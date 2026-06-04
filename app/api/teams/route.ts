import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";
import {
  createTeamForCurrentUser,
  listTeamsForCurrentUser,
  TeamAccessError
} from "@/lib/workspaces/team";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  requiredTrimmedString,
  parseJsonBody
} from "@/lib/api/route-security";

const teamCreateSchema = z
  .object({
    name: requiredTrimmedString("Informe o nome da equipe.").max(
      120,
      "O nome da equipe pode ter no maximo 120 caracteres."
    )
  })
  .strict();

export async function GET(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-teams-get",
      limit: 60,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const teams = await listTeamsForCurrentUser();

    return NextResponse.json({ teams, mode });
  } catch (error) {
    const status = getTeamErrorStatus(error);
    const errorMessage = getListTeamsErrorMessage(error);

    logger.error(
      {
        route: "/api/teams",
        operation: "LIST_TEAMS",
        status,
        message: errorMessage
      },
      error
    );

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-teams-post",
      limit: 20,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const payload = await parseJsonBody(request, teamCreateSchema);
    body = payload;
    const team = await createTeamForCurrentUser(payload);

    return NextResponse.json({ team, mode }, { status: 201 });
  } catch (error) {
    const status = getTeamErrorStatus(error);
    const errorMessage = getCreateTeamErrorMessage(error);

    logger.error(
      {
        route: "/api/teams",
        operation: "CREATE_TEAM",
        status,
        message: errorMessage,
        data: { body }
      },
      error
    );

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

function getListTeamsErrorMessage(error: unknown) {
  if (error instanceof TeamAccessError) {
    if (error.message.includes("Usuario nao autenticado")) {
      return "Sua sessao expirou. Entre novamente para carregar as equipes.";
    }

    if (error.message.includes("Perfil nao encontrado")) {
      return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
    }

    if (error.message.includes("Somente owners")) {
      return "Somente o gestor pode gerenciar equipes.";
    }
  }

  return "Nao foi possivel carregar as equipes agora.";
}

function getCreateTeamErrorMessage(error: unknown) {
  if (error instanceof TeamAccessError) {
    if (error.message.includes("Usuario nao autenticado")) {
      return "Sua sessao expirou. Entre novamente para criar equipes.";
    }

    if (error.message.includes("Perfil nao encontrado")) {
      return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
    }

    if (error.message.includes("Somente owners")) {
      return "Somente o gestor pode criar equipes.";
    }

    if (
      error.message.includes("Informe o nome da equipe") ||
      error.message.includes("120 caracteres")
    ) {
      return error.message;
    }
  }

  return "Nao foi possivel criar a equipe agora.";
}

function getTeamErrorStatus(error: unknown) {
  if (error instanceof TeamAccessError) {
    return error.status;
  }

  return 500;
}
