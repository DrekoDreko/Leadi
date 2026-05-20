import { NextResponse } from "next/server";
import { createDashboardReminderForCurrentUser } from "@/lib/dashboard-reminders/repository.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reminder = await createDashboardReminderForCurrentUser(body);

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: getCreateDashboardReminderErrorMessage(error) },
      { status: getCreateDashboardReminderErrorStatus(error) }
    );
  }
}

function getCreateDashboardReminderErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para salvar lembretes.";
  }

  if (message.includes("Perfil nao encontrado")) {
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
