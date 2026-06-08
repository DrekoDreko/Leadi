"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Clock,
  Megaphone,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  UsersRound
} from "lucide-react";
import {
  Metric,
  PageHeading
} from "@/components/dashboard/widgets";
import type { Lead } from "@/data/mock";
import type { OnboardingState } from "@/lib/onboarding/types";
import type { DashboardReminderItem } from "@/lib/dashboard-reminders/types";
import type { SystemTemplate } from "@/lib/templates/types";
import type { OverdueLeadTaskItem, LeadOwnerOption } from "@/lib/leads/repository.server";
import type { CampaignActivitySummary } from "@/lib/campaigns/types";
import type {
  DashboardConsultantPortfolioSummary,
  DashboardStageConversionSummary
} from "@/lib/reports/commercial-report.server";
import { isLeadClosedStage, getLeadStageValue } from "@/lib/leads/stages";
import { RemindersCalendarCard } from "@/components/dashboard/reminders-calendar-card";

const STALE_LEAD_DAYS = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type SupervisorDashboardProps = {
  preview?: boolean;
  aiBalance?: number;
  campaignsCount?: number;
  leads?: Lead[];
  onboardingState?: OnboardingState | null;
  dashboardReminders?: DashboardReminderItem[];
  whatsappTemplates?: SystemTemplate[];
  campaignActivitySummary?: CampaignActivitySummary;
  overdueTasks?: OverdueLeadTaskItem[];
  consultantPortfolioSummary?: DashboardConsultantPortfolioSummary;
  stageConversionSummary?: DashboardStageConversionSummary;
  leadOwnerOptions?: LeadOwnerOption[];
  pendingCampaignsCount?: number;
  pendingCreditRequestsCount?: number;
  unassignedLeadCount?: number;
  teamName?: string;
};

