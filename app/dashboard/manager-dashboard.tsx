"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Megaphone,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import {
  Metric,
  PageHeading
} from "@/components/dashboard/widgets";
import type { OnboardingState } from "@/lib/onboarding/types";
import type { DashboardReminderItem } from "@/lib/dashboard-reminders/types";
import type { SystemTemplate } from "@/lib/templates/types";
import type { OverdueLeadTaskItem, LeadOwnerOption } from "@/lib/leads/repository.server";
import type { CampaignActivitySummary } from "@/lib/campaigns/types";
import type {
  DashboardConsultantPortfolioSummary,
  DashboardCplSummary,
  DashboardStageConversionSummary
} from "@/lib/reports/commercial-report.server";
import type { TeamSetupData } from "@/lib/workspaces/team";
import type { SubscriptionNotice } from "@/lib/billing/subscription-limits.server";

export type ManagerDashboardProps = {
  preview?: boolean;
  aiBalance?: number;
  campaignsCount?: number;
  leadsCount?: number;
  whatsappMessagesCount?: number;
  creativeRequestsCount?: number;
  onboardingState?: OnboardingState | null;
  dashboardReminders?: DashboardReminderItem[];
  whatsappTemplates?: SystemTemplate[];
  campaignActivitySummary?: CampaignActivitySummary;
  overdueTasks?: OverdueLeadTaskItem[];
  cplSummary?: DashboardCplSummary;
  stageConversionSummary?: DashboardStageConversionSummary;
  consultantPortfolioSummary?: DashboardConsultantPortfolioSummary;
  leadOwnerOptions?: LeadOwnerOption[];
  teamSetupData?: TeamSetupData;
  pendingCampaignsCount?: number;
  pendingCreditRequestsCount?: number;
  subscriptionNotice?: SubscriptionNotice | null;
};

