"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus,
  ShieldCheck,
  Upload
} from "lucide-react";
import { campaignDraft, kanbanColumns, leads, type Lead } from "@/data/mock";
import type { LeadAgendaMetrics } from "@/lib/leads/repository";

type MetricTone = "blue" | "yellow" | "teal" | "dark";

export function PageHeading({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-5 md:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cobalt">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-3 leading-7 text-ink/64">{description}</p>
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </section>
  );
}

export function Metric({
  label,
  value,
  note,
  tone
}: {
  label: string;
  value: string;
  note: string;
  tone: MetricTone;
}) {
  const toneClass = {
    blue: "bg-cobalt text-white",
    yellow: "bg-signal text-ink",
    teal: "bg-lagoon text-white",
    dark: "bg-ink text-white"
  }[tone];

  return (
    <article className="glass rounded-[30px] p-5">
      <p className="text-sm text-ink/54">{label}</p>
      <div className="mt-3 flex flex-col gap-3">
        <strong className="text-4xl font-semibold">{value}</strong>
        <span className={`${toneClass} w-fit rounded-full px-3 py-1.5 text-xs font-semibold`}>
          {note}
        </span>
      </div>
    </article>
  );
}

export function OperationalAgendaMetrics({
  metrics
}: {
  metrics: LeadAgendaMetrics;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cobalt">Indicadores operacionais</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Qualidade da agenda comercial</h2>
          <p className="mt-2 leading-7 text-ink/62">{metrics.scopeDescription}</p>
        </div>
        <span className="w-fit rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold text-ink/68">
          {metrics.scopeLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric
          label="Sem agenda"
          value={String(metrics.noAgenda)}
          note="sem próximo contato"
          tone="dark"
        />
        <Metric
          label="Follow-ups atrasados"
          value={String(metrics.overdueFollowUps)}
          note="já venceram"
          tone="yellow"
        />
        <Metric
          label="Compromissos de hoje"
          value={String(metrics.todayCommitments)}
          note="restantes no dia"
          tone="teal"
        />
      </div>
    </section>
  );
}

export function LeadTable({
  leads: tableLeads = leads,
  onLeadOpen
}: {
  leads?: Lead[];
  onLeadOpen: (lead: Lead) => void;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-5 xl:min-h-[520px] xl:flex xl:flex-col">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-ink/54">CRM</p>
          <h2 className="text-2xl font-semibold">Leads</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="icon-button" type="button" title="Filtrar">
            <Filter size={18} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" title="Importar CSV">
            <Upload size={18} aria-hidden="true" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white">
            <Plus size={18} aria-hidden="true" />
            Novo lead
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[26px] border border-white/48 bg-white/28 xl:flex-1">
        <div className="hidden grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] gap-4 border-b border-ink/8 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid">
          <span>Lead</span>
          <span>Telefone</span>
          <span>Email</span>
          <span>Responsável</span>
          <span>Status</span>
          <span aria-hidden="true" />
        </div>
        {tableLeads.length === 0 && (
          <div className="px-5 py-8 text-sm font-medium text-ink/56">
            Nenhum lead cadastrado ainda.
          </div>
        )}
        {tableLeads.map((lead) => (
          <div
            className="grid gap-3 border-b border-ink/8 px-5 py-4 last:border-0 md:grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] md:items-center"
            key={lead.id}
          >
            <button
              className="min-w-0 text-left transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              <span className="block font-semibold leading-tight">{lead.name}</span>
              <span className="mt-1 block text-sm text-ink/54 md:hidden">{lead.phone}</span>
            </button>
            <button
              className="text-left text-sm font-medium text-ink transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.phone}
            </button>
            <button
              className="text-left text-sm text-ink/62 transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.email}
            </button>
            <button
              className="text-left text-sm text-ink/62 transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.owner}
            </button>
            <button
              className="w-fit rounded-full bg-white/60 px-3 py-1.5 text-left text-xs font-semibold transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.stage}
            </button>
            <button
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/54 text-ink/58 transition hover:bg-white/72 md:inline-flex"
              onClick={() => onLeadOpen(lead)}
              type="button"
              aria-label={`Abrir detalhes de ${lead.name}`}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function KanbanBoard({
  leads: boardLeads = leads,
  href = "/dashboard/funil",
  onLeadOpen
}: {
  leads?: Lead[];
  href?: string;
  onLeadOpen: (lead: Lead) => void;
}) {
  const columns = buildKanbanColumns(boardLeads);

  return (
    <section className="glass rounded-[34px] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink/54">Kanban</p>
          <h2 className="text-2xl font-semibold">Funil de vendas</h2>
        </div>
        <Link className="icon-button" href={href} title="Abrir página do funil" aria-label="Abrir página do funil">
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div className="rounded-[28px] bg-white/34 p-3" key={column.title}>
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <span className="text-sm font-semibold text-ink/62">{column.title}</span>
              <span className="rounded-full bg-white/56 px-2 py-1 text-xs font-semibold text-ink/54">
                {column.cards.length}
              </span>
            </div>
            {column.cards.length === 0 && (
              <div className="rounded-[24px] bg-white/36 p-4 text-sm font-medium text-ink/48">
                Sem leads nesta etapa.
              </div>
            )}
            {column.cards.map((lead) => (
              <button
                className={`${column.color} flex w-full flex-col justify-between rounded-[24px] p-4 text-left shadow-soft transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50`}
                key={lead.id}
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                <div className="space-y-3">
                  <h3 className="font-semibold leading-tight">{lead.name}</h3>
                  <p className="text-sm opacity-85">{lead.owner}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SuggestedCampaignPanel({ href = "/dashboard/campanhas" }: { href?: string }) {
  return (
    <section className="glass-strong rounded-[34px] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-cobalt">Campanha sugerida</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{campaignDraft.title}</h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">{campaignDraft.copy}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Análise consultiva", "Leads qualificados", "Meta Lead Form"].map((tag) => (
              <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Link
          aria-label="Abrir campanha sugerida"
          className="group relative isolate flex w-full max-w-[380px] items-center gap-4 overflow-hidden rounded-[28px] border border-white/24 bg-[linear-gradient(135deg,#2246e0_0%,#3462EE_58%,#4A91A8_100%)] px-5 py-4 text-left text-white shadow-[0_22px_60px_rgba(52,98,238,0.34)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_72px_rgba(52,98,238,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/40"
          href={href}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_50%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_36%)]"
          />
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/24">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <span className="relative flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/74">
              Fluxo principal
            </span>
            <span className="text-lg font-semibold leading-tight">Nova campanha sugerida</span>
            <span className="mt-1 text-sm leading-5 text-white/84">
              Crie uma campanha nova com base nos leads mais quentes do funil.
            </span>
          </span>
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/24 transition duration-200 group-hover:bg-white/28 group-hover:shadow-[0_10px_26px_rgba(255,255,255,0.18)] group-hover:ring-white/45">
            <ArrowRight
              size={18}
              aria-hidden="true"
              className="block -translate-x-px transition duration-200"
            />
          </span>
        </Link>
      </div>
    </section>
  );
}

function buildKanbanColumns(boardLeads: Lead[]) {
  return kanbanColumns.map((column) => ({
    ...column,
    cards: boardLeads.filter((lead) => lead.stage === column.title)
  }));
}

export function ComplianceChecklist() {
  return (
    <div className="space-y-3">
      {["Sem promessa garantida", "Sem pergunta de saúde", "Formulário seguro"].map((item) => (
        <div className="flex items-center gap-3 rounded-2xl bg-white/38 px-4 py-3" key={item}>
          <CheckCircle2 size={18} className="text-lagoon" aria-hidden="true" />
          <span className="text-sm font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}
