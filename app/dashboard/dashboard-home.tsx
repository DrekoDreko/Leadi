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
import { leads as mockLeads, scheduledTasks, type Lead } from "@/data/mock";
import {
  ComplianceChecklist,
  KanbanBoard,
  LeadTable,
  Metric,
  PageHeading,
  SuggestedCampaignPanel
} from "@/components/dashboard/widgets";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";

type DashboardHomeProps = {
  leads?: Lead[];
  preview?: boolean;
  showCreateTeamCard: boolean;
  creditBalance?: number;
};

export function DashboardHome({
  leads = mockLeads,
  preview = false,
  showCreateTeamCard,
  creditBalance = 0
}: DashboardHomeProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const metrics = preview ? getPreviewMetrics() : getDashboardMetrics(leads, creditBalance);
  const nextLead = leads[0];
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
                Seu workspace atual e individual. A estrutura para convidar vendedores
                esta preparada e a ativacao ficara disponivel em breve.
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Agenda da equipe</h2>
              <CalendarDays size={20} aria-hidden="true" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scheduledTasks.map((task) => (
                <div className="rounded-[22px] bg-white/44 p-3" key={task.day}>
                  <span className="text-sm text-ink/54">Abr</span>
                  <p className="text-2xl font-semibold">{task.day}</p>
                  <p className="mt-3 text-xs leading-snug text-ink/62">{task.label}</p>
                </div>
              ))}
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
