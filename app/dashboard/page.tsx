import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  getLeadsForCurrentUser,
  listLeadIdsWithRecordedContactForCurrentUser,
  listLeadOwnerOptionsForCurrentUser,
  listOverdueLeadTasksForCurrentUser
} from "@/lib/leads/repository.server";
import {
  getCampaignActivitySummaryForCurrentUser,
  getCampaignsForCurrentUser
} from "@/lib/campaigns/repository.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { getWhatsAppMessagesCountForCurrentUser } from "@/lib/whatsapp/repository.server";
import { getOnboardingStateForCurrentUser } from "@/lib/onboarding/repository.server";
import { getCreativeRequestsCountForCurrentUser } from "@/lib/creative-requests/repository.server";
import { getDashboardRemindersForCurrentUser } from "@/lib/dashboard-reminders/repository.server";
import {
  buildDashboardConsultantPortfolioSummary,
  buildDashboardStageConversionSummary,
  buildInitialDashboardCplSummary
} from "@/lib/reports/commercial-report.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { DashboardHome, type DashboardLeadNoContactSummary } from "./dashboard-home";

export default async function DashboardPage() {
  const [
    context,
    leadState,
    campaignState,
    campaignActivitySummary,
    whatsappMessagesCount,
    onboardingState,
    creativeRequestsCount,
    reminderState,
    whatsappTemplates,
    overdueTasks,
    leadOwnerOptions
  ] = await Promise.all([
    requireCompletedProfile(),
    getLeadsForCurrentUser(),
    getCampaignsForCurrentUser(6),
    getCampaignActivitySummaryForCurrentUser(),
    getWhatsAppMessagesCountForCurrentUser(),
    getOnboardingStateForCurrentUser(),
    getCreativeRequestsCountForCurrentUser(),
    getDashboardRemindersForCurrentUser(),
    getSystemTemplates("whatsapp"),
    listOverdueLeadTasksForCurrentUser(),
    listLeadOwnerOptionsForCurrentUser()
  ]);
  const aiBalance = await getCurrentAiBalance();
  const contactedLeadIds = new Set(
    await listLeadIdsWithRecordedContactForCurrentUser(leadState.leads.map((lead) => lead.id))
  );
  const leadNoContactSummary = buildLeadNoContactSummary(leadState.leads, contactedLeadIds);
  const cplSummary = buildInitialDashboardCplSummary({
    leadCount: leadState.leads.length,
    activeCampaignCount: campaignActivitySummary.activeCount,
    readyCampaignCount: campaignActivitySummary.readyCount
  });
  const stageConversionSummary = buildDashboardStageConversionSummary(leadState.leads);
  const consultantPortfolioSummary = context.isManager
    ? buildDashboardConsultantPortfolioSummary(
        leadState.leads,
        overdueTasks,
        leadOwnerOptions
      )
    : undefined;

  return (
    <DashboardHome
      aiBalance={aiBalance}
      campaignActivitySummary={campaignActivitySummary}
      campaignsCount={campaignState.campaigns.length}
      cplSummary={cplSummary}
      stageConversionSummary={stageConversionSummary}
      leads={leadState.leads}
      showCreateTeamCard={context.isSoloOwner}
      whatsappMessagesCount={whatsappMessagesCount}
      creativeRequestsCount={creativeRequestsCount}
      dashboardReminders={reminderState.reminders}
      onboardingState={onboardingState}
      whatsappTemplates={whatsappTemplates}
      leadNoContactSummary={leadNoContactSummary}
      overdueTasks={overdueTasks}
      canManageLeadOwners={context.isManager}
      leadOwnerOptions={leadOwnerOptions}
      consultantPortfolioSummary={consultantPortfolioSummary}
    />
  );
}

function buildLeadNoContactSummary(
  leads: Array<{
    id: string;
    name: string;
    owner: string;
    source: string;
    stage: string;
    createdAt: string;
  }>,
  contactedLeadIds: Set<string>
): DashboardLeadNoContactSummary {
  const leadsWithoutContact = leads.filter((lead) => !contactedLeadIds.has(lead.id));

  return {
    total: leadsWithoutContact.length,
    leads: leadsWithoutContact.slice(0, 3).map((lead) => ({
      id: lead.id,
      name: lead.name,
      owner: lead.owner,
      source: lead.source,
      stage: lead.stage,
      createdAtLabel: lead.createdAt
    }))
  };
}
