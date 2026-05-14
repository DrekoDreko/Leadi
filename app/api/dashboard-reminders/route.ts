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
    message.includes("Escolha um horario futuro") ||
    message.includes("Escolha quando voce quer ser lembrado") ||
    message.includes("Use um horario manual") ||
    message.includes("Nao foi possivel identificar o horario")
  ) {
    return message;
  }

  return "Nao foi possivel salvar o lembrete. Revise os dados e tente novamente.";
}

function getCreateDashboardReminderErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  return 400;
}
