"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { leads as mockLeads, type Lead } from "@/data/mock";
import {
  KanbanBoard,
  LeadTable,
  Metric,
  PageHeading,
  SuggestedCampaignPanel
} from "@/components/dashboard/widgets";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { DashboardRemindersCalendar } from "@/components/dashboard/dashboard-reminders-calendar";
import { buildAgendaEntries, type AgendaEntry } from "@/lib/leads/agenda";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { dismissOnboardingChecklist, toggleOnboardingStep } from "./onboarding-actions";
import type { OnboardingState } from "@/lib/onboarding/types";

type DashboardHomeProps = {
  leads?: Lead[];
  preview?: boolean;
  showCreateTeamCard?: boolean;
  creditBalance?: number;
  agendaEntries?: AgendaEntry[];
  campaignsCount?: number;
  hasMetaConnection?: boolean;
  hasOpenAIConnection?: boolean;
  whatsappMessagesCount?: number;
  creativeRequestsCount?: number;
  onboardingState?: OnboardingState | null;
};

export function DashboardHome({
  leads = mockLeads,
  preview = false,
  campaignsCount = 0,
  hasMetaConnection = false,
  hasOpenAIConnection = false,
  whatsappMessagesCount = 0,
  creativeRequestsCount = 0,
  onboardingState = null
}: DashboardHomeProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const metrics = preview
    ? getPreviewMetrics()
    : getDashboardMetrics(leads, campaignsCount, hasMetaConnection, hasOpenAIConnection);
  const relatoriosHref = preview ? "/login" : "/dashboard/relatorios";
  const campaignHref = preview ? "/login" : "/dashboard/criacoes/campanhas";
  const funnelHref = preview ? "/login" : "/dashboard/funil";
  const anunciosHref = preview ? "/login" : "/dashboard/anuncios";
  const agendaCards = buildAgendaEntries(leads);

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
        <Metric label="Conexoes" value={metrics.connections} note={metrics.connectionsNote} tone="blue" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
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

          <DashboardRemindersCalendar />

          <div className="rounded-[24px] bg-white/44 p-4 text-sm leading-6 text-ink/60">
            {agendaCards.length > 0
              ? `${agendaCards.length} compromissos comerciais seguem visiveis no CRM e no funil.`
              : "Os follow-ups dos leads continuam sendo controlados dentro do CRM e do funil."}
          </div>
        </aside>
      </section>

      <SuggestedCampaignPanel href={campaignHref} />

      <LeadDetailsPopup lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}

function getDashboardMetrics(
  leads: Lead[],
  campaignsCount: number,
  hasMetaConnection: boolean,
  hasOpenAIConnection: boolean
) {
  const activeLeads = leads.filter((lead) => !["Venda", "Perdido"].includes(lead.stage)).length;
  const proposals = leads.filter((lead) => lead.stage === "Proposta").length;
  const sales = leads.filter((lead) => lead.stage === "Venda").length;
  const connections = Number(hasMetaConnection) + Number(hasOpenAIConnection);

  return {
    activeLeads: String(activeLeads),
    proposals: String(proposals),
    sales: String(sales),
    campaigns: String(campaignsCount),
    connections: String(connections),
    totalNote: `${leads.length} leads no CRM`,
    proposalsNote: `${proposals} em proposta`,
    salesNote: `${sales} vendas`,
    campaignsNote: campaignsCount > 0 ? "historico ativo" : "sem criacoes ainda",
    connectionsNote:
      connections === 2
        ? "Meta e OpenAI conectadas"
        : connections === 1
          ? "1 conta conectada"
          : "conecte suas contas"
  };
}

function getPreviewMetrics() {
  return {
    activeLeads: "128",
    proposals: "31",
    sales: "12",
    campaigns: "9",
    connections: "2",
    totalNote: "+18% no mes",
    proposalsNote: "+6 hoje",
    salesNote: "R$ 84k pipeline",
    campaignsNote: "anuncios ativos",
    connectionsNote: "demo conectado"
  };
}
