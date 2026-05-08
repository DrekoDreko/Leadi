"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { leads as mockLeads, type Lead } from "@/data/mock";
import {
  ComplianceChecklist,
  KanbanBoard,
  LeadTable,
  Metric,
  PageHeading,
  OperationalAgendaMetrics,
  SuggestedCampaignPanel
} from "@/components/dashboard/widgets";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { buildAgendaEntries, buildAgendaMetricsFromLeads, type AgendaEntry } from "@/lib/leads/agenda";
import type { LeadAgendaMetrics } from "@/lib/leads/repository";

type DashboardHomeProps = {
  leads?: Lead[];
  preview?: boolean;
  showCreateTeamCard: boolean;
  creditBalance?: number;
  agendaEntries?: AgendaEntry[];
  agendaMetrics?: LeadAgendaMetrics;
};

export function DashboardHome({
  leads = mockLeads,
  preview = false,
  showCreateTeamCard,
  creditBalance = 0,
  agendaEntries,
  agendaMetrics
}: DashboardHomeProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const metrics = preview ? getPreviewMetrics() : getDashboardMetrics(leads, creditBalance);
  const agendaCards = agendaEntries ?? buildAgendaEntries(leads);
  const agendaSummary =
    agendaMetrics ??
    buildAgendaMetricsFromLeads(
      leads,
      preview
        ? {
            scopeLabel: "Demo",
            scopeDescription: "Indicadores simulados enquanto o Supabase nao esta conectado."
          }
        : undefined
    );
  const nextLead = agendaCards[0]?.lead ?? leads[0];
  const relatoriosHref = preview ? "/login" : "/dashboard/relatorios";
  const campaignHref = preview ? "/login" : "/dashboard/campanhas";
  const creditsHref = preview ? "/login" : "/dashboard/creditos";
  const funnelHref = preview ? "/login" : "/dashboard/funil";

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Operação"
        title="Dashboard"
        description="Resumo da captação, funil comercial, campanhas e controles ativos da operação."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href={relatoriosHref}
        >
          {preview ? "Entrar" : "Relatórios"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
          href={creditsHref}
        >
          Créditos
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      {showCreateTeamCard && (
        <section className="glass-strong flex flex-col gap-4 rounded-[34px] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lagoon text-white">
              <UserPlus size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Criar equipe</h2>
              <p className="mt-2 max-w-2xl leading-7 text-ink/62">
                Seu workspace atual ainda e individual. Quando voce ativar uma equipe, esta area
                libera convites, papéis e gestao de membros.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
            href="/dashboard/criar-equipe"
          >
            Ver estrutura
          </Link>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Leads ativos" value={metrics.activeLeads} note={metrics.totalNote} tone="blue" />
        <Metric label="Propostas" value={metrics.proposals} note={metrics.proposalsNote} tone="yellow" />
        <Metric label="Vendas" value={metrics.sales} note={metrics.salesNote} tone="teal" />
        <Metric label="Pedidos" value={metrics.orders} note={metrics.ordersNote} tone="dark" />
        <Metric label="Créditos" value={metrics.credits} note={metrics.creditsNote} tone={metrics.creditsTone} />
      </div>

      <OperationalAgendaMetrics metrics={agendaSummary} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <KanbanBoard href={funnelHref} leads={leads} onLeadOpen={setSelectedLead} />
          <LeadTable leads={leads} onLeadOpen={setSelectedLead} />
        </div>

        <aside className="min-w-0 flex h-full flex-col gap-4">
          <section className="glass rounded-[34px] p-5 h-full flex flex-col xl:flex-1">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lagoon text-white">
                <ShieldCheck size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Compliance</h2>
                <p className="text-sm text-ink/54">Anúncio aprovado no mock</p>
              </div>
            </div>
            <ComplianceChecklist />
          </section>

          <section className="glass rounded-[34px] p-5 h-full">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Agenda da equipe</h2>
                <p className="mt-1 text-sm text-ink/54">
                  {agendaCards.length > 0
                    ? `${agendaCards.length} compromissos priorizados`
                    : "Sem compromissos com data ativa"}
                </p>
              </div>
              <CalendarDays size={20} aria-hidden="true" />
            </div>
            <div className="space-y-2">
              {agendaCards.length === 0 ? (
                <div className="rounded-[22px] bg-white/44 p-4 text-sm leading-6 text-ink/58">
                  Nenhum compromisso ativo por enquanto. Use o campo de próximo contato no lead
                  para alimentar esta agenda.
                </div>
              ) : (
                agendaCards.map((entry) => (
                  <button
                    className="flex w-full items-start justify-between gap-3 rounded-[22px] bg-white/44 p-3 text-left transition hover:bg-white/62"
                    key={entry.lead.id}
                    onClick={() => setSelectedLead(entry.lead)}
                    type="button"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{entry.lead.name}</p>
                      <p className="mt-1 text-sm text-ink/58">{entry.lead.owner}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-ink/52">
                        <Clock3 size={12} aria-hidden="true" />
                        {entry.detailLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getAgendaToneClass(entry.tone)}`}
                    >
                      {entry.statusLabel}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5 h-full">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Próximo lead</h2>
              <Clock3 size={20} aria-hidden="true" />
            </div>
            {nextLead ? (
              <>
                <h3 className="text-2xl font-semibold">{nextLead.name}</h3>
                <p className="mt-1 text-sm text-ink/58">{nextLead.phone}</p>
                <p className="mt-1 text-sm text-ink/58">{nextLead.email}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/54 px-3 py-1.5 text-xs font-semibold">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {nextLead.score}% fit
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/54 px-3 py-1.5 text-xs font-semibold">
                    <MessageCircle size={15} aria-hidden="true" />
                    {nextLead.nextContact}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm font-medium leading-6 text-ink/56">
                Nenhum lead cadastrado ainda.
              </p>
            )}
          </section>
        </aside>
      </section>

      <SuggestedCampaignPanel href={campaignHref} />

      <LeadDetailsPopup lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}

function getDashboardMetrics(leads: Lead[], creditBalance: number) {
  const activeLeads = leads.filter((lead) => !["Venda", "Perdido"].includes(lead.stage)).length;
  const proposals = leads.filter((lead) => lead.stage === "Proposta").length;
  const sales = leads.filter((lead) => lead.stage === "Venda").length;

  return {
    activeLeads: String(activeLeads),
    proposals: String(proposals),
    sales: String(sales),
    orders: "0",
    credits: String(creditBalance),
    totalNote: `${leads.length} leads no CRM`,
    proposalsNote: `${proposals} em proposta`,
    salesNote: `${sales} vendas`,
    ordersNote: "sem pedidos ativos",
    creditsNote: creditBalance > 0 ? "saldo ativo" : "sem saldo",
    creditsTone: creditBalance > 0 ? ("teal" as const) : ("yellow" as const)
  };
}

function getPreviewMetrics() {
  return {
    activeLeads: "128",
    proposals: "31",
    sales: "12",
    orders: "9",
    credits: "240",
    totalNote: "+18% no mês",
    proposalsNote: "+6 hoje",
    salesNote: "R$ 84k pipeline",
    ordersNote: "3 em produção",
    creditsNote: "demo ativo",
    creditsTone: "teal" as const
  };
}

function getAgendaToneClass(tone: "danger" | "warning" | "neutral") {
  if (tone === "danger") {
    return "bg-red-100 text-red-700";
  }

  if (tone === "warning") {
    return "bg-signal/60 text-ink";
  }

  return "bg-white/70 text-ink/62";
}
