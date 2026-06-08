import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  getLeadsForCurrentUser,
  countUndistributedLeadsForCurrentUser,
  listLeadIdsWithRecordedContactForCurrentUser,
  listLeadOwnerOptionsForCurrentUser,
  listOverdueLeadTasksForCurrentUser
} from "@/lib/leads/repository.server";
import {
  getCampaignActivitySummaryForCurrentUser,
  getCampaignsForCurrentUser
} from "@/lib/campaigns/repository.server";
import { getAiUsageThisPeriod, getCurrentAiBalance, getCurrentAiBalanceDetails } from "@/lib/ai/credits";
import {
  getWhatsAppDeliverySummaryForCurrentUser,
  getWhatsAppMessagesCountForCurrentUser
} from "@/lib/whatsapp/repository.server";
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
import { ManagerDashboard } from "./manager-dashboard";
import { getPendingCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { listCreditRequests } from "@/lib/ai/credit-requests.server";
import { getCurrentSubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import { SupervisorDashboard } from "./supervisor-dashboard";
import { ConsultantDashboard } from "./consultant-dashboard";

export default async function DashboardPage() {
  const context = await requireCompletedProfile();

  const [
    leadState,
    campaignState,
    campaignActivitySummary,
    whatsappMessagesCount,
    onboardingState,
    creativeRequestsCount,
    reminderState,
    whatsappTemplates,
    overdueTasks,
    leadOwnerOptions,
    pendingCampaignsResult,
    teamSetupData,
    creditRequests,
    subscriptionNotice,
    whatsappDeliverySummary,
    aiBalanceDetails,
    aiUsageSummary
  ] = await Promise.all([
    getLeadsForCurrentUser(),
    getCampaignsForCurrentUser(4),
    getCampaignActivitySummaryForCurrentUser(),
    getWhatsAppMessagesCountForCurrentUser(),
    getOnboardingStateForCurrentUser(),
    getCreativeRequestsCountForCurrentUser(),
    getDashboardRemindersForCurrentUser(),
    getSystemTemplates("whatsapp"),
    listOverdueLeadTasksForCurrentUser(),
    listLeadOwnerOptionsForCurrentUser(),
    getPendingCampaignsForCurrentUser(),
    context.isManager && context.workspaceType === "team" ? getTeamSetupData(context) : Promise.resolve(null),
    context.isManager && context.workspaceType === "team" && context.workspace ? listCreditRequests(context.workspace.id, context.isAdmin ? context.teamId : undefined) : Promise.resolve(null),
    getCurrentSubscriptionNotice(),
    getWhatsAppDeliverySummaryForCurrentUser(),
    getCurrentAiBalanceDetails(),
    getAiUsageThisPeriod()
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

  const isManagerDashboard = context.isOwner && context.workspaceType === "team";
  const isSupervisorDashboard = context.isAdmin && context.workspaceType === "team";
  const isConsultantDashboard = context.isTeamSeller;

  if (isManagerDashboard) {
    const pendingCreditRequestsCount = creditRequests?.filter(r => r.status === "pending").length ?? 0;
    
    return (
      <ManagerDashboard
        aiBalance={aiBalance}
        leadsCount={leadState.leads.length}
        campaignsCount={campaignState.campaigns.length}
        teamSetupData={teamSetupData ?? undefined}
        pendingCampaignsCount={pendingCampaignsResult?.campaigns?.length ?? 0}
        pendingCreditRequestsCount={pendingCreditRequestsCount}
        campaignActivitySummary={campaignActivitySummary}
        cplSummary={cplSummary}
        stageConversionSummary={stageConversionSummary}
        consultantPortfolioSummary={consultantPortfolioSummary}
        whatsappMessagesCount={whatsappMessagesCount}
        creativeRequestsCount={creativeRequestsCount}
        dashboardReminders={reminderState.reminders}
        onboardingState={onboardingState}
        whatsappTemplates={whatsappTemplates}
        overdueTasks={overdueTasks}
        leadOwnerOptions={leadOwnerOptions}
        subscriptionNotice={subscriptionNotice}
      />
    );
  }

  if (isSupervisorDashboard) {
    const pendingCreditRequestsCount = creditRequests?.filter(r => r.status === "pending").length ?? 0;
    const unassignedLeadCount = await countUndistributedLeadsForCurrentUser();

    return (
      <SupervisorDashboard
        aiBalance={aiBalance}
        leads={leadState.leads}
        campaignsCount={campaignState.campaigns.length}
        campaignActivitySummary={campaignActivitySummary}
        consultantPortfolioSummary={consultantPortfolioSummary}
        stageConversionSummary={stageConversionSummary}
        overdueTasks={overdueTasks}
        pendingCampaignsCount={pendingCampaignsResult?.campaigns?.length ?? 0}
        pendingCreditRequestsCount={pendingCreditRequestsCount}
        unassignedLeadCount={unassignedLeadCount}
        dashboardReminders={reminderState.reminders}
        onboardingState={onboardingState}
        whatsappTemplates={whatsappTemplates}
        leadOwnerOptions={leadOwnerOptions}
        teamName={context.teamName}
      />
    );
  }

  if (isConsultantDashboard) {
    return (
      <ConsultantDashboard
        aiBalance={aiBalance}
        leads={leadState.leads}
        dashboardReminders={reminderState.reminders}
        overdueTasks={overdueTasks}
        teamName={context.teamName}
        supervisorName={context.supervisorName}
        organizationName={context.workspaceName}
        whatsappTemplates={whatsappTemplates}
      />
    );
  }

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
      whatsappDeliverySummary={whatsappDeliverySummary}
      aiBalanceDetails={aiBalanceDetails}
      aiUsageSummary={aiUsageSummary}
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
