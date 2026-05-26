"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Megaphone,
  Palette,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
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
import type { SystemTemplate } from "@/lib/templates/types";
import { RemindersCalendarCard } from "@/components/dashboard/reminders-calendar-card";
import { getLeadStageValue, isLeadClosedStage } from "@/lib/leads/stages";
import type { OverdueLeadTaskItem, LeadOwnerOption } from "@/lib/leads/repository.server";
import type { CampaignActivitySummary } from "@/lib/campaigns/types";
import type {
  DashboardConsultantPortfolioSummary,
  DashboardCplSummary,
  DashboardStageConversionSummary
} from "@/lib/reports/commercial-report.server";

const NEW_LEADS_WINDOW_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

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
  whatsappTemplates?: SystemTemplate[];
  leadNoContactSummary?: DashboardLeadNoContactSummary;
  campaignActivitySummary?: CampaignActivitySummary;
  overdueTasks?: OverdueLeadTaskItem[];
  cplSummary?: DashboardCplSummary;
  stageConversionSummary?: DashboardStageConversionSummary;
  consultantPortfolioSummary?: DashboardConsultantPortfolioSummary;
  canManageLeadOwners?: boolean;
  leadOwnerOptions?: LeadOwnerOption[];
};

export type DashboardLeadNoContactSummary = {
  total: number;
  leads: Array<{
    id: string;
    name: string;
    owner: string;
    source: string;
    stage: string;
    createdAtLabel: string;
  }>;
};

