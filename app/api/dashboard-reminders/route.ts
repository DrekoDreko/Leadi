import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createDashboardReminderForCurrentUser,
  getDashboardRemindersForCurrentUser,
  completeDashboardReminderForCurrentUser,
  snoozeDashboardReminderForCurrentUser
} from "@/lib/dashboard-reminders/repository.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const isDevelopment = process.env.NODE_ENV !== "production";

const reminderSchema = z.object({
  date: requiredTrimmedString("Informe uma data valida para o lembrete.").max(32),
  message: requiredTrimmedString("Informe do que voce quer ser lembrado.").max(240),
  preset: z.string().trim().max(32).optional(),
  time24h: z.string().trim().max(16).optional()
});

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-dashboard-reminders-get",
      limit: 60,
      windowMs: 60 * 1000
    });
    const state = await getDashboardRemindersForCurrentUser();

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel carregar os lembretes." },
      { status: getCreateDashboardReminderErrorStatus(error) }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-dashboard-reminders",
      limit: 40,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, reminderSchema);
    const reminder = await createDashboardReminderForCurrentUser(body);

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getCreateDashboardReminderErrorMessage(error) },
      { status: getCreateDashboardReminderErrorStatus(error) }
    );
  }
}

const patchSchema = z.object({
  id: z.string().trim().min(1),
  action: z.enum(["complete", "snooze"]),
  snoozeType: z.enum(["one_hour", "tomorrow"]).optional(),
  timezoneOffsetMinutes: z.number().int().optional(),
  clientNowIso: z.string().trim().optional()
});

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-dashboard-reminders-patch",
      limit: 60,
      windowMs: 60 * 1000
    });
    const body = await parseJsonBody(request, patchSchema);

    if (body.action === "complete") {
      const reminder = await completeDashboardReminderForCurrentUser(body.id);
      return NextResponse.json({ reminder });
    }

    if (body.action === "snooze") {
      if (!body.snoozeType) {
        return NextResponse.json({ error: "Informe o tipo de adiamento." }, { status: 400 });
      }
      const reminder = await snoozeDashboardReminderForCurrentUser(
        body.id,
        body.snoozeType,
        body.timezoneOffsetMinutes ?? 0,
        body.clientNowIso ?? new Date().toISOString()
      );
      return NextResponse.json({ reminder });
    }

    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: getCreateDashboardReminderErrorMessage(error) },
      { status: getCreateDashboardReminderErrorStatus(error) }
    );
  }
}

function getCreateDashboardReminderErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para salvar lembretes.";
  }

  if (message.includes("Perfil nao encontrado")) {
    if (isDevelopment) {
      return message;
    }

    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (
    message.includes("Informe uma data valida") ||
    message.includes("Informe do que voce quer ser lembrado") ||
    message.includes("Informe um horario valido") ||
    message.includes("Informe um horario em 24 horas para lembretes em outros dias") ||
    message.includes("Escolha um horario futuro") ||
    message.includes("Escolha quando voce quer ser lembrado") ||
    message.includes("Escolha uma opcao valida para o lembrete") ||
    message.includes("Informe um horario em 24 horas") ||
    message.includes("Use um horario manual") ||
    message.includes("Escolha um horario manual para este lembrete") ||
    message.includes("Nao foi possivel identificar o horario") ||
    message.includes("A tabela de lembretes ainda nao foi criada") ||
    message.includes("Seu perfil nao esta vinculado a uma organizacao")
  ) {
    return message;
  }

  if (
    message.includes("JSON object requested, multiple (or no) rows returned") ||
    message.includes("no rows returned") ||
    message.includes("No rows found") ||
    message.includes("relation \"dashboard_reminders\" does not exist") ||
    message.includes("Could not find the 'dashboard_reminders' table") ||
    message.includes("Could not find relation 'dashboard_reminders' in schema cache") ||
    message.includes("schema cache") && message.includes("dashboard_reminders")
  ) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina e tente novamente.";
  }

  if (
    message.includes("violates row-level security policy") ||
    message.includes("new row violates row-level security policy") ||
    message.includes("permission denied for table") ||
    message.includes("permission denied for schema") ||
    message.includes("null value in column \"organization_id\"") ||
    message.includes("null value in column \"created_by_profile_id\"") ||
    message.includes("violates foreign key constraint")
  ) {
    return "Seu perfil nao tem permissao para salvar lembretes. Recarregue a pagina ou refaca o login.";
  }

  return "Nao foi possivel salvar o lembrete. Revise os dados e tente novamente.";
}

function getCreateDashboardReminderErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (
    message.includes("Perfil nao encontrado") ||
    message.includes("JSON object requested, multiple (or no) rows returned") ||
    message.includes("no rows returned") ||
    message.includes("No rows found") ||
    message.includes("violates row-level security policy") ||
    message.includes("new row violates row-level security policy") ||
    message.includes("permission denied for table")
  ) {
    return 403;
  }

  return 400;
}