export function ManagerDashboard({
  preview = false,
  aiBalance = 0,
  leadsCount = 0,
  teamSetupData,
  pendingCampaignsCount = 0,
  pendingCreditRequestsCount = 0,
  subscriptionNotice,
}: ManagerDashboardProps) {
  const teamsCount = teamSetupData?.teams.length ?? 0;
  const consultantsCount = teamSetupData?.members.filter((m) => m.role === "seller" && m.status === "active").length ?? 0;
  
  const pendingInvitesCount = teamSetupData?.invites.filter((i) => i.approvalStatus === "pending").length ?? 0;
  const pendingDeactivationsCount = teamSetupData?.deactivationRequests.filter((r) => r.status === "pending").length ?? 0;
  const totalPendingMembers = pendingInvitesCount + pendingDeactivationsCount;
  
  const relatoriosHref = preview ? "/login" : "/dashboard/relatorios";
  const equipeHref = preview ? "/login" : "/dashboard/equipes";
  const aprovacoesAnunciosHref = preview ? "/login" : "/dashboard/campanhas/aprovacoes";
  const solicitacoesCreditoHref = preview ? "/login" : "/dashboard/creditos"; // TODO: Tela de solicitacoes especificas ou a geral de creditos onde aprova

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Gestão da Corretora"
        title="Painel do Gestor"
        description="Visão consolidada da sua organização, controle financeiro, equipes e aprovações pendentes."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
          href={relatoriosHref}
        >
          {preview ? "Entrar" : "Relatórios Completos"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4">
        <Metric 
          label="Créditos da Corretora" 
          value={String(aiBalance)} 
          note="saldo atual disponível" 
          tone="teal" 
        />
        <Metric 
          label="Leads Totais" 
          value={String(leadsCount)} 
          note="em toda a organização" 
          tone="blue" 
        />
        <Metric 
          label="Equipes" 
          value={String(teamsCount)} 
          note="unidades de venda ativas" 
          tone="dark" 
        />
        <Metric 
          label="Consultores" 
          value={String(consultantsCount)} 
          note="operando ativamente" 
          tone="dark" 
        />
      </div>

      <section className="surface-card rounded-[36px] p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-muted-soft text-sm">Centro de Aprovações</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Ações pendentes da sua equipe
            </h2>
            <p className="text-muted-soft mt-3 text-sm leading-6">
              Gerencie anúncios criados pelos supervisores, solicitações de créditos e convites de novos membros que aguardam a sua liberação.
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Anúncios */}
          <Link href={aprovacoesAnunciosHref} className="surface-card-muted rounded-[28px] p-5 transition hover:border-cobalt/30 group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-cobalt" />
                  <p className="text-lg font-semibold text-ink">Anúncios</p>
                </div>
                <p className="text-muted-soft mt-1 text-sm leading-6">
                  Campanhas aguardando revisão
                </p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${pendingCampaignsCount > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                {pendingCampaignsCount} pendente{pendingCampaignsCount === 1 ? "" : "s"}
              </span>
            </div>
            {pendingCampaignsCount > 0 && (
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cobalt group-hover:underline">
                Revisar anúncios <ArrowUpRight size={16} />
              </span>
            )}
          </Link>

          {/* Créditos */}
          <Link href={solicitacoesCreditoHref} className="surface-card-muted rounded-[28px] p-5 transition hover:border-cobalt/30 group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-cobalt" />
                  <p className="text-lg font-semibold text-ink">Créditos</p>
                </div>
                <p className="text-muted-soft mt-1 text-sm leading-6">
                  Solicitações de verba
                </p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${pendingCreditRequestsCount > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                {pendingCreditRequestsCount} pendente{pendingCreditRequestsCount === 1 ? "" : "s"}
              </span>
            </div>
            {pendingCreditRequestsCount > 0 && (
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cobalt group-hover:underline">
                Analisar solicitações <ArrowUpRight size={16} />
              </span>
            )}
          </Link>

          {/* Membros */}
          <Link href={equipeHref} className="surface-card-muted rounded-[28px] p-5 transition hover:border-cobalt/30 group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-cobalt" />
                  <p className="text-lg font-semibold text-ink">Membros</p>
                </div>
                <p className="text-muted-soft mt-1 text-sm leading-6">
                  Convites e desativações
                </p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${totalPendingMembers > 0 ? "bg-signal/14 text-foreground" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200"}`}>
                {totalPendingMembers} pendente{totalPendingMembers === 1 ? "" : "s"}
              </span>
            </div>
            {totalPendingMembers > 0 && (
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cobalt group-hover:underline">
                Gerenciar acessos <ArrowUpRight size={16} />
              </span>
            )}
          </Link>
        </div>
      </section>

      {/* Outras sessoes (opcional) */}
      <section className="grid gap-4 xl:grid-cols-2">
         <div className={`surface-card rounded-[34px] p-6 ${subscriptionNotice ? 'border border-signal/30' : ''}`}>
           <h3 className={`text-lg font-semibold ${subscriptionNotice ? 'text-signal' : ''}`}>
             {subscriptionNotice?.title ?? "Resumo do Plano & Faturamento"}
           </h3>
           <p className="text-muted-soft mt-2 text-sm">
             {subscriptionNotice?.message ?? "Controle de assinatura centralizado. Para alterar planos, cartões ou visualizar notas fiscais, acesse a área de billing."}
           </p>
           <div className="mt-5">
             <Link href={subscriptionNotice?.actionHref ?? "/dashboard/perfil"} className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt hover:underline">
               {subscriptionNotice?.actionLabel ?? "Gerenciar Assinatura e Billing"} <ArrowUpRight size={16} />
             </Link>
           </div>
         </div>
         <div className="surface-card rounded-[34px] p-6">
           <h3 className="text-lg font-semibold">Distribuição Geral</h3>
           <p className="text-muted-soft mt-2 text-sm">
             Acesse a área de equipes para verificar as carteiras detalhadas por unidade de venda e identificar gargalos na operação.
           </p>
           <div className="mt-5">
             <Link href="/dashboard/equipes" className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt hover:underline">
               Ver Todas as Equipes <ArrowUpRight size={16} />
             </Link>
           </div>
         </div>
      </section>
    </div>
  );
}
