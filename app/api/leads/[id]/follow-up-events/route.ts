import { NextResponse } from "next/server";
import {
  createLeadFollowUpEventForCurrentUser,
  listLeadFollowUpEventsForCurrentUser
} from "@/lib/leads/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const events = await listLeadFollowUpEventsForCurrentUser(id);

    return NextResponse.json({ events, mode });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: getLeadFollowUpErrorMessage(error, "load") },
      { status: getLeadFollowUpErrorStatus(error) }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const result = await createLeadFollowUpEventForCurrentUser(id, body);

    return NextResponse.json({ ...result, mode }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: getLeadFollowUpErrorMessage(error, "create") },
      { status: getLeadFollowUpErrorStatus(error) }
    );
  }
}

function getLeadFollowUpErrorMessage(error: unknown, action: "load" | "create") {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return action === "load"
      ? "Sua sessao expirou. Entre novamente para carregar o historico da agenda."
      : "Sua sessao expirou. Entre novamente para registrar o follow-up.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (message.includes("Lead nao encontrado")) {
    return "Lead nao encontrado ou indisponivel para o seu workspace.";
  }

  if (message.includes("Data de reagendamento obrigatoria")) {
    return "Informe uma data para reagendar o compromisso.";
  }

  if (message.includes("Data de reagendamento invalida")) {
    return "Escolha uma data valida para reagendar o compromisso.";
  }

  if (message.includes("Ação de follow-up inválida") || message.includes("Ação de follow-up invalida")) {
    return "Escolha uma acao valida para o follow-up.";
  }

  if (message.includes("Observacao muito longa")) {
    return "Observacao muito longa. Use ate 2000 caracteres.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce nao tem permissao para registrar follow-up neste lead.";
  }

  if (message.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. A acao sera mantida apenas nesta visualizacao.";
  }

  return action === "load"
    ? "Nao foi possivel carregar o historico da agenda."
    : "Nao foi possivel registrar o follow-up agora.";
}

function getLeadFollowUpErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Sem permissao")) {
    return 403;
  }

  if (message.includes("Lead nao encontrado")) {
    return 404;
  }

  return 400;
}
