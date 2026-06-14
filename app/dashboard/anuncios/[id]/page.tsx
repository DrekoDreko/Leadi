import { notFound, redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignByIdForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  let creativeImages: Array<{ url: string; filename: string }> = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: imageRows } = await supabase
      .from("meta_ad_image_uploads")
      .select("meta_image_url, source_filename")
      .eq("campaign_id", id)
      .eq("local_status", "uploaded")
      .not("meta_image_url", "is", null)
      .order("uploaded_at", { ascending: false });
    creativeImages = (imageRows ?? []).map((row) => ({
      url: row.meta_image_url!,
      filename: row.source_filename
    }));
  } catch {
    // Image fetch is non-critical
  }

  return (
    <RevisarPublicarClient
      campaign={campaign}
      initialReview={review}
      metaAssets={{
        pageName,
        adAccountName,
        leadFormName
      }}
      creativeImages={creativeImages}
    />
  );
}
