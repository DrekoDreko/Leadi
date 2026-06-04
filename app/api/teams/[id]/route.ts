import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";
import {
  deactivateTeamForCurrentUser,
  TeamAccessError,
  updateTeamForCurrentUser
} from "@/lib/workspaces/team";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const teamUpdateSchema = z
  .object({
    name: requiredTrimmedString("Informe o nome da equipe.").max(
      120,
      "O nome da equipe pode ter no maximo 120 caracteres."
    )
  })
  .strict();

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;

  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-team-patch",
      suffix: id,
      limit: 20,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const payload = await parseJsonBody(request, teamUpdateSchema);
    body = payload;
    const team = await updateTeamForCurrentUser(id, payload);

    return NextResponse.json({ team, mode });
  } catch (error) {
    const status = getTeamErrorStatus(error);
    const errorMessage = getUpdateTeamErrorMessage(error);

    logger.error(
      {
        route: `/api/teams/${id}`,
        operation: "UPDATE_TEAM",
        status,
        message: errorMessage,
        data: { body }
      },
      error
    );

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-team-delete",
      suffix: id,
      limit: 20,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const team = await deactivateTeamForCurrentUser(id);

    return NextResponse.json({ ok: true, team, mode });
  } catch (error) {
    const status = getTeamErrorStatus(error);
    const errorMessage = getDeactivateTeamErrorMessage(error);

    logger.error(
      {
        route: `/api/teams/${id}`,
        operation: "DEACTIVATE_TEAM",
        status,
        message: errorMessage
      },
      error
    );

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

function getUpdateTeamErrorMessage(error: unknown) {
  if (error instanceof TeamAccessError) {
    if (error.message.includes("Usuario nao autenticado")) {
      return "Sua sessao expirou. Entre novamente para editar equipes.";
    }

    if (error.message.includes("Perfil nao encontrado")) {
      return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
    }

    if (error.message.includes("Somente owners")) {
      return "Somente o gestor pode editar equipes.";
    }

    if (error.message.includes("Equipe nao encontrada")) {
      return "Equipe nao encontrada.";
    }

    if (
      error.message.includes("Informe o nome da equipe") ||
      error.message.includes("120 caracteres")
    ) {
      return error.message;
    }
  }

  return "Nao foi possivel atualizar a equipe agora.";
}

function getDeactivateTeamErrorMessage(error: unknown) {
  if (error instanceof TeamAccessError) {
    if (error.message.includes("Usuario nao autenticado")) {
      return "Sua sessao expirou. Entre novamente para desativar equipes.";
    }

    if (error.message.includes("Perfil nao encontrado")) {
      return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
    }

    if (error.message.includes("Somente owners")) {
      return "Somente o gestor pode desativar equipes.";
    }

    if (error.message.includes("Equipe nao encontrada")) {
      return "Equipe nao encontrada.";
    }
  }

  return "Nao foi possivel desativar a equipe agora.";
}

function getTeamErrorStatus(error: unknown) {
  if (error instanceof TeamAccessError) {
    return error.status;
  }

  return 500;
}
