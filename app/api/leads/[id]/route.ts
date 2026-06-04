import { NextResponse } from "next/server";
import { z } from "zod";
import {
  archiveLeadForCurrentUser,
  updateLeadForCurrentUser,
  type LeadCreateInput
} from "@/lib/leads/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { can } from "@/lib/workspaces/permissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

import { logger } from "@/lib/logger";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  getErrorStatus,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const leadUpdateSchema = z.object({
  name: requiredTrimmedString("Informe o nome do lead antes de salvar.").max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.email("Informe um e-mail valido.").optional(),
  owner_profile_id: z.string().trim().max(80).optional(),
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
  source_ad: z.string().trim().max(160).optional()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "Informe ao menos um campo para atualizar o lead."
});

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-lead-patch",
      suffix: id,
      limit: 40,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    body = await parseJsonBody(request, leadUpdateSchema);
    const lead = await updateLeadForCurrentUser(id, body as LeadCreateInput);

    return NextResponse.json({ lead, mode });
  } catch (error) {
    const status = getLeadMutationErrorStatus(error);
    const errorMessage = getUpdateLeadErrorMessage(error);

    logger.error({
      route: `/api/leads/${id}`,
      operation: "UPDATE_LEAD",
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

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-lead-delete",
      suffix: id,
      limit: 30,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
      const workspaceContext = await getCurrentWorkspaceContext();
      if (!can(workspaceContext.role, "delete_archive_leads")) {
        throw new ApiRouteError(403, "Voce nao tem permissao para arquivar leads.");
      }
    }

    await archiveLeadForCurrentUser(id);

    return NextResponse.json({ ok: true, mode });
  } catch (error) {
    const status = getLeadMutationErrorStatus(error);
    const errorMessage = getDeleteLeadErrorMessage(error);

    logger.error({
      route: `/api/leads/${id}`,
      operation: "DELETE_LEAD",
      status,
      message: errorMessage
    }, error);

    return NextResponse.json(
      {
        error: errorMessage
      },
      { status }
    );
  }
}

function getUpdateLeadErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para editar leads.";
  }

  if (message.includes("Nome do lead")) {
    return "Informe o nome do lead antes de salvar.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
  }

  if (message.includes("Conecte uma conta Meta ativa")) {
    return "Conecte uma conta Meta ativa para editar leads dessa origem.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce so pode editar leads adicionados por voce.";
  }

  if (message.includes("Somente owner ou admin podem alterar o responsavel do lead")) {
    return "Somente owner ou admin podem alterar o responsavel do lead.";
  }

  if (message.includes("Responsavel do lead nao encontrado")) {
    return "Nao encontramos o responsavel informado na sua equipe.";
  }

  if (message.includes("Selecione um responsavel valido")) {
    return "Selecione um responsavel valido para este lead.";
  }

  if (message.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. A edicao sera mantida apenas nesta visualizacao.";
  }

  return "Nao foi possivel atualizar o lead. Revise os dados e tente novamente.";
}

function getDeleteLeadErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para arquivar leads.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
  }

  if (message.includes("Lead nao encontrado")) {
    return "Lead nao encontrado ou ja arquivado.";
  }

  if (message.includes("Conecte uma conta Meta ativa")) {
    return "Conecte uma conta Meta ativa para arquivar leads dessa origem.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce so pode arquivar leads adicionados por voce.";
  }

  if (message.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. O arquivamento exige a base real configurada.";
  }

  return "Nao foi possivel arquivar o lead. Tente novamente em instantes.";
}

function getLeadMutationErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Conecte uma conta Meta ativa") || message.includes("Sem permissao")) {
    return 403;
  }

  return 400;
}
