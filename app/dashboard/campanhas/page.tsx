import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { CampaignGenerator } from "./campaign-generator";

export default async function CampanhasPage() {
  const [campaignState, campaignAccess, questionAccess, connectedAccounts] = await Promise.all([
    getCampaignsForCurrentUser(4),
    getCurrentResourceAccess("campaign_generation"),
    getCurrentResourceAccess("campaign_questions"),
    getConnectedAccountsForCurrentUser()
  ]);

  return (
    <CampaignGenerator
      campaignAccess={campaignAccess}
      connectedAccounts={connectedAccounts}
      historyMessage={campaignState.message}
      historyMode={campaignState.mode}
      initialCampaigns={campaignState.campaigns}
      questionAccess={questionAccess}
    />
  );
}
