import "server-only";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { getMetaGraphApiVersion } from "@/lib/meta/config";
import { resolveMetaAccessTokenForOrganization } from "@/lib/integrations/repository.server";
import { parseCampaignInputPayload, parseCampaignResultPayload } from "@/lib/campaigns/payload";
import { createCampaignReviewNotification } from "@/lib/notifications/repository.server";
import type {
  CampaignHistoryItem,
  CampaignPublicationStatus
} from "@/lib/campaigns/types";

// Reconciliacao do status de veiculacao da campanha com a Meta.
//
// O problema que isto resolve: ate aqui o app escrevia publication_status e uma
// mensagem fixa nas acoes (publicar/ativar/pausar) e nunca conferia o estado
// real na Meta. Resultado: anuncios ja aprovados apareciam como "em revisao".
// Aqui lemos o effective_status real (Graph API) do objeto mais especifico que
// existir (anuncio > conjunto > campanha) e gravamos o estado verdadeiro.

type CampaignDeliveryRow = {
  id: string;
  organization_id: string;
  created_by_profile_id: string;
  status: "generated" | "archived";
  connected_account_id: string | null;
  meta_page_id: string | null;
  meta_ad_account_id: string | null;
  meta_lead_form_id: string | null;
  publish_mode: CampaignHistoryItem["publishMode"];
  publication_status: CampaignPublicationStatus;
  publication_message: string | null;
  approval_status: CampaignHistoryItem["approvalStatus"];
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  meta_effective_status: string | null;
  delivery_status_synced_at: string | null;
  campaign_name: string;
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
  tone: string;
  product: string;
  primary_text: string;
  headline: string;
  description: string;
  call_to_action: string;
  suggested_audience: string;
  variants: Json;
  compliance_notes: Json;
  input_payload: Json;
  result_payload: Json;
  created_at: string;
  updated_at: string;
};

export type CampaignDeliveryReconcileResult = {
  item: CampaignHistoryItem;
  effectiveStatus: string | null;
  publicationStatus: CampaignPublicationStatus;
  publicationMessage: string | null;
  changed: boolean;
};

type PublicationMapping = {
  publicationStatus: CampaignPublicationStatus;
  message: string;
};

// Traduz o effective_status da Meta para o nosso publication_status + uma
// mensagem em pt-BR honesta sobre o estado real. effective_status cobre tanto
// veiculacao quanto revisao/cobranca, entao e a fonte certa.
export function mapEffectiveStatusToPublication(
  effectiveStatus: string | null | undefined
): PublicationMapping {
  const normalized = effectiveStatus?.trim().toUpperCase() ?? "";

  switch (normalized) {
    case "ACTIVE":
      return { publicationStatus: "published", message: "Veiculando na Meta." };
    case "WITH_ISSUES":
      return {
        publicationStatus: "published",
        message: "Veiculando, mas a Meta sinalizou pendencias. Verifique o Gerenciador de Anuncios."
      };
    case "PENDING_REVIEW":
    case "IN_PROCESS":
    case "PREAPPROVED":
      return { publicationStatus: "pending_review", message: "Em revisao pela Meta." };
    case "PENDING_BILLING_INFO":
      return {
        publicationStatus: "pending_review",
        message: "Aguardando forma de pagamento valida na conta de anuncio para comecar a veicular."
      };
    case "DISAPPROVED":
      return {
        publicationStatus: "failed",
        message: "Reprovada pela Meta. Ajuste o anuncio e reenvie para nova revisao."
      };
    case "PAUSED":
    case "CAMPAIGN_PAUSED":
    case "ADSET_PAUSED":
      return { publicationStatus: "paused", message: "Pausada." };
    case "ARCHIVED":
      return { publicationStatus: "paused", message: "Arquivada na Meta." };
    case "COMPLETED":
      return { publicationStatus: "paused", message: "Concluida na Meta." };
    case "DELETED":
      return { publicationStatus: "failed", message: "Removida na Meta." };
    default:
      return {
        publicationStatus: "pending_review",
        message: "Status de veiculacao ainda nao confirmado pela Meta."
      };
  }
}

type MetaObjectStatusResponse = {
  effective_status?: string;
  status?: string;
  error?: { message?: string };
};

