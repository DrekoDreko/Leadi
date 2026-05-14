import { getAiBalance } from "@/lib/ai/credits";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { CampaignGenerator } from "../../campanhas/campaign-generator";

export default async function CriacoesCampanhasPage() {
  const context = await requireCompletedProfile();
  const [campaignState, connectedAccounts, templates, aiBalance] = await Promise.all([
    getCampaignsForCurrentUser(4),
    getConnectedAccountsForCurrentUser(),
    getSystemTemplates("campaign"),
    getAiBalance(context.workspace?.id ?? "")
  ]);

  return (
    <CampaignGenerator
      aiBalance={aiBalance}
      connectedAccounts={connectedAccounts}
      historyMessage={campaignState.message}
      historyMode={campaignState.mode}
      initialCampaigns={campaignState.campaigns}
      systemTemplates={templates}
    />
  );
}
