"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { leads as mockLeads, type Lead } from "@/data/mock";
import {
  KanbanBoard,
  LeadTable,
  Metric,
  PageHeading
} from "@/components/dashboard/widgets";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { dismissOnboardingChecklist, toggleOnboardingStep } from "./onboarding-actions";
import type { OnboardingState } from "@/lib/onboarding/types";
import type { DashboardReminderItem } from "@/lib/dashboard-reminders/types";
import { RemindersCalendarCard } from "@/components/dashboard/reminders-calendar-card";

type DashboardHomeProps = {
  leads?: Lead[];
  preview?: boolean;
  showCreateTeamCard?: boolean;
  aiBalance?: number;
  creditBalance?: number;
  campaignsCount?: number;
  whatsappMessagesCount?: number;
  creativeRequestsCount?: number;
  onboardingState?: OnboardingState | null;
  dashboardReminders?: DashboardReminderItem[];
};

export function DashboardHome({
  leads = mockLeads,
  preview = false,
  aiBalance = 0,
  campaignsCount = 0,
  whatsappMessagesCount = 0,
  creativeRequestsCount = 0,
  onboardingState = null,
  dashboardReminders = []
}: DashboardHomeProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const metrics = preview
    ? getPreviewMetrics()
    : getDashboardMetrics(leads, campaignsCount, aiBalance);
  const relatoriosHref = preview ? "/login" : "/dashboard/relatorios";
  const campaignHref = preview ? "/login" : "/dashboard/criacoes/campanhas";
  const funnelHref = preview ? "/login" : "/dashboard/funil";
  const anunciosHref = preview ? "/login" : "/dashboard/anuncios";
  const creativeRequestHref = preview ? "/login" : "/dashboard/criacoes/validador?compose=1";

  const onboardingSteps = [
    {
      id: "create-lead",
      title: "Crie seu primeiro lead",
      description: "Cadastre manualmente ou importe um lead para começar a gerenciar sua carteira.",
      href: "/dashboard/leads",
      isCompleted: leads.length > 0 || onboardingState?.completedSteps.includes("create-lead") || false
    },
    {
      id: "generate-campaign",
      title: "Gere uma campanha",
      description: "Use nossa IA para criar textos de anúncios focados em alta conversão.",
      href: "/dashboard/criacoes/campanhas",
      isCompleted: campaignsCount > 0 || onboardingState?.completedSteps.includes("generate-campaign") || false
    },
    {
      id: "copy-message",
      title: "Mensagem copiada",
      description: "Gere e copie uma mensagem personalizada para abordar seus novos leads.",
      href: "/dashboard/criacoes/whatsapp",
      isCompleted: whatsappMessagesCount > 0 || onboardingState?.completedSteps.includes("copy-message") || false
    },
    {
      id: "send-order",
      title: "Pedido enviado",
      description: "Solicite um criativo profissional (imagem ou vídeo) para suas campanhas.",
      href: "/dashboard/criacoes/pedidos",
      isCompleted: creativeRequestsCount > 0 || onboardingState?.completedSteps.includes("send-order") || false
    }
  ];

  const showOnboarding = onboardingState && !onboardingState.dismissedAt && !preview;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Operacao"
        title="Dashboard"
        description="Resumo da conta, conexoes ativas, anuncios criados e prioridades para a operacao comercial."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href={relatoriosHref}
        >
          {preview ? "Entrar" : "Relatorios"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      {showOnboarding && (
        <OnboardingChecklist
          steps={onboardingSteps}
          onDismiss={dismissOnboardingChecklist}
          onToggleStep={(stepId, completed) => 
            toggleOnboardingStep(stepId, completed, onboardingState?.completedSteps || [])
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Leads ativos" value={metrics.activeLeads} note={metrics.totalNote} tone="blue" />
        <Metric label="Propostas" value={metrics.proposals} note={metrics.proposalsNote} tone="yellow" />
        <Metric label="Vendas" value={metrics.sales} note={metrics.salesNote} tone="teal" />
        <Metric label="Anuncios" value={metrics.campaigns} note={metrics.campaignsNote} tone="dark" />
        <Metric label="Saldo de IA" value={metrics.aiBalance} note={metrics.aiBalanceNote} tone="blue" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <KanbanBoard href={funnelHref} leads={leads} onLeadOpen={setSelectedLead} />
          <LeadTable leads={leads} onLeadOpen={setSelectedLead} />
        </div>

        <aside className="min-w-0 flex h-full flex-col gap-4">
          <Link
            className="glass flex flex-col justify-between rounded-[34px] p-5 transition hover:bg-white/68"
            href={anunciosHref}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lagoon text-white">
                <ShieldCheck size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Meus Anuncios</h2>
                <p className="text-sm text-ink/54">
                  {campaignsCount > 0
                    ? `${campaignsCount} anuncios salvos`
                    : "Nenhum anuncio salvo ainda"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {campaignsCount > 0 ? (
                <div className="rounded-[22px] bg-white/44 p-4 text-sm leading-6 text-ink/62">
                  Veja o historico principal de campanhas geradas e retome qualquer anuncio para revisar ou reaproveitar a ideia.
                </div>
              ) : (
                <div className="rounded-[22px] bg-white/44 p-4 text-sm leading-6 text-ink/62">
                  A primeira campanha criada em Criações aparece aqui como resumo da conta.
                </div>
              )}
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
                Abrir anuncios
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </div>
          </Link>

          <RemindersCalendarCard initialReminders={dashboardReminders} />

          <section className="glass rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink/54">Gerar Campanha</p>
                <h2 className="mt-1 text-xl font-semibold">Criar nova campanha</h2>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Monte a campanha com publico, oferta e briefing criativo no fluxo principal de Criações.
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/62 text-cobalt">
                <Sparkles size={19} aria-hidden="true" />
              </span>
            </div>

            <Link
              aria-label="Abrir IA Gerador de Campanha"
              className="group relative isolate mt-5 flex items-center gap-4 overflow-hidden rounded-[28px] border border-white/24 bg-[linear-gradient(135deg,#2246e0_0%,#3462EE_58%,#4A91A8_100%)] px-5 py-4 text-left text-white shadow-[0_22px_60px_rgba(52,98,238,0.34)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_72px_rgba(52,98,238,0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/40"
              href={campaignHref}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_50%,rgba(255,255,255,0.28),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_36%)]"
              />
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/24">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <span className="relative flex min-w-0 flex-1 flex-col">
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
          </section>

          <Link
            className="glass flex flex-col justify-between rounded-[34px] p-5 transition hover:bg-white/68"
            href={creativeRequestHref}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink/54">Solicitar Criativo</p>
                <h2 className="mt-1 text-xl font-semibold">Abrir novo briefing</h2>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Envie um pedido de design para campanhas e entre direto no formulario de solicitacao.
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/62 text-cobalt">
                <Palette size={19} aria-hidden="true" />
              </span>
            </div>

            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
              Solicitar criativo
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </Link>
        </aside>
      </section>

      <LeadDetailsPopup aiBalance={aiBalance} lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}

function getDashboardMetrics(
  leads: Lead[],
  campaignsCount: number,
  aiBalance: number
) {
  const activeLeads = leads.filter((lead) => !["Venda", "Perdido"].includes(lead.stage)).length;
  const proposals = leads.filter((lead) => lead.stage === "Proposta").length;
  const sales = leads.filter((lead) => lead.stage === "Venda").length;

  return {
    activeLeads: String(activeLeads),
    proposals: String(proposals),
    sales: String(sales),
    campaigns: String(campaignsCount),
    totalNote: `${leads.length} leads no CRM`,
    proposalsNote: `${proposals} em proposta`,
    salesNote: `${sales} vendas`,
    campaignsNote: campaignsCount > 0 ? "historico ativo" : "sem criacoes ainda",
    aiBalance: String(aiBalance),
    aiBalanceNote:
      aiBalance > 0
        ? `${aiBalance.toLocaleString("pt-BR")} créditos de IA disponíveis`
        : "seu saldo de IA acabou"
  };
}

function getPreviewMetrics() {
  return {
    activeLeads: "128",
    proposals: "31",
    sales: "12",
    campaigns: "9",
    aiBalance: "48",
    totalNote: "+18% no mes",
    proposalsNote: "+6 hoje",
    salesNote: "R$ 84k pipeline",
    campaignsNote: "anuncios ativos",
    aiBalanceNote: "saldo demo de IA"
  };
}
