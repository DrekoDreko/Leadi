import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { CampaignHistoryItem } from "@/lib/campaigns/types";
import { RevisarPublicarClient } from "./revisar-publicar-client";

// Bloco "Revisar e publicar" reutilizado na página do anúncio e no desempenho por
// anúncio. Concentra o carregamento dos ativos vinculados (página, conta, formulário),
// a revisão de copy e os criativos para os dois lugares mostrarem o mesmo conteúdo.
export async function RevisarPublicarSection({
  campaign
}: {
  campaign: CampaignHistoryItem;
}) {
  const connectedAccounts = await getConnectedAccountsForCurrentUser();

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

    // 1. Meta ad images (uploaded to Meta)
    const { data: imageRows } = await supabase
      .from("meta_ad_image_uploads")
      .select("meta_image_url, source_filename")
      .eq("campaign_id", campaign.id)
      .eq("local_status", "uploaded")
      .not("meta_image_url", "is", null)
      .order("uploaded_at", { ascending: false });
    const metaImages = (imageRows ?? []).map((row) => ({
      url: row.meta_image_url!,
      filename: row.source_filename
    }));

    // 2. Supabase Storage creatives (uploaded during campaign creation)
    let storageImages: Array<{ url: string; filename: string }> = [];
    try {
      const storageClient = hasSupabaseServiceRole()
        ? createSupabaseAdminClient()
        : supabase;
      const folder = `${campaign.organizationId}/${campaign.id}`;
      const { data: files } = await storageClient.storage
        .from("campaign-creatives")
        .list(folder, { limit: 50 });

      if (files && files.length > 0) {
        const signedResults = await Promise.all(
          files
            .filter((f) => f.name && !f.name.startsWith("."))
            .map(async (f) => {
              const path = `${folder}/${f.name}`;
              const { data: urlData } = await storageClient.storage
                .from("campaign-creatives")
                .createSignedUrl(path, 3600);
              return {
                url: urlData?.signedUrl ?? "",
                filename: f.name.replace(/^[a-f0-9-]+-/, "")
              };
            })
        );
        storageImages = signedResults.filter((img) => img.url);
      }
    } catch {
      // Storage fetch is non-critical
    }

    creativeImages = [...storageImages, ...metaImages];
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
