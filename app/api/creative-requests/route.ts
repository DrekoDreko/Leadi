import { NextResponse } from "next/server";
import { BillingResourceAccessError } from "@/lib/billing/subscription-limits.server";
import {
  createCreativeRequestForCurrentUser,
  getCreativeRequestsForCurrentUser
} from "@/lib/creative-requests/repository.server";
import {
  getCreativeRequestSetupErrorMessage,
  isCreativeRequestSetupErrorMessage
} from "@/lib/creative-requests/errors";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  const state = await getCreativeRequestsForCurrentUser();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const creativeRequest = await createCreativeRequestForCurrentUser(body);

    return NextResponse.json({ request: creativeRequest, mode }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: getCreateCreativeRequestErrorMessage(error) },
      { status: getCreateCreativeRequestErrorStatus(error) }
    );
  }
}

function getCreateCreativeRequestErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para criar pedidos.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (isCreativeRequestSetupErrorMessage(message)) {
    return getCreativeRequestSetupErrorMessage();
  }

  if (
    message.includes("Tipo de pedido") ||
    message.includes("Titulo do pedido") ||
    message.includes("Objetivo do pedido") ||
    message.includes("Briefing do pedido") ||
    message.includes("Prazo desejado")
  ) {
    return message;
  }

  return "Nao foi possivel salvar o pedido. Revise os dados e tente novamente.";
}

function getCreateCreativeRequestErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (error instanceof BillingResourceAccessError) {
    return error.status;
  }

  return 400;
}
