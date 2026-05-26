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
import { kanbanColumns, leads, type Lead } from "@/data/mock";

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
          <p className="text-muted-soft mt-3 leading-7">{description}</p>
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
    blue: "bg-primary text-primary-foreground",
    yellow: "bg-signal text-accent-foreground",
    teal: "border border-info/28 bg-info/18 text-foreground",
    dark: "bg-foreground text-background"
  }[tone];

  return (
    <article className="surface-card rounded-[30px] p-5">
      <p className="text-muted-soft text-sm">{label}</p>
      <div className="mt-3 flex flex-col gap-3">
        <strong className="text-4xl font-semibold">{value}</strong>
        <span className={`${toneClass} w-fit rounded-full px-3 py-1.5 text-xs font-semibold`}>
          {note}
        </span>
      </div>
    </article>
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
    <section className="surface-card-strong rounded-[34px] p-5 xl:min-h-[520px] xl:flex xl:flex-col">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-muted-soft text-sm">CRM</p>
          <h2 className="text-2xl font-semibold">Leads</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="icon-button" type="button" title="Filtrar">
            <Filter size={18} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" title="Importar CSV">
            <Upload size={18} aria-hidden="true" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92">
            <Plus size={18} aria-hidden="true" />
            Novo lead
          </button>
        </div>
      </div>
        <div className="surface-card-muted overflow-hidden rounded-[26px] xl:flex-1">
        <div className="text-muted-soft hidden grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] gap-4 border-b border-border/50 px-5 py-3 text-xs font-semibold uppercase tracking-normal md:grid">
          <span>Lead</span>
          <span>Telefone</span>
          <span>Email</span>
          <span>Responsável</span>
          <span>Status</span>
          <span aria-hidden="true" />
        </div>
        {tableLeads.length === 0 && (
          <div className="text-muted-soft px-5 py-8 text-sm font-medium">
            Nenhum lead cadastrado ainda.
          </div>
        )}
        {tableLeads.map((lead) => (
          <div
            className="grid gap-3 border-b border-border/45 px-5 py-4 last:border-0 md:grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] md:items-center"
            key={lead.id}
          >
            <button
              className="min-w-0 text-left transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              <span className="block font-semibold leading-tight">{lead.name}</span>
              <span className="text-muted-soft mt-1 block text-sm md:hidden">{lead.phone}</span>
            </button>
            <button
              className="text-left text-sm font-medium text-ink transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.phone}
            </button>
            <button
              className="text-muted-soft text-left text-sm transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.email}
            </button>
            <button
              className="text-muted-soft text-left text-sm transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.owner}
            </button>
            <button
              className="surface-pill w-fit rounded-full px-3 py-1.5 text-left text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              onClick={() => onLeadOpen(lead)}
              type="button"
            >
              {lead.stage}
            </button>
            <button
              className="surface-action-secondary hidden h-10 w-10 items-center justify-center rounded-full md:inline-flex"
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
    <section className="surface-card rounded-[34px] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-muted-soft text-sm">Kanban</p>
          <h2 className="text-2xl font-semibold">Funil de vendas</h2>
        </div>
        <Link className="icon-button" href={href} title="Abrir página do funil" aria-label="Abrir página do funil">
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div className="surface-card-muted rounded-[28px] p-3" key={column.title}>
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <span className="text-muted-strong text-sm font-semibold">{column.title}</span>
              <span className="surface-pill rounded-full px-2 py-1 text-xs font-semibold">
                {column.cards.length}
              </span>
            </div>
            {column.cards.length === 0 && (
              <div className="surface-card rounded-[24px] p-4 text-sm font-medium text-muted-soft">
                Sem leads nesta etapa.
              </div>
            )}
            <div className="flex flex-col gap-2">
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
          </div>
        ))}
      </div>
    </section>
  );
}

export function SuggestedCampaignPanel({ href = "/dashboard/criacoes/campanhas" }: { href?: string }) {
  return (
    <section className="surface-card-strong rounded-[34px] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-cobalt">Criar nova campanha</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">IA Gerador de Campanha</h2>
          <p className="text-muted-soft mt-3 max-w-xl leading-7">
            Comece uma campanha nova com publico, oferta, observacoes e briefing criativo em um fluxo unico dentro de Criações.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Criacoes", "Publico e objetivo", "Briefing criativo"].map((tag) => (
              <span className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold" key={tag}>
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
              Hub de criacoes
            </span>
            <span className="text-lg font-semibold leading-tight">Abrir IA Gerador de Campanha</span>
            <span className="mt-1 text-sm leading-5 text-white/84">
              Monte a campanha, anexe criativos e acompanhe o retorno no validador.
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
        <div className="surface-card-muted flex items-center gap-3 rounded-2xl px-4 py-3" key={item}>
          <CheckCircle2 size={18} className="text-lagoon" aria-hidden="true" />
          <span className="text-sm font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
}
