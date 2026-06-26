import "server-only";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { getMetaGraphApiVersion } from "@/lib/meta/config";
import {
  resolveMetaAccessTokenForOrganization,
  resolveMetaAccessTokenForProfile,
  getMetaConnectionForProfile
} from "@/lib/integrations/repository.server";
import {
  ensureMetaMarketingPermission,
  MetaMarketingPermissionError
} from "@/lib/meta/campaign-publication.server";
import { reconcileCampaignDeliveryStatus } from "@/lib/meta/delivery-status.server";
import type { CampaignHistoryItem } from "@/lib/campaigns/types";
import { parseCampaignInputPayload, parseCampaignResultPayload } from "@/lib/campaigns/payload";

export type CampaignDeliveryAction = "activate" | "pause";

type CampaignControlRow = {
  id: string;
  organization_id: string;
  created_by_profile_id: string;
  status: "generated" | "archived";
  connected_account_id: string | null;
  meta_page_id: string | null;
  meta_ad_account_id: string | null;
  meta_lead_form_id: string | null;
  publish_mode: CampaignHistoryItem["publishMode"];
  publication_status: CampaignHistoryItem["publicationStatus"];
  approval_status: CampaignHistoryItem["approvalStatus"];
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
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

function requireServiceRole() {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }
}

async function loadCampaign(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  campaignId: string
): Promise<CampaignControlRow | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CampaignControlRow | null) ?? null;
}

