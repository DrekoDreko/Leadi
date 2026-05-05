import { NextResponse } from "next/server";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { updateCreativeRequestStatusForCurrentUser } from "@/lib/creative-requests/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const creativeRequest = await updateCreativeRequestStatusForCurrentUser(id, body);

    return NextResponse.json({ request: creativeRequest, mode });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: getUpdateCreativeRequestErrorMessage(error)
      },
      { status: getCreativeRequestMutationErrorStatus(error) }
    );
  }
}

function getUpdateCreativeRequestErrorMessage(error: unknown) {
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
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Pedido nao encontrado")) {
    return 404;
  }

  return 400;
}
