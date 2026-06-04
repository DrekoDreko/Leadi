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
  reviewMemberDeactivationRequestForCurrentUser,
  startMemberDeactivationForCurrentUser,
  TeamAccessError,
  type MemberDeactivationReviewDecision
} from "@/lib/workspaces/team";

const createDeactivationSchema = z
  .object({
    targetProfileId: requiredTrimmedString("Informe o membro que voce quer desativar.")
  })
  .strict();

const reviewDeactivationSchema = z
  .object({
    requestId: requiredTrimmedString("Informe a solicitacao que voce quer revisar."),
    decision: z.enum(["approved", "rejected"])
  })
  .strict();

const deactivationPayloadSchema = z.union([createDeactivationSchema, reviewDeactivationSchema]);

export async function POST(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-team-members-deactivate-post",
      limit: 30,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const body:
      | { targetProfileId: string }
      | { requestId: string; decision: MemberDeactivationReviewDecision } = await parseJsonBody(
      request,
      deactivationPayloadSchema
    );

    const result =
      "targetProfileId" in body
        ? await startMemberDeactivationForCurrentUser(body.targetProfileId)
        : await reviewMemberDeactivationRequestForCurrentUser(body.requestId, body.decision);

    return NextResponse.json({ result, mode });
  } catch (error) {
    const status = getTeamMemberDeactivationErrorStatus(error);
    const message = getTeamMemberDeactivationErrorMessage(error);

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

function getTeamMemberDeactivationErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  if (error instanceof TeamAccessError) {
    if (error.message.includes("Usuario nao autenticado")) {
      return "Sua sessao expirou. Entre novamente para gerenciar desativacoes.";
    }

    if (error.message.includes("Perfil nao encontrado")) {
      return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o gestor.";
    }

    if (error.message.includes("Somente owners podem aprovar desativacoes")) {
      return "Somente o gestor pode aprovar ou rejeitar desativacoes.";
    }

    return error.message;
  }

  return "Nao foi possivel concluir a desativacao agora.";
}

function getTeamMemberDeactivationErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  if (error instanceof TeamAccessError) {
    return error.status;
  }

  return 500;
}
