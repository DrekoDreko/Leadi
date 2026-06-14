import { notFound, redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignByIdForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
import { RevisarPublicarClient } from "./revisar-publicar-client";

type RevisarPublicarPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RevisarPublicarPage({ params }: RevisarPublicarPageProps) {
  const { id } = await params;
  const context = await requireCompletedProfile();

  if (!context.isOwner) {
    redirect("/dashboard/anuncios");
  }

  const [campaign, connectedAccounts] = await Promise.all([
    getCampaignByIdForCurrentUser(id),
    getConnectedAccountsForCurrentUser()
  ]);

  if (!campaign) {
    notFound();
  }

  const pageName =
    connectedAccounts.metaPages.find((page) => page.metaPageId === campaign.metaPageId)?.name ?? null;
  const adAccountName =
    connectedAccounts.metaAdAccounts.find(
      (account) => account.metaAdAccountId === campaign.metaAdAccountId
    )?.name ?? null;
  const leadFormName =
    connectedAccounts.metaLeadForms.find((form) => form.metaFormId === campaign.metaLeadFormId)?.name ??
    null;

  const review = reviewCampaignCopyLocally({
    primaryText: campaign.result.primaryText,
    headline: campaign.result.headline,
    description: campaign.result.description,
    callToAction: campaign.result.callToAction
  });

  return (
    <RevisarPublicarClient
      campaign={campaign}
      initialReview={review}
      metaAssets={{
        pageName,
        adAccountName,
        leadFormName
      }}
    />
  );
}