// Atualiza o status (ACTIVE/PAUSED) de um objeto da Meta (campanha, conjunto ou
// anúncio) via POST /{id}. Reaproveita o mesmo tratamento de erro do publish.
async function updateMetaObjectStatus(
  accessToken: string,
  objectId: string,
  status: "ACTIVE" | "PAUSED"
): Promise<void> {
  const url = new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}/${objectId}`);

  const body = new URLSearchParams();
  body.set("status", status);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string; error_user_msg?: string; error_subcode?: number };
    } | null;
    const metaError = payload?.error;
    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    throw new Error(
      detail
        ? `Falha ao atualizar status na Meta: ${detail}${suffix}`
        : `Falha ao atualizar status na Meta: status ${response.status}.`
    );
  }
}

// Ativa ou pausa a veiculação de uma campanha já publicada. Para ativar, os três
// níveis (campanha + conjunto + anúncio) precisam ficar ACTIVE; para pausar,
// basta pausar a campanha. A conta de anúncio precisa ter forma de pagamento
// válida na Meta para a veiculação realmente começar.
/**
 * Resolve o access token correto para uma campanha: se ela foi criada por um consultor
 * com conexão Meta pessoal, usa o token dele; senão, o da corretora.
 */
async function resolveAccessTokenForCampaign(
  campaign: { created_by_profile_id: string },
  organizationId: string
) {
  const personalConnection = await getMetaConnectionForProfile(campaign.created_by_profile_id);
  return personalConnection
    ? resolveMetaAccessTokenForProfile(campaign.created_by_profile_id)
    : resolveMetaAccessTokenForOrganization(organizationId);
}

export async function updateMetaCampaignDelivery(input: {
  organizationId: string;
  campaignId: string;
  createdByProfileId: string;
  restrictToCreatorProfileId?: string | null;
  action: CampaignDeliveryAction;
}): Promise<CampaignHistoryItem> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const campaign = await loadCampaign(supabase, input.organizationId, input.campaignId);

  if (!campaign) {
    throw new Error("Campanha nao encontrada para esta organizacao.");
  }

  if (
    input.restrictToCreatorProfileId &&
    campaign.created_by_profile_id !== input.restrictToCreatorProfileId
  ) {
    throw new Error("Voce so pode gerenciar campanhas que voce mesmo criou.");
  }

  if (!campaign.meta_campaign_id) {
    throw new Error("Esta campanha ainda nao foi publicada na Meta.");
  }

  const accessToken = await resolveAccessTokenForCampaign(campaign, input.organizationId);
  if (!accessToken) {
    throw new Error("A conexao Meta nao possui um access token valido.");
  }

  await ensureMetaMarketingPermission(accessToken);

  // Defesa real (nao apenas UI): ativar um anuncio que a Meta ainda nao aprovou
  // nao tem efeito util e induz o usuario ao erro. Antes de mandar ACTIVE,
  // conferimos o estado verdadeiro na Meta e bloqueamos enquanto em revisao ou
  // reprovado. Reconciliacao best-effort: se a Meta nao responder, seguimos.
  if (input.action === "activate") {
    const current = await reconcileCampaignDeliveryStatus({
      organizationId: input.organizationId,
      campaignId: campaign.id
    });
    if (current?.publicationStatus === "pending_review") {
      throw new Error(
        "A campanha ainda esta em revisao pela Meta. Voce podera ativa-la assim que for aprovada."
      );
    }
    if (current?.publicationStatus === "failed") {
      throw new Error(
        "A Meta reprovou o anuncio. Ajuste o texto ou o criativo e publique novamente antes de ativar."
      );
    }
  }

  try {
    if (input.action === "activate") {
      // Ordem: campanha -> conjunto -> anúncio. Todos precisam estar ACTIVE.
      await updateMetaObjectStatus(accessToken, campaign.meta_campaign_id, "ACTIVE");
      if (campaign.meta_adset_id) {
        await updateMetaObjectStatus(accessToken, campaign.meta_adset_id, "ACTIVE");
      }
      if (campaign.meta_ad_id) {
        await updateMetaObjectStatus(accessToken, campaign.meta_ad_id, "ACTIVE");
      }
    } else {
      // Pausar a campanha interrompe a veiculação de todos os conjuntos/anúncios.
      await updateMetaObjectStatus(accessToken, campaign.meta_campaign_id, "PAUSED");
    }
  } catch (error) {
    if (error instanceof MetaMarketingPermissionError) {
      throw error;
    }
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel atualizar a veiculacao da campanha na Meta.";
    throw new Error(message, { cause: error });
  }

  const isActive = input.action === "activate";
  const now = new Date().toISOString();

  // Registra o carimbo da tentativa; o status/mensagem reais sao definidos pela
  // reconciliacao logo abaixo (le o effective_status na Meta em vez de chutar).
  const updated = await supabase
    .from("campaigns")
    .update({
      last_publication_attempt_at: now,
      last_publication_error: null,
      ...(isActive ? { published_at: now } : {})
    })
    .eq("id", campaign.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw new Error(
      updated.error?.message ?? "Nao foi possivel atualizar o status da campanha."
    );
  }

  // Le o estado verdadeiro na Meta (ACTIVE / PENDING_REVIEW / DISAPPROVED / ...)
  // e grava o publication_status + mensagem honesta. Se a Meta nao responder,
  // caimos no row recem-atualizado sem inventar mensagem.
  const reconciled = await reconcileCampaignDeliveryStatus({
    organizationId: input.organizationId,
    campaignId: campaign.id
  });

  if (reconciled) {
    return reconciled.item;
  }

  return mapRowToHistoryItem(updated.data as CampaignControlRow);
}

// Atualiza o orçamento diário da campanha (em reais; convertido para centavos,
// mesma unidade usada na criação). O orçamento vive no nível da campanha
// (Advantage Campaign Budget), então o POST vai para o meta_campaign_id.
export async function updateMetaCampaignBudget(input: {
  organizationId: string;
  campaignId: string;
  dailyBudget: number;
  restrictToCreatorProfileId?: string | null;
}): Promise<CampaignHistoryItem> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const campaign = await loadCampaign(supabase, input.organizationId, input.campaignId);

  if (!campaign) {
    throw new Error("Campanha nao encontrada para esta organizacao.");
  }

  if (
    input.restrictToCreatorProfileId &&
    campaign.created_by_profile_id !== input.restrictToCreatorProfileId
  ) {
    throw new Error("Voce so pode gerenciar campanhas que voce mesmo criou.");
  }

  if (!campaign.meta_campaign_id) {
    throw new Error("Esta campanha ainda nao foi publicada na Meta.");
  }

  const accessToken = await resolveAccessTokenForCampaign(campaign, input.organizationId);
  if (!accessToken) {
    throw new Error("A conexao Meta nao possui um access token valido.");
  }

  await ensureMetaMarketingPermission(accessToken);

  const dailyBudgetCents = Math.round(input.dailyBudget * 100);

  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${campaign.meta_campaign_id}`
  );
  const body = new URLSearchParams();
  body.set("daily_budget", String(dailyBudgetCents));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string; error_user_msg?: string; error_subcode?: number };
    } | null;
    const metaError = payload?.error;
    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    throw new Error(
      detail
        ? `Falha ao atualizar orcamento na Meta: ${detail}${suffix}`
        : `Falha ao atualizar orcamento na Meta: status ${response.status}.`
    );
  }

  const updated = await supabase
    .from("campaigns")
    .update({
      publication_message: `Orcamento diario atualizado para R$ ${input.dailyBudget.toFixed(2)}.`,
      last_publication_attempt_at: new Date().toISOString(),
      last_publication_error: null
    })
    .eq("id", campaign.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw new Error(updated.error?.message ?? "Nao foi possivel registrar o novo orcamento.");
  }

  return mapRowToHistoryItem(updated.data as CampaignControlRow);
}

