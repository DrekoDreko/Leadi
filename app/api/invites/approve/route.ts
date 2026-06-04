import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  getErrorStatus,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  reviewInviteForCurrentUser,
  TeamAccessError,
  type InviteReviewDecision
} from "@/lib/workspaces/team";

const inviteReviewSchema = z
  .object({
    inviteId: requiredTrimmedString("Informe o convite que voce quer revisar."),
    decision: z.enum(["approved", "rejected"])
  })
  .strict();

export async function POST(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-invites-approve-post",
      limit: 30,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const body: { inviteId: string; decision: InviteReviewDecision } = await parseJsonBody(
      request,
      inviteReviewSchema
    );
    const invite = await reviewInviteForCurrentUser(body.inviteId, body.decision);

    return NextResponse.json({ invite, mode });
  } catch (error) {
    const status = getInviteReviewErrorStatus(error);
    const message = getInviteReviewErrorMessage(error);

    return NextResponse.json(
      {
        error: message
      },
      {
        status
      }
    );
  }
}

function getInviteReviewErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  if (error instanceof TeamAccessError) {
    if (error.message.includes("Usuario nao autenticado")) {
      return "Sua sessao expirou. Entre novamente para revisar convites.";
    }

    if (error.message.includes("Perfil nao encontrado")) {
      return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o gestor.";
    }

    if (error.message.includes("Somente owners podem aprovar convites")) {
      return "Somente o gestor pode aprovar ou rejeitar convites.";
    }

    if (
      error.message.includes("Convite nao encontrado") ||
      error.message.includes("Este convite ja expirou") ||
      error.message.includes("Este convite nao precisa de aprovacao") ||
      error.message.includes("Este convite ja foi revisado") ||
      error.message.includes("Este convite ja foi utilizado") ||
      error.message.includes("Este convite nao esta disponivel")
    ) {
      return error.message;
    }

    if (error.message.includes("A aprovacao de convites nao esta disponivel agora")) {
      return error.message;
    }
  }

  return "Nao foi possivel revisar o convite agora.";
}

function getInviteReviewErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  if (error instanceof TeamAccessError) {
    return error.status;
  }

  return 500;
}
