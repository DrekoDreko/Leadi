import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  buildCommercialAgendaStateFromLeadState,
  parseCommercialAgendaQuery
} from "@/lib/leads/agenda.server";
import { CommercialAgendaWorkspace } from "./agenda-workspace";

type AgendaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const [context, leadState, resolvedSearchParams] = await Promise.all([
    requireCompletedProfile(),
    getLeadsForCurrentUser(),
    searchParams
  ]);
  const agendaState = buildCommercialAgendaStateFromLeadState(leadState, {
    filters: parseCommercialAgendaQuery(resolvedSearchParams),
    scopeLabel:
      context.mode === "not-configured"
        ? "Demo"
        : context.isTeamSeller
          ? "Escopo: minha carteira"
          : "Escopo: equipe",
    scopeDescription:
      context.mode === "not-configured"
        ? "Indicadores simulados enquanto o Supabase nao esta conectado."
        : context.isTeamSeller
          ? "Compromissos apenas da sua carteira comercial."
          : "Compromissos da sua organizacao com prioridade operacional."
  });

  return <CommercialAgendaWorkspace agendaState={agendaState} />;
}
