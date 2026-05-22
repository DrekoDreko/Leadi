import "server-only";

import {
  getLeadPeriodStart,
  getSupabaseSourceValue,
  leadPeriodFilterOptions,
  leadSourceFilterOptions,
  type LeadPeriodFilterValue,
  type LeadSourceFilterValue
} from "@/lib/leads/filters";
import { isLeadQualifiedStage, isLeadWonStage } from "@/lib/leads/stages";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceContext } from "@/lib/workspaces/context";

type LeadRow = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  "stage" | "source" | "owner_profile_id" | "source_campaign" | "meta_campaign_id" | "received_at"
>;
type CampaignRow = Pick<
  Database["public"]["Tables"]["campaigns"]["Row"],
  "id" | "campaign_name" | "publication_status" | "publish_mode" | "created_at" | "created_by_profile_id"
>;
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "role" | "organization_id"
>;

const sourceDisplayLabels: Record<LeadRow["source"], string> = {
  manual: "Cadastro manual",
  csv_import: "CSV importado",
  meta_lead_ads: "Meta Lead Form",
  make_zapier: "Make/Zapier",
  api: "API"
};

export type CommercialReportFilters = {
  period: LeadPeriodFilterValue;
  source: LeadSourceFilterValue;
  seller: string;
};

export type CommercialReportSellerOption = {
  value: string;
  label: string;
};

export type CommercialReportBreakdownRow = {
  label: string;
  leads: number;
  won: number;
  qualified: number;
  conversionRate: number;
  campaignCount: number;
  note: string;
};

export type CommercialReportCampaignItem = {
  id: string;
  name: string;
  publicationStatus: CampaignRow["publication_status"];
  publishMode: CampaignRow["publish_mode"];
  createdAt: string;
};

export type CommercialReportData = {
  filters: CommercialReportFilters;
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  scopeLabel: string;
  scopeDescription: string;
  availableMetrics: string[];
  missingMetrics: string[];
  summary: {
    leads: number;
    won: number;
    qualified: number;
    conversionRate: number;
    leadsWithoutOwner: number;
    campaignCount: number;
    roiLabel: string;
    roiNote: string;
  };
  campaignRows: CommercialReportBreakdownRow[];
  sourceRows: CommercialReportBreakdownRow[];
  sellerRows: CommercialReportBreakdownRow[];
  sellerOptions: CommercialReportSellerOption[];
  campaigns: CommercialReportCampaignItem[];
  message?: string;
};

export type DashboardCplSummary = {
  value: string;
  note: string;
  status: "mocked" | "unavailable";
};

const periodOptions = new Set(leadPeriodFilterOptions.map((option) => option.value));
const sourceOptions = new Set(leadSourceFilterOptions.map((option) => option.value));
const reportDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});
const dashboardCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2
});
const INITIAL_CPL_MOCK_VALUE = 24;

export function parseCommercialReportFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined> | undefined
): CommercialReportFilters {
  return {
    period: parseAllowedValue(input, "period", periodOptions, "30d"),
    source: parseAllowedValue(input, "source", sourceOptions, "all"),
    seller: parseSellerValue(input)
  };
}

export function buildInitialDashboardCplSummary(input: {
  leadCount: number;
  activeCampaignCount: number;
  readyCampaignCount: number;
}): DashboardCplSummary {
  if (input.leadCount <= 0) {
    return {
      value: "N/D",
      note: "sem leads para leitura inicial",
      status: "unavailable"
    };
  }

  if (input.activeCampaignCount + input.readyCampaignCount <= 0) {
    return {
      value: "N/D",
      note: "sem campanhas ativas ou prontas",
      status: "unavailable"
    };
  }

  return {
    value: `~${dashboardCurrencyFormatter.format(INITIAL_CPL_MOCK_VALUE)}`,
    note: "mock inicial • sem custo Meta real",
    status: "mocked"
  };
}

