import type { Lead } from "@/data/mock";
import { getLeadStageLabel, getLeadStageValue, leadStageOptions } from "./stages";

type LeadSearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

export type LeadStageFilterValue = "all" | (typeof leadStageOptions)[number]["label"];

export const leadStageFilterOptions: ReadonlyArray<{
  value: LeadStageFilterValue;
  label: string;
}> = [
  { value: "all", label: "Todos os estagios" },
  ...leadStageOptions.map((option) => ({
    value: option.label as LeadStageFilterValue,
    label: option.label
  }))
];

export const leadSourceFilterOptions = [
  { value: "all", label: "Todas as origens" },
  { value: "Cadastro manual", label: "Cadastro manual" },
  { value: "CSV importado", label: "CSV importado" },
  { value: "Meta Lead Form", label: "Meta Lead Form" },
  { value: "Make/Zapier", label: "Make/Zapier" },
  { value: "API", label: "API" }
] as const;

export const leadPeriodFilterOptions = [
  { value: "all", label: "Qualquer periodo" },
  { value: "7d", label: "Ultimos 7 dias" },
  { value: "30d", label: "Ultimos 30 dias" },
  { value: "90d", label: "Ultimos 90 dias" },
  { value: "month", label: "Este mes" }
] as const;

export type LeadSourceFilterValue = (typeof leadSourceFilterOptions)[number]["value"];
export type LeadPeriodFilterValue = (typeof leadPeriodFilterOptions)[number]["value"];
export type LeadViewFilterValue = "all" | "unassigned" | "distributed";

export type LeadUrlFilters = {
  stage: LeadStageFilterValue;
  source: LeadSourceFilterValue;
  city: string;
  period: LeadPeriodFilterValue;
  search: string;
  archived: boolean;
  owner: string;
  campaign: string;
  view: LeadViewFilterValue;
  team: string;
};

export const filterKeys: Array<keyof LeadUrlFilters> = [
  "stage",
  "source",
  "city",
  "period",
  "search",
  "archived",
  "owner",
  "campaign",
  "view",
  "team"
];

export const defaultLeadUrlFilters: LeadUrlFilters = {
  stage: "all",
  source: "all",
  city: "",
  period: "all",
  search: "",
  archived: false,
  owner: "",
  campaign: "",
  view: "all",
  team: "all"
};

const stageValues = new Set<string>(leadStageFilterOptions.map((option) => option.value));
const sourceValues = new Set<string>(leadSourceFilterOptions.map((option) => option.value));
const periodValues = new Set<string>(leadPeriodFilterOptions.map((option) => option.value));
const viewValues = new Set<string>(["all", "unassigned", "distributed"]);

export function parseLeadUrlFilters(input: LeadSearchParamsInput): LeadUrlFilters {
  return {
    stage: parseFilterValue(input, "stage", stageValues, defaultLeadUrlFilters.stage),
    source: parseFilterValue(input, "source", sourceValues, defaultLeadUrlFilters.source),
    city: normalizeFilterText(readSearchParam(input, "city")),
    period: parseFilterValue(input, "period", periodValues, defaultLeadUrlFilters.period),
    search: normalizeLeadSearchTerm(readSearchParam(input, "search")),
    archived: readSearchParam(input, "archived") === "true",
    owner: normalizeFilterText(readSearchParam(input, "owner")),
    campaign: normalizeFilterText(readSearchParam(input, "campaign")),
    view: parseFilterValue(input, "view", viewValues, defaultLeadUrlFilters.view),
    team: normalizeFilterText(readSearchParam(input, "team")) || "all",
  };
}

export function hasActiveLeadUrlFilters(filters: LeadUrlFilters) {
  return (
    filters.stage !== defaultLeadUrlFilters.stage ||
    filters.source !== defaultLeadUrlFilters.source ||
    filters.city.trim().length > 0 ||
    filters.period !== defaultLeadUrlFilters.period ||
    filters.search.trim().length > 0 ||
    filters.owner.trim().length > 0 ||
    filters.campaign.trim().length > 0 ||
    filters.view !== defaultLeadUrlFilters.view ||
    filters.team !== defaultLeadUrlFilters.team
  );
}

