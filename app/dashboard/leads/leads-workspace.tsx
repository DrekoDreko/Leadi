"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MessageCircle,
  PhoneCall,
  Plus,
  Sparkles,
  Upload
} from "lucide-react";
import type { Lead } from "@/data/mock";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type { LeadDataMode, LeadDataState } from "@/lib/leads/repository";
import { LeadCreateModal } from "./lead-create-modal";

export function LeadsWorkspace({ leadState }: { leadState: LeadDataState }) {
  const router = useRouter();
  const [leads, setLeads] = useState(leadState.leads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const kanbanColumns = buildKanbanColumns(leads);
  const newLeads = leads.filter((lead) => lead.stage === "Novo lead").length;
  const qualifiedLeads = leads.filter((lead) => lead.stage === "Qualificação").length;
  const proposalLeads = leads.filter((lead) => lead.stage === "Proposta").length;
  const staleLeads = leads.filter((lead) => lead.nextContact === "A definir").length;

  useEffect(() => {
    setLeads(leadState.leads);
  }, [leadState.leads]);

  function handleLeadCreated(lead: Lead, mode?: LeadDataMode) {
    setLeads((currentLeads) => [
      lead,
      ...currentLeads.filter((currentLead) => currentLead.id !== lead.id)
    ]);
    setCreateFeedback(
      mode === "not-configured"
        ? "Lead criado no modo demonstracao. Configure o Supabase para persistir novos cadastros."
        : "Lead criado e salvo no CRM."
    );

    if (mode === "supabase" || mode === undefined) {
      router.refresh();
    }
  }

  function handleLeadUpdated(lead: Lead, mode?: LeadDataMode) {
    setLeads((currentLeads) =>
      currentLeads.map((currentLead) => (currentLead.id === lead.id ? lead : currentLead))
    );
    setSelectedLead(lead);

    if (mode === "supabase" || mode === undefined) {
      router.refresh();
    }
  }

  function handleLeadDeleted(leadId: string, mode?: LeadDataMode) {
    setLeads((currentLeads) => currentLeads.filter((currentLead) => currentLead.id !== leadId));
    setSelectedLead(null);
    setCreateFeedback(
      mode === "not-configured"
        ? "Lead removido no modo demonstracao. Configure o Supabase para persistir exclusoes reais."
        : "Lead removido do CRM."
    );

    if (mode === "supabase" || mode === undefined) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="CRM"
        title="Leads"
        description="Lista dedicada para qualificar contatos, acompanhar responsáveis e priorizar próximos passos."
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
          onClick={() => setIsCreateOpen(true)}
          type="button"
        >
          <Plus size={18} aria-hidden="true" />
          Novo lead
        </button>
      </PageHeading>

      <LeadDataNotice leadState={leadState} />
      {createFeedback && (
        <p className="flex items-center gap-2 rounded-[24px] bg-lagoon/16 px-5 py-3 text-sm font-medium text-ink">
          <CheckCircle2 className="shrink-0 text-lagoon" size={18} aria-hidden="true" />
          {createFeedback}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Novos leads" value={String(newLeads)} note={`${leads.length} no CRM`} tone="blue" />
        <Metric label="Qualificação" value={String(qualifiedLeads)} note="em diagnóstico" tone="teal" />
        <Metric label="Propostas" value={String(proposalLeads)} note="em negociação" tone="yellow" />
        <Metric label="Sem agenda" value={String(staleLeads)} note="prioridade" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <LeadTablePanel
            leads={leads}
            onCreateOpen={() => setIsCreateOpen(true)}
            onLeadOpen={setSelectedLead}
          />
          <LeadKanbanPanel columns={kanbanColumns} onLeadOpen={setSelectedLead} />
        </div>

        <LeadContactQueue leads={leads} onLeadOpen={setSelectedLead} />
      </section>

      <LeadCreateModal
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleLeadCreated}
        open={isCreateOpen}
      />
      <LeadDetailsPopup
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onDeleted={leadState.canDeleteLeads ? handleLeadDeleted : undefined}
        onUpdated={handleLeadUpdated}
      />
    </div>
  );
}

function LeadDataNotice({ leadState }: { leadState: LeadDataState }) {
  if (leadState.mode === "supabase") {
    return (
      <p className="rounded-[24px] bg-lagoon/16 px-5 py-3 text-sm font-medium text-ink">
        Dados reais do Supabase carregados para a organização logada.
      </p>
    );
  }

  return (
    <p className="rounded-[24px] bg-signal/30 px-5 py-3 text-sm font-medium text-ink">
      {leadState.message ?? "Usando dados mockados enquanto a base real nao esta disponivel."}
    </p>
  );
}

function LeadTablePanel({
  leads,
  onCreateOpen,
  onLeadOpen
}: {
  leads: Lead[];
  onCreateOpen: () => void;
  onLeadOpen: (lead: Lead) => void;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-5 h-full flex flex-col">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-ink/54">CRM</p>
          <h2 className="text-2xl font-semibold">Leads</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="icon-button" type="button" title="Filtrar">
            <Filter size={18} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" title="Importar CSV">
            <Upload size={18} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
            onClick={onCreateOpen}
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
            Novo lead
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[26px] border border-white/48 bg-white/28">
        <div className="hidden grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] gap-4 border-b border-ink/8 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid">
          <span>Lead</span>
          <span>Telefone</span>
          <span>Email</span>
          <span>Responsável</span>
          <span>Status</span>
          <span aria-hidden="true" />
        </div>
        {leads.length === 0 && (
          <div className="px-5 py-8 text-sm leading-6 text-ink/62">
            Nenhum lead cadastrado ainda. Crie o primeiro lead manualmente ou integre novas origens.
          </div>
        )}
        {leads.map((lead) => (
          <button
            className="grid w-full gap-3 border-b border-ink/8 px-5 py-4 text-left transition hover:bg-white/34 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 last:border-0 md:grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] md:items-center"
            key={lead.id}
            onClick={() => onLeadOpen(lead)}
            type="button"
          >
            <span>
              <span className="block font-semibold leading-tight">{lead.name}</span>
              <span className="mt-1 block text-sm text-ink/54 md:hidden">{lead.phone}</span>
            </span>
            <span className="text-sm font-medium">{lead.phone}</span>
            <span className="text-sm text-ink/62">{lead.email}</span>
            <span className="text-sm text-ink/62">{lead.owner}</span>
            <span className="w-fit rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold">
              {lead.stage}
            </span>
            <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/54 text-ink/58 md:inline-flex">
              <ChevronRight size={18} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function LeadKanbanPanel({
  columns,
  onLeadOpen
}: {
  columns: ReturnType<typeof buildKanbanColumns>;
  onLeadOpen: (lead: Lead) => void;
}) {
  return (
    <section className="glass rounded-[34px] p-5 h-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink/54">Kanban</p>
          <h2 className="text-2xl font-semibold">Funil de vendas</h2>
        </div>
        <button className="icon-button" type="button" title="Ajustar automação">
          <Sparkles size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div className="rounded-[28px] bg-white/34 p-3" key={column.title}>
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <span className="text-sm font-semibold">{column.title}</span>
              <span className="rounded-full bg-white/60 px-2.5 py-1 text-xs font-semibold">
                {column.cards.length}
              </span>
            </div>
            {column.cards.map((lead) => (
              <button
                className={`${column.color} flex w-full flex-col justify-between rounded-[24px] p-4 text-left shadow-soft transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50`}
                key={lead.id}
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                <div className="space-y-3">
                  <span className="block font-semibold leading-tight">{lead.name}</span>
                  <span className="block text-sm opacity-85">{lead.owner}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function LeadContactQueue({
  leads,
  onLeadOpen
}: {
  leads: Lead[];
  onLeadOpen: (lead: Lead) => void;
}) {
  return (
    <aside className="flex h-full flex-col">
      <section className="glass rounded-[34px] p-5 h-full">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold">Próximos contatos</h2>
          <Clock3 size={20} aria-hidden="true" />
        </div>
        <div className="space-y-3">
          {leads.map((lead) => (
            <article className="rounded-[24px] bg-white/42 p-4" key={lead.id}>
              <button className="w-full text-left" onClick={() => onLeadOpen(lead)} type="button">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{lead.name}</span>
                    <span className="mt-1 block text-sm text-ink/56">{lead.phone}</span>
                  </span>
                  <span className="rounded-full bg-white/64 px-2.5 py-1 text-xs font-semibold">
                    {lead.score}%
                  </span>
                </span>
              </button>
              <div className="mt-4 flex gap-2">
                <Link
                  className="icon-button"
                  href={`/dashboard/whatsapp?lead=${lead.id}`}
                  title={`Abrir sugestões de mensagem para ${lead.name}`}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                </Link>
                <button className="icon-button" type="button" title="Ligar">
                  <PhoneCall size={18} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}

function buildKanbanColumns(leads: Lead[]) {
  return [
    {
      title: "Novo lead",
      color: "bg-cobalt text-white",
      cards: leads.filter((lead) => lead.stage === "Novo lead")
    },
    {
      title: "Qualificação",
      color: "bg-lagoon text-white",
      cards: leads.filter((lead) => lead.stage === "Qualificação")
    },
    {
      title: "Proposta",
      color: "bg-signal text-ink",
      cards: leads.filter((lead) => lead.stage === "Proposta")
    },
    {
      title: "Negociação",
      color: "bg-ink text-white",
      cards: leads.filter((lead) => lead.stage === "Negociação")
    }
  ];
}
