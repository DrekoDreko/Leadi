import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { buildCommercialAgendaStateFromLeadState } from "@/lib/leads/agenda.server";
import { getBillingSnapshot } from "@/lib/billing/admin";
import { buildDemoBillingSnapshot } from "@/lib/billing/usage.server";
import { isBillingConfigured } from "@/lib/billing/config";
import { DashboardHome } from "./dashboard-home";

export default async function DashboardPage() {
  const context = await requireCompletedProfile();
  const leadState = await getLeadsForCurrentUser();
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
  const billingSnapshot = isBillingConfigured()
    ? (await getBillingSnapshot(context.workspace?.id ?? context.profile?.organization_id ?? "")) ??
      buildDemoBillingSnapshot()
    : buildDemoBillingSnapshot();

  return (
    <DashboardHome
      creditBalance={billingSnapshot.wallet.balance}
      agendaEntries={agendaState.entries}
      agendaMetrics={agendaState.metrics}
      leads={leadState.leads}
      showCreateTeamCard={context.isSoloOwner}
    />
  );
}
