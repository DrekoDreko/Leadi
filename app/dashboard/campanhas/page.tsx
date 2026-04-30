import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { CampaignGenerator } from "./campaign-generator";

export default async function CampanhasPage() {
  const campaignState = await getCampaignsForCurrentUser(4);

  return (
    <CampaignGenerator
      historyMessage={campaignState.message}
      historyMode={campaignState.mode}
      initialCampaigns={campaignState.campaigns}
    />
  );
}
