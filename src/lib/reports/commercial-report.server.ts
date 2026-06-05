import "server-only";

import {
  getLeadPeriodStart,
  getSupabaseSourceValue,
  leadPeriodFilterOptions,
  leadSourceFilterOptions,
  type LeadPeriodFilterValue,
  type LeadSourceFilterValue
} from "@/lib/leads/filters";
import {
  getLeadStageValue,
  isLeadQualifiedStage,
  isLeadWonStage,
  leadStageMetas,
  type LeadStageTone,
  type LeadStageValue
} from "@/lib/leads/stages";
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

export type DashboardStageConversionRow = {
  stageValue: LeadStageValue;
  label: string;
  tone: LeadStageTone;
  count: number;
  percentage: number;
};

export type DashboardStageConversionSummary = {
  total: number;
  note: string;
  rows: DashboardStageConversionRow[];
  status: "available" | "empty";
};

export type DashboardConsultantPortfolioRow = {
  ownerProfileId: string | null;
  ownerName: string;
  role: "owner" | "admin" | "seller" | "unassigned";
  leadCount: number;
  overdueCount: number;
};

export type DashboardConsultantPortfolioSummary = {
  totalConsultants: number;
  totalLeads: number;
  totalOverdue: number;
  note: string;
  rows: DashboardConsultantPortfolioRow[];
  status: "available" | "empty";
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

export function buildDashboardStageConversionSummary<T extends { stage: string }>(
  leads: T[]
): DashboardStageConversionSummary {
  if (leads.length === 0) {
    return {
      total: 0,
      note: "Sem leads visiveis para calcular a distribuicao atual do funil.",
      rows: [],
      status: "empty"
    };
  }

  const counts = new Map<LeadStageValue, number>();

  for (const lead of leads) {
    const stageValue = getLeadStageValue(lead.stage);

    if (!stageValue) {
      continue;
    }

    counts.set(stageValue, (counts.get(stageValue) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return {
      total: 0,
      note: "As etapas atuais dos leads visiveis nao puderam ser classificadas no funil oficial.",
      rows: [],
      status: "empty"
    };
  }

  return {
    total,
    note: "Percentual da base atual em cada etapa oficial do funil.",
    rows: leadStageMetas.map((stageMeta) => {
      const count = counts.get(stageMeta.value) ?? 0;

      return {
        stageValue: stageMeta.value,
        label: stageMeta.label,
        tone: stageMeta.tone,
        count,
        percentage: count / total
      };
    }),
    status: "available"
  };
}

export function buildDashboardConsultantPortfolioSummary<
  TLead extends { id: string; owner: string; ownerProfileId?: string | null },
  TTask extends { leadId: string },
  TOwner extends { id: string; name: string; role: "owner" | "admin" | "seller" }
>(
  leads: TLead[],
  overdueTasks: TTask[],
  ownerOptions: TOwner[]
): DashboardConsultantPortfolioSummary {
  if (leads.length === 0 && overdueTasks.length === 0) {
    return {
      totalConsultants: 0,
      totalLeads: 0,
      totalOverdue: 0,
      note: "Nenhuma carteira visivel foi encontrada para distribuir a leitura por consultor.",
      rows: [],
      status: "empty"
    };
  }

  const rowMap = new Map<string, DashboardConsultantPortfolioRow>();
  const ownerMap = new Map(ownerOptions.map((option) => [option.id, option]));
  const leadOwnerKeys = new Map<string, string>();
  const unassignedKey = "__unassigned__";

  for (const lead of leads) {
    const descriptor = resolveConsultantDescriptor(lead, ownerMap);
    const row = getOrCreateConsultantPortfolioRow(rowMap, descriptor.key, descriptor);
    row.leadCount += 1;
    leadOwnerKeys.set(lead.id, descriptor.key);
  }

  for (const task of overdueTasks) {
    const ownerKey = leadOwnerKeys.get(task.leadId) ?? unassignedKey;
    const row =
      rowMap.get(ownerKey) ??
      getOrCreateConsultantPortfolioRow(rowMap, unassignedKey, {
        ownerProfileId: null,
        ownerName: "Sem responsável",
        role: "unassigned"
      });

    row.overdueCount += 1;
  }

  const rows = Array.from(rowMap.values())
    .filter((row) => row.leadCount > 0 || row.overdueCount > 0)
    .sort(compareConsultantPortfolioRows);
  const totalConsultants = rows.filter((row) => row.role !== "unassigned").length;

  return {
    totalConsultants,
    totalLeads: leads.length,
    totalOverdue: overdueTasks.length,
    note:
      overdueTasks.length > 0
        ? "Carteira atual e tarefas em atraso agregadas por consultor visivel no CRM."
        : "Carteira atual agregada por consultor visivel no CRM, sem atrasos registrados.",
    rows,
    status: rows.length > 0 ? "available" : "empty"
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
          : `${leads.length} leads · ${campaigns.length} campanhas · ${accessibleProfiles.length} consultores`
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

function getOrCreateConsultantPortfolioRow(
  rowMap: Map<string, DashboardConsultantPortfolioRow>,
  key: string,
  descriptor: {
    ownerProfileId: string | null;
    ownerName: string;
    role: DashboardConsultantPortfolioRow["role"];
  }
) {
  const existingRow = rowMap.get(key);

  if (existingRow) {
    return existingRow;
  }

  const row: DashboardConsultantPortfolioRow = {
    ownerProfileId: descriptor.ownerProfileId,
    ownerName: descriptor.ownerName,
    role: descriptor.role,
    leadCount: 0,
    overdueCount: 0
  };

  rowMap.set(key, row);
  return row;
}

function resolveConsultantDescriptor<
  TLead extends { owner: string; ownerProfileId?: string | null },
  TOwner extends { id: string; name: string; role: "owner" | "admin" | "seller" }
>(lead: TLead, ownerMap: Map<string, TOwner>) {
  if (!lead.ownerProfileId) {
    return {
      key: "__unassigned__",
      ownerProfileId: null,
      ownerName: "Sem responsável",
      role: "unassigned" as const
    };
  }

  const ownerOption = ownerMap.get(lead.ownerProfileId);

  return {
    key: lead.ownerProfileId,
    ownerProfileId: lead.ownerProfileId,
    ownerName: ownerOption?.name?.trim() || lead.owner || "Consultor sem nome",
    role: ownerOption?.role ?? "seller"
  };
}

function compareConsultantPortfolioRows(
  left: DashboardConsultantPortfolioRow,
  right: DashboardConsultantPortfolioRow
) {
  if (right.overdueCount !== left.overdueCount) {
    return right.overdueCount - left.overdueCount;
  }

  if (right.leadCount !== left.leadCount) {
    return right.leadCount - left.leadCount;
  }

  return left.ownerName.localeCompare(right.ownerName, "pt-BR");
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
