import { NextResponse } from "next/server";
import { createLeadForCurrentUser, getLeadsForCurrentUser } from "@/lib/leads/repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  const state = await getLeadsForCurrentUser();

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const lead = await createLeadForCurrentUser(body);

    return NextResponse.json({ lead, mode }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: getCreateLeadErrorMessage(error)
      },
      { status: getCreateLeadErrorStatus(error) }
    );
  }
}

function getCreateLeadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para criar leads.";
  }

  if (message.includes("Nome do lead")) {
    return "Informe o nome do lead antes de salvar.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
  }

  return "Nao foi possivel criar o lead. Revise os dados e tente novamente.";
}

function getCreateLeadErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  return 400;
}