export function SupervisorDashboard({
  preview = false,
  aiBalance = 0,
  leads = [],
  dashboardReminders = [],
  consultantPortfolioSummary,
  stageConversionSummary,
  overdueTasks = [],
  pendingCampaignsCount = 0,
  pendingCreditRequestsCount = 0,
  unassignedLeadCount = 0,
  teamName = "Sua Equipe"
}: SupervisorDashboardProps) {
  const relatoriosHref = preview ? "/login" : "/dashboard/relatorios";
  const leadsHref = preview ? "/login" : "/dashboard/leads";
  const funnelHref = preview ? "/login" : "/dashboard/funil";

  const activeLeads = leads.filter((lead) => !isLeadClosedStage(lead.stage)).length;
  const proposals = leads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const negotiations = leads.filter((lead) => getLeadStageValue(lead.stage) === "negotiation").length;
  const sales = leads.filter((lead) => getLeadStageValue(lead.stage) === "won").length;
  const lost = leads.filter((lead) => getLeadStageValue(lead.stage) === "lost").length;

  const consultantsCount = consultantPortfolioSummary?.status === "available"
    ? consultantPortfolioSummary.totalConsultants
    : 0;

  const staleNewLeads = leads.filter((lead) => {
    if (getLeadStageValue(lead.stage) !== "new") return false;
    const receivedAt = lead.receivedAt ? new Date(lead.receivedAt) : null;
    if (!receivedAt || !Number.isFinite(receivedAt.getTime())) return false;
    return (Date.now() - receivedAt.getTime()) > STALE_LEAD_DAYS * DAY_IN_MS;
  });

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={`Gestão da Equipe • ${teamName}`}
        title="Painel do Supervisor"
        description="Acompanhe o desempenho da equipe, distribua leads e gerencie aprovações."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
          href={relatoriosHref}
        >
          {preview ? "Entrar" : "Relatórios Completos"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Metric
          label="Leads da Equipe"
          value={String(activeLeads)}
          note="em atendimento"
          tone="blue"
        />
        <Metric
          label="Sem responsável"
          value={String(unassignedLeadCount)}
          note={unassignedLeadCount > 0 ? "aguardando distribuição" : "equipe abastecida"}
          tone="yellow"
        />
        <Metric
          label="Em Negociação"
          value={String(negotiations)}
          note={`${proposals} em proposta`}
          tone="dark"
        />
        <Metric
          label="Vendas"
          value={String(sales)}
          note="negócios fechados"
          tone="teal"
        />
        <Metric
          label="Perdidos"
          value={String(lost)}
          note={lost > 0 ? "leads encerrados" : "nenhum perdido"}
          tone="yellow"
        />
        <Metric
          label="Consultores"
          value={String(consultantsCount)}
          note="operando ativamente"
          tone="dark"
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="min-w-0 flex flex-col gap-4">

          {/* Card de distribuição */}
          {unassignedLeadCount > 0 ? (
            <Link
              className="group flex items-center gap-5 rounded-[36px] surface-card px-6 py-6 text-left shadow-[0_0_0_1.5px_rgba(52,98,238,0.25),0_4px_20px_rgba(52,98,238,0.12)] transition duration-200 hover:shadow-[0_0_0_1.5px_rgba(52,98,238,0.35),0_6px_28px_rgba(52,98,238,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/40"
              href={`${leadsHref}?view=unassigned`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/12 text-cobalt">
                <UsersRound size={22} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-2xl font-bold leading-tight text-cobalt">{unassignedLeadCount}</span>
                <span className="text-sm font-semibold leading-tight text-foreground">
                  lead{unassignedLeadCount === 1 ? "" : "s"} aguardando distribuição
                </span>
                <span className="mt-1 text-xs leading-5 text-muted-soft">
                  Clique para distribuir entre os consultores da equipe.
                </span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt transition duration-200 group-hover:bg-cobalt/20">
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <div className="surface-card rounded-[36px] p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-muted-soft text-sm">Distribuição de Leads</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Equipe abastecida
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    Todos os leads da organização possuem um consultor responsável.
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <UsersRound size={20} aria-hidden="true" />
                </span>
              </div>
            </div>
          )}

          {/* Alerta de leads parados */}
          {staleNewLeads.length > 0 && (
            <section className="surface-card rounded-[34px] border border-signal/22 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-soft text-sm">Leads parados</p>
                  <h2 className="mt-1 text-xl font-semibold text-signal">
                    {staleNewLeads.length} lead{staleNewLeads.length > 1 ? "s" : ""} novo{staleNewLeads.length > 1 ? "s" : ""} sem movimentação
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    Leads em &quot;Novo&quot; há mais de {STALE_LEAD_DAYS} dias sem avançar no funil.
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
                  <Clock size={19} aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {staleNewLeads.slice(0, 4).map((lead) => (
                  <div className="surface-card-muted rounded-[24px] p-4" key={lead.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink line-clamp-1">{lead.name}</p>
                        <p className="text-muted-soft mt-1 text-sm line-clamp-1">
                          {lead.owner || "Sem responsável"}
                        </p>
                      </div>
                      <span className="rounded-full bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal whitespace-nowrap">
                        {lead.receivedAt
                          ? new Date(lead.receivedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {staleNewLeads.length > 4 && (
                <div className="mt-3 text-center text-sm font-semibold text-signal">
                  + {staleNewLeads.length - 4} leads parados
                </div>
              )}
            </section>
          )}

          {/* Funil prévia */}
          <section className="surface-card rounded-[36px] p-6 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-muted-soft text-sm">Funil da Equipe</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Conversão por etapa
                </h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  {stageConversionSummary?.note ?? "Prévia do funil comercial da equipe."}
                </p>
              </div>
              <Link
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt transition hover:bg-cobalt/18"
                href={funnelHref}
              >
                <BarChart3 size={20} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {stageConversionSummary?.status === "available" ? (
                <>
                  {stageConversionSummary.rows.map((row) => (
                    <div className="flex items-center gap-3" key={row.stageValue}>
                      <span className="w-24 shrink-0 text-sm font-medium text-ink">{row.label}</span>
                      <div className="flex-1 h-3 overflow-hidden rounded-full bg-muted/90">
                        <div
                          aria-hidden="true"
                          className={`h-full rounded-full transition-all ${getStageToneClass(row.tone)}`}
                          style={{ width: `${Math.max(row.percentage * 100, 2)}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink">
                        {row.count}
                      </span>
                      <span className="w-12 shrink-0 text-right text-xs text-muted-soft">
                        {formatStageShare(row.percentage)}
                      </span>
                    </div>
                  ))}
                  <Link
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-cobalt"
                    href={funnelHref}
                  >
                    Ver funil completo
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                  Nenhum lead com etapa válida foi encontrado para montar o funil.
                </div>
              )}
            </div>
          </section>

          {/* Tarefas em atraso */}
          {overdueTasks.length > 0 && (
            <section className="surface-card rounded-[34px] border border-signal/22 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-soft text-sm">Atenção da Equipe</p>
                  <h2 className="mt-1 text-xl font-semibold text-signal">
                    {overdueTasks.length} tarefa{overdueTasks.length > 1 ? "s" : ""} em atraso
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    Acompanhe o follow-up dos consultores.
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
                  <AlertCircle size={19} aria-hidden="true" />
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {overdueTasks.slice(0, 6).map((task) => (
                  <div className="surface-card-muted rounded-[24px] p-4" key={task.id}>
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
                  </div>
                ))}
              </div>
              {overdueTasks.length > 6 && (
                <div className="mt-4 text-center text-sm font-semibold text-warning">
                  + {overdueTasks.length - 6} tarefas vencidas
                </div>
              )}
            </section>
          )}

          {/* Desempenho da equipe */}
          <section className="surface-card rounded-[36px] p-6 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-muted-soft text-sm">Desempenho da Equipe</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Carteira por consultor
                </h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  {consultantPortfolioSummary?.status === "available"
                    ? `${consultantPortfolioSummary.totalConsultants} consultor${consultantPortfolioSummary.totalConsultants === 1 ? "" : "es"} • ${consultantPortfolioSummary.totalLeads} leads na equipe`
                    : "Sem carteiras distribuídas no momento."}
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <UsersRound size={20} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-6">
              {consultantPortfolioSummary?.status === "available" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {consultantPortfolioSummary.rows.map((row) => {
                    const bd = row.stageBreakdown;
                    const total = row.leadCount || 1;
                    return (
                      <div
                        className="surface-card-muted rounded-[28px] p-5"
                        key={row.ownerProfileId ?? row.ownerName}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-lg font-semibold text-ink">{row.ownerName}</p>
                            <p className="text-muted-soft mt-1 text-sm leading-6">
                              {getConsultantRoleLabel(row.role)} • {row.leadCount} lead{row.leadCount === 1 ? "" : "s"}
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

                        {/* Mini barra de distribuição */}
                        {row.leadCount > 0 && (
                          <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                            {bd.new > 0 && (
                              <div className="bg-cobalt" style={{ width: `${(bd.new / total) * 100}%` }} />
                            )}
                            {bd.qualification > 0 && (
                              <div className="bg-lagoon" style={{ width: `${(bd.qualification / total) * 100}%` }} />
                            )}
                            {bd.proposal > 0 && (
                              <div className="bg-signal" style={{ width: `${(bd.proposal / total) * 100}%` }} />
                            )}
                            {bd.negotiation > 0 && (
                              <div className="bg-ink" style={{ width: `${(bd.negotiation / total) * 100}%` }} />
                            )}
                            {bd.won > 0 && (
                              <div className="bg-emerald-600" style={{ width: `${(bd.won / total) * 100}%` }} />
                            )}
                            {bd.lost > 0 && (
                              <div className="bg-red-500" style={{ width: `${(bd.lost / total) * 100}%` }} />
                            )}
                          </div>
                        )}

                        {/* Badges de negociação e perdidos */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {bd.negotiation > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink dark:text-cloud">
                              {bd.negotiation} em negociação
                            </span>
                          )}
                          {bd.proposal > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-signal/12 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                              {bd.proposal} em proposta
                            </span>
                          )}
                          {bd.won > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200">
                              {bd.won} venda{bd.won === 1 ? "" : "s"}
                            </span>
                          )}
                          {bd.lost > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-500/12 dark:text-red-300">
                              <TrendingDown size={12} aria-hidden="true" />
                              {bd.lost} perdido{bd.lost === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="surface-card-muted rounded-[28px] p-5 text-sm leading-6 text-muted-soft">
                  Assim que houver leads distribuídos para a equipe, a leitura por consultor aparece aqui.
                </div>
              )}
            </div>
          </section>

          {/* Ações rápidas */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              className="surface-card rounded-[24px] p-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              href={`${leadsHref}?view=unassigned`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600">
                <UsersRound size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Distribuir Leads</p>
              <p className="text-muted-soft mt-1 text-xs leading-5">
                Atribuir leads pendentes aos consultores.
              </p>
            </Link>

            <Link
              className="surface-card rounded-[24px] p-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              href={relatoriosHref}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <BarChart3 size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Relatórios</p>
              <p className="text-muted-soft mt-1 text-xs leading-5">
                Métricas completas de conversão e desempenho.
              </p>
            </Link>

            <Link
              className="surface-card rounded-[24px] p-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              href={funnelHref}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lagoon/10 text-lagoon">
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Funil Completo</p>
              <p className="text-muted-soft mt-1 text-xs leading-5">
                Visualização kanban de todas as etapas.
              </p>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 flex flex-col gap-4">
          <RemindersCalendarCard initialReminders={dashboardReminders} />

          {/* Saldo de IA */}
          <div className="surface-card rounded-[28px] p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-muted-soft text-sm">Saldo de IA</p>
                <p className="text-2xl font-semibold tracking-tight text-ink">{aiBalance}</p>
              </div>
            </div>
            <span className="text-muted-soft text-xs leading-5 text-right whitespace-nowrap">
              crédito{aiBalance === 1 ? "" : "s"}<br />disponíve{aiBalance === 1 ? "l" : "is"}
            </span>
          </div>

          {/* Aprovações */}
          <section className="surface-card rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-soft text-sm">Aprovações</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Solicitações enviadas
                </h2>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
                <ShieldCheck size={19} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="surface-card-muted rounded-[22px] p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                    <Megaphone size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Anúncios</p>
                    <p className="text-muted-soft text-xs">Aguardando gestor</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${pendingCampaignsCount > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                  {pendingCampaignsCount}
                </span>
              </div>

              <div className="surface-card-muted rounded-[22px] p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                    <Briefcase size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Créditos</p>
                    <p className="text-muted-soft text-xs">Pedidos de verba</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${pendingCreditRequestsCount > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                  {pendingCreditRequestsCount}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
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
      return "Supervisor";
    case "seller":
      return "Consultor";
    default:
      return "Sem responsável";
  }
}
