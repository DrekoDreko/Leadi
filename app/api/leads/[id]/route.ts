import { NextResponse } from "next/server";
import {
  deleteLeadForCurrentUser,
  updateLeadForCurrentUser
} from "@/lib/leads/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

import { logger } from "@/lib/logger";

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    body = await request.json();
    const lead = await updateLeadForCurrentUser(id, body);

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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    await deleteLeadForCurrentUser(id);

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

  if (message.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. A edicao sera mantida apenas nesta visualizacao.";
  }

  return "Nao foi possivel atualizar o lead. Revise os dados e tente novamente.";
}

function getDeleteLeadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para excluir leads.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
  }

  if (message.includes("Lead nao encontrado")) {
    return "Lead nao encontrado ou ja removido.";
  }

  if (message.includes("Conecte uma conta Meta ativa")) {
    return "Conecte uma conta Meta ativa para excluir leads dessa origem.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce so pode excluir leads adicionados por voce.";
  }

  if (message.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. A exclusao exige a base real configurada.";
  }

  return "Nao foi possivel remover o lead. Tente novamente em instantes.";
}

function getLeadMutationErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Conecte uma conta Meta ativa") || message.includes("Sem permissao")) {
    return 403;
  }

  return 400;
}
