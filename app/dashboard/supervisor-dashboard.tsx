"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Megaphone,
  ShieldCheck,
  UsersRound,
  AlertCircle
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
import type { DashboardConsultantPortfolioSummary } from "@/lib/reports/commercial-report.server";
import { isLeadClosedStage, getLeadStageValue } from "@/lib/leads/stages";

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
  leadOwnerOptions?: LeadOwnerOption[];
  pendingCampaignsCount?: number;
  pendingCreditRequestsCount?: number;
  teamName?: string;
};

export function SupervisorDashboard({
  preview = false,
  aiBalance = 0,
  leads = [],
  consultantPortfolioSummary,
  overdueTasks = [],
  pendingCampaignsCount = 0,
  pendingCreditRequestsCount = 0,
  teamName = "Sua Equipe"
}: SupervisorDashboardProps) {
  const relatoriosHref = preview ? "/login" : "/dashboard/relatorios";
  const leadsHref = preview ? "/login" : "/dashboard/leads";
  
  const activeLeads = leads.filter((lead) => !isLeadClosedStage(lead.stage)).length;
  const unassignedLeads = leads.filter((lead) => !lead.ownerProfileId).length;
  const proposals = leads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const sales = leads.filter((lead) => getLeadStageValue(lead.stage) === "won").length;

  const consultantsCount = consultantPortfolioSummary?.status === "available" 
    ? consultantPortfolioSummary.totalConsultants 
    : 0;

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <Metric 
          label="Créditos da Equipe" 
          value={String(aiBalance)} 
          note="saldo atual disponível" 
          tone="teal" 
        />
        <Metric 
          label="Leads da Equipe" 
          value={String(activeLeads)} 
          note="em atendimento" 
          tone="blue" 
        />
        <Metric 
          label="Sem responsável" 
          value={String(unassignedLeads)} 
          note={unassignedLeads > 0 ? "aguardando distribuição" : "equipe abastecida"} 
          tone="yellow" 
        />
        <Metric 
          label="Consultores" 
          value={String(consultantsCount)} 
          note="operando ativamente" 
          tone="dark" 
        />
        <Metric 
          label="Vendas da Equipe" 
          value={String(sales)} 
          note={`${proposals} propostas em aberto`} 
          tone="teal" 
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-2 mt-6">
        <div className="surface-card rounded-[36px] p-6 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-muted-soft text-sm">Status de Aprovações</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Suas solicitações enviadas
              </h2>
              <p className="text-muted-soft mt-2 text-sm leading-6">
                Acompanhe o status das solicitações de créditos e anúncios enviadas para o gestor.
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {/* Solicitações de Anúncios */}
            <div className="surface-card-muted rounded-[24px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <Megaphone size={18} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Anúncios em aprovação</p>
                  <p className="text-muted-soft text-sm">Campanhas aguardando o gestor</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${pendingCampaignsCount > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                {pendingCampaignsCount} pendente{pendingCampaignsCount === 1 ? "" : "s"}
              </span>
            </div>

            {/* Solicitações de Créditos */}
            <div className="surface-card-muted rounded-[24px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <Briefcase size={18} />
                </span>
                <div>
                  <p className="font-semibold text-ink">Créditos solicitados</p>
                  <p className="text-muted-soft text-sm">Pedidos de verba aguardando aprovação</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${pendingCreditRequestsCount > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                {pendingCreditRequestsCount} pendente{pendingCreditRequestsCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-[36px] p-6 lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-muted-soft text-sm">Distribuição de Leads</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Leads sem responsável
              </h2>
              <p className="text-muted-soft mt-2 text-sm leading-6">
                Leads novos que chegaram e ainda não foram atribuídos a nenhum consultor.
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600">
              <UsersRound size={20} aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6">
            {unassignedLeads > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6">
                  Existem <strong>{unassignedLeads} leads</strong> aguardando atribuição para a equipe.
                </div>
                <Link
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-cobalt px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cobalt/90"
                  href={leadsHref}
                >
                  Distribuir Leads
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="surface-card-muted rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                Todos os leads da equipe já possuem um consultor responsável.
              </div>
            )}
          </div>
        </div>
      </section>

      {overdueTasks.length > 0 && (
        <section className="surface-card rounded-[34px] border border-signal/22 p-6 lg:p-7 mt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-soft text-sm">Atenção da Equipe</p>
              <h2 className="mt-1 text-xl font-semibold text-signal">
                {overdueTasks.length} tarefa{overdueTasks.length > 1 ? "s" : ""} em atraso na equipe
              </h2>
              <p className="text-muted-soft mt-2 text-sm leading-6">
                Acompanhe o follow-up dos consultores.
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal">
              <AlertCircle size={19} aria-hidden="true" />
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overdueTasks.slice(0, 6).map((task) => (
              <div
                className="surface-card-muted rounded-[24px] p-4"
                key={task.id}
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

      {consultantPortfolioSummary?.status === "available" && (
        <section className="surface-card rounded-[36px] p-6 lg:p-7 mt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-muted-soft text-sm">Desempenho da Equipe</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Carteira por consultor
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {consultantPortfolioSummary.rows.map((row) => (
              <div
                className="surface-card-muted rounded-[28px] p-5"
                key={row.ownerProfileId ?? row.ownerName}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-ink">{row.ownerName}</p>
                    <p className="text-muted-soft mt-1 text-sm leading-6">
                      {row.leadCount} lead{row.leadCount === 1 ? "" : "s"} na carteira
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
