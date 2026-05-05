import { NextResponse } from "next/server";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { createCreativeRequestCommentForAdmin } from "@/lib/creative-requests/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const creativeRequest = await createCreativeRequestCommentForAdmin(id, body);

    return NextResponse.json({ request: creativeRequest, mode }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: getAdminCreativeRequestCommentErrorMessage(error) },
      { status: getAdminCreativeRequestCommentErrorStatus(error) }
    );
  }
}

function getAdminCreativeRequestCommentErrorMessage(error: unknown) {
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