export function applyLeadUrlFilters(
  lead: Lead,
  filters: LeadUrlFilters,
  sellerProfileIds: string[] = []
) {
  if (filters.stage !== "all" && getLeadStageLabel(lead.stage) !== filters.stage) {
    return false;
  }

  if (filters.source !== "all" && lead.source !== filters.source) {
    return false;
  }

  if (filters.city && !lead.city?.toLowerCase().includes(filters.city.toLowerCase())) {
    return false;
  }

  if (filters.view === "unassigned") {
    if (sellerProfileIds.length > 0) {
      if (lead.ownerProfileId && sellerProfileIds.includes(lead.ownerProfileId)) {
        return false;
      }
    } else if (lead.ownerProfileId) {
      return false;
    }
  }

  if (filters.view === "distributed") {
    if (sellerProfileIds.length > 0) {
      if (!lead.ownerProfileId || !sellerProfileIds.includes(lead.ownerProfileId)) {
        return false;
      }
    } else if (!lead.ownerProfileId) {
      return false;
    }
  }

  if (filters.owner && !lead.owner?.toLowerCase().includes(filters.owner.toLowerCase())) {
    return false;
  }

  if (filters.campaign && !lead.sourceCampaign?.toLowerCase().includes(filters.campaign.toLowerCase())) {
    return false;
  }

  if (filters.team !== "all" && lead.teamId !== filters.team) {
    return false;
  }

  if (!matchesLeadPeriod(lead.receivedAt ?? null, filters.period)) {
    return false;
  }

  if (!matchesLeadSearch(lead, filters.search)) {
    return false;
  }

  return true;
}

export function normalizeLeadSearchTerm(value: string | null) {
  const normalizedValue = normalizeFilterText(value);

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .replace(/[,%*_()[\]{}"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();
}

export function getSupabaseStageValue(value: LeadStageFilterValue) {
  return value === "all" ? null : getLeadStageValue(value);
}

export function getSupabaseSourceValue(value: LeadSourceFilterValue) {
  return value === "all" ? null : toRawSourceValue(value);
}

export function getLeadPeriodStart(value: LeadPeriodFilterValue) {
  if (value === "all") {
    return null;
  }

  const now = new Date();
  const start = new Date(now);

  if (value === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const daysBack = value === "7d" ? 6 : value === "30d" ? 29 : 89;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysBack);
  return start;
}

function parseFilterValue<T extends string>(
  input: LeadSearchParamsInput,
  key: string,
  allowedValues: Set<string>,
  fallback: T
): T {
  const rawValue = readSearchParam(input, key);
  return rawValue && allowedValues.has(rawValue) ? (rawValue as T) : fallback;
}

function readSearchParam(input: LeadSearchParamsInput, key: string) {
  if (!input) {
    return null;
  }

  if (input instanceof URLSearchParams) {
    return normalizeFilterText(input.get(key));
  }

  const value = input[key];
  const rawValue = Array.isArray(value) ? value[0] : value;
  return normalizeFilterText(rawValue ?? null);
}

function normalizeFilterText(value: string | null) {
  if (!value) {
    return "";
  }

  return value.trim();
}

function matchesLeadSearch(lead: Lead, searchTerm: string) {
  const normalizedSearchTerm = normalizeLeadSearchTerm(searchTerm).toLowerCase();

  if (!normalizedSearchTerm) {
    return true;
  }

  const searchBase = [
    lead.name,
    lead.email,
    lead.phone,
    lead.city ?? "",
    lead.companyName ?? ""
  ]
    .join(" ")
    .toLowerCase();

  return normalizedSearchTerm
    .split(" ")
    .every((searchPart) => searchBase.includes(searchPart));
}

function matchesLeadPeriod(receivedAt: string | null | undefined, value: LeadPeriodFilterValue) {
  const start = getLeadPeriodStart(value);

  if (!start) {
    return true;
  }

  if (!receivedAt) {
    return false;
  }

  const receivedDate = new Date(receivedAt);
  if (Number.isNaN(receivedDate.getTime())) {
    return false;
  }

  return receivedDate >= start;
}

function toRawSourceValue(value: Exclude<LeadSourceFilterValue, "all">) {
  switch (value) {
    case "Cadastro manual":
      return "manual";
    case "CSV importado":
      return "csv_import";
    case "Meta Lead Form":
      return "meta_lead_ads";
    case "Make/Zapier":
      return "make_zapier";
    case "API":
      return "api";
  }
}
