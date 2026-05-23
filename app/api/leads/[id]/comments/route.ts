import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createLeadCommentForCurrentUser,
  listLeadCommentsForCurrentUser
} from "@/lib/leads/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const leadCommentSchema = z.object({
  body: requiredTrimmedString("Escreva um comentario antes de enviar.").max(
    2000,
    "Comentario muito longo. Use ate 2000 caracteres."
  ),
  type: z.enum(["comment", "contact"]).optional().default("comment")
}).strict();

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const comments = await listLeadCommentsForCurrentUser(id);

    return NextResponse.json({ comments, mode });
  } catch (error) {
    logApiError({
      route: "/api/leads/[id]/comments",
      operation: "LIST_LEAD_COMMENTS",
      message: getLeadCommentErrorMessage(error),
      status: getLeadCommentErrorStatus(error),
      error
    });

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
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-lead-comments-post",
      suffix: id,
      limit: 30,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const body = await parseJsonBody(request, leadCommentSchema);
    const { comment, lead } = await createLeadCommentForCurrentUser(id, body);

    return NextResponse.json({ comment, lead, mode }, { status: 201 });
  } catch (error) {
    logApiError({
      route: "/api/leads/[id]/comments",
      operation: "CREATE_LEAD_COMMENT",
      message: getLeadCommentErrorMessage(error),
      status: getLeadCommentErrorStatus(error),
      error
    });

    return NextResponse.json(
      { error: getLeadCommentErrorMessage(error) },
      { status: getLeadCommentErrorStatus(error) }
    );
  }
}

function getLeadCommentErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

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
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

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
