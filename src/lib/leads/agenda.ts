import type { Lead } from "@/data/mock";
import type { LeadAgendaMetrics } from "@/lib/leads/repository";

export type AgendaEntryTone = "danger" | "warning" | "neutral";

export type AgendaEntry = {
  lead: Lead;
  nextContactAt: string;
  statusLabel: string;
  detailLabel: string;
  tone: AgendaEntryTone;
};

export type CommercialAgendaBucket = "overdue" | "today" | "upcoming" | "no_agenda";
export type CommercialAgendaStatusFilterValue = CommercialAgendaBucket | "all";
export type CommercialAgendaPeriodFilterValue = "all" | "today" | "7d" | "overdue";

export type CommercialAgendaFilters = {
  responsible: string;
  status: CommercialAgendaStatusFilterValue;
  period: CommercialAgendaPeriodFilterValue;
};

export const commercialAgendaStatusFilterOptions = [
  { value: "all", label: "Todos os status" },
  { value: "overdue", label: "Atrasados" },
  { value: "today", label: "Hoje" },
  { value: "upcoming", label: "Próximos" },
  { value: "no_agenda", label: "Sem agenda" }
] as const;

export const commercialAgendaPeriodFilterOptions = [
  { value: "all", label: "Todo o período" },
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Próximos 7 dias" },
  { value: "overdue", label: "Atrasados" }
] as const;

export const defaultCommercialAgendaFilters: CommercialAgendaFilters = {
  responsible: "all",
  status: "all",
  period: "all"
};

export type CommercialAgendaItem = {
  lead: Lead;
  bucket: CommercialAgendaBucket;
  dueAt: string | null;
  daysDelta: number | null;
};

export type CommercialAgendaStats = {
  overdue: number;
  today: number;
  upcoming: number;
  noAgenda: number;
  total: number;
};

const agendaFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo"
});

export function buildAgendaEntries(leads: Lead[], limit = 4): AgendaEntry[] {
  return buildAgendaEntriesFromItems(buildCommercialAgendaItems(leads), limit);
}

export function buildAgendaEntriesFromItems(
  items: CommercialAgendaItem[],
  limit = 4
): AgendaEntry[] {
  return items
    .filter((item) => item.bucket !== "no_agenda")
    .slice(0, limit)
    .map((item) => ({
      lead: item.lead,
      nextContactAt: item.dueAt ?? item.lead.nextContactAt ?? "",
      statusLabel:
        item.bucket === "overdue" ? "Atrasado" : item.bucket === "today" ? "Hoje" : "Próximo",
      detailLabel: formatAgendaDateTime(item.dueAt ?? item.lead.nextContactAt ?? ""),
      tone: item.bucket === "overdue" ? "danger" : item.bucket === "today" ? "warning" : "neutral"
    }));
}

export function buildAgendaMetricsFromLeads(
  leads: Lead[],
  options?: Pick<LeadAgendaMetrics, "scopeLabel" | "scopeDescription">
): LeadAgendaMetrics {
  const metrics = buildCommercialAgendaStats(buildCommercialAgendaItems(leads));

  return {
    scopeLabel: options?.scopeLabel ?? "Agenda",
    scopeDescription:
      options?.scopeDescription ?? "Compromissos calculados a partir dos leads carregados.",
    noAgenda: metrics.noAgenda,
    overdueFollowUps: metrics.overdue,
    todayCommitments: metrics.today
  };
}

export function buildCommercialAgendaItems(leads: Lead[], now = new Date()) {
  return leads
    .filter((lead) => isOperationalAgendaLead(lead.stage))
    .map((lead) => buildCommercialAgendaItem(lead, now))
    .sort(compareCommercialAgendaItems);
}

export function buildCommercialAgendaStats(items: CommercialAgendaItem[]): CommercialAgendaStats {
  return {
    overdue: items.filter((item) => item.bucket === "overdue").length,
    today: items.filter((item) => item.bucket === "today").length,
    upcoming: items.filter((item) => item.bucket === "upcoming").length,
    noAgenda: items.filter((item) => item.bucket === "no_agenda").length,
    total: items.length
  };
}

export function filterCommercialAgendaItems(
  items: CommercialAgendaItem[],
  filters: CommercialAgendaFilters
) {
  return items.filter((item) => {
    if (filters.responsible !== "all" && getAgendaResponsibleKey(item.lead) !== filters.responsible) {
      return false;
    }

    if (filters.status !== "all" && item.bucket !== filters.status) {
      return false;
    }

    if (filters.period === "today") {
      return item.bucket === "today";
    }

    if (filters.period === "7d") {
      return item.bucket !== "overdue" && item.daysDelta !== null && item.daysDelta >= 0 && item.daysDelta <= 7;
    }

    if (filters.period === "overdue") {
      return item.bucket === "overdue";
    }

    return true;
  });
}

