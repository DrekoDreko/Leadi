import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateFilePayloadSize } from "@/lib/payload-limits";
import { resolveCurrentIdentity, getMetaConnectionForOrganization, resolveMetaAccessTokenForOrganization, recordIntegrationSyncLog } from "@/lib/integrations/repository.server";
import type { MetaConnection } from "@/lib/integrations/types";
import { getMetaGraphApiVersion } from "@/lib/meta/config";
import { sanitizeCreativeRequestAttachmentName } from "@/lib/creative-requests/attachments";
import type { Database, Json } from "@/lib/supabase/database.types";

type MetaAdAccountRow = Database["public"]["Tables"]["meta_ad_accounts"]["Row"];
type MetaAdImageUploadRow = Database["public"]["Tables"]["meta_ad_image_uploads"]["Row"];

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const REQUIRED_SCOPES = ["ads_management"] as const;

type MetaGraphErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
};

export type MetaAdImageUploadResult = {
  upload: MetaAdImageUploadRow;
  metaResponse: Json;
};

export class MetaAdImageUploadError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 400, code = "meta_ad_image_upload_failed") {
    super(message);
    this.name = "MetaAdImageUploadError";
    this.status = status;
    this.code = code;
  }
}

export async function uploadMetaAdImageForCurrentUser(input: {
  file: File;
  metaAdAccountId: string;
  creativeRequestId?: string | null;
  campaignId?: string | null;
}) {
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    throw new MetaAdImageUploadError("Sua sessao expirou. Entre novamente para enviar a imagem.", 401);
  }

  if (!input.metaAdAccountId.trim()) {
    throw new MetaAdImageUploadError("Informe a conta de anuncio da Meta para concluir o upload.");
  }

  const scopeCheck = getAssociationScope(input.creativeRequestId ?? null, input.campaignId ?? null);
  if (!scopeCheck) {
    throw new MetaAdImageUploadError("Associe a imagem a um pedido ou campanha antes de enviar.");
  }

  const validationError = validateMetaAdImageFile(input.file);
  if (validationError) {
    throw new MetaAdImageUploadError(validationError);
  }

  const metaConnection = await getMetaConnectionForOrganization(identity.organization.id);
  if (!metaConnection) {
    throw new MetaAdImageUploadError("Conecte uma conta Meta ativa antes de enviar imagens.");
  }

  if (!isMetaConnectionUsable(metaConnection)) {
    throw new MetaAdImageUploadError("A conta Meta conectada esta indisponivel. Reconecte para continuar.", 403);
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(identity.organization.id);
  if (!accessToken) {
    throw new MetaAdImageUploadError("Nao foi possivel recuperar o token da Meta. Reconecte a conta.", 403);
  }

  ensureRequiredScopes(metaConnection);

  const admin = createSupabaseAdminClient();
  const metaAdAccount = await loadMetaAdAccount(admin, identity.organization.id, input.metaAdAccountId);
  if (!metaAdAccount) {
    throw new MetaAdImageUploadError("Conta de anuncio nao encontrada para esta organizacao.", 404);
  }

  if (metaAdAccount.connected_account_id !== metaConnection.id) {
    throw new MetaAdImageUploadError("A conta de anuncio selecionada nao esta vinculada a esta conexao Meta.", 403);
  }

  const pendingUpload = await createPendingUpload({
    admin,
    organizationId: identity.organization.id,
    connectedAccountId: metaConnection.id,
    metaAdAccountId: metaAdAccount.meta_ad_account_id,
    creativeRequestId: input.creativeRequestId ?? null,
    campaignId: input.campaignId ?? null,
    file: input.file
  });

  try {
    const metaResponse = await sendImageToMeta({
      accessToken,
      adAccountId: metaAdAccount.meta_ad_account_id,
      file: input.file
    });
    const normalized = normalizeMetaUploadResponse(metaResponse, input.file.name);

    const { data, error } = await admin
      .from("meta_ad_image_uploads")
      .update({
        local_status: "uploaded",
        uploaded_at: new Date().toISOString(),
        meta_image_hash: normalized.hash,
        meta_image_id: normalized.id,
        meta_image_url: normalized.url,
        meta_response: metaResponse as Json,
        last_error: null
      })
      .eq("id", pendingUpload.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Nao foi possivel registrar o upload da imagem.");
    }

    await recordIntegrationSyncLog({
      organizationId: identity.organization.id,
      provider: "meta",
      connectionId: metaConnection.id,
      assetType: "meta_ad_image",
      status: "success",
      title: "Imagem enviada para a biblioteca da Meta",
      message: `A imagem ${input.file.name} foi enviada com sucesso para a conta de anuncios ${metaAdAccount.meta_ad_account_id}.`,
      details: {
        metaAdAccountId: metaAdAccount.meta_ad_account_id,
        creativeRequestId: input.creativeRequestId ?? null,
        campaignId: input.campaignId ?? null,
        uploadId: data.id,
        metaImageHash: normalized.hash,
        metaImageId: normalized.id
      },
      createdByProfileId: identity.profile.id
    });

    return {
      upload: data,
      metaResponse
    } satisfies MetaAdImageUploadResult;
  } catch (error) {
    const friendlyError = normalizeMetaUploadError(error);

    await markUploadFailed({
      admin,
      uploadId: pendingUpload.id,
      error: friendlyError.message,
      metaResponse: extractErrorMetaResponse(error)
    });

    try {
      await recordIntegrationSyncLog({
        organizationId: identity.organization.id,
        provider: "meta",
        connectionId: metaConnection.id,
        assetType: "meta_ad_image",
        status: "failed",
        title: "Falha ao enviar imagem para a Meta",
        message: friendlyError.message,
        details: {
          metaAdAccountId: metaAdAccount.meta_ad_account_id,
          creativeRequestId: input.creativeRequestId ?? null,
          campaignId: input.campaignId ?? null,
          uploadId: pendingUpload.id,
          code: friendlyError.code
        },
        createdByProfileId: identity.profile.id
      });
    } catch {
      // Se o log falhar, nao bloqueamos o retorno amigavel para o usuario.
    }

    throw friendlyError;
  }
}

