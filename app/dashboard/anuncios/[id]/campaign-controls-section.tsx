import {
  buildMetaBillingUrl,
  getMetaAccountSpendState
} from "@/lib/meta/campaign-controls.server";
import { reconcileCampaignDeliveryStatus } from "@/lib/meta/delivery-status.server";
import type { CampaignHistoryItem } from "@/lib/campaigns/types";
import { CampaignDeliveryControls, CampaignStatusCard } from "./campaign-delivery-controls";

// Bloco "Veiculação / Controle do anúncio" reutilizado tanto na página do anúncio
// (/dashboard/anuncios/[id]) quanto no desempenho por anúncio
// (/dashboard/anuncios/[id]/desempenho). Concentra a reconciliação do status real
// na Meta para os dois lugares mostrarem exatamente a mesma informação.
export async function CampaignControlsSection({ campaign }: { campaign: CampaignHistoryItem }) {
  if (!campaign.metaCampaignId) {
    return null;
  }

  // Camada 2: ao abrir a tela, conferimos o estado real na Meta para o status
  // exibido nunca mentir (ex.: anuncio ja aprovado aparecendo como "em revisao").
  // Best-effort: falha de leitura mantem os dados ja gravados.
  let publicationStatus = campaign.publicationStatus;
  let deliveryMessage: string | null = null;
  let effectiveStatus: string | null = null;
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

  // Estado de gasto da conta (teto rigido + total gasto) para a trava de seguranca.
  // Best-effort: falha de leitura apenas omite o valor atual no card.
  const accountSpend = await getMetaAccountSpendState({
    organizationId: campaign.organizationId,
    campaignId: campaign.id
  }).catch(() => null);

  return (
    <>
      <CampaignStatusCard status={publicationStatus} effectiveStatus={effectiveStatus} />
      <CampaignDeliveryControls
        campaignId={campaign.id}
        initialStatus={publicationStatus}
        deliveryMessage={deliveryMessage}
        effectiveStatus={effectiveStatus}
        hasAdSet={Boolean(campaign.metaAdSetId)}
        billingUrl={buildMetaBillingUrl(campaign.metaAdAccountId)}
        accountSpend={accountSpend}
      />
    </>
  );
}