export async function getCommercialReportForCurrentUser(
  context: Pick<WorkspaceContext, "mode" | "profile" | "role" | "workspaceName" | "displayName">,
  filters: CommercialReportFilters
): Promise<CommercialReportData> {
  if (!isSupabaseConfigured() || context.mode === "not-configured") {
    return {
      filters,
      mode: "not-configured",
      scopeLabel: "Demonstração",
      scopeDescription: "Configure o Supabase para ver os indicadores calculados em dados reais.",
      availableMetrics: buildAvailableMetrics(),
      missingMetrics: buildMissingMetrics(),
      summary: {
        leads: 0,
        won: 0,
        qualified: 0,
        conversionRate: 0,
        leadsWithoutOwner: 0,
        campaignCount: 0,
        roiLabel: "N/D",
        roiNote: "sem custo e receita cadastrados"
      },
      campaignRows: [],
      sourceRows: [],
      sellerRows: [],
      sellerOptions: [],
      campaigns: [],
      message: "Supabase nao configurado. Os relatórios reais aparecem quando a base estiver conectada."
    };
  }

  if (!context.profile) {
    return buildErrorReport(filters, "Usuario nao autenticado.");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const accessibleProfiles = await loadAccessibleProfiles(supabase, context);
    const selectedSellerId = resolveSelectedSellerId(filters.seller, context, accessibleProfiles);
    const [leads, campaigns] = await Promise.all([
      loadCommercialLeads(supabase, context, filters, selectedSellerId),
      loadCommercialCampaigns(supabase, context, selectedSellerId)
    ]);

    const sellerMap = new Map(accessibleProfiles.map((profile) => [profile.id, profile]));

    const campaignRows = buildCampaignRows(leads);
    const sourceRows = buildSourceRows(leads);
    const sellerRows = buildSellerRows(leads, sellerMap);
    const leadsWithoutOwner = leads.filter((lead) => !lead.owner_profile_id).length;
    const qualified = countQualifiedLeads(leads);
    const won = leads.filter((lead) => isLeadWonStage(lead.stage)).length;
    const conversionRate = leads.length ? won / leads.length : 0;

    return {
      filters,
      mode: "supabase",
      scopeLabel: context.workspaceName,
      scopeDescription:
        context.role === "seller"
          ? "A leitura respeita apenas a sua carteira comercial."
          : "A leitura inclui a organização inteira e pode ser refinada pelos filtros acima.",
      availableMetrics: buildAvailableMetrics(),
      missingMetrics: buildMissingMetrics(),
      summary: {
        leads: leads.length,
        won,
        qualified,
        conversionRate,
        leadsWithoutOwner,
        campaignCount: campaigns.length,
        roiLabel: "N/D",
        roiNote: "sem custo e receita cadastrados"
      },
      campaignRows,
      sourceRows,
      sellerRows,
      sellerOptions: buildSellerOptions(accessibleProfiles, context),
      campaigns: campaigns
        .sort((left, right) => right.created_at.localeCompare(left.created_at))
        .slice(0, 6)
        .map((campaign) => ({
          id: campaign.id,
          name: campaign.campaign_name,
          publicationStatus: campaign.publication_status,
          publishMode: campaign.publish_mode,
          createdAt: campaign.created_at
        })),
      message:
        leads.length === 0
          ? "Nenhum lead encontrado para os filtros selecionados."
          : `Dados consolidados a partir de ${leads.length} leads, ${campaigns.length} campanhas registradas e ${accessibleProfiles.length} consultores visíveis.`
    };
  } catch (error) {
    return buildErrorReport(filters, error instanceof Error ? error.message : "Nao foi possivel carregar os relatórios.");
  }
}

function buildAvailableMetrics() {
  return [
    "Leads por periodo",
    "Conversao por etapa",
    "Distribuicao por origem",
    "Distribuicao por consultor",
    "Campanhas identificadas nos leads"
  ];
}

