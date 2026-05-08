import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { CampaignGenerator } from "../../campanhas/campaign-generator";

export default async function CriacoesCampanhasPage() {
  const [campaignState, connectedAccounts] = await Promise.all([
    getCampaignsForCurrentUser(4),
    getConnectedAccountsForCurrentUser()
  ]);

  return (
    <CampaignGenerator
      connectedAccounts={connectedAccounts}
      historyMessage={campaignState.message}
      historyMode={campaignState.mode}
      initialCampaigns={campaignState.campaigns}
    />
  );
}
