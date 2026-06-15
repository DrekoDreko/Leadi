import "server-only";

import { getMetaGraphApiVersion } from "@/lib/meta/config";
import { resolveMetaAccessTokenForOrganization } from "@/lib/integrations/repository.server";

// Períodos suportados pelo painel de desempenho (modo easy). Mapeiam direto
// para o parâmetro `date_preset` da Graph API de insights.
export type InsightDatePreset = "today" | "last_7d" | "last_30d" | "maximum";

const VALID_DATE_PRESETS: InsightDatePreset[] = ["today", "last_7d", "last_30d", "maximum"];

export function normalizeInsightDatePreset(value: unknown): InsightDatePreset {
  return VALID_DATE_PRESETS.includes(value as InsightDatePreset)
    ? (value as InsightDatePreset)
    : "last_30d";
}

// Action types da Meta que representam um lead de formulário/anúncio. Usamos o
// MAIOR valor entre eles (e não a soma) para evitar contagem duplicada, já que
// a Meta repete o mesmo lead em variações agrupadas do mesmo evento.
const LEAD_ACTION_TYPES = new Set([
  "lead",
  "leadgen_grouped",
  "onsite_conversion.lead_grpd",
  "onsite_conversion.lead"
]);

type MetaInsightAction = {
  action_type?: string;
  value?: string;
};

type MetaInsightRow = {
  ad_id?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  ctr?: string;
  cpc?: string;
  actions?: MetaInsightAction[];
};

export type CampaignInsightSummary = {
  spend: number;
  leads: number;
  costPerLead: number | null;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number;
};

export type AdInsightSummary = {
  adId: string;
  adName: string;
  spend: number;
  leads: number;
  costPerLead: number | null;
  reach: number;
  impressions: number;
  clicks: number;
};

const CAMPAIGN_INSIGHT_FIELDS =
  "spend,impressions,clicks,reach,ctr,cpc,actions";
const AD_INSIGHT_FIELDS =
  "ad_id,ad_name,spend,impressions,clicks,reach,actions";

function toNumber(value: string | undefined): number {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractLeads(actions: MetaInsightAction[] | undefined): number {
  if (!actions?.length) {
    return 0;
  }

  let leads = 0;
  for (const action of actions) {
    if (action.action_type && LEAD_ACTION_TYPES.has(action.action_type)) {
      leads = Math.max(leads, toNumber(action.value));
    }
  }

  return leads;
}

function computeCostPerLead(spend: number, leads: number): number | null {
  return leads > 0 ? spend / leads : null;
}

async function fetchInsights(
  accessToken: string,
  objectId: string,
  params: Record<string, string>
): Promise<MetaInsightRow[]> {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/${objectId}/insights`
  );
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: MetaInsightRow[];
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message
        ? `Falha ao carregar desempenho na Meta: ${payload.error.message}`
        : `Falha ao carregar desempenho na Meta: status ${response.status}.`
    );
  }

  return payload?.data ?? [];
}

// Resumo agregado da campanha no período. Retorna `null` quando não há token,
// sem id de campanha publicada, ou quando a Meta não devolve nenhuma linha
// (campanha sem entrega ainda) — a UI trata como estado vazio amigável.
export async function fetchCampaignInsights(input: {
  organizationId: string;
  metaCampaignId: string | null;
  datePreset?: InsightDatePreset;
}): Promise<CampaignInsightSummary | null> {
  if (!input.metaCampaignId) {
    return null;
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(input.organizationId);
  if (!accessToken) {
    return null;
  }

  try {
    const rows = await fetchInsights(accessToken, input.metaCampaignId, {
      fields: CAMPAIGN_INSIGHT_FIELDS,
      date_preset: input.datePreset ?? "last_30d"
    });

    const row = rows[0];
    if (!row) {
      return null;
    }

    const spend = toNumber(row.spend);
    const leads = extractLeads(row.actions);

    return {
      spend,
      leads,
      costPerLead: computeCostPerLead(spend, leads),
      reach: toNumber(row.reach),
      impressions: toNumber(row.impressions),
      clicks: toNumber(row.clicks),
      ctr: toNumber(row.ctr)
    };
  } catch (error) {
    console.error("Erro ao carregar insights da campanha Meta.", error);
    return null;
  }
}

// Resumo simples por anúncio (level=ad) dentro da campanha. Lista vazia quando
// não há entrega/permite que a página renderize sem quebrar.
export async function fetchAdsInsights(input: {
  organizationId: string;
  metaCampaignId: string | null;
  datePreset?: InsightDatePreset;
}): Promise<AdInsightSummary[]> {
  if (!input.metaCampaignId) {
    return [];
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(input.organizationId);
  if (!accessToken) {
    return [];
  }

  try {
    const rows = await fetchInsights(accessToken, input.metaCampaignId, {
      fields: AD_INSIGHT_FIELDS,
      level: "ad",
      date_preset: input.datePreset ?? "last_30d"
    });

    return rows.flatMap((row) => {
      const adId = row.ad_id?.trim();
      if (!adId) {
        return [];
      }

      const spend = toNumber(row.spend);
      const leads = extractLeads(row.actions);

      return [
        {
          adId,
          adName: row.ad_name?.trim() || "Anúncio",
          spend,
          leads,
          costPerLead: computeCostPerLead(spend, leads),
          reach: toNumber(row.reach),
          impressions: toNumber(row.impressions),
          clicks: toNumber(row.clicks)
        }
      ];
    });
  } catch (error) {
    console.error("Erro ao carregar insights por anúncio da Meta.", error);
    return [];
  }
}
