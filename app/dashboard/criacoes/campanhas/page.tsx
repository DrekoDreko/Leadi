import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { CampaignGenerator } from "../../campanhas/campaign-generator";

export default async function CriacoesCampanhasPage() {
  const [campaignState, connectedAccounts, templates] = await Promise.all([
    getCampaignsForCurrentUser(4),
    getConnectedAccountsForCurrentUser(),
    getSystemTemplates("campaign")
  ]);

  return (
    <CampaignGenerator
      connectedAccounts={connectedAccounts}
      historyMessage={campaignState.message}
      historyMode={campaignState.mode}
      initialCampaigns={campaignState.campaigns}
      systemTemplates={templates}
    />
  );
}
