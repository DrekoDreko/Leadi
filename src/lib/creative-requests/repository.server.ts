import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreativeRequestCommentVisibility,
  CreativeRequestPriority,
  CreativeRequestType,
  Database
} from "@/lib/supabase/database.types";
import {
  CREATIVE_REQUEST_ATTACHMENT_BUCKET,
  normalizeCreativeRequestAttachments,
  resolveCreativeRequestAttachmentMimeType,
  sanitizeCreativeRequestAttachmentName,
  validateCreativeRequestAttachment
} from "./attachments";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "./errors";
import type {
  CreativeRequestAdminCommentCreateInput,
  CreativeRequestAdminItem,
  CreativeRequestAdminListState,
  CreativeRequestCommentCreateInput,
  CreativeRequestCommentItem,
  CreativeRequestCreateInput,
  CreativeRequestItem,
  CreativeRequestListState,
  CreativeRequestStatusUpdateInput
} from "./types";
import { creativeRequestWorkflowStatuses } from "./types";

type CreativeRequestRow = Database["public"]["Tables"]["creative_requests"]["Row"];
type CreativeRequestInsert = Database["public"]["Tables"]["creative_requests"]["Insert"];
type CreativeRequestCommentRow = Database["public"]["Tables"]["creative_request_comments"]["Row"];
type CreativeRequestCommentInsert =
  Database["public"]["Tables"]["creative_request_comments"]["Insert"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const mockCreativeRequests: CreativeRequestItem[] = [
  {
    id: "mock-request-1",
    type: "design",
    title: "Carrossel para captacao",
    objective: "Gerar leads para plano empresarial com proposta consultiva.",
    briefing:
      "Criar carrossel com foco em empresas de 2 a 49 vidas, destacando analise comparativa entre operadoras.",
    notes: "Usar identidade clara, sem promessas sensiveis.",
    status: "in_review",
    priority: "high",
    dueAt: "2026-05-02T12:00:00.000Z",
    files: [],
    comments: [
      {
        id: "mock-comment-1",
        creativeRequestId: "mock-request-1",
        authorProfileId: "mock-profile-1",
        authorName: "Larissa Costa",
        authorEmail: "larissa@atlas.demo",
        body: "Briefing enviado para producao. Se der, priorizar a variacao com CTA para WhatsApp.",
        visibility: "workspace",
        createdAt: "2026-04-29T15:20:00.000Z",
        updatedAt: "2026-04-29T15:20:00.000Z"
      },
      {
        id: "mock-comment-2",
        creativeRequestId: "mock-request-1",
        authorProfileId: "mock-admin-1",
        authorName: "Operacao LeadHealth",
        authorEmail: "operacao@leadhealth.demo",
        body: "Recebido. Vamos subir a primeira proposta ainda hoje para revisao.",
        visibility: "workspace",
        createdAt: "2026-04-29T16:05:00.000Z",
        updatedAt: "2026-04-29T16:05:00.000Z"
      }
    ],
    createdAt: "2026-04-29T15:00:00.000Z",
    updatedAt: "2026-04-29T17:30:00.000Z"
  },
  {
    id: "mock-request-2",
    type: "video",
    title: "Video de plano empresarial",
    objective: "Apoiar a equipe comercial com um vídeo curto para anúncio.",
    briefing:
      "Roteiro vertical de até 30 segundos explicando quando vale revisar o plano atual da empresa.",
    notes: "Priorizar gancho forte nos primeiros 3 segundos.",
    status: "in_progress",
    priority: "medium",
    dueAt: "2026-05-05T12:00:00.000Z",
    files: [],
    comments: [
      {
        id: "mock-comment-3",
        creativeRequestId: "mock-request-2",
        authorProfileId: "mock-admin-2",
        authorName: "Operacao LeadHealth",
        authorEmail: "operacao@leadhealth.demo",
        body: "Storyboard inicial em andamento. Precisamos confirmar se o foco principal vai ser reducao de custo ou comparativo de cobertura.",
        visibility: "workspace",
        createdAt: "2026-04-29T12:10:00.000Z",
        updatedAt: "2026-04-29T12:10:00.000Z"
      },
      {
        id: "mock-comment-4",
        creativeRequestId: "mock-request-2",
        authorProfileId: "mock-admin-2",
        authorName: "Operacao LeadHealth",
        authorEmail: "operacao@leadhealth.demo",
        body: "Manter a primeira versao so na operacao ate validarmos o roteiro final.",
        visibility: "ops_only",
        createdAt: "2026-04-29T12:40:00.000Z",
        updatedAt: "2026-04-29T12:40:00.000Z"
      }
    ],
    createdAt: "2026-04-28T13:15:00.000Z",
    updatedAt: "2026-04-29T12:00:00.000Z"
  },
  {
    id: "mock-request-3",
    type: "campaign",
    title: "Criativo para lead form",
    objective: "Preparar uma campanha completa para captura de contatos.",
    briefing:
      "Combinar arte principal, texto-base e orientação visual para lead form voltado a PME.",
    notes: "",
    status: "delivered",
    priority: "medium",
    dueAt: "2026-04-30T12:00:00.000Z",
    files: [],
    comments: [],
    createdAt: "2026-04-27T10:45:00.000Z",
    updatedAt: "2026-04-30T09:10:00.000Z"
  }
];

export async function getCreativeRequestsForCurrentUser(
  limit = 12
): Promise<CreativeRequestListState> {
  const safeLimit = Math.max(1, Math.trunc(limit));

  try {
    if (!isSupabaseConfigured()) {
      return {
        requests: mockCreativeRequests.slice(0, safeLimit).map(stripOpsOnlyComments),
        mode: "not-configured",
        message: "Supabase ainda nao configurado. Exibindo pedidos demonstrativos."
      };
    }

    const profile = await getCurrentProfile();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("creative_requests")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      return {
        requests: [],
        mode: "error",
        message: isCreativeRequestSetupErrorMessage(error.message)
          ? getCreativeRequestSetupErrorMessage()
          : "Nao foi possivel carregar os pedidos criativos."
      };
    }

    const requestRows = data ?? [];
    const commentsByRequestId = await getCommentMapForCurrentUser(
      supabase,
      requestRows.map((request) => request.id)
    );

    return {
      requests: requestRows.map((request) =>
        mapCreativeRequestRowToItem(request, commentsByRequestId.get(request.id) ?? [])
      ),
      mode: "supabase"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    return {
      requests: [],
      mode: message.includes("Usuario nao autenticado") ? "unauthenticated" : "error",
      message:
        message.includes("Usuario nao autenticado")
          ? "Usuario nao autenticado."
          : isCreativeRequestSetupErrorMessage(message)
            ? getCreativeRequestSetupErrorMessage()
          : "Nao foi possivel carregar os pedidos criativos."
    };
  }
}

export async function createCreativeRequestForCurrentUser(
  input: CreativeRequestCreateInput
): Promise<CreativeRequestItem> {
  if (!isSupabaseConfigured()) {
    return createMockCreativeRequest(input);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const payload = buildCreativeRequestInsert(profile, input);
  const { data, error } = await supabase
    .from("creative_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel salvar o pedido.");
  }

  return mapCreativeRequestRowToItem(data, []);
}

export async function createCreativeRequestCommentForCurrentUser(
  requestId: string,
  input: CreativeRequestCommentCreateInput
) {
  const body = normalizeRequiredText(input.body, "Comentario");

  if (!isSupabaseConfigured()) {
    return addMockCreativeRequestComment(requestId, {
      authorEmail: "demo@leadhealth.local",
      authorName: "Equipe Demo",
      body,
      visibility: "workspace"
    });
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const creativeRequest = await getCreativeRequestRowForCurrentUser(
    supabase,
    profile.organization_id,
    requestId
  );
  const payload = buildCreativeRequestCommentInsert(creativeRequest, profile, body, "workspace");
  const { error } = await supabase.from("creative_request_comments").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  return getCreativeRequestItemForCurrentUser(supabase, profile.organization_id, creativeRequest.id);
}

export async function getCreativeRequestsForAdmin(
  limit = 24
): Promise<CreativeRequestAdminListState> {
  const safeLimit = Math.max(1, Math.trunc(limit));

  try {
    if (!isSupabaseConfigured()) {
      return {
        requests: buildMockAdminCreativeRequests().slice(0, safeLimit),
        mode: "not-configured",
        message: "Supabase ainda nao configurado. Exibindo fila operacional demonstrativa."
      };
    }

    if (!hasSupabaseServiceRole()) {
      return {
        requests: [],
        mode: "error",
        message: "A fila admin precisa de SUPABASE_SERVICE_ROLE_KEY configurada no ambiente."
      };
    }

    const profile = await getCurrentProfile();

    if (!profile.is_platform_admin) {
      throw new Error("Permissao negada.");
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("creative_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      return {
        requests: [],
        mode: "error",
        message: isCreativeRequestSetupErrorMessage(error.message)
          ? getCreativeRequestSetupErrorMessage()
          : "Nao foi possivel carregar a fila admin de pedidos."
      };
    }

    const requestRows = data ?? [];
    const commentsByRequestId = await getCommentMapForAdmin(
      supabase,
      requestRows.map((request) => request.id)
    );
    const requesterProfileIds = [...new Set(requestRows.map((request) => request.requester_profile_id))];
    const organizationIds = [...new Set(requestRows.map((request) => request.organization_id))];
    const [organizationsById, profilesById] = await getAdminReferenceMaps(
      supabase,
      organizationIds,
      requesterProfileIds
    );

    return {
      requests: requestRows.map((request) =>
        mapCreativeRequestRowToAdminItem(
          request,
          commentsByRequestId.get(request.id) ?? [],
          organizationsById.get(request.organization_id),
          profilesById.get(request.requester_profile_id)
        )
      ),
      mode: "supabase"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    return {
      requests: [],
      mode: message.includes("Usuario nao autenticado") ? "unauthenticated" : "error",
      message:
        message.includes("Usuario nao autenticado")
          ? "Usuario nao autenticado."
          : isCreativeRequestSetupErrorMessage(message)
            ? getCreativeRequestSetupErrorMessage()
          : "Nao foi possivel carregar a fila admin de pedidos."
    };
  }
}

export async function createCreativeRequestCommentForAdmin(
  requestId: string,
  input: CreativeRequestAdminCommentCreateInput
) {
  const body = normalizeRequiredText(input.body, "Comentario");
  const visibility = normalizeCreativeRequestCommentVisibility(input.visibility);

  if (!isSupabaseConfigured()) {
    return addMockCreativeRequestComment(requestId, {
      authorEmail: "operacao@leadhealth.local",
      authorName: "Operacao LeadHealth",
      body,
      visibility
    }, true);
  }

  if (!hasSupabaseServiceRole()) {
    throw new Error("A fila admin precisa de SUPABASE_SERVICE_ROLE_KEY configurada no ambiente.");
  }

  const profile = await getCurrentProfile();

  if (!profile.is_platform_admin) {
    throw new Error("Permissao negada.");
  }

  const supabase = createSupabaseAdminClient();
  const creativeRequest = await getCreativeRequestRowForAdmin(supabase, requestId);
  const payload = buildCreativeRequestCommentInsert(creativeRequest, profile, body, visibility);
  const { error } = await supabase.from("creative_request_comments").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  return getCreativeRequestAdminItemById(supabase, creativeRequest.id);
}

export async function addCreativeRequestAttachmentForCurrentUser(requestId: string, file: File) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao configurado.");
  }

  const validationError = validateCreativeRequestAttachment(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const creativeRequest = await getCreativeRequestRowForCurrentUser(
    supabase,
    profile.organization_id,
    requestId
  );

  const attachment = buildCreativeRequestAttachment(creativeRequest.organization_id, requestId, file);
  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(CREATIVE_REQUEST_ATTACHMENT_BUCKET)
    .upload(attachment.path, fileBuffer, {
      cacheControl: "3600",
      contentType: attachment.mimeType,
      upsert: false
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const nextFiles = [...normalizeCreativeRequestAttachments(creativeRequest.files), attachment];
  const { data, error } = await supabase
    .from("creative_requests")
    .update({ files: nextFiles })
    .eq("id", creativeRequest.id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (error || !data) {
    await supabase.storage.from(CREATIVE_REQUEST_ATTACHMENT_BUCKET).remove([attachment.path]);
    throw new Error(error?.message ?? "Nao foi possivel salvar o anexo.");
  }

  const commentsByRequestId = await getCommentMapForCurrentUser(supabase, [data.id]);
  return mapCreativeRequestRowToItem(data, commentsByRequestId.get(data.id) ?? []);
}

export async function updateCreativeRequestStatusForCurrentUser(
  requestId: string,
  input: CreativeRequestStatusUpdateInput
) {
  const nextStatus = normalizeCreativeRequestWorkflowStatus(input.status);

  if (!isSupabaseConfigured()) {
    return updateMockCreativeRequestStatus(requestId, nextStatus);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const creativeRequest = await getCreativeRequestRowForCurrentUser(
    supabase,
    profile.organization_id,
    requestId
  );

  if (creativeRequest.status === nextStatus) {
    return getCreativeRequestItemForCurrentUser(supabase, profile.organization_id, creativeRequest.id);
  }

  const { data, error } = await supabase
    .from("creative_requests")
    .update({ status: nextStatus })
    .eq("id", creativeRequest.id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel atualizar o pedido.");
  }

  const commentsByRequestId = await getCommentMapForCurrentUser(supabase, [data.id]);
  return mapCreativeRequestRowToItem(data, commentsByRequestId.get(data.id) ?? []);
}

export async function getCreativeRequestAttachmentDownloadUrlForCurrentUser(
  requestId: string,
  attachmentId: string
) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao configurado.");
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const creativeRequest = await getCreativeRequestRowForCurrentUser(
    supabase,
    profile.organization_id,
    requestId
  );
  const attachment = normalizeCreativeRequestAttachments(creativeRequest.files).find(
    (item) => item.id === attachmentId
  );

  if (!attachment) {
    throw new Error("Anexo nao encontrado.");
  }

  const { data, error } = await supabase.storage
    .from(CREATIVE_REQUEST_ATTACHMENT_BUCKET)
    .createSignedUrl(attachment.path, 60, {
      download: attachment.name
    });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Nao foi possivel preparar o download do anexo.");
  }

  return data.signedUrl;
}

async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? "Perfil nao encontrado.");
  }

  return profile;
}

async function getCreativeRequestItemForCurrentUser(
  supabase: ServerClient,
  organizationId: string,
  requestId: string
) {
  const creativeRequest = await getCreativeRequestRowForCurrentUser(supabase, organizationId, requestId);
  const commentsByRequestId = await getCommentMapForCurrentUser(supabase, [creativeRequest.id]);

  return mapCreativeRequestRowToItem(
    creativeRequest,
    commentsByRequestId.get(creativeRequest.id) ?? []
  );
}

async function getCreativeRequestAdminItemById(supabase: AdminClient, requestId: string) {
  const creativeRequest = await getCreativeRequestRowForAdmin(supabase, requestId);
  const [commentsByRequestId, referenceMaps] = await Promise.all([
    getCommentMapForAdmin(supabase, [creativeRequest.id]),
    getAdminReferenceMaps(supabase, [creativeRequest.organization_id], [creativeRequest.requester_profile_id])
  ]);
  const [organizationsById, profilesById] = referenceMaps;

  return mapCreativeRequestRowToAdminItem(
    creativeRequest,
    commentsByRequestId.get(creativeRequest.id) ?? [],
    organizationsById.get(creativeRequest.organization_id),
    profilesById.get(creativeRequest.requester_profile_id)
  );
}

async function getAdminReferenceMaps(
  supabase: AdminClient,
  organizationIds: string[],
  requesterProfileIds: string[]
) {
  const [organizationsResponse, profilesResponse] = await Promise.all([
    organizationIds.length === 0
      ? Promise.resolve({ data: [] as OrganizationRow[], error: null })
      : supabase.from("organizations").select("id,name").in("id", organizationIds),
    requesterProfileIds.length === 0
      ? Promise.resolve({ data: [] as ProfileRow[], error: null })
      : supabase.from("profiles").select("id,full_name,email").in("id", requesterProfileIds)
  ]);

  if (organizationsResponse.error || profilesResponse.error) {
    throw new Error("Nao foi possivel carregar os detalhes operacionais dos pedidos.");
  }

  return [
    new Map((organizationsResponse.data ?? []).map((organization) => [organization.id, organization])),
    new Map((profilesResponse.data ?? []).map((profile) => [profile.id, profile]))
  ] as const;
}

function buildCreativeRequestInsert(
  profile: ProfileRow,
  input: CreativeRequestCreateInput
): CreativeRequestInsert {
  const dueAt = normalizeDueAt(input.due_at);

  return {
    organization_id: profile.organization_id,
    requester_profile_id: profile.id,
    type: normalizeCreativeRequestType(input.type),
    title: normalizeRequiredText(input.title, "Titulo do pedido"),
    objective: normalizeRequiredText(input.objective, "Objetivo do pedido"),
    briefing: normalizeRequiredText(input.briefing, "Briefing do pedido"),
    notes: normalizeOptionalText(input.notes),
    due_at: dueAt,
    priority: inferPriorityFromDueAt(dueAt),
    status: "requested",
    files: []
  };
}

function buildCreativeRequestCommentInsert(
  creativeRequest: CreativeRequestRow,
  profile: ProfileRow,
  body: string,
  visibility: CreativeRequestCommentVisibility
): CreativeRequestCommentInsert {
  return {
    organization_id: creativeRequest.organization_id,
    creative_request_id: creativeRequest.id,
    author_profile_id: profile.id,
    author_name: profile.full_name?.trim() || profile.email.split("@")[0] || "Usuario",
    author_email: profile.email,
    body,
    visibility
  };
}

function mapCreativeRequestRowToItem(
  row: CreativeRequestRow,
  comments: CreativeRequestCommentItem[]
): CreativeRequestItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    objective: row.objective,
    briefing: row.briefing,
    notes: row.notes ?? "",
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    files: normalizeCreativeRequestAttachments(row.files),
    comments,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCreativeRequestRowToAdminItem(
  row: CreativeRequestRow,
  comments: CreativeRequestCommentItem[],
  organization?: Pick<OrganizationRow, "id" | "name">,
  requester?: Pick<ProfileRow, "id" | "full_name" | "email">
): CreativeRequestAdminItem {
  const baseItem = mapCreativeRequestRowToItem(row, comments);

  return {
    ...baseItem,
    organizationId: row.organization_id,
    organizationName: organization?.name ?? "Organizacao nao identificada",
    requesterProfileId: row.requester_profile_id,
    requesterName: requester?.full_name?.trim() || requester?.email || "Solicitante nao identificado",
    requesterEmail: requester?.email ?? "Email nao informado"
  };
}

function mapCreativeRequestCommentRowToItem(row: CreativeRequestCommentRow): CreativeRequestCommentItem {
  return {
    id: row.id,
    creativeRequestId: row.creative_request_id,
    authorProfileId: row.author_profile_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createMockCreativeRequest(input: CreativeRequestCreateInput): CreativeRequestItem {
  const now = new Date();
  const dueAt = normalizeDueAt(input.due_at);

  return {
    id: `mock-request-${now.getTime()}`,
    type: normalizeCreativeRequestType(input.type),
    title: normalizeRequiredText(input.title, "Titulo do pedido"),
    objective: normalizeRequiredText(input.objective, "Objetivo do pedido"),
    briefing: normalizeRequiredText(input.briefing, "Briefing do pedido"),
    notes: normalizeOptionalText(input.notes) ?? "",
    status: "requested",
    priority: inferPriorityFromDueAt(dueAt),
    dueAt,
    files: [],
    comments: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

function buildMockAdminCreativeRequests(): CreativeRequestAdminItem[] {
  return mockCreativeRequests.map((request, index) => ({
    ...request,
    organizationId: `mock-organization-${index + 1}`,
    organizationName: ["Corretora Atlas", "Equipe Prisma", "Saude PME Hub"][index] ?? "Workspace Demo",
    requesterProfileId: `mock-profile-${index + 1}`,
    requesterName: ["Larissa Costa", "Marcos Lima", "Bianca Rocha"][index] ?? "Usuario Demo",
    requesterEmail:
      ["larissa@atlas.demo", "marcos@prisma.demo", "bianca@hub.demo"][index] ?? "demo@leadhealth.local"
  }));
}

function updateMockCreativeRequestStatus(
  requestId: string,
  status: CreativeRequestRow["status"]
): CreativeRequestItem {
  const currentRequest = mockCreativeRequests.find((item) => item.id === requestId);

  if (!currentRequest) {
    throw new Error("Pedido nao encontrado.");
  }

  const updatedRequest = {
    ...currentRequest,
    status,
    updatedAt: new Date().toISOString()
  };

  replaceMockCreativeRequest(requestId, updatedRequest);
  return stripOpsOnlyComments(updatedRequest);
}

function addMockCreativeRequestComment(
  requestId: string,
  input: {
    authorEmail: string;
    authorName: string;
    body: string;
    visibility: CreativeRequestCommentVisibility;
  },
  includeOpsOnly = false
) {
  const currentRequest = mockCreativeRequests.find((item) => item.id === requestId);

  if (!currentRequest) {
    throw new Error("Pedido nao encontrado.");
  }

  const now = new Date().toISOString();
  const nextComment: CreativeRequestCommentItem = {
    id: `mock-comment-${Date.now()}`,
    creativeRequestId: requestId,
    authorProfileId: `mock-author-${Date.now()}`,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
    body: input.body,
    visibility: input.visibility,
    createdAt: now,
    updatedAt: now
  };
  const updatedRequest: CreativeRequestItem = {
    ...currentRequest,
    comments: [...currentRequest.comments, nextComment],
    updatedAt: now
  };

  replaceMockCreativeRequest(requestId, updatedRequest);
  return includeOpsOnly ? updatedRequest : stripOpsOnlyComments(updatedRequest);
}

function replaceMockCreativeRequest(requestId: string, request: CreativeRequestItem) {
  const requestIndex = mockCreativeRequests.findIndex((item) => item.id === requestId);

  if (requestIndex >= 0) {
    mockCreativeRequests.splice(requestIndex, 1, request);
  }
}

function stripOpsOnlyComments(request: CreativeRequestItem): CreativeRequestItem {
  return {
    ...request,
    comments: request.comments.filter((comment) => comment.visibility === "workspace")
  };
}

async function getCreativeRequestRowForCurrentUser(
  supabase: ServerClient,
  organizationId: string,
  requestId: string
) {
  const { data, error } = await supabase
    .from("creative_requests")
    .select("*")
    .eq("id", requestId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    throw new Error("Pedido nao encontrado.");
  }

  return data;
}

async function getCreativeRequestRowForAdmin(supabase: AdminClient, requestId: string) {
  const { data, error } = await supabase.from("creative_requests").select("*").eq("id", requestId).single();

  if (error || !data) {
    throw new Error("Pedido nao encontrado.");
  }

  return data;
}

async function getCommentMapForCurrentUser(supabase: ServerClient, requestIds: string[]) {
  if (requestIds.length === 0) {
    return new Map<string, CreativeRequestCommentItem[]>();
  }

  const { data, error } = await supabase
    .from("creative_request_comments")
    .select("*")
    .in("creative_request_id", requestIds)
    .eq("visibility", "workspace")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar os comentarios do pedido.");
  }

  return buildCommentMap(data ?? []);
}

async function getCommentMapForAdmin(supabase: AdminClient, requestIds: string[]) {
  if (requestIds.length === 0) {
    return new Map<string, CreativeRequestCommentItem[]>();
  }

  const { data, error } = await supabase
    .from("creative_request_comments")
    .select("*")
    .in("creative_request_id", requestIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar os comentarios do pedido.");
  }

  return buildCommentMap(data ?? []);
}

function buildCommentMap(commentRows: CreativeRequestCommentRow[]) {
  const commentsByRequestId = new Map<string, CreativeRequestCommentItem[]>();

  for (const row of commentRows) {
    const currentComments = commentsByRequestId.get(row.creative_request_id) ?? [];
    currentComments.push(mapCreativeRequestCommentRowToItem(row));
    commentsByRequestId.set(row.creative_request_id, currentComments);
  }

  return commentsByRequestId;
}

function buildCreativeRequestAttachment(
  organizationId: string,
  requestId: string,
  file: File
) {
  const now = new Date().toISOString();
  const attachmentId = crypto.randomUUID();
  const sanitizedName = sanitizeCreativeRequestAttachmentName(file.name);
  const mimeType = resolveCreativeRequestAttachmentMimeType(file);

  if (!mimeType) {
    throw new Error("Tipo de arquivo nao suportado.");
  }

  return {
    id: attachmentId,
    name: file.name,
    path: `${organizationId}/${requestId}/${attachmentId}-${sanitizedName}`,
    mimeType,
    sizeBytes: file.size,
    uploadedAt: now
  };
}

function normalizeCreativeRequestType(value: unknown): CreativeRequestType {
  if (value === "design" || value === "video" || value === "campaign") {
    return value;
  }

  throw new Error("Tipo de pedido invalido.");
}

function normalizeCreativeRequestWorkflowStatus(value: unknown): CreativeRequestRow["status"] {
  if (
    typeof value === "string" &&
    creativeRequestWorkflowStatuses.includes(
      value as (typeof creativeRequestWorkflowStatuses)[number]
    )
  ) {
    return value as (typeof creativeRequestWorkflowStatuses)[number];
  }

  throw new Error("Status do pedido invalido.");
}

function normalizeCreativeRequestCommentVisibility(value: unknown): CreativeRequestCommentVisibility {
  if (value === "ops_only") {
    return "ops_only";
  }

  return "workspace";
}

function normalizeRequiredText(value: unknown, fieldName: string) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    throw new Error(`${fieldName} obrigatorio.`);
  }

  return normalized;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeDueAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error("Prazo desejado invalido.");
  }

  return `${normalized}T12:00:00.000Z`;
}

function inferPriorityFromDueAt(dueAt: string | null): CreativeRequestPriority {
  if (!dueAt) {
    return "medium";
  }

  const diffInDays = Math.ceil((Date.parse(dueAt) - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 2) {
    return "urgent";
  }

  if (diffInDays <= 5) {
    return "high";
  }

  return "medium";
}