function sanitizeAdAccountId(value: string) {
  return value.replace(/^act_/i, "").trim();
}

export type MetaAccountSpendState = {
  currency: string | null;
  // Total ja gasto pela conta (em reais) acumulado contra o limite atual.
  amountSpent: number;
  // Teto rigido configurado (em reais) ou null quando nao ha limite.
  spendCap: number | null;
};

// Le o estado de gasto da conta de anuncio: total gasto, moeda e o teto rigido
// (account spending limit) atual. Best-effort — qualquer falha retorna null para
// a UI seguir renderizando sem o valor atual. O spend_cap da Meta vem em centavos
// e "0" (ou ausente) significa "sem limite".
export async function getMetaAccountSpendState(input: {
  organizationId: string;
  campaignId: string;
}): Promise<MetaAccountSpendState | null> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const campaign = await loadCampaign(supabase, input.organizationId, input.campaignId);
  if (!campaign?.meta_ad_account_id) {
    return null;
  }

  const accessToken = await resolveAccessTokenForCampaign(campaign, input.organizationId);
  if (!accessToken) {
    return null;
  }

  try {
    const url = new URL(
      `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(
        campaign.meta_ad_account_id
      )}`
    );
    url.searchParams.set("fields", "currency,amount_spent,spend_cap");

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as {
      currency?: string;
      amount_spent?: string;
      spend_cap?: string;
    } | null;

    if (!payload) {
      return null;
    }

    const capCents = Number(payload.spend_cap ?? "0");
    return {
      currency: payload.currency ?? null,
      amountSpent: Number(payload.amount_spent ?? "0") / 100,
      // spend_cap "0" = sem limite na Meta.
      spendCap: Number.isFinite(capCents) && capCents > 0 ? capCents / 100 : null
    };
  } catch {
    return null;
  }
}

