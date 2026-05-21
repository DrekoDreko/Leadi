import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { updateCreativeRequestStatusForCurrentUser } from "@/lib/creative-requests/repository.server";
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

const updateCreativeRequestSchema = z.object({
  status: requiredTrimmedString("Status do pedido invalido.").max(40)
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-creative-request-patch",
      suffix: id,
      limit: 20,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, updateCreativeRequestSchema);
    const creativeRequest = await updateCreativeRequestStatusForCurrentUser(id, body);

    return NextResponse.json({ request: creativeRequest, mode });
  } catch (error) {
    logApiError({
      route: "/api/creative-requests/[id]",
      operation: "UPDATE_CREATIVE_REQUEST_STATUS",
      message: getUpdateCreativeRequestErrorMessage(error),
      status: getCreativeRequestMutationErrorStatus(error),
      error
    });

    return NextResponse.json(
      {
        error: getUpdateCreativeRequestErrorMessage(error)
      },
      { status: getCreativeRequestMutationErrorStatus(error) }
    );
  }
}

function getUpdateCreativeRequestErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para atualizar pedidos.";
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

  if (message.includes("Status do pedido")) {
    return message;
  }

  return "Nao foi possivel atualizar o status do pedido. Tente novamente em instantes.";
}

function getCreativeRequestMutationErrorStatus(error: unknown) {
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
