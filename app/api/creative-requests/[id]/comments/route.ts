import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { createCreativeRequestCommentForCurrentUser } from "@/lib/creative-requests/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
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

const creativeRequestCommentSchema = z.object({
  body: requiredTrimmedString("Comentario invalido.").max(2000)
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-creative-request-comment",
      suffix: id,
      limit: 30,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, creativeRequestCommentSchema);
    const creativeRequest = await createCreativeRequestCommentForCurrentUser(id, body);

    return NextResponse.json({ request: creativeRequest, mode }, { status: 201 });
  } catch (error) {
    logApiError({
      route: "/api/creative-requests/[id]/comments",
      operation: "CREATE_CREATIVE_REQUEST_COMMENT",
      message: getCreativeRequestCommentErrorMessage(error),
      status: getCreativeRequestCommentErrorStatus(error),
      error
    });

    return NextResponse.json(
      { error: getCreativeRequestCommentErrorMessage(error) },
      { status: getCreativeRequestCommentErrorStatus(error) }
    );
  }
}

function getCreativeRequestCommentErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para comentar no pedido.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (message.includes("Pedido nao encontrado")) {
    return "Pedido nao encontrado ou indisponivel para o seu workspace.";
  }

  if (isCreativeRequestSetupErrorMessage(message)) {
    return getCreativeRequestSetupErrorMessage();
  }

  if (message.includes("Comentario")) {
    return message;
  }

  return "Nao foi possivel salvar o comentario. Tente novamente em instantes.";
}

function getCreativeRequestCommentErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Pedido nao encontrado")) {
    return 404;
  }

  return 400;
}