function validateMetaAdImageFile(file: { name: string; size: number; type: string }) {
  validateFilePayloadSize(file, "META_AD_IMAGE");

  if (!file.name.trim()) {
    return "Selecione uma imagem para enviar.";
  }

  if (file.size <= 0) {
    return "A imagem selecionada esta vazia.";
  }

  const mimeType = normalizeMimeType(file);
  if (!mimeType) {
    return "Formato nao suportado. Use JPG ou PNG.";
  }

  return "";
}

function normalizeMimeType(file: { name: string; type: string }) {
  const normalizedType = file.type.trim().toLowerCase();

  if (ALLOWED_MIME_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  const extension = getFileExtension(file.name);
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return "";
  }

  return extension === "jpeg" || extension === "jpg" ? "image/jpeg" : "image/png";
}

function ensureRequiredScopes(connection: MetaConnection) {
  const scopes = new Set((connection.scopes ?? []).map((scope) => scope.trim().toLowerCase()));
  const missing = REQUIRED_SCOPES.filter((scope) => !scopes.has(scope));

  if (missing.length > 0) {
    throw new MetaAdImageUploadError(
      "A conexao Meta nao possui a permissao ads_management. Reconecte a conta para liberar o upload.",
      403,
      "missing_meta_permissions"
    );
  }
}

function isMetaConnectionUsable(connection: MetaConnection) {
  return connection.status === "connected";
}

async function loadMetaAdAccount(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  metaAdAccountId: string
) {
  const { data, error } = await admin
    .from("meta_ad_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("meta_ad_account_id", metaAdAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as MetaAdAccountRow | null;
}

async function createPendingUpload(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  organizationId: string;
  connectedAccountId: string;
  metaAdAccountId: string;
  creativeRequestId: string | null;
  campaignId: string | null;
  file: File;
}) {
  const { data, error } = await input.admin
    .from("meta_ad_image_uploads")
      .insert({
      organization_id: input.organizationId,
      connected_account_id: input.connectedAccountId,
      meta_ad_account_id: input.metaAdAccountId,
      creative_request_id: input.creativeRequestId,
      campaign_id: input.campaignId,
      source_filename: input.file.name.trim() || "imagem",
      source_mime_type: normalizeMimeType(input.file) || input.file.type || "application/octet-stream",
      source_size_bytes: input.file.size,
      local_status: "pending",
      meta_response: {}
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar a imagem antes do upload.");
  }

  return data as MetaAdImageUploadRow;
}

async function markUploadFailed(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  uploadId: string;
  error: string;
  metaResponse: Json;
}) {
  const { error } = await input.admin
    .from("meta_ad_image_uploads")
    .update({
      local_status: "failed",
      last_error: input.error,
      meta_response: input.metaResponse
    })
    .eq("id", input.uploadId);

  if (error) {
    throw new Error(error.message);
  }
}

