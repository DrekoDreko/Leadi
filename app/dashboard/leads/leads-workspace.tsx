"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Mail,
  MessageCircle,
  PhoneCall,
  Plus,
  Sparkles,
  Upload,
  UserRound,
  X
} from "lucide-react";
import type { Lead } from "@/data/mock";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type { LeadDataState } from "@/lib/leads/repository";

export function LeadsWorkspace({ leadState }: { leadState: LeadDataState }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const leads = leadState.leads;
  const kanbanColumns = buildKanbanColumns(leads);
  const newLeads = leads.filter((lead) => lead.stage === "Novo lead").length;
  const qualifiedLeads = leads.filter((lead) => lead.stage === "Qualificação").length;
  const proposalLeads = leads.filter((lead) => lead.stage === "Proposta").length;
  const staleLeads = leads.filter((lead) => lead.nextContact === "A definir").length;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="CRM"
        title="Leads"
        description="Lista dedicada para qualificar contatos, acompanhar responsáveis e priorizar próximos passos."
      >
        <button className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white">
          <Plus size={18} aria-hidden="true" />
          Novo lead
        </button>
      </PageHeading>

      <LeadDataNotice leadState={leadState} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Novos leads" value={String(newLeads)} note={`${leads.length} no CRM`} tone="blue" />
        <Metric label="Qualificação" value={String(qualifiedLeads)} note="em diagnóstico" tone="teal" />
        <Metric label="Propostas" value={String(proposalLeads)} note="em negociação" tone="yellow" />
        <Metric label="Sem agenda" value={String(staleLeads)} note="prioridade" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <LeadTablePanel leads={leads} onLeadOpen={setSelectedLead} />
          <LeadKanbanPanel columns={kanbanColumns} onLeadOpen={setSelectedLead} />
        </div>

        <LeadContactQueue leads={leads} onLeadOpen={setSelectedLead} />
      </section>

      <LeadDetailsPopup lead={selectedLead} onClose={() => setSelectedLead(null)} />
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
  onLeadOpen
}: {
  leads: Lead[];
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
          <button className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white">
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
            Nenhum lead cadastrado ainda. O primeiro lead real pode entrar via API, CSV ou Meta na proxima fase.
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

function LeadDetailsPopup({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  useEffect(() => {
    if (!lead) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lead, onClose]);

  if (!lead) {
    return null;
  }

  const profileItems = [
    { icon: UserRound, label: "Nome", value: lead.name },
    { icon: PhoneCall, label: "Telefone", value: lead.phone },
    { icon: Mail, label: "Email", value: lead.email }
  ];

  return (
    <div
      aria-labelledby="lead-popup-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/70 bg-cloud/95 p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                {lead.id}
              </span>
              <span className="rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold">
                {lead.stage}
              </span>
              <span className="rounded-full bg-cobalt px-3 py-1.5 text-xs font-semibold text-white">
                {lead.score}% fit
              </span>
            </div>
            <h2 className="text-2xl font-semibold sm:text-3xl" id="lead-popup-title">
              {lead.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/62 sm:text-base">
              {lead.interest}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button className="icon-button" type="button" title="Enviar e-mail">
              <Mail size={18} aria-hidden="true" />
            </button>
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
            <button className="icon-button" onClick={onClose} type="button" title="Fechar">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 pt-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {profileItems.map((item) => (
                <div className="rounded-[24px] bg-white/44 p-4" key={item.label}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/68">
                    <item.icon size={18} aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-ink/42">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-[28px] bg-white/42 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lagoon text-white">
                  <CheckCircle2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-ink/54">Última interação</p>
                  <h3 className="font-semibold">Resumo comercial</h3>
                </div>
              </div>
              <p className="text-sm leading-6 text-ink/68">{lead.lastInteraction}</p>
              <p className="mt-4 rounded-[20px] bg-white/52 p-4 text-sm leading-6 text-ink/68">
                {lead.notes}
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[28px] bg-ink p-5 text-white">
              <p className="text-sm text-white/62">Próximo contato</p>
              <h3 className="mt-2 text-2xl font-semibold">{lead.nextContact}</h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <span>WhatsApp</span>
                  <span className="font-semibold">{lead.phone}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <span>Email</span>
                  <span className="max-w-[180px] truncate font-semibold">{lead.email}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] bg-white/44 p-5">
              <h3 className="font-semibold">Contato</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/54">Nome</dt>
                  <dd className="max-w-[170px] truncate font-semibold">{lead.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/54">Telefone</dt>
                  <dd className="font-semibold">{lead.phone}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink/54">Email</dt>
                  <dd className="max-w-[170px] truncate font-semibold">{lead.email}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
