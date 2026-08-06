import "server-only";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { getMetaGraphApiVersion } from "@/lib/meta/config";
import { resolveMetaAccessTokenForOrganization } from "@/lib/integrations/repository.server";
import { createCampaignAlertNotification } from "@/lib/notifications/repository.server";

// Mudanca 7: monitoramento de entrega pos-publicacao.
//
// O problema que isto resolve: uma campanha pode ficar ATIVA por semanas gastando
// uma fracao minima do orcamento (subentrega), e no painel ela aparece como
// "ativa" — ninguem percebe. Aqui, diariamente, comparamos o gasto real do dia
// anterior com o orcamento e disparamos alertas acionaveis no sino do dashboard.

// Abaixo de 30% do orcamento por 3 dias seguidos = subentrega.
const UNDERDELIVERY_RATIO_THRESHOLD = 0.3;
const UNDERDELIVERY_CONSECUTIVE_DAYS = 3;
// Frequencia acima de 3 = saturacao de publico.
const FREQUENCY_SATURATION_THRESHOLD = 3;
// Campanha ativa ha 7+ dias com 0 leads = alerta separado.
const NO_LEADS_MIN_DAYS = 7;
// 50 leads em 7 dias em modo degradado = pode migrar para o objetivo cheio (Mudanca 1).
const UPGRADE_LEADS_THRESHOLD = 50;

// Statuses da Meta em que a campanha esta efetivamente veiculando (ou a caminho).
const ACTIVE_EFFECTIVE_STATUSES = new Set([
  "ACTIVE",
  "IN_PROCESS",
  "LEARNING",
  "PENDING_REVIEW",
  "PENDING_BILLING_INFO"
]);

type DeliveryHealthCampaignRow = {
  id: string;
  organization_id: string;
  created_by_profile_id: string;
  campaign_name: string;
  meta_campaign_id: string | null;
  meta_effective_status: string | null;
  meta_optimization_goal: string | null;
  publication_status: string | null;
  published_at: string | null;
};

export type DeliveryHealthSummary = {
  processed: number;
  snapshots: number;
  alerts: number;
  failed: number;
};

function requireServiceRole() {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }
}

// Data (UTC) de ontem no formato YYYY-MM-DD.
function yesterdayDateString(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

type MetaInsights = {
  spendReais: number;
  frequency: number;
  leads: number;
};

// Soma os valores das acoes cujo tipo indica captacao de lead (formulario
// instantaneo pode reportar como onsite_conversion.lead_grouped / leadgen.*).
function sumLeadActions(actions: Array<{ action_type?: string; value?: string }> | undefined): number {
  if (!actions) return 0;
  return actions.reduce((total, action) => {
    const type = action.action_type?.toLowerCase() ?? "";
    if (type.includes("lead")) {
      const value = Number(action.value ?? 0);
      return total + (Number.isFinite(value) ? value : 0);
    }
    return total;
  }, 0);
}

async function fetchCampaignInsights(
  accessToken: string,
  metaCampaignId: string,
  datePreset: "yesterday" | "last_7d"
): Promise<MetaInsights | null> {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${metaCampaignId}/insights`
  );
  url.searchParams.set("fields", "spend,frequency,actions");
  url.searchParams.set("date_preset", datePreset);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as {
    data?: Array<{
      spend?: string;
      frequency?: string;
      actions?: Array<{ action_type?: string; value?: string }>;
    }>;
  } | null;

  const row = payload?.data?.[0];
  if (!row) {
    // Sem linha de insights = sem entrega no periodo. Tratamos como zeros.
    return { spendReais: 0, frequency: 0, leads: 0 };
  }

  return {
    spendReais: Number(row.spend ?? 0) || 0,
    frequency: Number(row.frequency ?? 0) || 0,
    leads: sumLeadActions(row.actions)
  };
}

// Le o orcamento diario (centavos) da campanha na Meta (CBO no nivel da campanha).
async function fetchCampaignDailyBudgetCents(
  accessToken: string,
  metaCampaignId: string
): Promise<number> {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${metaCampaignId}`
  );
  url.searchParams.set("fields", "daily_budget");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) return 0;

  const payload = (await response.json().catch(() => null)) as { daily_budget?: string } | null;
  const cents = Number(payload?.daily_budget ?? 0);
  return Number.isFinite(cents) ? cents : 0;
}

