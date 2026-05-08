import { buildAgendaEntriesFromItems, buildCommercialAgendaItems, buildCommercialAgendaStats, buildAgendaResponsibleOptions, defaultCommercialAgendaFilters, filterCommercialAgendaItems, type CommercialAgendaFilters, type CommercialAgendaItem, type CommercialAgendaPeriodFilterValue, type CommercialAgendaStatusFilterValue } from "@/lib/leads/agenda";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import type { LeadAgendaMetrics, LeadDataMode, LeadDataState } from "@/lib/leads/repository";

type AgendaSearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

type CommercialAgendaScope = {
  scopeLabel: string;
  scopeDescription: string;
};

export type CommercialAgendaState = CommercialAgendaScope & {
  mode: LeadDataMode;
  message?: string;
  filters: CommercialAgendaFilters;
  items: CommercialAgendaItem[];
  entries: ReturnType<typeof buildAgendaEntriesFromItems>;
  stats: ReturnType<typeof buildCommercialAgendaStats>;
  metrics: LeadAgendaMetrics;
  responsibleOptions: ReturnType<typeof buildAgendaResponsibleOptions>;
};

export type CommercialAgendaQuery = Partial<{
  responsible: string;
  status: CommercialAgendaStatusFilterValue;
  period: CommercialAgendaPeriodFilterValue;
  limit: number | null;
}>;

export function parseCommercialAgendaQuery(
  input: AgendaSearchParamsInput
): CommercialAgendaQuery {
  return {
    responsible: readAgendaParam(input, "responsible") ?? readAgendaParam(input, "user") ?? undefined,
    status: parseAgendaStatusFilter(readAgendaParam(input, "status")),
    period: parseAgendaPeriodFilter(readAgendaParam(input, "period")),
    limit: parseAgendaLimit(readAgendaParam(input, "limit"))
  };
}

export function buildCommercialAgendaStateFromLeadState(
  leadState: LeadDataState,
  options?: {
    filters?: CommercialAgendaQuery;
    limit?: number | null;
    scopeLabel?: string;
    scopeDescription?: string;
  }
): CommercialAgendaState {
  const agendaItems = buildCommercialAgendaItems(leadState.leads);
  const responsibleOptions = buildAgendaResponsibleOptions(leadState.leads);
  const filters = normalizeCommercialAgendaFilters(options?.filters, responsibleOptions);
  const visibleItems = filterCommercialAgendaItems(agendaItems, filters);
  const limit = options?.limit ?? null;
  const entries =
    limit === null
      ? buildAgendaEntriesFromItems(visibleItems, visibleItems.length)
      : buildAgendaEntriesFromItems(visibleItems, limit);
  const scope = resolveCommercialAgendaScope(leadState.mode, options?.scopeLabel, options?.scopeDescription);

  return {
    ...scope,
    mode: leadState.mode,
    message: leadState.message,
    filters,
    items: visibleItems,
    entries,
    stats: buildCommercialAgendaStats(visibleItems),
    metrics: {
      scopeLabel: scope.scopeLabel,
      scopeDescription: scope.scopeDescription,
      noAgenda: visibleItems.filter((item) => item.bucket === "no_agenda").length,
      overdueFollowUps: visibleItems.filter((item) => item.bucket === "overdue").length,
      todayCommitments: visibleItems.filter((item) => item.bucket === "today").length
    },
    responsibleOptions
  };
}

export async function getCommercialAgendaForCurrentUser(
  options?: {
    filters?: CommercialAgendaQuery;
    limit?: number | null;
    scopeLabel?: string;
    scopeDescription?: string;
  }
): Promise<CommercialAgendaState> {
  const leadState = await getLeadsForCurrentUser();

  return buildCommercialAgendaStateFromLeadState(leadState, {
    filters: options?.filters,
    limit: options?.limit,
    scopeLabel: options?.scopeLabel,
    scopeDescription: options?.scopeDescription
  });
}

function normalizeCommercialAgendaFilters(
  filters: CommercialAgendaQuery | undefined,
  responsibleOptions: ReturnType<typeof buildAgendaResponsibleOptions>
): CommercialAgendaFilters {
  const allowedResponsibleValues = new Set(responsibleOptions.map((option) => option.value));
  const responsibleValue =
    filters?.responsible && allowedResponsibleValues.has(filters.responsible)
      ? filters.responsible
      : defaultCommercialAgendaFilters.responsible;

  return {
    responsible: responsibleValue,
    status: filters?.status ?? defaultCommercialAgendaFilters.status,
    period: filters?.period ?? defaultCommercialAgendaFilters.period
  };
}

function resolveCommercialAgendaScope(
  mode: LeadDataMode,
  scopeLabel?: string,
  scopeDescription?: string
): CommercialAgendaScope {
  if (scopeLabel || scopeDescription) {
    return {
      scopeLabel: scopeLabel ?? "Agenda",
      scopeDescription:
        scopeDescription ?? "Compromissos calculados a partir dos leads carregados."
    };
  }

  if (mode === "not-configured") {
    return {
      scopeLabel: "Demo",
      scopeDescription: "Indicadores simulados enquanto o Supabase nao esta conectado."
    };
  }

  if (mode === "unauthenticated") {
    return {
      scopeLabel: "Sem dados",
      scopeDescription: "Entre novamente para carregar os compromissos da agenda."
    };
  }

  if (mode === "error") {
    return {
      scopeLabel: "Sem dados",
      scopeDescription: "Nao foi possivel carregar os compromissos da agenda agora."
    };
  }

  return {
    scopeLabel: "Agenda",
    scopeDescription: "Compromissos calculados a partir dos leads carregados."
  };
}

function parseAgendaStatusFilter(value: string | null): CommercialAgendaStatusFilterValue | undefined {
  if (!value) {
    return undefined;
  }

  const allowedValues: CommercialAgendaStatusFilterValue[] = [
    "all",
    "overdue",
    "today",
    "upcoming",
    "no_agenda"
  ];

  return allowedValues.includes(value as CommercialAgendaStatusFilterValue)
    ? (value as CommercialAgendaStatusFilterValue)
    : undefined;
}

function parseAgendaPeriodFilter(value: string | null): CommercialAgendaPeriodFilterValue | undefined {
  if (!value) {
    return undefined;
  }

  const allowedValues: CommercialAgendaPeriodFilterValue[] = ["all", "today", "7d", "overdue"];

  return allowedValues.includes(value as CommercialAgendaPeriodFilterValue)
    ? (value as CommercialAgendaPeriodFilterValue)
    : undefined;
}

function parseAgendaLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsedValue)));
}

function readAgendaParam(
  input: AgendaSearchParamsInput,
  key: string
) {
  if (!input) {
    return null;
  }

  if (input instanceof URLSearchParams) {
    return normalizeAgendaParam(input.get(key));
  }

  const value = input[key];
  const rawValue = Array.isArray(value) ? value[0] : value;
  return normalizeAgendaParam(rawValue ?? null);
}

function normalizeAgendaParam(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}
