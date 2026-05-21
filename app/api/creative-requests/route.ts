import { NextResponse } from "next/server";
import { z } from "zod";
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
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const creativeRequestSchema = z.object({
  type: requiredTrimmedString("Tipo de pedido invalido.").max(40),
  title: requiredTrimmedString("Titulo do pedido invalido.").max(160),
  objective: requiredTrimmedString("Objetivo do pedido invalido.").max(500),
  briefing: requiredTrimmedString("Briefing do pedido invalido.").max(4000),
  notes: z.string().trim().max(2000).optional(),
  desiredDeadline: z.string().trim().max(64).optional()
});

export async function GET() {
  const state = await getCreativeRequestsForCurrentUser();
  if (state.mode === "unauthenticated") {
    return NextResponse.json(
      { error: "Sua sessao expirou. Entre novamente para carregar pedidos." },
      { status: 401 }
    );
  }
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-creative-requests",
      limit: 20,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, creativeRequestSchema);
    const creativeRequest = await createCreativeRequestForCurrentUser(body);

    return NextResponse.json({ request: creativeRequest, mode }, { status: 201 });
  } catch (error) {
    logApiError({
      route: "/api/creative-requests",
      operation: "CREATE_CREATIVE_REQUEST",
      message: getCreateCreativeRequestErrorMessage(error),
      status: getCreateCreativeRequestErrorStatus(error),
      error
    });

    return NextResponse.json(
      { error: getCreateCreativeRequestErrorMessage(error) },
      { status: getCreateCreativeRequestErrorStatus(error) }
    );
  }
}

function getCreateCreativeRequestErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

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
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (error instanceof BillingResourceAccessError) {
    return error.status;
  }

  return 400;
}