// Define (ou remove) o teto rigido de gasto da CONTA de anuncio — o "account
// spending limit" da Meta. Diferente do orcamento diario (media de gasto por dia
// que NAO controla a cobranca), este e um teto absoluto: ao atingi-lo a Meta
// PAUSA toda a veiculacao da conta. E a unica trava real contra cobranca alem do
// previsto.
//
// O limite e cumulativo contra o `amount_spent` historico da conta. Por isso, ao
// definir "no maximo R$ N a partir de agora", enviamos `spend_cap_action=reset`
// junto: zera o contador de gasto-contra-o-teto para que gasto passado nao estoure
// o novo limite na hora. `spendCap=null` remove o limite (spend_cap=0 na Meta).
//
// Atencao: a Meta limita a 10 alteracoes de limite por dia (erro code 17 /
// subcode 1885172); tratamos com mensagem amigavel.
export async function updateMetaAccountSpendCap(input: {
  organizationId: string;
  campaignId: string;
  spendCap: number | null;
  restrictToCreatorProfileId?: string | null;
}): Promise<MetaAccountSpendState> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const campaign = await loadCampaign(supabase, input.organizationId, input.campaignId);

  if (!campaign) {
    throw new Error("Campanha nao encontrada para esta organizacao.");
  }

  if (
    input.restrictToCreatorProfileId &&
    campaign.created_by_profile_id !== input.restrictToCreatorProfileId
  ) {
    throw new Error("Voce so pode gerenciar campanhas que voce mesmo criou.");
  }

  if (!campaign.meta_ad_account_id) {
    throw new Error("Selecione uma conta de anuncio antes de definir o limite de gastos.");
  }

  const accessToken = await resolveAccessTokenForCampaign(campaign, input.organizationId);
  if (!accessToken) {
    throw new Error("A conexao Meta nao possui um access token valido.");
  }

  await ensureMetaMarketingPermission(accessToken);

  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(
      campaign.meta_ad_account_id
    )}`
  );
  const body = new URLSearchParams();

  if (input.spendCap === null) {
    // Remove o limite de gastos da conta.
    body.set("spend_cap", "0");
  } else {
    body.set("spend_cap", String(Math.round(input.spendCap * 100)));
    // Zera o gasto-contra-o-teto para que o novo limite valha "a partir de agora".
    body.set("spend_cap_action", "reset");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string; error_user_msg?: string; code?: number; error_subcode?: number };
    } | null;
    const metaError = payload?.error;

    if (metaError?.code === 17 && metaError?.error_subcode === 1885172) {
      throw new Error(
        "A Meta so permite alterar o limite de gastos da conta 10 vezes por dia. Tente novamente mais tarde."
      );
    }

    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    throw new Error(
      detail
        ? `Falha ao atualizar o limite de gastos na Meta: ${detail}${suffix}`
        : `Falha ao atualizar o limite de gastos na Meta: status ${response.status}.`
    );
  }

  // Le de volta o estado para a UI refletir o valor real confirmado pela Meta.
  const state = await getMetaAccountSpendState({
    organizationId: input.organizationId,
    campaignId: input.campaignId
  });

  return (
    state ?? {
      currency: null,
      amountSpent: 0,
      spendCap: input.spendCap
    }
  );
}

// Exclui a campanha na Meta via DELETE /{id}. Apagar a campanha remove em
// cascata o conjunto de anúncios e o anúncio, então basta o meta_campaign_id.
// Best-effort: se o objeto já não existir (HTTP 404 ou code 100), tratamos como
// sucesso para não travar a exclusão do registro local. Não exige permissão de
// marketing aqui — quem chama trata a falha como aviso, não como bloqueio.
export async function deleteMetaCampaignForOrganization(input: {
  organizationId: string;
  metaCampaignId: string | null;
}): Promise<void> {
  if (!input.metaCampaignId) {
    return;
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(input.organizationId);
  if (!accessToken) {
    throw new Error("A conexao Meta nao possui um access token valido.");
  }

  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${input.metaCampaignId}`
  );

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string; error_user_msg?: string; code?: number; error_subcode?: number };
  } | null;
  const metaError = payload?.error;

  // Campanha já removida manualmente na Meta: o objeto não existe mais
  // (HTTP 404, code 100 "does not exist" ou subcode 33). Seguimos sem erro.
  if (response.status === 404 || metaError?.code === 100 || metaError?.error_subcode === 33) {
    return;
  }

  const detail = metaError?.error_user_msg || metaError?.message;
  const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
  throw new Error(
    detail
      ? `Falha ao excluir a campanha na Meta: ${detail}${suffix}`
      : `Falha ao excluir a campanha na Meta: status ${response.status}.`
  );
}

// Link direto para a área de cobrança da conta de anúncio na Meta. A Graph API
// não permite adicionar cartão/saldo, então redirecionamos o cliente para cá.
export function buildMetaBillingUrl(adAccountId: string | null): string | null {
  if (!adAccountId) {
    return null;
  }
  const clean = adAccountId.replace(/^act_/i, "").trim();
  if (!clean) {
    return null;
  }
  return `https://www.facebook.com/ads/manager/account_settings/account_billing/?act=${clean}`;
}

function mapRowToHistoryItem(row: CampaignControlRow): CampaignHistoryItem {
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