export function DashboardHome({
  leads = mockLeads,
  preview = false,
  aiBalance = 0,
  campaignsCount = 0,
  whatsappMessagesCount = 0,
  creativeRequestsCount = 0,
  onboardingState = null,
  dashboardReminders = [],
  whatsappTemplates = [],
  leadNoContactSummary,
  campaignActivitySummary,
  overdueTasks = [],
  cplSummary,
  stageConversionSummary,
  consultantPortfolioSummary,
  canManageLeadOwners = false,
  leadOwnerOptions = []
}: DashboardHomeProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const metrics = preview
    ? getPreviewMetrics()
    : getDashboardMetrics(leads, campaignsCount, aiBalance);
  const campaignSummary = preview
    ? getPreviewCampaignActivitySummary()
    : campaignActivitySummary ?? getFallbackCampaignActivitySummary();
  const noContactSummary = preview
    ? getPreviewNoContactSummary()
    : leadNoContactSummary ?? getFallbackNoContactSummary();
  const dashboardCplSummary = preview
    ? getPreviewDashboardCplSummary()
    : cplSummary ?? getFallbackDashboardCplSummary();
  const dashboardStageConversionSummary = preview
    ? getPreviewStageConversionSummary()
    : stageConversionSummary ?? getFallbackStageConversionSummary();
  const teamConsultantSummary = preview
    ? getPreviewConsultantPortfolioSummary()
    : consultantPortfolioSummary ?? getFallbackConsultantPortfolioSummary();
  const contextItems = [
    {
      label: "Anuncios salvos",
      value: metrics.campaigns,
      note: metrics.campaignsNote
    },
    {
      label: "Saldo de IA",
      value: metrics.aiBalance,
      note: metrics.aiBalanceNote
    },
    ...(dashboardCplSummary.status === "mocked"
      ? [
          {
            label: "CPL inicial",
            value: dashboardCplSummary.value,
            note: dashboardCplSummary.note
          }
        ]
      : [])
  ];
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
        eyebrow={canManageLeadOwners ? "Gestão da Equipe" : "Operacao"}
        title={canManageLeadOwners ? "Painel de Supervisor" : "Dashboard"}
        description={canManageLeadOwners 
          ? "Visão centralizada da carteira da equipe, atrasos operacionais e distribuição de leads." 
          : "Resumo da conta, conexoes ativas, anuncios criados e prioridades para a operacao comercial."}
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
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

      <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${canManageLeadOwners ? '2xl:grid-cols-7' : '2xl:grid-cols-6'}`}>
        <Metric label={canManageLeadOwners ? "Carteira da equipe" : "Leads ativos"} value={metrics.activeLeads} note={metrics.totalNote} tone="blue" />
        <Metric label="Novos leads" value={metrics.newLeads} note={metrics.newLeadsNote} tone="yellow" />
        <Metric
          label="Sem contato"
          value={String(noContactSummary.total)}
          note={
            noContactSummary.total > 0
              ? "pedem primeiro retorno"
              : "todos com contato inicial"
          }
          tone="dark"
        />
        {canManageLeadOwners && (
          <Metric 
            label="Sem responsável" 
            value={metrics.unassignedLeads} 
            note={Number(metrics.unassignedLeads) > 0 ? "aguardando distribuição" : "equipe abastecida"} 
            tone="yellow" 
          />
        )}
        <Metric
          label={canManageLeadOwners ? "Atrasos da equipe" : "Tarefas em atraso"}
          value={String(overdueTasks.length)}
          note={overdueTasks.length > 0 ? "follow-up parado" : "follow-up em dia"}
          tone="yellow"
        />
        <Metric label="Propostas" value={metrics.proposals} note={metrics.proposalsNote} tone="yellow" />
        <Metric label="Vendas" value={metrics.sales} note={metrics.salesNote} tone="teal" />
      </div>

      <section className="surface-card rounded-[30px] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-cobalt">Contexto da conta</p>
            <p className="text-muted-soft mt-1 text-sm leading-6">
              Anuncios, saldo de IA e custo inicial continuam visiveis, mas fora da linha principal
              de prioridades comerciais.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {contextItems.map((item) => (
              <div
                className="surface-pill rounded-full px-4 py-2 text-sm"
                key={item.label}
              >
                <span className="font-semibold text-ink">{item.label}:</span> {item.value}
                <span className="text-muted-soft"> • {item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <KanbanBoard href={funnelHref} leads={leads} onLeadOpen={setSelectedLead} />
          <LeadTable leads={leads} onLeadOpen={setSelectedLead} />
        </div>

        <aside className="min-w-0 flex h-full flex-col gap-4">
          <Link
            className="surface-card flex flex-col justify-between rounded-[34px] p-5 transition"
            href={anunciosHref}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-info/22 text-foreground">
                <ShieldCheck size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Meus Anuncios</h2>
                <p className="text-muted-soft text-sm">
                  {campaignsCount > 0
                    ? `${campaignsCount} anuncios salvos`
                    : "Nenhum anuncio salvo ainda"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {campaignsCount > 0 ? (
                <div className="surface-card-muted rounded-[22px] p-4 text-sm leading-6 text-muted-soft">
                  Veja o historico principal de campanhas geradas e retome qualquer anuncio para revisar ou reaproveitar a ideia.
                </div>
              ) : (
                <div className="surface-card-muted rounded-[22px] p-4 text-sm leading-6 text-muted-soft">
                  A primeira campanha criada em Criações aparece aqui como resumo da conta.
                </div>
              )}
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
                Abrir anuncios
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </div>
          </Link>

          <section className="surface-card rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-soft text-sm">Campanhas ativas</p>
                <h2 className="mt-1 text-xl font-semibold">
                  {campaignSummary.activeCount + campaignSummary.readyCount === 0
                    ? "Nenhuma campanha ativa ou pronta"
                    : `${campaignSummary.activeCount + campaignSummary.readyCount} campanha${campaignSummary.activeCount + campaignSummary.readyCount > 1 ? "s" : ""} ativa${campaignSummary.activeCount + campaignSummary.readyCount > 1 ? "s" : ""} ou pronta${campaignSummary.activeCount + campaignSummary.readyCount > 1 ? "s" : ""}`}
                </h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  {getCampaignActivityHeadline(campaignSummary, campaignsCount)}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lagoon/18 text-lagoon">
                <Megaphone size={19} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {campaignSummary.campaigns.length > 0 ? (
                campaignSummary.campaigns.map((campaign) => (
                  <Link
                    className="surface-card-muted block rounded-[24px] p-4 transition hover:border-cobalt/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/40"
                    href={anunciosHref}
                    key={campaign.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink line-clamp-1">{campaign.campaignName}</p>
                        <p className="text-muted-soft mt-1 text-sm leading-6">
                          {getCampaignPublicationStatusLabel(campaign.publicationStatus)} •{" "}
                          {getCampaignPublishModeLabel(campaign.publishMode)}
                        </p>
                      </div>
                      <span className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
                        {campaign.publicationStatus === "published" ? "Ativa" : "Pronta"}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                  {getCampaignActivityEmptyState(campaignSummary, campaignsCount)}
                </div>
              )}

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
                Acompanhe publicacao, revisao e retomada na area de anuncios
              </span>
            </div>
          </section>

          <RemindersCalendarCard initialReminders={dashboardReminders} />

          <section className="surface-card rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-soft text-sm">Funil comercial</p>
                <h2 className="mt-1 text-xl font-semibold">Conversao por etapa</h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  {dashboardStageConversionSummary.note}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <ArrowUpRight size={19} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {dashboardStageConversionSummary.status === "available" ? (
                dashboardStageConversionSummary.rows.map((row) => (
                  <div className="surface-card-muted rounded-[24px] p-4" key={row.stageValue}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{row.label}</p>
                        <p className="text-muted-soft mt-1 text-sm leading-6">
                          {row.count} lead{row.count === 1 ? "" : "s"} na etapa atual
                        </p>
                      </div>
                      <span className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
                        {formatStageShare(row.percentage)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/90">
                      <div
                        aria-hidden="true"
                        className={`h-full rounded-full ${getStageToneClass(row.tone)}`}
                        style={{ width: `${row.percentage * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                  Nenhum lead com etapa valida foi encontrado para montar a leitura do funil.
                </div>
              )}

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
                Leitura baseada na etapa atual de cada lead visivel no dashboard
              </span>
            </div>
          </section>

          {canManageLeadOwners && (
            <section className="surface-card rounded-[34px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-soft text-sm">Carteira por consultor</p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {teamConsultantSummary.status === "available"
                      ? `${teamConsultantSummary.totalConsultants} consultor${teamConsultantSummary.totalConsultants === 1 ? "" : "es"} com carteira visivel`
                      : "Nenhuma carteira distribuida no momento"}
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    {teamConsultantSummary.note}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <UsersRound size={19} aria-hidden="true" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {teamConsultantSummary.status === "available" ? (
                  teamConsultantSummary.rows.map((row) => (
                    <div className="surface-card-muted rounded-[24px] p-4" key={row.ownerProfileId ?? row.ownerName}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{row.ownerName}</p>
                          <p className="text-muted-soft mt-1 text-sm leading-6">
                            {getConsultantRoleLabel(row.role)} • {row.leadCount} lead{row.leadCount === 1 ? "" : "s"} na carteira
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                            row.overdueCount > 0
                          ? "bg-signal/14 text-foreground"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"
                          }`}
                        >
                          {row.overdueCount} atraso{row.overdueCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                    Assim que houver leads distribuidos para a equipe, a leitura por consultor aparece aqui.
                  </div>
                )}
              </div>
            </section>
          )}

          {overdueTasks.length > 0 && (
            <section className="surface-card rounded-[34px] border border-signal/22 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-soft text-sm">Tarefas pendentes</p>
                  <h2 className="mt-1 text-xl font-semibold text-signal">
                    {overdueTasks.length} tarefa{overdueTasks.length > 1 ? "s" : ""} em atraso
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    Atrasos operacionais no relacionamento com os leads.
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal/10 text-signal">
                  <AlertCircle size={19} aria-hidden="true" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {overdueTasks.slice(0, 3).map((task) => (
                  <button
                    className="surface-card-muted w-full rounded-[24px] p-4 text-left transition hover:border-signal/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal/40"
                    key={task.id}
                    onClick={() => {
                      const matchingLead = leads.find((lead) => lead.id === task.leadId) ?? null;
                      if (matchingLead) {
                        setSelectedLead(matchingLead);
                      }
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink line-clamp-1">{task.title}</p>
                        <p className="text-muted-soft mt-1 text-sm leading-6 line-clamp-1">
                          {task.leadName} • {task.leadStage}
                        </p>
                      </div>
                      <span className="rounded-full bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal whitespace-nowrap">
                        {new Date(task.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </button>
                ))}

                {overdueTasks.length > 3 && (
                  <div className="mt-2 text-center text-sm font-semibold text-warning">
                    + {overdueTasks.length - 3} tarefas vencidas
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="surface-card rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-soft text-sm">Sem primeiro contato</p>
                <h2 className="mt-1 text-xl font-semibold">
                  {noContactSummary.total === 0
                    ? "Nenhum lead aguardando abordagem"
                    : `${noContactSummary.total} lead${noContactSummary.total > 1 ? "s" : ""} aguardando abordagem`}
                </h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  Regra inicial: lead sem registro manual de contato no histórico comercial.
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal/30 text-ink dark:text-cloud">
                <PhoneOff size={19} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {noContactSummary.leads.length > 0 ? (
                noContactSummary.leads.map((leadSummary) => (
                  <button
                    className="surface-card-muted w-full rounded-[24px] p-4 text-left transition hover:border-cobalt/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/40"
                    key={leadSummary.id}
                    onClick={() => {
                      const matchingLead = leads.find((lead) => lead.id === leadSummary.id) ?? null;
                      setSelectedLead(matchingLead);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{leadSummary.name}</p>
                        <p className="text-muted-soft mt-1 text-sm leading-6">
                          {leadSummary.owner} • {leadSummary.source}
                        </p>
                      </div>
                      <span className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold">
                        {leadSummary.createdAtLabel}
                      </span>
                    </div>
                    <p className="text-muted-soft mt-3 text-sm">{leadSummary.stage}</p>
                  </button>
                ))
              ) : (
                <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                  Todos os leads visiveis no dashboard ja contam com ao menos um contato registrado.
                </div>
              )}

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
                Priorize os mais recentes para acelerar o primeiro retorno
              </span>
            </div>
          </section>

          <section className="surface-card rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-soft text-sm">Gerar Campanha</p>
                <h2 className="mt-1 text-xl font-semibold">Criar nova campanha</h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  Monte a campanha com publico, oferta e briefing criativo no fluxo principal de Criações.
                </p>
              </div>
              <span className="surface-pill flex h-11 w-11 items-center justify-center rounded-full text-cobalt">
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
            className="surface-card flex flex-col justify-between rounded-[34px] p-5 transition"
            href={creativeRequestHref}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-soft text-sm">Solicitar Criativo</p>
                <h2 className="mt-1 text-xl font-semibold">Abrir novo briefing</h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  Envie um pedido de design para campanhas e entre direto no formulario de solicitacao.
                </p>
              </div>
              <span className="surface-pill flex h-11 w-11 items-center justify-center rounded-full text-cobalt">
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

      <LeadDetailsPopup
        aiBalance={aiBalance}
        canManageLeadOwners={canManageLeadOwners}
        lead={selectedLead}
        leadOwnerOptions={leadOwnerOptions}
        messageGeneratorEnabled
        onClose={() => setSelectedLead(null)}
        whatsappTemplates={whatsappTemplates}
      />
    </div>
  );
}

export function getDashboardMetrics(
  leads: Lead[],
  campaignsCount: number,
  aiBalance: number,
  referenceDate = new Date()
) {
  const activeLeads = leads.filter((lead) => !isLeadClosedStage(lead.stage)).length;
  const proposals = leads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const sales = leads.filter((lead) => getLeadStageValue(lead.stage) === "won").length;
  const recentLeads = leads.filter((lead) => isLeadRecent(lead.receivedAt, referenceDate));
  const recentLeadsStillNew = recentLeads.filter((lead) => getLeadStageValue(lead.stage) === "new").length;
  const unassignedLeads = leads.filter((lead) => !lead.ownerProfileId).length;

  return {
    activeLeads: String(activeLeads),
    newLeads: String(recentLeads.length),
    proposals: String(proposals),
    sales: String(sales),
    campaigns: String(campaignsCount),
    unassignedLeads: String(unassignedLeads),
    totalNote: `${leads.length} leads no CRM`,
    newLeadsNote:
      recentLeads.length > 0
        ? `ultimos ${NEW_LEADS_WINDOW_DAYS} dias • ${recentLeadsStillNew} ainda em Novo lead`
        : `sem entradas nos ultimos ${NEW_LEADS_WINDOW_DAYS} dias`,
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
    newLeads: "14",
    proposals: "31",
    sales: "12",
    campaigns: "9",
    unassignedLeads: "2",
    aiBalance: "48",
    totalNote: "+18% no mes",
    newLeadsNote: "ultimos 7 dias • 8 ainda em Novo lead",
    proposalsNote: "+6 hoje",
    salesNote: "R$ 84k pipeline",
    campaignsNote: "anuncios ativos",
    aiBalanceNote: "saldo demo de IA"
  };
}

function getPreviewCampaignActivitySummary(): CampaignActivitySummary {
  return {
    activeCount: 3,
    readyCount: 2,
    pausedCount: 1,
    campaigns: [
      {
        id: "preview-campaign-1",
        campaignName: "Plano PME Campinas",
        publicationStatus: "published",
        publishMode: "scheduled"
      },
      {
        id: "preview-campaign-2",
        campaignName: "Troca de Operadora Interior",
        publicationStatus: "pending_review",
        publishMode: "manual_review"
      },
      {
        id: "preview-campaign-3",
        campaignName: "Lead Form Empresarial",
        publicationStatus: "draft_created",
        publishMode: "draft"
      }
    ],
    mode: "supabase"
  };
}

function getPreviewNoContactSummary(): DashboardLeadNoContactSummary {
  return {
    total: 5,
    leads: [
      {
        id: "preview-1",
        name: "Clinica Aurora",
        owner: "Gabriel",
        source: "Meta Lead Form",
        stage: "Novo lead",
        createdAtLabel: "Hoje"
      },
      {
        id: "preview-2",
        name: "Grupo Vale Verde",
        owner: "Beatriz",
        source: "CSV importado",
        stage: "Novo lead",
        createdAtLabel: "Ontem"
      }
    ]
  };
}

function getFallbackNoContactSummary(): DashboardLeadNoContactSummary {
  return {
    total: 0,
    leads: []
  };
}

function getPreviewDashboardCplSummary(): DashboardCplSummary {
  return {
    value: "~R$ 18,40",
    note: "demo controlada • sem custo real",
    status: "mocked"
  };
}

function getPreviewStageConversionSummary(): DashboardStageConversionSummary {
  return {
    total: 24,
    note: "Percentual da base atual em cada etapa oficial do funil.",
    rows: [
      { stageValue: "new", label: "Novo lead", tone: "cobalt", count: 8, percentage: 8 / 24 },
      { stageValue: "qualification", label: "Qualificação", tone: "lagoon", count: 5, percentage: 5 / 24 },
      { stageValue: "proposal", label: "Proposta", tone: "signal", count: 4, percentage: 4 / 24 },
      { stageValue: "negotiation", label: "Negociação", tone: "ink", count: 3, percentage: 3 / 24 },
      { stageValue: "won", label: "Venda", tone: "emerald", count: 2, percentage: 2 / 24 },
      { stageValue: "lost", label: "Perdido", tone: "red", count: 2, percentage: 2 / 24 }
    ],
    status: "available"
  };
}

function getPreviewConsultantPortfolioSummary(): DashboardConsultantPortfolioSummary {
  return {
    totalConsultants: 3,
    totalLeads: 24,
    totalOverdue: 5,
    note: "Carteira atual e tarefas em atraso agregadas por consultor visivel no CRM.",
    rows: [
      {
        ownerProfileId: "preview-gabriel",
        ownerName: "Gabriel",
        role: "owner",
        leadCount: 9,
        overdueCount: 2
      },
      {
        ownerProfileId: "preview-beatriz",
        ownerName: "Beatriz",
        role: "admin",
        leadCount: 8,
        overdueCount: 2
      },
      {
        ownerProfileId: "preview-fernanda",
        ownerName: "Fernanda",
        role: "seller",
        leadCount: 7,
        overdueCount: 1
      }
    ],
    status: "available"
  };
}

function getFallbackDashboardCplSummary(): DashboardCplSummary {
  return {
    value: "N/D",
    note: "custo inicial indisponivel",
    status: "unavailable"
  };
}

function getFallbackStageConversionSummary(): DashboardStageConversionSummary {
  return {
    total: 0,
    note: "Sem leads visiveis para calcular a distribuicao atual do funil.",
    rows: [],
    status: "empty"
  };
}

function getFallbackConsultantPortfolioSummary(): DashboardConsultantPortfolioSummary {
  return {
    totalConsultants: 0,
    totalLeads: 0,
    totalOverdue: 0,
    note: "Nenhuma carteira visivel foi encontrada para distribuir a leitura por consultor.",
    rows: [],
    status: "empty"
  };
}

function getFallbackCampaignActivitySummary(): CampaignActivitySummary {
  return {
    activeCount: 0,
    readyCount: 0,
    pausedCount: 0,
    campaigns: [],
    mode: "error"
  };
}

function getCampaignActivityHeadline(
  campaignSummary: CampaignActivitySummary,
  campaignsCount: number
) {
  if (campaignSummary.mode === "error" && campaignSummary.message) {
    return campaignSummary.message;
  }

  if (campaignSummary.activeCount + campaignSummary.readyCount > 0) {
    return `${campaignSummary.activeCount} publicada${campaignSummary.activeCount === 1 ? "" : "s"} • ${campaignSummary.readyCount} pronta${campaignSummary.readyCount === 1 ? "" : "s"} para proxima acao`;
  }

  if (campaignSummary.pausedCount > 0) {
    return `${campaignSummary.pausedCount} campanha${campaignSummary.pausedCount > 1 ? "s" : ""} pausada${campaignSummary.pausedCount > 1 ? "s" : ""} aguardando retomada.`;
  }

  if (campaignsCount > 0) {
    return "Voce ja tem campanhas salvas, mas nenhuma esta publicada ou pronta no momento.";
  }

  return "Quando houver campanhas prontas ou publicadas, elas aparecem aqui para a operacao.";
}

function getCampaignActivityEmptyState(
  campaignSummary: CampaignActivitySummary,
  campaignsCount: number
) {
  if (campaignSummary.mode === "error" && campaignSummary.message) {
    return campaignSummary.message;
  }

  if (campaignSummary.pausedCount > 0) {
    return "As campanhas pausadas seguem fora da operacao ate serem retomadas na area de anuncios.";
  }

  if (campaignsCount > 0) {
    return "As campanhas salvas ainda precisam avancar para revisao, preparo ou publicacao para entrar neste indicador.";
  }

  return "Crie a primeira campanha em Criações para começar a acompanhar o status operacional por aqui.";
}

function getCampaignPublicationStatusLabel(publicationStatus: CampaignActivitySummary["campaigns"][number]["publicationStatus"]) {
  switch (publicationStatus) {
    case "published":
      return "Publicada";
    case "pending_review":
      return "Aguardando revisao";
    case "draft_created":
      return "Rascunho criado";
    case "ready_to_prepare":
      return "Pronta para preparar";
    case "paused":
      return "Pausada";
    case "failed":
      return "Falhou";
    case "not_connected":
      return "Sem conexao";
    default:
      return "Em preparacao";
  }
}

function getCampaignPublishModeLabel(publishMode: CampaignActivitySummary["campaigns"][number]["publishMode"]) {
  switch (publishMode) {
    case "draft":
      return "Rascunho";
    case "manual_review":
      return "Revisao manual";
    case "scheduled":
      return "Agendada";
    case "paused":
      return "Pausada";
    default:
      return "Operacional";
  }
}

function formatStageShare(percentage: number) {
  return percentage.toLocaleString("pt-BR", {
    style: "percent",
    maximumFractionDigits: percentage > 0 && percentage < 0.1 ? 1 : 0
  });
}

function getStageToneClass(tone: DashboardStageConversionSummary["rows"][number]["tone"]) {
  switch (tone) {
    case "lagoon":
      return "bg-lagoon";
    case "signal":
      return "bg-signal";
    case "ink":
      return "bg-ink";
    case "emerald":
      return "bg-emerald-600";
    case "red":
      return "bg-red-500";
    default:
      return "bg-cobalt";
  }
}

function getConsultantRoleLabel(role: DashboardConsultantPortfolioSummary["rows"][number]["role"]) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "seller":
      return "Consultor";
    default:
      return "Sem responsável";
  }
}

function isLeadRecent(receivedAt: Lead["receivedAt"], referenceDate: Date) {
  if (!receivedAt) {
    return false;
  }

  const receivedAtMs = Date.parse(receivedAt);
  const referenceMs = referenceDate.getTime();

  if (!Number.isFinite(receivedAtMs)) {
    return false;
  }

  const ageInMs = referenceMs - receivedAtMs;

  return ageInMs >= 0 && ageInMs <= NEW_LEADS_WINDOW_DAYS * DAY_IN_MS;
}
