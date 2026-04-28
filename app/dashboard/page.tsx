"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck
} from "lucide-react";
import { leads, scheduledTasks, type Lead } from "@/data/mock";
import {
  ComplianceChecklist,
  KanbanBoard,
  LeadTable,
  Metric,
  PageHeading,
  SuggestedCampaignPanel
} from "@/components/dashboard/widgets";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";

export default function DashboardPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Operação"
        title="Dashboard"
        description="Resumo da captação, funil comercial, campanhas e controles ativos da operação."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard/relatorios"
        >
          Relatórios
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Leads ativos" value="128" note="+18% no mês" tone="blue" />
        <Metric label="Propostas" value="31" note="+6 hoje" tone="yellow" />
        <Metric label="Vendas" value="12" note="R$ 84k pipeline" tone="teal" />
        <Metric label="Pedidos" value="9" note="3 em produção" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <KanbanBoard onLeadOpen={setSelectedLead} />
          <LeadTable onLeadOpen={setSelectedLead} />
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
            <h3 className="text-2xl font-semibold">{leads[0].name}</h3>
            <p className="mt-1 text-sm text-ink/58">{leads[0].phone}</p>
            <p className="mt-1 text-sm text-ink/58">{leads[0].email}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/54 px-3 py-1.5 text-xs font-semibold">
                <CheckCircle2 size={15} aria-hidden="true" />
                {leads[0].score}% fit
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/54 px-3 py-1.5 text-xs font-semibold">
                <MessageCircle size={15} aria-hidden="true" />
                {leads[0].nextContact}
              </span>
            </div>
          </section>
        </aside>
      </section>

      <SuggestedCampaignPanel />

      <LeadDetailsPopup lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
