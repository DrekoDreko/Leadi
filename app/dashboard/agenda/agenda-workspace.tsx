"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Clock3,
  Filter,
  Loader2,
  RefreshCcw,
  Target,
  UsersRound,
  X
} from "lucide-react";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type { Lead } from "@/data/mock";
import {
  commercialAgendaPeriodFilterOptions,
  commercialAgendaStatusFilterOptions,
  defaultCommercialAgendaFilters,
  formatAgendaDateTime,
  getCommercialAgendaBucketLabel,
  getCommercialAgendaBucketTone,
  getCommercialAgendaRelativeLabel,
  type CommercialAgendaBucket,
  type CommercialAgendaFilters,
  type CommercialAgendaItem,
  type CommercialAgendaPeriodFilterValue,
  type CommercialAgendaStatusFilterValue
} from "@/lib/leads/agenda";
import type { CommercialAgendaState } from "@/lib/leads/agenda.server";

type AgendaNotice = {
  type: "success" | "error" | "info";
  message: string;
};

const agendaFilterKeys: Array<keyof CommercialAgendaFilters> = ["responsible", "status", "period"];

export function CommercialAgendaWorkspace({
  agendaState
}: {
  agendaState: CommercialAgendaState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notice, setNotice] = useState<AgendaNotice | null>(
    agendaState.message
      ? {
          type: agendaState.mode === "error" ? "error" : agendaState.mode === "unauthenticated" ? "error" : "info",
          message: agendaState.message
        }
      : null
  );

  useEffect(() => {
    if (!selectedLead) {
      return;
    }

    if (!agendaState.items.some((item) => item.lead.id === selectedLead.id)) {
      setSelectedLead(null);
    }
  }, [agendaState.items, selectedLead]);

  function updateFilter<K extends keyof CommercialAgendaFilters>(
    key: K,
    value: CommercialAgendaFilters[K]
  ) {
    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");

    for (const filterKey of agendaFilterKeys) {
      const nextValue = filterKey === key ? value : agendaState.filters[filterKey];

      if (isDefaultAgendaFilterValue(filterKey, nextValue)) {
        nextSearchParams.delete(filterKey);
      } else {
        nextSearchParams.set(filterKey, nextValue);
      }
    }

    const currentPathname = pathname ?? "/dashboard/agenda";
    const query = nextSearchParams.toString();
    router.replace(query ? `${currentPathname}?${query}` : currentPathname, { scroll: false });
  }

  function clearFilters() {
    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");

    for (const filterKey of agendaFilterKeys) {
      nextSearchParams.delete(filterKey);
    }

    const currentPathname = pathname ?? "/dashboard/agenda";
    const query = nextSearchParams.toString();
    router.replace(query ? `${currentPathname}?${query}` : currentPathname, { scroll: false });
  }

  function refreshAgenda() {
    router.refresh();
  }

  function handleLeadUpdated(lead: Lead) {
    setSelectedLead(lead);
    setNotice({
      type: agendaState.mode === "not-configured" ? "info" : "success",
      message:
        agendaState.mode === "not-configured"
          ? "Lead atualizado no modo demonstracao."
          : "Lead atualizado e refletido na agenda."
    });
    router.refresh();
  }

  function handleLeadDeleted() {
    setSelectedLead(null);
    setNotice({
      type: agendaState.mode === "not-configured" ? "info" : "success",
      message:
        agendaState.mode === "not-configured"
          ? "Lead removido no modo demonstracao."
          : "Lead removido da agenda."
    });
    router.refresh();
  }

  const itemsByBucket = groupAgendaItemsByBucket(agendaState.items);
  const hasNoVisibleItems = agendaState.items.length === 0;
  const isLoadingDemo = agendaState.mode === "not-configured";

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Agenda comercial"
        title="Prioridades do dia"
        description="Follow-ups atrasados, de hoje e dos próximos dias em uma visão curta para a operação comercial agir rápido."
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          onClick={refreshAgenda}
          type="button"
        >
          <RefreshCcw size={18} aria-hidden="true" />
          Atualizar
        </button>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard/leads"
        >
          Ver leads
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-cobalt">{agendaState.scopeLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Base real da operação</h2>
            <p className="mt-2 leading-7 text-ink/62">{agendaState.scopeDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink/68">
              <Target size={14} aria-hidden="true" />
              {isLoadingDemo ? "Modo demonstracao" : "Dados reais do Supabase"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink/68">
              <Clock3 size={14} aria-hidden="true" />
              Janela curta de acompanhamento
            </span>
          </div>
        </div>

        {notice ? (
          <div
            className={`mt-4 rounded-[24px] border px-4 py-3 text-sm ${
              notice.type === "error"
                ? "border-red-200/70 bg-red-50/80 text-red-800"
                : notice.type === "success"
                  ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-800"
                  : "border-amber-200/70 bg-amber-50/80 text-amber-900"
            }`}
          >
            {notice.message}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Atrasados"
          value={String(agendaState.stats.overdue)}
          note="follow-ups vencidos"
          tone="yellow"
        />
        <Metric
          label="Hoje"
          value={String(agendaState.stats.today)}
          note="prioridade imediata"
          tone="teal"
        />
        <Metric
          label="Próximos"
          value={String(agendaState.stats.upcoming)}
          note="dentro da janela"
          tone="blue"
        />
        <Metric
          label="Sem agenda"
          value={String(agendaState.stats.noAgenda)}
          note="sem próximo contato"
          tone="dark"
        />
      </div>

      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm text-ink/54">Filtros operacionais</p>
            <h2 className="text-2xl font-semibold">Refinar a agenda</h2>
          </div>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/60 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/78"
            onClick={clearFilters}
            type="button"
          >
            <X size={16} aria-hidden="true" />
            Limpar filtros
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/58">Responsável</span>
            <div className="relative">
              <UsersRound
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38"
                size={18}
                aria-hidden="true"
              />
              <select
                className="liquid-input appearance-none py-3 pl-11 pr-10"
                value={agendaState.filters.responsible}
                onChange={(event) => updateFilter("responsible", event.target.value)}
              >
                {agendaState.responsibleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/58">Status</span>
            <div className="relative">
              <Filter
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38"
                size={18}
                aria-hidden="true"
              />
              <select
                className="liquid-input appearance-none py-3 pl-11 pr-10"
                value={agendaState.filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value as CommercialAgendaStatusFilterValue)
                }
              >
                {commercialAgendaStatusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/58">Período</span>
            <div className="relative">
              <CalendarClock
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38"
                size={18}
                aria-hidden="true"
              />
              <select
                className="liquid-input appearance-none py-3 pl-11 pr-10"
                value={agendaState.filters.period}
                onChange={(event) =>
                  updateFilter("period", event.target.value as CommercialAgendaPeriodFilterValue)
                }
              >
                {commercialAgendaPeriodFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </section>

      {hasNoVisibleItems ? (
        <section className="glass-strong rounded-[34px] p-6">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/60 text-ink/70">
              <Loader2 size={18} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-2xl font-semibold">Nenhum compromisso neste recorte</h3>
            <p className="mt-3 leading-7 text-ink/62">
              Ajuste os filtros ou amplie a janela para ver outros follow-ups da equipe.
            </p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
              onClick={clearFilters}
              type="button"
            >
              <X size={16} aria-hidden="true" />
              Limpar filtros
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        {(["overdue", "today", "upcoming", "no_agenda"] as CommercialAgendaBucket[]).map((bucket) => {
          const items = itemsByBucket[bucket];

          return (
            <AgendaSection
              bucket={bucket}
              items={items}
              onOpenLead={setSelectedLead}
              key={bucket}
            />
          );
        })}
      </section>

      <LeadDetailsPopup
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onDeleted={handleLeadDeleted}
        onUpdated={handleLeadUpdated}
      />
    </div>
  );
}

function AgendaSection({
  bucket,
  items,
  onOpenLead
}: {
  bucket: CommercialAgendaBucket;
  items: CommercialAgendaItem[];
  onOpenLead: (lead: Lead) => void;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-ink/54">{getCommercialAgendaBucketLabel(bucket)}</p>
          <h2 className="text-2xl font-semibold">
            {bucket === "overdue"
              ? "Follow-ups que já venceram"
              : bucket === "today"
                ? "Compromissos de hoje"
                : bucket === "upcoming"
                  ? "Próximos compromissos"
                  : "Leads sem próximo contato"}
          </h2>
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getToneClass(bucket)}`}>
          {items.length} item{items.length > 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-white/56 bg-white/28 p-5 text-sm leading-7 text-ink/60">
          {getEmptyBucketMessage(bucket)}
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <AgendaCard item={item} onOpenLead={onOpenLead} key={item.lead.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function AgendaCard({
  item,
  onOpenLead
}: {
  item: CommercialAgendaItem;
  onOpenLead: (lead: Lead) => void;
}) {
  const bucketTone = getCommercialAgendaBucketTone(item.bucket);
  const relativeLabel = getCommercialAgendaRelativeLabel(item);
  const dueLabel = formatAgendaDateTime(item.dueAt ?? item.lead.nextContactAt ?? "");

  return (
    <article className="rounded-[28px] border border-white/55 bg-white/36 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getToneClass(item.bucket)}`}>
              {relativeLabel}
            </span>
            <span className="rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold text-ink/64">
              {item.lead.owner}
            </span>
            <span className="rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold text-ink/64">
              {item.lead.stage}
            </span>
            <span className="rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold text-ink/64">
              {item.lead.score}% fit
            </span>
          </div>

          <button
            className="block text-left transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
            onClick={() => onOpenLead(item.lead)}
            type="button"
          >
            <h3 className="text-xl font-semibold leading-tight">{item.lead.name}</h3>
            <p className="mt-1 text-sm text-ink/58">
              {item.lead.companyName ?? item.lead.city ?? "Sem empresa informada"}
            </p>
          </button>

          <p className="max-w-3xl text-sm leading-7 text-ink/62">{item.lead.lastInteraction}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white"
            onClick={() => onOpenLead(item.lead)}
            type="button"
          >
            <ArrowUpRight size={16} aria-hidden="true" />
            Abrir rápido
          </button>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/64 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/80"
            href={`/dashboard/leads?search=${encodeURIComponent(item.lead.name)}`}
          >
            <ArrowRight size={16} aria-hidden="true" />
            Abrir no CRM
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoTile label="Próximo contato" value={dueLabel} tone={bucketTone} />
        <InfoTile label="Telefone" value={item.lead.phone} tone="neutral" />
        <InfoTile label="Email" value={item.lead.email} tone="neutral" />
      </div>
    </article>
  );
}

function InfoTile({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "danger" | "warning" | "info" | "muted" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200/70 bg-red-50/70 text-red-900"
      : tone === "warning"
        ? "border-amber-200/70 bg-amber-50/70 text-amber-900"
        : tone === "info"
          ? "border-cobalt/18 bg-cobalt/8 text-ink"
          : tone === "muted"
            ? "border-white/56 bg-white/62 text-ink/70"
            : "border-white/56 bg-white/62 text-ink/70";

  return (
    <div className={`rounded-[22px] border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function getToneClass(bucket: CommercialAgendaBucket) {
  return (
    {
      overdue: "bg-red-100 text-red-900",
      today: "bg-signal text-ink",
      upcoming: "bg-cobalt text-white",
      no_agenda: "bg-white/72 text-ink/68"
    }[bucket] ?? "bg-white/72 text-ink/68"
  );
}

function getEmptyBucketMessage(bucket: CommercialAgendaBucket) {
  return (
    {
      overdue: "Nenhum follow-up venceu até agora. Quando houver atraso, ele aparece nesta faixa primeiro.",
      today: "Nenhum compromisso vence hoje. Este bloco volta a ganhar prioridade quando houver agendamentos para a data atual.",
      upcoming:
        "Nenhum compromisso está dentro da janela atual. Amplie o período se quiser ver a próxima rodada de contatos.",
      no_agenda:
        "Nenhum lead ficou sem agenda nesta visão. Quando um lead estiver sem próximo contato, ele aparece aqui para priorização."
    }[bucket] ?? "Sem compromissos nesta seção."
  );
}

function groupAgendaItemsByBucket(items: CommercialAgendaItem[]) {
  return items.reduce<Record<CommercialAgendaBucket, CommercialAgendaItem[]>>(
    (accumulator, item) => {
      accumulator[item.bucket].push(item);
      return accumulator;
    },
    {
      overdue: [],
      today: [],
      upcoming: [],
      no_agenda: []
    }
  );
}

function isDefaultAgendaFilterValue<K extends keyof CommercialAgendaFilters>(
  key: K,
  value: CommercialAgendaFilters[K]
) {
  return defaultCommercialAgendaFilters[key] === value;
}
