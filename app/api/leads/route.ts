import { NextResponse } from "next/server";
import {
  createLeadForCurrentUser,
  getLeadsForCurrentUser
} from "@/lib/leads/repository.server";
import { parseLeadPaginationParams } from "@/lib/leads/repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parseLeadUrlFilters } from "@/lib/leads/filters";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const state = await getLeadsForCurrentUser(
    parseLeadUrlFilters(searchParams),
    parseLeadPaginationParams(searchParams)
  );

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    const body = await request.json();
    const result = await createLeadForCurrentUser(body);

    return NextResponse.json(
      { lead: result.lead, mode, status: result.status },
      { status: 201 }
    );
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

  if (message.includes("Apenas supervisores podem editar")) {
    return "Ja existe um lead do Meta Ads com esse contato. Apenas supervisores podem alterar esse registro.";
  }

  if (message.includes("Apenas supervisores")) {
    return "Apenas usuarios supervisores podem cadastrar leads com origem Meta Ads.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce nao tem permissao para criar esse lead.";
  }

  return "Nao foi possivel criar o lead. Revise os dados e tente novamente.";
}

function getCreateLeadErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Apenas supervisores") || message.includes("Sem permissao")) {
    return 403;
  }

  return 400;
}