function buildMissingMetrics() {
  return [
    "ROI financeiro",
    "Custo por campanha",
    "Receita por venda",
    "Ligacao direta entre receita e lead"
  ];
}

function buildErrorReport(filters: CommercialReportFilters, message: string): CommercialReportData {
  return {
    filters,
    mode: "error",
    scopeLabel: "Sem dados",
    scopeDescription: "Nao foi possivel carregar os relatórios.",
    availableMetrics: buildAvailableMetrics(),
    missingMetrics: buildMissingMetrics(),
    summary: {
      leads: 0,
      won: 0,
      qualified: 0,
      conversionRate: 0,
      leadsWithoutOwner: 0,
      campaignCount: 0,
      roiLabel: "N/D",
      roiNote: "indisponivel"
    },
    campaignRows: [],
    sourceRows: [],
    sellerRows: [],
    sellerOptions: [],
    campaigns: [],
    message
  };
}

async function loadAccessibleProfiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  context: Pick<WorkspaceContext, "role" | "profile" | "workspaceName">
) {
  if (context.role === "seller" && context.profile) {
    return [
      {
        id: context.profile.id,
        full_name: context.profile.full_name,
        email: context.profile.email,
        role: context.profile.role,
        organization_id: context.profile.organization_id
      }
    ] satisfies ProfileRow[];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, organization_id")
    .eq("organization_id", context.profile?.organization_id ?? "")
    .in("role", ["owner", "admin", "seller"])
    .order("full_name", { ascending: true });

  if (error || !data) {
    return context.profile ? [context.profile] : [];
  }

  return data as ProfileRow[];
}

async function loadCommercialLeads(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  context: Pick<WorkspaceContext, "profile" | "role">,
  filters: CommercialReportFilters,
  selectedSellerId: string | null
) {
  const periodStart = getLeadPeriodStart(filters.period);
  let query = supabase
    .from("leads")
    .select("stage, source, owner_profile_id, source_campaign, meta_campaign_id, received_at")
    .order("received_at", { ascending: false });

  if (context.profile) {
    query = query.eq("organization_id", context.profile.organization_id);
  }

  if (context.role === "seller" && context.profile) {
    query = query.eq("owner_profile_id", context.profile.id);
  }

  if (selectedSellerId) {
    query = query.eq("owner_profile_id", selectedSellerId);
  }

  if (filters.source !== "all") {
    const sourceValue = getSupabaseSourceValue(filters.source);
    if (sourceValue) {
      query = query.eq("source", sourceValue);
    }
  }

  if (periodStart) {
    query = query.gte("received_at", periodStart.toISOString());
  }

  const { data, error } = await query;

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel carregar os leads.");
  }

  return data as LeadRow[];
}

async function loadCommercialCampaigns(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  context: Pick<WorkspaceContext, "profile" | "role">,
  selectedSellerId: string | null
) {
  let query = supabase
    .from("campaigns")
    .select("id, campaign_name, publication_status, publish_mode, created_at, created_by_profile_id")
    .order("created_at", { ascending: false });

  if (context.profile) {
    query = query.eq("organization_id", context.profile.organization_id);
  }

  if (selectedSellerId) {
    query = query.eq("created_by_profile_id", selectedSellerId);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel carregar as campanhas.");
  }

  return data as CampaignRow[];
}

