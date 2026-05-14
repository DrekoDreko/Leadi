import type { Lead } from "@/data/mock";

export type LeadDataMode = "supabase" | "mock" | "not-configured" | "unauthenticated" | "error";

export type LeadDataState = {
  leads: Lead[];
  mode: LeadDataMode;
  canDeleteLeads: boolean;
  canCreateMetaAdsLeads: boolean;
  pagination: LeadPaginationMeta;
  message?: string;
};

export type LeadPaginationOptions = {
  limit?: number | null;
  offset?: number;
};

export type LeadPaginationMeta = {
  limit: number | null;
  offset: number;
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export const DEFAULT_LEAD_PAGE_SIZE = 20;
const MAX_LEAD_PAGE_SIZE = 100;

export function parseLeadPaginationParams(
  input: URLSearchParams | Record<string, string | string[] | undefined> | undefined
): Required<Pick<LeadPaginationOptions, "limit" | "offset">> {
  return {
    limit: parseBoundedInteger(
      readPaginationParam(input, "limit"),
      DEFAULT_LEAD_PAGE_SIZE,
      1,
      MAX_LEAD_PAGE_SIZE
    ),
    offset: parseBoundedInteger(readPaginationParam(input, "offset"), 0, 0, Number.MAX_SAFE_INTEGER)
  };
}

export function normalizeLeadPaginationOptions(options?: LeadPaginationOptions) {
  if (options === undefined) {
    return {
      limit: null,
      offset: 0
    };
  }

  return {
    limit:
      options?.limit === null
        ? null
        : parseBoundedInteger(options?.limit, DEFAULT_LEAD_PAGE_SIZE, 1, MAX_LEAD_PAGE_SIZE),
    offset: parseBoundedInteger(options?.offset, 0, 0, Number.MAX_SAFE_INTEGER)
  };
}

export function paginateLeads(
  leads: Lead[],
  pagination: ReturnType<typeof normalizeLeadPaginationOptions>
) {
  if (pagination.limit === null) {
    return leads;
  }

  return leads.slice(pagination.offset, pagination.offset + pagination.limit);
}

export function buildLeadPaginationMeta(
  pagination: ReturnType<typeof normalizeLeadPaginationOptions>,
  total: number,
  currentPageSize: number
): LeadPaginationMeta {
  if (pagination.limit === null) {
    return {
      limit: null,
      offset: 0,
      total,
      hasMore: false,
      nextOffset: null
    };
  }

  const nextOffset = pagination.offset + currentPageSize;
  const hasMore = nextOffset < total;

  return {
    limit: pagination.limit,
    offset: pagination.offset,
    total,
    hasMore,
    nextOffset: hasMore ? nextOffset : null
  };
}

function readPaginationParam(
  input: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  if (!input) {
    return null;
  }

  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  const value = input[key];
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function parseBoundedInteger(
  value: string | number | null | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const parsedValue = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsedValue)));
}
