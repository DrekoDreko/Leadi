import { NextResponse } from "next/server";
import {
  createLeadCommentForCurrentUser,
  listLeadCommentsForCurrentUser
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
    const comments = await listLeadCommentsForCurrentUser(id);

    return NextResponse.json({ comments, mode });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: getLeadCommentErrorMessage(error) },
      { status: getLeadCommentErrorStatus(error) }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const comment = await createLeadCommentForCurrentUser(id, body);

    return NextResponse.json({ comment, mode }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: getLeadCommentErrorMessage(error) },
      { status: getLeadCommentErrorStatus(error) }
    );
  }
}

function getLeadCommentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para comentar no lead.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (message.includes("Lead nao encontrado")) {
    return "Lead nao encontrado ou indisponivel para o seu workspace.";
  }

  if (message.includes("Comentario vazio")) {
    return "Escreva um comentario antes de enviar.";
  }

  if (message.includes("Comentario muito longo")) {
    return "Comentario muito longo. Use ate 2000 caracteres.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce nao tem permissao para acessar este lead.";
  }

  return "Nao foi possivel salvar ou carregar os comentarios do lead.";
}

function getLeadCommentErrorStatus(error: unknown) {
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