async function sendImageToMeta(input: {
  accessToken: string;
  adAccountId: string;
  file: File;
}) {
  const bytes = Buffer.from(await input.file.arrayBuffer()).toString("base64");
  const formData = new FormData();
  formData.set("bytes", bytes);
  formData.set("access_token", input.accessToken);
  formData.set("name", sanitizeCreativeRequestAttachmentName(input.file.name));

  const response = await fetch(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${input.adAccountId}/adimages`,
    {
      method: "POST",
      body: formData
    }
  );

  const payload = (await response.json().catch(() => null)) as MetaGraphErrorPayload | null;

  if (!response.ok) {
    throw new MetaAdImageUploadError(formatMetaGraphUploadError(payload, response.status), response.status, "meta_graph_error");
  }

  return payload ?? {};
}

function formatMetaGraphUploadError(payload: MetaGraphErrorPayload | null, status: number) {
  const error = payload?.error;

  if (!error) {
    return "A Meta nao retornou detalhes do erro de upload. Tente novamente em instantes.";
  }

  const text = [error.error_user_title, error.error_user_msg, error.message].filter(Boolean).join(" ").trim();
  const code = Number(error.code ?? 0);
  const subcode = Number(error.error_subcode ?? 0);

  if (code === 10 || code === 200 || code === 190 || /permission|permiss/i.test(text)) {
    return "A Meta recusou o upload por permissao insuficiente. Reconecte a conta com ads_management e tente novamente.";
  }

  if (status === 413 || /size|larg(?:u|o)|tamanho/i.test(text)) {
    return "A imagem excede o limite permitido pela Meta. Envie um arquivo menor.";
  }

  if (/format|mime|type|png|jpg|jpeg/i.test(text) || subcode === 1487242) {
    return "A Meta rejeitou o formato da imagem. Use JPG ou PNG.";
  }

  return text || "A Meta nao conseguiu concluir o upload da imagem.";
}

function normalizeMetaUploadError(error: unknown) {
  if (error instanceof MetaAdImageUploadError) {
    return error;
  }

  if (error instanceof Error) {
    if (error.message.includes("Usuario nao autenticado")) {
      return new MetaAdImageUploadError("Sua sessao expirou. Entre novamente para enviar a imagem.", 401);
    }

    return new MetaAdImageUploadError(error.message || "Nao foi possivel enviar a imagem para a Meta.");
  }

  return new MetaAdImageUploadError("Nao foi possivel enviar a imagem para a Meta.");
}

function extractErrorMetaResponse(error: unknown): Json {
  if (error instanceof Error && "response" in error) {
    return { message: error.message };
  }

  if (error instanceof MetaAdImageUploadError) {
    return {
      code: error.code,
      message: error.message
    } as Json;
  }

  if (error && typeof error === "object") {
    return error as Json;
  }

  return { message: "Erro desconhecido" };
}

function normalizeMetaUploadResponse(response: Json, filename: string) {
  const asRecord = isRecord(response) ? response : {};
  const images = isRecord(asRecord.images) ? asRecord.images : null;
  const directImage = images
    ? pickImageEntry(images, filename) ?? pickImageEntry(images, Object.keys(images)[0] ?? "")
    : null;

  return {
    hash: stringFromValue(directImage?.hash ?? asRecord.hash ?? asRecord.image_hash),
    id: stringFromValue(directImage?.id ?? asRecord.id),
    url: stringFromValue(directImage?.url ?? asRecord.url ?? directImage?.permalink_url)
  };
}

function pickImageEntry(images: Record<string, unknown>, key: string) {
  const value = images[key];

  if (isRecord(value)) {
    return value;
  }

  for (const entry of Object.values(images)) {
    if (isRecord(entry)) {
      return entry;
    }
  }

  return null;
}

function getAssociationScope(creativeRequestId: string | null, campaignId: string | null) {
  const present = [creativeRequestId, campaignId].filter((value) => Boolean(value));
  return present.length === 1;
}

function stringFromValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}