// Le o effective_status de um objeto da Meta (anuncio, conjunto ou campanha).
// Retorna null em caso de erro/objeto inexistente para nunca quebrar a tela.
async function fetchMetaEffectiveStatus(
  accessToken: string,
  objectId: string
): Promise<string | null> {
  try {
    const url = new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}/${objectId}`);
    url.searchParams.set("fields", "effective_status,status");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as MetaObjectStatusResponse | null;

    if (!response.ok || !payload) {
      return null;
    }

    return payload.effective_status ?? payload.status ?? null;
  } catch {
    return null;
  }
}

function requireServiceRole() {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }
}

async function loadCampaignRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  campaignId: string
): Promise<CampaignDeliveryRow | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CampaignDeliveryRow | null) ?? null;
}

// Anuncio > conjunto > campanha: o objeto mais especifico carrega o sinal de
// revisao/veiculacao mais fiel.
function pickMostSpecificObjectId(row: CampaignDeliveryRow): string | null {
  return row.meta_ad_id ?? row.meta_adset_id ?? row.meta_campaign_id ?? null;
}

async function applyReconciliation(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  row: CampaignDeliveryRow,
  accessToken: string
): Promise<CampaignDeliveryReconcileResult> {
  const objectId = pickMostSpecificObjectId(row);

  if (!objectId) {
    return {
      item: mapRowToHistoryItem(row),
      effectiveStatus: row.meta_effective_status,
      publicationStatus: row.publication_status,
      publicationMessage: row.publication_message,
      changed: false
    };
  }

  const effectiveStatus = await fetchMetaEffectiveStatus(accessToken, objectId);

  // Sem resposta confiavel da Meta: mantemos o estado atual em vez de sobrescrever
  // com algo incerto. So registramos o momento da tentativa.
  if (!effectiveStatus) {
    await supabase
      .from("campaigns")
      .update({ delivery_status_synced_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("organization_id", row.organization_id);

    return {
      item: mapRowToHistoryItem(row),
      effectiveStatus: row.meta_effective_status,
      publicationStatus: row.publication_status,
      publicationMessage: row.publication_message,
      changed: false
    };
  }

  const mapping = mapEffectiveStatusToPublication(effectiveStatus);
  const changed =
    mapping.publicationStatus !== row.publication_status ||
    effectiveStatus !== row.meta_effective_status;

  const { data, error } = await supabase
    .from("campaigns")
    .update({
      publication_status: mapping.publicationStatus,
      publication_message: mapping.message,
      meta_effective_status: effectiveStatus,
      delivery_status_synced_at: new Date().toISOString()
    })
    .eq("id", row.id)
    .eq("organization_id", row.organization_id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel atualizar o status de veiculacao.");
  }

  const updatedRow = data as CampaignDeliveryRow;

  // Detecta a saida da revisao e avisa o dono da campanha (sino do dashboard).
  // Best-effort: nunca deixa a notificacao quebrar a reconciliacao.
  if (changed && row.publication_status === "pending_review") {
    await maybeEmitReviewNotification(updatedRow, effectiveStatus);
  }

  return {
    item: mapRowToHistoryItem(updatedRow),
    effectiveStatus,
    publicationStatus: mapping.publicationStatus,
    publicationMessage: mapping.message,
    changed
  };
}

// effective_status que representam "a Meta terminou a revisao e aprovou" — seja
// veiculando (ACTIVE/WITH_ISSUES) ou aprovado e pausado (PAUSED/..._PAUSED).
// ARCHIVED/COMPLETED/DELETED nao sao aprovacao, entao ficam de fora.
const APPROVED_EFFECTIVE_STATUSES = new Set([
  "ACTIVE",
  "WITH_ISSUES",
  "PAUSED",
  "CAMPAIGN_PAUSED",
  "ADSET_PAUSED"
]);

async function maybeEmitReviewNotification(
  row: CampaignDeliveryRow,
  effectiveStatus: string
): Promise<void> {
  const normalized = effectiveStatus.trim().toUpperCase();
  const link = `/dashboard/anuncios/${row.id}`;

  try {
    if (APPROVED_EFFECTIVE_STATUSES.has(normalized)) {
      await createCampaignReviewNotification({
        organizationId: row.organization_id,
        campaignId: row.id,
        recipientProfileId: row.created_by_profile_id,
        type: "campaign_approved",
        title: "Anúncio aprovado pela Meta",
        body: `A campanha "${row.campaign_name}" foi aprovada. Você já pode ativá-la para começar a veicular.`,
        linkUrl: link
      });
    } else if (normalized === "DISAPPROVED") {
      await createCampaignReviewNotification({
        organizationId: row.organization_id,
        campaignId: row.id,
        recipientProfileId: row.created_by_profile_id,
        type: "campaign_rejected",
        title: "Anúncio reprovado pela Meta",
        body: `A campanha "${row.campaign_name}" foi reprovada. Ajuste o texto ou o criativo e publique novamente.`,
        linkUrl: link
      });
    }
  } catch {
    // Notificacao e nao-critica para a reconciliacao.
  }
}

// Reconciliacao pontual de UMA campanha. Usada na acao de ativar/pausar
// (camada 1) e ao abrir a tela da campanha (camada 2). Best-effort: nunca
// lanca por falha de leitura da Meta, so por erro de banco.
export async function reconcileCampaignDeliveryStatus(input: {
  organizationId: string;
  campaignId: string;
}): Promise<CampaignDeliveryReconcileResult | null> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const row = await loadCampaignRow(supabase, input.organizationId, input.campaignId);

  if (!row || !row.meta_campaign_id) {
    return null;
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(input.organizationId);
  if (!accessToken) {
    return null;
  }

  return applyReconciliation(supabase, row, accessToken);
}

export type ReconcileAllSummary = {
  processed: number;
  updated: number;
  failed: number;
};

// Reconciliacao em lote (camada 3 / background). Varre as campanhas que tem
// objeto na Meta e atualiza o status real, sem ninguem abrir a tela. Resolve o
// token uma vez por organizacao.
//
// `statuses` permite escopar a varredura: o loop rapido (a cada 30s) reconcilia
// apenas as que estao em revisao (pending_review) para detectar a aprovacao
// quase em tempo real sem martelar a Meta com campanhas ja decididas; a varredura
// ampla (menos frequente) cobre published/paused para pegar mudancas externas.
export async function reconcileAllPublishedCampaigns(options?: {
  limit?: number;
  statuses?: CampaignPublicationStatus[];
}): Promise<ReconcileAllSummary> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const limit = options?.limit ?? 200;
  const statuses = options?.statuses ?? ["published", "paused", "pending_review"];

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .not("meta_campaign_id", "is", null)
    .in("publication_status", statuses)
    .order("delivery_status_synced_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as CampaignDeliveryRow[] | null) ?? [];
  const summary: ReconcileAllSummary = { processed: 0, updated: 0, failed: 0 };
  const tokenCache = new Map<string, string | null>();

  for (const row of rows) {
    summary.processed += 1;
    try {
      let accessToken = tokenCache.get(row.organization_id);
      if (accessToken === undefined) {
        accessToken = await resolveMetaAccessTokenForOrganization(row.organization_id);
        tokenCache.set(row.organization_id, accessToken);
      }
      if (!accessToken) {
        continue;
      }

      const result = await applyReconciliation(supabase, row, accessToken);
      if (result.changed) {
        summary.updated += 1;
      }
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}

function mapRowToHistoryItem(row: CampaignDeliveryRow): CampaignHistoryItem {
  const input = parseCampaignInputPayload(row);
  const result = parseCampaignResultPayload(row);

  return {
    id: row.id,
    organizationId: row.organization_id,
    createdByProfileId: row.created_by_profile_id,
    status: row.status === "archived" ? "archived" : "generated",
    product: row.product,
    connectedAccountId: row.connected_account_id ?? input.connectedAccountId,
    metaPageId: row.meta_page_id ?? input.metaPageId,
    metaAdAccountId: row.meta_ad_account_id ?? input.metaAdAccountId,
    metaLeadFormId: row.meta_lead_form_id ?? input.metaLeadFormId,
    publishMode: row.publish_mode,
    publicationStatus: row.publication_status,
    approvalStatus: row.approval_status,
    metaCampaignId: row.meta_campaign_id,
    metaAdSetId: row.meta_adset_id,
    metaAdId: row.meta_ad_id,
    campaignName: row.campaign_name,
    audience: row.audience,
    offer: row.offer,
    region: row.region,
    differentiator: row.differentiator,
    tone: row.tone,
    input,
    result,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
