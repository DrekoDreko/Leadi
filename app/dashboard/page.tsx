import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { buildCommercialAgendaStateFromLeadState } from "@/lib/leads/agenda.server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { DashboardHome } from "./dashboard-home";

export default async function DashboardPage() {
  const [context, leadState, campaignState, connectedAccounts] = await Promise.all([
    requireCompletedProfile(),
    getLeadsForCurrentUser(),
    getCampaignsForCurrentUser(6),
    getConnectedAccountsForCurrentUser()
  ]);
  const agendaState = buildCommercialAgendaStateFromLeadState(leadState, {
    limit: 4,
    scopeLabel: context.mode === "not-configured" ? "Demo" : context.isTeamSeller ? "Escopo: minha carteira" : "Escopo: equipe",
    scopeDescription:
      context.mode === "not-configured"
        ? "Indicadores simulados enquanto o Supabase nao esta conectado."
        : context.isTeamSeller
          ? "Compromissos apenas da sua carteira comercial."
          : "Compromissos da sua organizacao com prioridade operacional."
  });

  return (
    <DashboardHome
      agendaEntries={agendaState.entries}
      campaignsCount={campaignState.campaigns.length}
      hasMetaConnection={Boolean(connectedAccounts.metaConnection)}
      hasOpenAIConnection={Boolean(connectedAccounts.openAIConnection)}
      leads={leadState.leads}
      showCreateTeamCard={context.isSoloOwner}
    />
  );
}
