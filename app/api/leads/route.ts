import { NextResponse } from "next/server";
import { z } from "zod";
import { BillingResourceAccessError } from "@/lib/billing/subscription-limits.server";
import {
  createLeadForCurrentUser,
  getLeadsForCurrentUser,
  type LeadCreateInput
} from "@/lib/leads/repository.server";
import { parseLeadPaginationParams } from "@/lib/leads/repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseLeadUrlFilters } from "@/lib/leads/filters";

import { logger } from "@/lib/logger";
import { assertPayloadSize, PayloadTooLargeError } from "@/lib/payload-limits";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const leadCreateSchema = z.object({
  name: requiredTrimmedString("Informe o nome do lead antes de salvar.").max(160),
  phone: z.string().trim().max(40).optional(),
  email: z.email("Informe um e-mail valido.").optional(),
  city: z.string().trim().max(120).optional(),
  company_name: z.string().trim().max(160).optional(),
  lives_count: z.union([z.number(), z.string()]).optional(),
  stage: z.string().trim().max(40).optional(),
  source: z.string().trim().max(60).optional(),
  quality: z.enum(["high", "medium", "low"]).nullable().optional(),
  budget: z.string().trim().max(120).optional(),
  interest: z.string().trim().max(120).optional(),
  last_interaction: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  loss_reason: z.string().trim().max(500).optional(),
  source_campaign: z.string().trim().max(160).optional(),
  source_adset: z.string().trim().max(160).optional(),
  source_ad: z.string().trim().max(160).optional(),
  meta_lead_id: z.string().trim().max(120).optional(),
  meta_form_id: z.string().trim().max(120).optional(),
  meta_page_id: z.string().trim().max(120).optional(),
  meta_campaign_id: z.string().trim().max(120).optional(),
  meta_adset_id: z.string().trim().max(120).optional(),
  meta_ad_id: z.string().trim().max(120).optional(),
  meta_connected_account_id: z.string().trim().max(120).optional()
});

export async function GET(request: Request) {
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-leads-get",
    limit: 120,
    windowMs: 60 * 1000
  });

  const searchParams = new URL(request.url).searchParams;
  const state = await getLeadsForCurrentUser(
    parseLeadUrlFilters(searchParams),
    parseLeadPaginationParams(searchParams)
  );

  if (state.mode === "unauthenticated") {
    return NextResponse.json({ error: "Sua sessao expirou. Entre novamente para carregar os leads." }, { status: 401 });
  }

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-leads-post",
      limit: 40,
      windowMs: 60 * 1000
    });
    assertPayloadSize(request, "WEBHOOK_JSON");
    body = await parseJsonBody(request, leadCreateSchema);
    const result = await createLeadForCurrentUser(body as LeadCreateInput);

    return NextResponse.json(
      { lead: result.lead, mode, status: result.status },
      { status: 201 }
    );
  } catch (error) {
    const status = getCreateLeadErrorStatus(error);
    const errorMessage = getCreateLeadErrorMessage(error);

    logger.error({
      route: "/api/leads",
      operation: "CREATE_LEAD",
      status,
      message: errorMessage,
      data: { body }
    }, error);

    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}

function getCreateLeadErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para criar leads.";
  }

  if (message.includes("Nome do lead")) {
    return "Informe o nome do lead antes de salvar.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
  }

  if (message.includes("Conecte uma conta Meta ativa")) {
    return "Ja existe um lead do Meta Ads com esse contato. Conecte uma conta Meta ativa para alterar esse registro.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce nao tem permissao para criar esse lead.";
  }

  return "Nao foi possivel criar o lead. Revise os dados e tente novamente.";
}

function getCreateLeadErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  if (error instanceof PayloadTooLargeError) {
    return error.status;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Conecte uma conta Meta ativa") || message.includes("Sem permissao")) {
    return 403;
  }

  if (error instanceof BillingResourceAccessError) {
    return error.status;
  }

  return 400;
}