async function processCampaign(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  row: DeliveryHealthCampaignRow,
  accessToken: string,
  snapshotDate: string
): Promise<number> {
  if (!row.meta_campaign_id) return 0;

  const [yesterday, last7d, dailyBudgetCents] = await Promise.all([
    fetchCampaignInsights(accessToken, row.meta_campaign_id, "yesterday"),
    fetchCampaignInsights(accessToken, row.meta_campaign_id, "last_7d"),
    fetchCampaignDailyBudgetCents(accessToken, row.meta_campaign_id)
  ]);

  const spendCents = yesterday ? Math.round(yesterday.spendReais * 100) : 0;
  const deliveryRatio = dailyBudgetCents > 0 ? spendCents / dailyBudgetCents : 0;
  const frequency = yesterday?.frequency ?? 0;
  const leadsYesterday = yesterday?.leads ?? 0;
  const leads7d = last7d?.leads ?? 0;

  // Persiste o snapshot do dia (idempotente por campanha+data).
  await supabase.from("meta_delivery_health").upsert(
    {
      organization_id: row.organization_id,
      campaign_id: row.id,
      snapshot_date: snapshotDate,
      spend_cents: spendCents,
      daily_budget_cents: dailyBudgetCents,
      delivery_ratio: Number(deliveryRatio.toFixed(4)),
      leads: leadsYesterday,
      frequency: Number(frequency.toFixed(4))
    },
    { onConflict: "campaign_id,snapshot_date" }
  );

  let alertsFired = 0;
  const linkUrl = `/dashboard/anuncios/${row.id}/desempenho`;
  const brl = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Alerta 1: subentrega por 3 dias seguidos.
  if (dailyBudgetCents > 0 && deliveryRatio < UNDERDELIVERY_RATIO_THRESHOLD) {
    const { data: recent } = await supabase
      .from("meta_delivery_health")
      .select("delivery_ratio, daily_budget_cents")
      .eq("campaign_id", row.id)
      .order("snapshot_date", { ascending: false })
      .limit(UNDERDELIVERY_CONSECUTIVE_DAYS);

    const days = (recent as Array<{ delivery_ratio: number; daily_budget_cents: number }> | null) ?? [];
    const sustained =
      days.length >= UNDERDELIVERY_CONSECUTIVE_DAYS &&
      days.every((d) => d.daily_budget_cents > 0 && d.delivery_ratio < UNDERDELIVERY_RATIO_THRESHOLD);

    if (sustained) {
      const fired = await createCampaignAlertNotification({
        organizationId: row.organization_id,
        campaignId: row.id,
        recipientProfileId: row.created_by_profile_id,
        type: "campaign_underdelivery",
        title: "Sua campanha está gastando bem menos que o previsto",
        body: `A campanha "${row.campaign_name}" gastou ${brl(spendCents)} dos ${brl(dailyBudgetCents)} previstos ontem. Isso normalmente significa que o Meta ainda não aprendeu quem é seu público. Sugestão: ampliar as cidades ou aumentar o orçamento.`,
        linkUrl
      });
      if (fired) alertsFired += 1;
    }
  }

  // Alerta 2: ativa ha 7+ dias com 0 leads.
  if (daysSince(row.published_at) >= NO_LEADS_MIN_DAYS && leads7d === 0) {
    const fired = await createCampaignAlertNotification({
      organizationId: row.organization_id,
      campaignId: row.id,
      recipientProfileId: row.created_by_profile_id,
      type: "campaign_no_leads",
      title: "Campanha há mais de 7 dias sem nenhum lead",
      body: `A campanha "${row.campaign_name}" está ativa há mais de uma semana e ainda não trouxe leads. Vale revisar o público, o criativo ou o formulário.`,
      linkUrl
    });
    if (fired) alertsFired += 1;
  }

  // Alerta 3: saturacao de publico (frequencia > 3).
  if (frequency > FREQUENCY_SATURATION_THRESHOLD) {
    const fired = await createCampaignAlertNotification({
      organizationId: row.organization_id,
      campaignId: row.id,
      recipientProfileId: row.created_by_profile_id,
      type: "campaign_frequency_saturation",
      title: "Seu público está vendo o anúncio vezes demais",
      body: `A campanha "${row.campaign_name}" está com frequência ${frequency.toFixed(1)} (acima de 3). O mesmo público vê o anúncio repetidamente — vale ampliar as cidades ou trocar o criativo.`,
      linkUrl
    });
    if (fired) alertsFired += 1;
  }

  // Alerta 4 (Mudanca 1): rodando em modo degradado e ja acumulou volume — pode
  // migrar para otimizacao por lead.
  if (
    row.meta_optimization_goal &&
    row.meta_optimization_goal !== "LEAD_GENERATION" &&
    leads7d >= UPGRADE_LEADS_THRESHOLD
  ) {
    const fired = await createCampaignAlertNotification({
      organizationId: row.organization_id,
      campaignId: row.id,
      recipientProfileId: row.created_by_profile_id,
      type: "campaign_optimization_upgrade",
      title: "Sua campanha já pode otimizar direto por leads",
      body: `A campanha "${row.campaign_name}" já acumulou ${leads7d} leads em 7 dias. Agora o Meta tem sinal suficiente para otimizar direto por lead — vale republicar otimizando por lead.`,
      linkUrl
    });
    if (fired) alertsFired += 1;
  }

  return alertsFired;
}

// Executa o check diario para todas as campanhas ativas. Best-effort por campanha:
// uma falha isolada nao derruba o lote. Usa o token da organizacao (mesma
// limitacao do reconcile — campanhas de conexao pessoal ficam de fora por ora).
export async function runDeliveryHealthCheck(options?: {
  limit?: number;
}): Promise<DeliveryHealthSummary> {
  requireServiceRole();

  const supabase = createSupabaseAdminClient();
  const snapshotDate = yesterdayDateString();
  const summary: DeliveryHealthSummary = { processed: 0, snapshots: 0, alerts: 0, failed: 0 };

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, organization_id, created_by_profile_id, campaign_name, meta_campaign_id, meta_effective_status, meta_optimization_goal, publication_status, published_at"
    )
    .not("meta_campaign_id", "is", null)
    .eq("status", "generated")
    .in("publication_status", ["published", "paused"])
    .limit(options?.limit ?? 200);

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data as DeliveryHealthCampaignRow[] | null) ?? []).filter((row) =>
    ACTIVE_EFFECTIVE_STATUSES.has(row.meta_effective_status ?? "")
  );

  const tokenCache = new Map<string, string | null>();

  for (const row of rows) {
    summary.processed += 1;
    try {
      let accessToken = tokenCache.get(row.organization_id);
      if (accessToken === undefined) {
        accessToken = await resolveMetaAccessTokenForOrganization(row.organization_id);
        tokenCache.set(row.organization_id, accessToken);
      }
      if (!accessToken) continue;

      const alerts = await processCampaign(supabase, row, accessToken, snapshotDate);
      summary.snapshots += 1;
      summary.alerts += alerts;
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}