export function buildAgendaResponsibleOptions(leads: Lead[]) {
  const options = new Map<string, string>();

  for (const lead of leads) {
    if (!isOperationalAgendaLead(lead.stage)) {
      continue;
    }

    const key = getAgendaResponsibleKey(lead);
    if (!options.has(key)) {
      options.set(key, lead.owner || "Responsável");
    }
  }

  return [
    { value: "all", label: "Todos os responsáveis" },
    ...Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"))
  ];
}

export function getCommercialAgendaBucketLabel(bucket: CommercialAgendaBucket) {
  return (
    {
      overdue: "Atrasado",
      today: "Hoje",
      upcoming: "Próximo",
      no_agenda: "Sem agenda"
    }[bucket] ?? "Agenda"
  );
}

export function getCommercialAgendaBucketTone(
  bucket: CommercialAgendaBucket
): "danger" | "warning" | "info" | "muted" | "neutral" {
  const tones: Record<CommercialAgendaBucket, "danger" | "warning" | "info" | "muted"> = {
    overdue: "danger",
    today: "warning",
    upcoming: "info",
    no_agenda: "muted"
  };

  return tones[bucket];
}

export function getCommercialAgendaRelativeLabel(item: CommercialAgendaItem) {
  if (item.bucket === "no_agenda") {
    return "A definir";
  }

  if (item.daysDelta === null) {
    return item.bucket === "today" ? "Hoje" : "Próximo";
  }

  if (item.daysDelta < 0) {
    const overdueDays = Math.abs(item.daysDelta);
    return overdueDays === 0 ? "Atrasado hoje" : `Atrasado há ${overdueDays} dia${overdueDays > 1 ? "s" : ""}`;
  }

  if (item.daysDelta === 0) {
    return "Hoje";
  }

  return `Em ${item.daysDelta} dia${item.daysDelta > 1 ? "s" : ""}`;
}

export function getAgendaResponsibleKey(lead: Lead) {
  return lead.ownerProfileId ?? lead.owner;
}

export function formatAgendaDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return agendaFormatter.format(date);
}

function buildCommercialAgendaItem(lead: Lead, now: Date): CommercialAgendaItem {
  const dueAt = lead.nextContactAt ? new Date(lead.nextContactAt) : null;

  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return {
      lead,
      bucket: "no_agenda",
      dueAt: null,
      daysDelta: null
    };
  }

  const daysDelta = getLocalDayDelta(now, dueAt);
  const bucket: CommercialAgendaBucket =
    dueAt.getTime() < now.getTime() ? "overdue" : daysDelta === 0 ? "today" : "upcoming";

  return {
    lead,
    bucket,
    dueAt: lead.nextContactAt ?? null,
    daysDelta
  };
}

function compareCommercialAgendaItems(left: CommercialAgendaItem, right: CommercialAgendaItem) {
  const bucketOrder: Record<CommercialAgendaBucket, number> = {
    overdue: 0,
    today: 1,
    upcoming: 2,
    no_agenda: 3
  };

  const leftBucket = bucketOrder[left.bucket];
  const rightBucket = bucketOrder[right.bucket];

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  if (left.bucket === "no_agenda" && right.bucket === "no_agenda") {
    return right.lead.score - left.lead.score || left.lead.name.localeCompare(right.lead.name, "pt-BR");
  }

  const leftTime = left.dueAt ? new Date(left.dueAt).getTime() : Number.POSITIVE_INFINITY;
  const rightTime = right.dueAt ? new Date(right.dueAt).getTime() : Number.POSITIVE_INFINITY;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return right.lead.score - left.lead.score || left.lead.name.localeCompare(right.lead.name, "pt-BR");
}

function isOperationalAgendaLead(stage: string) {
  return !["Venda", "Perdido", "won", "lost"].includes(stage);
}

function getLocalDayDelta(left: Date, right: Date) {
  const leftMidnight = getLocalMidnightMs(left);
  const rightMidnight = getLocalMidnightMs(right);

  return Math.round((rightMidnight - leftMidnight) / 86_400_000);
}

function getLocalMidnightMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return Date.UTC(year, month - 1, day);
}
