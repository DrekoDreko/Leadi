"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  AlertCircle,
  ShieldCheck,
  UsersRound,
  Sparkles,
  MessageSquarePlus,
  MessageCircle,
  Send
} from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import type { Lead } from "@/data/mock";
import type { DashboardReminderItem } from "@/lib/dashboard-reminders/types";
import type { OverdueLeadTaskItem } from "@/lib/leads/repository.server";
import type { SystemTemplate } from "@/lib/templates/types";
import { isLeadClosedStage, getLeadStageValue, getLeadStageLabel } from "@/lib/leads/stages";
import {
  isLeadPendingFirstContact,
  sortLeadsByFirstContactPriority
} from "@/lib/leads/first-contact";
import { RemindersCalendarCard } from "@/components/dashboard/reminders-calendar-card";

export type ConsultantDashboardProps = {
  preview?: boolean;
  aiBalance?: number;
  leads?: Lead[];
  dashboardReminders?: DashboardReminderItem[];
  overdueTasks?: OverdueLeadTaskItem[];
  teamName?: string;
  supervisorName?: string;
  organizationName?: string;
  whatsappTemplates?: SystemTemplate[];
};

export function ConsultantDashboard({
  preview = false,
  aiBalance = 0,
  leads = [],
  dashboardReminders = [],
  overdueTasks = [],
  teamName,
  supervisorName,
  organizationName,
  whatsappTemplates = []
}: ConsultantDashboardProps) {
  const leadsHref = preview ? "/login" : "/dashboard/leads";

  const [dashboardLeads, setDashboardLeads] = useState(() =>
    sortLeadsByFirstContactPriority(leads)
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    setDashboardLeads(sortLeadsByFirstContactPriority(leads));
  }, [leads]);

  useEffect(() => {
    setSelectedLead((currentLead) => {
      if (!currentLead) {
        return currentLead;
      }

      return dashboardLeads.find((lead) => lead.id === currentLead.id) ?? currentLead;
    });
  }, [dashboardLeads]);

  function handleLeadUpdated(updatedLead: Lead) {
    setDashboardLeads((currentLeads) =>
      sortLeadsByFirstContactPriority(
        currentLeads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      )
    );
    setSelectedLead(updatedLead);
  }

  const activeLeads = leads.filter((lead) => !isLeadClosedStage(lead.stage)).length;
  const newLeads = leads.filter((lead) => getLeadStageValue(lead.stage) === "new").length;
  const proposals = leads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const sales = leads.filter((lead) => getLeadStageValue(lead.stage) === "won").length;

  const identityLabels = [
    "Consultor",
    teamName,
    supervisorName,
    organizationName
  ].filter(Boolean).join(" • ");

  const pendingContactCount = leads.filter(isLeadPendingFirstContact).length;
  const whatsappHref = preview ? "/login" : "/dashboard/whatsapp";

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={identityLabels}
        title="Dashboard de Vendas"
        description="Acompanhe seus leads, lembretes e desempenho diário."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
          href={leadsHref}
        >
          {preview ? "Entrar" : "Meus Leads"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric 
          label="Meus Leads" 
          value={String(activeLeads)} 
          note="em atendimento" 
          tone="blue" 
        />
        <Metric 
          label="Novos leads" 
          value={String(newLeads)} 
          note="entradas recentes" 
          tone="yellow" 
        />
        <Metric 
          label="Em Proposta" 
          value={String(proposals)} 
          note="negociações em andamento" 
          tone="yellow" 
        />
        <Metric
          label="Vendas"
          value={String(sales)}
          note="negócios fechados"
          tone="teal"
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] mt-6">
        <div className="min-w-0 flex h-full flex-col gap-4">
           {overdueTasks.length > 0 ? (
            <section className="surface-card rounded-[34px] border border-signal/22 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-soft text-sm">Atenção</p>
                  <h2 className="mt-1 text-xl font-semibold text-signal">
                    {overdueTasks.length} tarefa{overdueTasks.length > 1 ? "s" : ""} em atraso
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    Acompanhe seu follow-up.
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <AlertCircle size={19} aria-hidden="true" />
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {overdueTasks.slice(0, 4).map((task) => (
                  <div
                    className="surface-card-muted rounded-[24px] p-4"
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink line-clamp-1">{task.title}</p>
                        <p className="text-muted-soft mt-1 text-sm leading-6 line-clamp-1">
                          {task.leadName}
                        </p>
                      </div>
                      <span className="rounded-full bg-signal/10 px-3 py-1.5 text-xs font-semibold text-signal whitespace-nowrap">
                        {new Date(task.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {overdueTasks.length > 4 && (
                <div className="mt-4 text-center text-sm font-semibold text-warning">
                  + {overdueTasks.length - 4} tarefas vencidas
                </div>
              )}
            </section>
          ) : (
            <section className="surface-card rounded-[34px] p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <p className="text-muted-soft text-sm">Follow-up</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Minhas tarefas
                  </h2>
                  <p className="text-muted-soft mt-2 text-sm leading-6">
                    Seu follow-up está em dia.
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <ShieldCheck size={20} aria-hidden="true" />
                </span>
              </div>

              <div className="surface-card-muted mt-6 rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                Suas tarefas aparecerão aqui.
              </div>
            </section>
          )}

          <section className="surface-card rounded-[36px] p-6 lg:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-muted-soft text-sm">Minha Carteira</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  Meus leads
                </h2>
                <p className="text-muted-soft mt-2 text-sm leading-6">
                  {dashboardLeads.length > 0
                    ? `${dashboardLeads.length} lead${dashboardLeads.length === 1 ? "" : "s"} atribuído${dashboardLeads.length === 1 ? "" : "s"} a você.`
                    : "Nenhum lead atribuído a você no momento."}
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <UsersRound size={20} aria-hidden="true" />
              </span>
            </div>

            {dashboardLeads.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dashboardLeads.map((lead) => {
                  const stageMeta = getLeadStageLabel(lead.stage);
                  const isClosed = isLeadClosedStage(lead.stage);
                  return (
                    <button
                      className="surface-card-muted rounded-[28px] p-5 text-left transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-ink line-clamp-1">{lead.name}</p>
                          <p className="text-muted-soft mt-1 text-sm leading-6 line-clamp-1">
                            {lead.phone || lead.email || lead.source}
                          </p>
                        </div>
                        {isLeadPendingFirstContact(lead) ? (
                          <span className="rounded-full bg-cobalt px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-sm whitespace-nowrap">
                            Novo
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                          isClosed
                            ? "bg-success/15 text-success"
                            : "bg-signal/14 text-foreground"
                        }`}
                      >
                        {stageMeta}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="surface-card-muted mt-6 rounded-[24px] p-4 text-sm leading-6 text-muted-soft">
                Assim que o supervisor distribuir leads para você, eles aparecerão aqui.
              </div>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              className="surface-card rounded-[24px] p-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              href={whatsappHref}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <MessageSquarePlus size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Gerar mensagem</p>
              <p className="text-muted-soft mt-1 text-xs leading-5">
                Crie uma abordagem com IA para um lead.
              </p>
            </Link>

            <Link
              className="surface-card rounded-[24px] p-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              href={whatsappHref}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <Send size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Enviar pela plataforma</p>
              <p className="text-muted-soft mt-1 text-xs leading-5">
                Dispare a mensagem direto pelo Leadi.
              </p>
            </Link>

            <Link
              className="surface-card rounded-[24px] p-4 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50"
              href={leadsHref}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <MessageCircle size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">Leads para abordar</p>
              <p className="text-muted-soft mt-1 text-xs leading-5">
                {pendingContactCount > 0
                  ? `${pendingContactCount} aguardando o primeiro contato.`
                  : "Todos os seus leads já receberam contato."}
              </p>
            </Link>
          </div>

        </div>

        <aside className="min-w-0 flex h-full flex-col gap-4">
          <RemindersCalendarCard initialReminders={dashboardReminders} />

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
        </aside>
      </section>

      <LeadDetailsPopup
        aiBalance={aiBalance}
        canManageLeadOwners={false}
        lead={selectedLead}
        messageGeneratorEnabled
        onClose={() => setSelectedLead(null)}
        onUpdated={handleLeadUpdated}
        whatsappTemplates={whatsappTemplates}
      />
    </div>
  );
}
