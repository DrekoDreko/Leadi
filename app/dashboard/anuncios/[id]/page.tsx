import { notFound, redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignByIdForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { buildMetaBillingUrl } from "@/lib/meta/campaign-controls.server";
import { reconcileCampaignDeliveryStatus } from "@/lib/meta/delivery-status.server";
import { RevisarPublicarClient } from "./revisar-publicar-client";
import { CampaignDeliveryControls, CampaignStatusCard } from "./campaign-delivery-controls";

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

  // Camada 2: ao abrir a tela, conferimos o estado real na Meta para o status
  // exibido nunca mentir (ex.: anuncio ja aprovado aparecendo como "em revisao").
  // Best-effort: falha de leitura mantem os dados ja gravados.
  let publicationStatus = campaign.publicationStatus;
  let deliveryMessage: string | null = null;
  let effectiveStatus: string | null = null;
  if (campaign.metaCampaignId) {
    try {
      const reconciled = await reconcileCampaignDeliveryStatus({
        organizationId: campaign.organizationId,
        campaignId: campaign.id
      });
      if (reconciled) {
        publicationStatus = reconciled.publicationStatus;
        deliveryMessage = reconciled.publicationMessage;
        effectiveStatus = reconciled.effectiveStatus;
      }
    } catch {
      // Reconciliacao e nao-critica para renderizar a tela.
    }
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

    // 1. Meta ad images (uploaded to Meta)
    const { data: imageRows } = await supabase
      .from("meta_ad_image_uploads")
      .select("meta_image_url, source_filename")
      .eq("campaign_id", id)
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
      const folder = `${campaign.organizationId}/${id}`;
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
    <div className="space-y-4">
      {campaign.metaCampaignId ? (
        <CampaignDeliveryControls
          campaignId={campaign.id}
          initialStatus={publicationStatus}
          deliveryMessage={deliveryMessage}
          effectiveStatus={effectiveStatus}
          hasAdSet={Boolean(campaign.metaAdSetId)}
          billingUrl={buildMetaBillingUrl(campaign.metaAdAccountId)}
        />
      ) : null}
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
      {campaign.metaCampaignId ? (
        <CampaignStatusCard status={publicationStatus} effectiveStatus={effectiveStatus} />
      ) : null}
    </div>
  );
}
