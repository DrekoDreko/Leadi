import { getBillingSnapshot } from "@/lib/billing/admin";
import { getAiBalance } from "@/lib/ai/credits";
import {
  getCampaignsForCurrentUser,
  getPublishedCampaignsCountForCurrentUser
} from "@/lib/campaigns/repository.server";
import { getLeadsCountForCurrentUser } from "@/lib/leads/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { CampaignGenerator } from "../../campanhas/campaign-generator";

export default async function CriacoesCampanhasPage() {
  const context = await requireCompletedProfile();
  const [
    campaignState,
    connectedAccounts,
    templates,
    aiBalance,
    publishedAdsCount,
    leadsCapturedCount,
    billingSnapshot
  ] = await Promise.all([
    getCampaignsForCurrentUser(4),
    getConnectedAccountsForCurrentUser(),
    getSystemTemplates("campaign"),
    getAiBalance(context.workspace?.id ?? ""),
    getPublishedCampaignsCountForCurrentUser(),
    getLeadsCountForCurrentUser(),
    getBillingSnapshot(context.workspace?.id ?? "")
  ]);

  return (
    <CampaignGenerator
      aiBalance={aiBalance}
      connectedAccounts={connectedAccounts}
      historyMessage={campaignState.message}
      historyMode={campaignState.mode}
      leadsCapturedCount={leadsCapturedCount}
      publishedAdsCount={publishedAdsCount}
      totalSpentCredits={billingSnapshot?.wallet.totalSpent ?? 0}
      systemTemplates={templates}
    />
  );
}