function buildSellerOptions(
  profiles: ProfileRow[],
  context: Pick<WorkspaceContext, "displayName" | "profile">
): CommercialReportSellerOption[] {
  const items = profiles
    .map((profile) => ({
      value: profile.id,
      label: profile.full_name?.trim() || profile.email || "Sem nome"
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));

  if (!items.length && context.profile) {
    return [
      {
        value: context.profile.id,
        label: context.displayName || context.profile.email || "Sem nome"
      }
    ];
  }

  return items;
}

function buildCampaignRows(leads: LeadRow[]): CommercialReportBreakdownRow[] {
  return groupRows(leads, (lead) => normalizeCampaignLabel(lead))
    .map((entry) => buildBreakdownRow(entry.label, entry.leads))
    .sort(compareRows);
}

function buildSourceRows(leads: LeadRow[]): CommercialReportBreakdownRow[] {
  return groupRows(leads, (lead) => normalizeSourceLabel(lead.source))
    .map((entry) => buildBreakdownRow(entry.label, entry.leads))
    .sort(compareRows);
}

function buildSellerRows(leads: LeadRow[], sellerMap: Map<string, ProfileRow>): CommercialReportBreakdownRow[] {
  return groupRows(leads, (lead) => {
    if (!lead.owner_profile_id) {
      return "Sem consultor";
    }

    const profile = sellerMap.get(lead.owner_profile_id);
    return profile?.full_name?.trim() || profile?.email || "Sem consultor";
  })
    .map((entry) => buildBreakdownRow(entry.label, entry.leads))
    .sort(compareRows);
}

function buildBreakdownRow(label: string, leads: LeadRow[]): CommercialReportBreakdownRow {
  const won = leads.filter((lead) => isLeadWonStage(lead.stage)).length;
  const qualified = leads.filter((lead) => isLeadQualifiedStage(lead.stage)).length;
  const conversionRate = leads.length ? won / leads.length : 0;

  return {
    label,
    leads: leads.length,
    won,
    qualified,
    conversionRate,
    campaignCount: countCampaignMentions(leads),
    note: leads.length ? `${won} vendas` : "sem registros"
  };
}

function groupRows<T>(items: T[], getLabel: (item: T) => string) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const label = getLabel(item);
    const rows = map.get(label) ?? [];
    rows.push(item);
    map.set(label, rows);
  }

  return [...map.entries()].map(([label, groupedItems]) => ({
    label,
    leads: groupedItems
  }));
}

function normalizeCampaignLabel(lead: LeadRow) {
  const campaignLabel = lead.source_campaign?.trim() || lead.meta_campaign_id?.trim();

  return campaignLabel || "Sem campanha identificavel";
}

function normalizeSourceLabel(source: LeadRow["source"]) {
  return sourceDisplayLabels[source];
}

function countQualifiedLeads(leads: LeadRow[]) {
  return leads.filter((lead) => isLeadQualifiedStage(lead.stage)).length;
}

function countCampaignMentions(leads: LeadRow[]) {
  return leads.filter((lead) => Boolean(lead.source_campaign?.trim() || lead.meta_campaign_id?.trim())).length;
}

function compareRows(left: CommercialReportBreakdownRow, right: CommercialReportBreakdownRow) {
  if (right.leads !== left.leads) {
    return right.leads - left.leads;
  }

  return left.label.localeCompare(right.label, "pt-BR");
}

function resolveSelectedSellerId(
  sellerValue: string,
  context: Pick<WorkspaceContext, "role" | "profile">,
  accessibleProfiles: ProfileRow[]
) {
  if (context.role === "seller") {
    return context.profile?.id ?? null;
  }

  if (sellerValue === "all") {
    return null;
  }

  const selectedSeller = accessibleProfiles.find((profile) => profile.id === sellerValue);
  return selectedSeller?.id ?? null;
}

function parseAllowedValue<T extends string>(
  input: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
  key: string,
  allowedValues: Set<string>,
  fallback: T
): T {
  const rawValue = readSearchParam(input, key);
  return rawValue && allowedValues.has(rawValue) ? (rawValue as T) : fallback;
}

function parseSellerValue(
  input: URLSearchParams | Record<string, string | string[] | undefined> | undefined
) {
  const rawValue = readSearchParam(input, "seller");
  return rawValue && rawValue !== "all" ? rawValue : "all";
}

function readSearchParam(
  input: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  if (!input) {
    return null;
  }

  if (input instanceof URLSearchParams) {
    const value = input.get(key);
    return value?.trim() || null;
  }

  const value = input[key];
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.trim() || null;
}

export function formatReportDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return reportDateFormatter.format(date);
}
