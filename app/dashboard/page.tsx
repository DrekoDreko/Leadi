import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getWhatsAppMessagesCountForCurrentUser } from "@/lib/whatsapp/repository.server";
import { getOnboardingStateForCurrentUser } from "@/lib/onboarding/repository.server";
import { getCreativeRequestsCountForCurrentUser } from "@/lib/creative-requests/repository.server";
import { getDashboardRemindersForCurrentUser } from "@/lib/dashboard-reminders/repository.server";
import { DashboardHome } from "./dashboard-home";

export default async function DashboardPage() {
  const [
    context,
    leadState,
    campaignState,
    connectedAccounts,
    whatsappMessagesCount,
    onboardingState,
    creativeRequestsCount,
    reminderState
  ] = await Promise.all([
    requireCompletedProfile(),
    getLeadsForCurrentUser(),
    getCampaignsForCurrentUser(6),
    getConnectedAccountsForCurrentUser(),
    getWhatsAppMessagesCountForCurrentUser(),
    getOnboardingStateForCurrentUser(),
    getCreativeRequestsCountForCurrentUser(),
    getDashboardRemindersForCurrentUser()
  ]);

  return (
    <DashboardHome
      campaignsCount={campaignState.campaigns.length}
      hasMetaConnection={Boolean(connectedAccounts.metaConnection)}
      hasOpenAIConnection={Boolean(connectedAccounts.openAIConnection)}
      leads={leadState.leads}
      showCreateTeamCard={context.isSoloOwner}
      whatsappMessagesCount={whatsappMessagesCount}
      creativeRequestsCount={creativeRequestsCount}
      dashboardReminders={reminderState.reminders}
      onboardingState={onboardingState}
    />
  );
}
