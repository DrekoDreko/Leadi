import type { Lead } from "@/data/mock";

type LeadSearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

export const leadStageFilterOptions = [
  { value: "all", label: "Todos os estagios" },
  { value: "Novo lead", label: "Novo lead" },
  { value: "Qualificação", label: "Qualificação" },
  { value: "Proposta", label: "Proposta" },
  { value: "Negociação", label: "Negociação" },
  { value: "Venda", label: "Venda" },
  { value: "Perdido", label: "Perdido" }
] as const;

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

export type LeadStageFilterValue = (typeof leadStageFilterOptions)[number]["value"];
export type LeadSourceFilterValue = (typeof leadSourceFilterOptions)[number]["value"];
export type LeadPeriodFilterValue = (typeof leadPeriodFilterOptions)[number]["value"];

export type LeadUrlFilters = {
  stage: LeadStageFilterValue;
  source: LeadSourceFilterValue;
  city: string;
  period: LeadPeriodFilterValue;
  search: string;
};

export const defaultLeadUrlFilters: LeadUrlFilters = {
  stage: "all",
  source: "all",
  city: "",
  period: "all",
  search: ""
};

const stageValues = new Set<string>(leadStageFilterOptions.map((option) => option.value));
const sourceValues = new Set<string>(leadSourceFilterOptions.map((option) => option.value));
const periodValues = new Set<string>(leadPeriodFilterOptions.map((option) => option.value));

export function parseLeadUrlFilters(input: LeadSearchParamsInput): LeadUrlFilters {
  return {
    stage: parseFilterValue(input, "stage", stageValues, defaultLeadUrlFilters.stage),
    source: parseFilterValue(input, "source", sourceValues, defaultLeadUrlFilters.source),
    city: normalizeFilterText(readSearchParam(input, "city")),
    period: parseFilterValue(input, "period", periodValues, defaultLeadUrlFilters.period),
    search: normalizeLeadSearchTerm(readSearchParam(input, "search"))
  };
}

export function hasActiveLeadUrlFilters(filters: LeadUrlFilters) {
  return (
    filters.stage !== defaultLeadUrlFilters.stage ||
    filters.source !== defaultLeadUrlFilters.source ||
    filters.city.trim().length > 0 ||
    filters.period !== defaultLeadUrlFilters.period ||
    filters.search.trim().length > 0
  );
}

export function applyLeadUrlFilters(lead: Lead, filters: LeadUrlFilters) {
  if (filters.stage !== "all" && lead.stage !== filters.stage) {
    return false;
  }

  if (filters.source !== "all" && lead.source !== filters.source) {
    return false;
  }

  if (filters.city && !lead.city?.toLowerCase().includes(filters.city.toLowerCase())) {
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
  return value === "all" ? null : toRawStageValue(value);
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

function toRawStageValue(value: Exclude<LeadStageFilterValue, "all">) {
  switch (value) {
    case "Novo lead":
      return "new";
    case "Qualificação":
      return "qualification";
    case "Proposta":
      return "proposal";
    case "Negociação":
      return "negotiation";
    case "Venda":
      return "won";
    case "Perdido":
      return "lost";
  }
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
