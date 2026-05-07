import { NextResponse } from "next/server";
import { BillingResourceAccessError } from "@/lib/billing/subscription-limits.server";
import { createLeadFromWebhook } from "@/lib/leads/repository.server";
import { normalizeLeadSourceOrNull } from "@/lib/leads/normalization";
import { recordLeadWebhookEvent } from "@/lib/leads/webhook-events.server";
import {
  authenticateLeadWebhookRequest,
  type LeadWebhookAuthContext
} from "@/lib/leads/webhook-auth";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { LeadSource } from "@/lib/supabase/database.types";

const safeWebhookLeadSources = new Set<LeadSource>(["make_zapier", "api"]);

export async function POST(request: Request) {
  let body: unknown;
  let webhookAuth: LeadWebhookAuthContext | undefined;

  try {
    assertJsonRequest(request);
    body = await request.json();
    webhookAuth = await authenticateLeadWebhookRequest(request);
    const result = await createLeadFromWebhook(
      normalizeWebhookLeadPayload(body, webhookAuth.organizationId)
    );

    await recordLeadWebhookEvent({
      organizationId: webhookAuth.organizationId,
      integrationId: webhookAuth.integrationId,
      leadId: result.lead.id,
      status: "processed",
      httpStatus: result.status === "created" ? 201 : 200,
      rawPayload: {
        ...(isRecord(body) ? body : { payload: body }),
        duplicate: result.status === "duplicate",
        duplicate_reason: result.duplicateReason ?? null
      },
      safeHeaders: getSafeWebhookHeaders(request),
      errorMessage:
        result.status === "duplicate"
          ? `Lead duplicado absorvido pelo webhook (${result.duplicateReason ?? "desconhecido"}).`
          : undefined
    });

    return NextResponse.json(
      {
        lead: result.lead,
        organization_id: webhookAuth.organizationId,
        integration_id: webhookAuth.integrationId,
        mode: hasSupabaseServiceRole() ? "supabase" : "not-configured",
        status: result.status
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  } catch (error) {
    console.error(error);
    const status = getWebhookLeadErrorStatus(error);
    const errorMessage = getWebhookLeadErrorMessage(error);

    await recordLeadWebhookEvent({
      organizationId: webhookAuth?.organizationId,
      integrationId: webhookAuth?.integrationId,
      status: "failed",
      httpStatus: status,
      rawPayload: body,
      safeHeaders: getSafeWebhookHeaders(request),
      errorMessage
    });

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

function assertJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type invalido. Use application/json.");
  }
}

function normalizeWebhookLeadPayload(body: unknown, organizationId: string) {
  if (!isRecord(body)) {
    throw new Error("Payload invalido. Envie um objeto JSON.");
  }

  const leadPayload = getLeadPayload(body);

  return {
    organization_id: organizationId,
    owner_profile_id:
      getField(body, ["owner_profile_id", "ownerProfileId", "owner id"]) ??
      getField(leadPayload, ["owner_profile_id", "ownerProfileId", "owner id"]),
    owner_email:
      getField(body, ["owner_email", "ownerEmail", "assigned_to_email", "assignedToEmail"]) ??
      getField(leadPayload, ["owner_email", "ownerEmail", "assigned_to_email", "assignedToEmail"]),
    name: getTextField(leadPayload, [
      "name",
      "nome",
      "full_name",
      "fullName",
      "nome_completo",
      "lead_name",
      "contact_name"
    ]),
    phone: getTextField(leadPayload, [
      "phone",
      "telefone",
      "whatsapp",
      "celular",
      "mobile",
      "telefone_celular",
      "numero",
      "phone_number"
    ]),
    email: getTextField(leadPayload, ["email", "e-mail", "mail"]),
    city: getTextField(leadPayload, ["city", "cidade", "localidade", "municipio"]),
    company_name:
      getTextField(leadPayload, ["company_name", "companyName", "empresa", "company"]),
    lives_count:
      getField(leadPayload, [
        "lives_count",
        "livesCount",
        "quantidade_vidas",
        "vidas",
        "beneficiarios"
      ]),
    stage: getField(leadPayload, ["stage", "etapa", "status"]),
    source: getWebhookLeadSource(leadPayload, body),
    score: getField(leadPayload, ["score", "pontuacao"]),
    next_contact_at:
      getTextField(leadPayload, ["next_contact_at", "nextContactAt", "proximo_contato"]),
    budget: getTextField(leadPayload, ["budget", "orcamento", "valor", "investimento"]),
    interest: getTextField(leadPayload, ["interest", "interesse", "produto", "plano"]),
    last_interaction:
      getTextField(leadPayload, ["last_interaction", "lastInteraction", "ultima_interacao"]),
    notes: getTextField(leadPayload, ["notes", "observacoes", "observacao", "mensagem"]),
    source_campaign:
      getTextField(leadPayload, ["source_campaign", "sourceCampaign", "campaign", "campanha"]),
    source_adset:
      getTextField(leadPayload, ["source_adset", "sourceAdset", "adset", "conjunto"]),
    source_ad: getTextField(leadPayload, ["source_ad", "sourceAd", "ad", "anuncio"]),
    meta_lead_id: getTextField(leadPayload, ["meta_lead_id", "metaLeadId", "leadgen_id"]),
    meta_form_id: getTextField(leadPayload, ["meta_form_id", "metaFormId", "form_id"]),
    meta_page_id: getTextField(leadPayload, ["meta_page_id", "metaPageId", "page_id"]),
    meta_campaign_id:
      getTextField(leadPayload, ["meta_campaign_id", "metaCampaignId", "campaign_id"]),
    meta_adset_id: getTextField(leadPayload, ["meta_adset_id", "metaAdsetId", "adset_id"]),
    meta_ad_id: getTextField(leadPayload, ["meta_ad_id", "metaAdId", "ad_id"]),
    raw_payload: body
  };
}

function getLeadPayload(body: Record<string, unknown>) {
  const payload = getField(body, ["lead", "data", "payload", "contact", "prospect"]);
  return isRecord(payload) ? payload : body;
}

function getWebhookLeadSource(
  leadPayload: Record<string, unknown>,
  body: Record<string, unknown>
) {
  const source =
    normalizeLeadSourceOrNull(getField(leadPayload, ["source", "origem"])) ??
    normalizeLeadSourceOrNull(getField(body, ["source", "origem"]));

  return source && safeWebhookLeadSources.has(source) ? source : "make_zapier";
}

function getTextField(record: Record<string, unknown>, aliases: string[]) {
  const value = getField(record, aliases);

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return undefined;
}

function getField(record: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (record[alias] !== undefined) {
      return record[alias];
    }
  }

  const normalizedAliases = new Set(aliases.map(normalizePayloadKey));
  const entry = Object.entries(record).find(([key]) => normalizedAliases.has(normalizePayloadKey(key)));

  return entry?.[1];
}

function normalizePayloadKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getWebhookLeadErrorMessage(error: unknown) {
  if (error instanceof BillingResourceAccessError) {
    return error.access.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    return message;
  }

  if (message.includes("Supabase nao configurado")) {
    return "Configure o Supabase antes de usar o webhook de leads.";
  }

  if (message.includes("Webhook nao autorizado")) {
    return "Webhook nao autorizado.";
  }

  if (message.includes("Webhook token ausente")) {
    return "Informe um token em Authorization Bearer ou x-leadhealth-token.";
  }

  if (message.includes("Content-Type invalido")) {
    return "Envie o webhook com Content-Type application/json.";
  }

  if (message.includes("Payload invalido")) {
    return "Payload invalido. Revise o JSON enviado.";
  }

  if (message.includes("organization_id ou organization_slug")) {
    return "Nao foi possivel identificar a organizacao do webhook.";
  }

  if (message.includes("Organizacao nao encontrada")) {
    return "Nao encontramos a organizacao informada para este webhook.";
  }

  if (message.includes("owner_email informado")) {
    return "Nao encontramos o owner_email informado dentro da organizacao.";
  }

  if (message.includes("Perfil informado nao pertence")) {
    return "O owner_profile_id informado nao pertence a essa organizacao.";
  }

  if (message.includes("Organizacao sem perfis")) {
    return "A organizacao ainda nao possui um perfil apto para receber leads.";
  }

  if (message.includes("Nome do lead")) {
    return "Informe o nome do lead para processar o webhook.";
  }

  return "Nao foi possivel processar o webhook de lead.";
}

function getWebhookLeadErrorStatus(error: unknown) {
  if (error instanceof BillingResourceAccessError) {
    return error.status;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Webhook nao autorizado") || message.includes("Webhook token ausente")) {
    return 401;
  }

  if (message.includes("Organizacao nao encontrada")) {
    return 404;
  }

  if (
    message.includes("Supabase nao configurado") ||
    message.includes("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    return 503;
  }

  if (message.includes("Content-Type invalido")) {
    return 415;
  }

  return 400;
}

function getSafeWebhookHeaders(request: Request) {
  const safeHeaderNames = [
    "accept",
    "content-type",
    "user-agent",
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip"
  ];

  return Object.fromEntries(
    safeHeaderNames.flatMap((headerName) => {
      const value = request.headers.get(headerName);
      return value ? [[headerName, value]] : [];
    })
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
