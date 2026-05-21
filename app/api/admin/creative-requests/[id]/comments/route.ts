import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { createCreativeRequestCommentForAdmin } from "@/lib/creative-requests/repository.server";
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

const adminCreativeRequestCommentSchema = z.object({
  body: requiredTrimmedString("Comentario invalido.").max(2000)
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-admin-creative-request-comment",
      suffix: id,
      limit: 20,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, adminCreativeRequestCommentSchema);
    const creativeRequest = await createCreativeRequestCommentForAdmin(id, body);

    return NextResponse.json({ request: creativeRequest, mode }, { status: 201 });
  } catch (error) {
    logApiError({
      route: "/api/admin/creative-requests/[id]/comments",
      operation: "CREATE_ADMIN_CREATIVE_REQUEST_COMMENT",
      message: getAdminCreativeRequestCommentErrorMessage(error),
      status: getAdminCreativeRequestCommentErrorStatus(error),
      error
    });

    return NextResponse.json(
      { error: getAdminCreativeRequestCommentErrorMessage(error) },
      { status: getAdminCreativeRequestCommentErrorStatus(error) }
    );
  }
}

function getAdminCreativeRequestCommentErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para comentar no pedido.";
  }

  if (message.includes("Permissao negada")) {
    return "Apenas administradores operacionais podem comentar por esta rota.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (message.includes("Pedido nao encontrado")) {
    return "Pedido nao encontrado na fila admin.";
  }

  if (isCreativeRequestSetupErrorMessage(message)) {
    return getCreativeRequestSetupErrorMessage();
  }

  if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    return message;
  }

  if (message.includes("Comentario")) {
    return message;
  }

  return "Nao foi possivel salvar o comentario interno. Tente novamente em instantes.";
}

function getAdminCreativeRequestCommentErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Permissao negada")) {
    return 403;
  }

  if (message.includes("Pedido nao encontrado")) {
    return 404;
  }

  return 400;
}
