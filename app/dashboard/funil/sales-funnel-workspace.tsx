"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GripVertical,
  Kanban,
  Loader2,
  MessageCircle,
  PhoneCall,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound
} from "lucide-react";
import type { Lead } from "@/data/mock";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import {
  getLeadStageLabel,
  getLeadStageValue,
  leadStageOptions,
  type LeadStageValue
} from "@/lib/leads/stages";
import type { LeadDataMode, LeadDataState } from "@/lib/leads/repository";
import { LeadCreateModal } from "../leads/lead-create-modal";

type StageTone = {
  accent: string;
  card: string;
  description: string;
  pulse: string;
};

type LeadStageUpdateResponse = {
  lead?: Lead;
  error?: string;
  mode?: LeadDataMode;
};

const stageToneByValue: Record<LeadStageValue, StageTone> = {
  new: {
    accent: "bg-cobalt text-white",
    card: "border-cobalt/18 bg-cobalt/10",
    description: "Entrada e primeira abordagem",
    pulse: "bg-cobalt"
  },
  qualification: {
    accent: "bg-lagoon text-white",
    card: "border-lagoon/20 bg-lagoon/12",
    description: "Diagnóstico e fit comercial",
    pulse: "bg-lagoon"
  },
  proposal: {
    accent: "bg-signal text-ink",
    card: "border-signal/40 bg-signal/20",
    description: "Simulação enviada",
    pulse: "bg-signal"
  },
  negotiation: {
    accent: "bg-ink text-white",
    card: "border-ink/14 bg-ink/8",
    description: "Ajustes e objeções",
    pulse: "bg-ink"
  },
  won: {
    accent: "bg-emerald-600 text-white",
    card: "border-emerald-500/20 bg-emerald-500/12",
    description: "Venda ganha",
    pulse: "bg-emerald-600"
  },
  lost: {
    accent: "bg-red-600 text-white",
    card: "border-red-500/18 bg-red-500/10",
    description: "Perdidos ou sem avanço",
    pulse: "bg-red-600"
  }
};

export function SalesFunnelWorkspace({ leadState }: { leadState: LeadDataState }) {
  const router = useRouter();
  const [leads, setLeads] = useState(leadState.leads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<LeadStageValue | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

  const visibleLeads = leads.filter((lead) => matchesFunnelSearch(lead, deferredSearchTerm));
  const columns = buildFunnelColumns(visibleLeads);
  const totalLeads = visibleLeads.length;
  const openLeads = visibleLeads.filter((lead) => !["Venda", "Perdido"].includes(lead.stage)).length;
  const wonLeads = visibleLeads.filter((lead) => lead.stage === "Venda").length;
  const highFitLeads = visibleLeads.filter((lead) => lead.score >= 80).length;
  const averageScore = Math.round(
    visibleLeads.reduce((total, lead) => total + lead.score, 0) / Math.max(totalLeads, 1)
  );
  const selectedLeadCanEdit = selectedLead?.canEdit ?? true;
  const selectedLeadCanDelete = selectedLead?.canDelete ?? leadState.canDeleteLeads;
  const isErrorState = leadState.mode === "error" || leadState.mode === "unauthenticated";

  useEffect(() => {
    setLeads(leadState.leads);
  }, [leadState.leads]);

  useEffect(() => {
    if (selectedLead && !leads.some((lead) => lead.id === selectedLead.id)) {
      setSelectedLead(null);
    }
  }, [leads, selectedLead]);

  function handleRefresh() {
    router.refresh();
  }

  function handleLeadCreated(lead: Lead, mode?: LeadDataMode) {
    setLeads((currentLeads) => [
      lead,
      ...currentLeads.filter((currentLead) => currentLead.id !== lead.id)
    ]);
    setFeedback({
      type: "success",
      message:
        mode === "not-configured"
          ? "Lead criado no modo demonstracao e adicionado ao funil."
          : "Lead criado e adicionado ao funil."
    });

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
    setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== leadId));
    setSelectedLead(null);
    setFeedback({
      type: "success",
      message:
        mode === "not-configured"
          ? "Lead removido do funil no modo demonstracao."
          : "Lead removido do funil."
    });

    if (mode === "supabase" || mode === undefined) {
      router.refresh();
    }
  }

  function handleDragStart(event: DragEvent<HTMLElement>, lead: Lead) {
    if (!(lead.canEdit ?? true)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lead.id);
    setDraggedLeadId(lead.id);
    setFeedback(null);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, stage: LeadStageValue) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setActiveDropStage(stage);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>, stage: LeadStageValue) {
    const relatedTarget = event.relatedTarget;

    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return;
    }

    setActiveDropStage((currentStage) => (currentStage === stage ? null : currentStage));
  }

  function handleDrop(event: DragEvent<HTMLElement>, nextStage: LeadStageValue) {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain") || draggedLeadId;
    const lead = leads.find((currentLead) => currentLead.id === leadId);

    setDraggedLeadId(null);
    setActiveDropStage(null);

    if (!lead) {
      return;
    }

    void handleLeadStageChange(lead, nextStage);
  }

  function handleDragEnd() {
    setDraggedLeadId(null);
    setActiveDropStage(null);
  }

  async function handleLeadStageChange(lead: Lead, nextStage: LeadStageValue) {
    const nextStageLabel = getLeadStageLabel(nextStage);

    if (lead.stage === nextStageLabel || updatingLeadId === lead.id) {
      return;
    }

    if (!(lead.canEdit ?? true)) {
      setFeedback({
        type: "error",
        message: "Sem permissao para alterar a etapa deste lead."
      });
      return;
    }

    if (leadState.mode === "not-configured" || leadState.mode === "mock") {
      const updatedLead = { ...lead, stage: nextStageLabel };
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) => (currentLead.id === lead.id ? updatedLead : currentLead))
      );
      setSelectedLead((currentLead) => (currentLead?.id === lead.id ? updatedLead : currentLead));
      setFeedback({
        type: "success",
        message: `${lead.name} mudou para ${nextStageLabel} no modo demonstracao.`
      });
      return;
    }

    const previousStage = lead.stage;
    setUpdatingLeadId(lead.id);
    setFeedback(null);

    setLeads((currentLeads) =>
      currentLeads.map((currentLead) =>
        currentLead.id === lead.id ? { ...currentLead, stage: nextStageLabel } : currentLead
      )
    );
    setSelectedLead((currentLead) =>
      currentLead?.id === lead.id ? { ...currentLead, stage: nextStageLabel } : currentLead
    );

    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ stage: nextStage })
      });
      const data = await parseLeadStageUpdateResponse(response);

      if (!response.ok || !data.lead) {
        throw new Error(getLeadStageUpdateErrorMessage(data.error));
      }

      const updatedLead = data.lead;
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) => (currentLead.id === lead.id ? updatedLead : currentLead))
      );
      setSelectedLead((currentLead) => (currentLead?.id === lead.id ? updatedLead : currentLead));
      setFeedback({
        type: "success",
        message: `${lead.name} mudou para ${getLeadStageLabel(nextStage)}.`
      });
    } catch (error) {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          currentLead.id === lead.id ? { ...currentLead, stage: previousStage } : currentLead
        )
      );
      setSelectedLead((currentLead) =>
        currentLead?.id === lead.id ? { ...currentLead, stage: previousStage } : currentLead
      );
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel mover o lead. Tente novamente."
      });
    } finally {
      setUpdatingLeadId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass-strong overflow-hidden rounded-[40px] p-5 md:p-6 xl:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                <Kanban size={14} aria-hidden="true" />
                Funil de vendas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold text-ink/68">
                Arrasta e solta ativo
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl xl:text-[3.6rem]">
              Uma tela grande, clara e pronta para tocar o pipeline inteiro.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/64 md:text-base">
              Arraste leads entre etapas, abra detalhes sem sair da página e acompanhe os pontos
              que mais pedem atenção comercial.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-[460px] xl:items-end">
            <label className="relative block w-full">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/42"
                size={18}
                aria-hidden="true"
              />
              <input
                aria-label="Buscar no funil"
                className="liquid-input pl-11 text-sm"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, telefone, cidade ou interesse"
                type="search"
                value={searchTerm}
              />
            </label>

            <div className="flex w-full flex-wrap gap-2 xl:justify-end">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/78"
                href="/dashboard/leads"
              >
                Ver lista
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(52,98,238,0.24)]"
                onClick={() => setIsCreateOpen(true)}
                type="button"
              >
                <Plus size={18} aria-hidden="true" />
                Novo lead
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <FunnelHeroMetric
            icon={BriefcaseBusiness}
            label="Leads no funil"
            note={`${openLeads} em aberto`}
            tone="blue"
            value={String(totalLeads)}
          />
          <FunnelHeroMetric
            icon={Target}
            label="Score medio"
            note={`${highFitLeads} acima de 80%`}
            tone="teal"
            value={`${averageScore}%`}
          />
          <FunnelHeroMetric
            icon={TrendingUp}
            label="Vendas"
            note="fechados no periodo"
            tone="dark"
            value={String(wonLeads)}
          />
          <FunnelHeroMetric
            icon={CalendarClock}
            label="Sem agenda"
            note="pedem atencao"
            tone="yellow"
            value={String(countStaleLeads(visibleLeads))}
          />
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-6">
          {columns.map((column) => {
            const tone = stageToneByValue[column.value];

            return (
              <article
                className={`rounded-[28px] border border-white/56 p-4 ${tone.card}`}
                key={column.value}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className={`mb-3 block h-2.5 w-14 rounded-full ${tone.pulse}`} />
                    <h2 className="text-base font-semibold">{column.label}</h2>
                    <p className="mt-1 text-xs leading-5 text-ink/56">{tone.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.accent}`}>
                    {column.cards.length}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <LeadDataNotice leadState={leadState} />

      {feedback && (
        <p
          aria-live="polite"
          className={`flex items-center gap-2 rounded-[24px] px-5 py-3 text-sm font-medium text-ink ${
            feedback.type === "success" ? "bg-lagoon/16" : "bg-signal/30"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="shrink-0 text-lagoon" size={18} aria-hidden="true" />
          ) : (
            <AlertCircle className="shrink-0 text-ink" size={18} aria-hidden="true" />
          )}
          {feedback.message}
        </p>
      )}

      {isErrorState ? (
        <LeadWorkspaceErrorState message={leadState.message} onRetry={handleRefresh} />
      ) : (
        <section className="glass-strong overflow-hidden rounded-[40px] p-4 md:p-5">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-cobalt">Pipeline operacional</p>
              <h2 className="mt-2 text-3xl font-semibold md:text-[2.2rem]">
                Arraste os cards para mover a negociação
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink/62">
                Cards bloqueados indicam leads que o usuario atual nao pode alterar. Para editar
                dados comerciais, abra o card e use o painel lateral.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-white/64 px-4 py-2 text-xs font-semibold text-ink/64">
                {totalLeads} leads visiveis
              </span>
              <span className="inline-flex items-center rounded-full bg-white/64 px-4 py-2 text-xs font-semibold text-ink/64">
                {columns.length} etapas
              </span>
            </div>
          </div>

          {visibleLeads.length === 0 ? (
            <FunnelEmptyState
              hasSearch={searchTerm.trim().length > 0}
              onCreateOpen={() => setIsCreateOpen(true)}
              onSearchClear={() => setSearchTerm("")}
            />
          ) : (
            <div className="-mx-1 overflow-x-auto pb-2">
              <div className="grid min-w-max auto-cols-[minmax(330px,1fr)] grid-flow-col gap-4 px-1">
                {columns.map((column) => {
                  const tone = stageToneByValue[column.value];
                  const isActiveDrop = activeDropStage === column.value;

                  return (
                    <section
                      aria-label={`Etapa ${column.label}`}
                      className={`flex min-h-[72vh] max-h-[72vh] flex-col rounded-[34px] border p-4 transition ${
                        isActiveDrop
                          ? "border-cobalt/70 bg-cobalt/14 shadow-[0_28px_72px_rgba(52,98,238,0.18)]"
                          : `${tone.card} border-white/56`
                      }`}
                      key={column.value}
                      onDragLeave={(event) => handleDragLeave(event, column.value)}
                      onDragOver={(event) => handleDragOver(event, column.value)}
                      onDrop={(event) => handleDrop(event, column.value)}
                    >
                      <div className="mb-4 rounded-[28px] bg-white/54 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`mb-3 block h-2.5 w-14 rounded-full ${tone.pulse}`} />
                            <h3 className="text-lg font-semibold">{column.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-ink/56">{tone.description}</p>
                          </div>
                          <span
                            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold ${tone.accent}`}
                          >
                            {column.cards.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                        {column.cards.map((lead) => (
                          <FunnelLeadCard
                            active={draggedLeadId === lead.id}
                            key={lead.id}
                            lead={lead}
                            onDragEnd={handleDragEnd}
                            onDragStart={handleDragStart}
                            onLeadOpen={setSelectedLead}
                            onLeadStageChange={handleLeadStageChange}
                            pending={updatingLeadId === lead.id}
                          />
                        ))}

                        {column.cards.length === 0 && (
                          <div className="flex flex-1 items-center justify-center rounded-[28px] border border-dashed border-ink/14 bg-white/30 p-6 text-center text-sm font-medium leading-6 text-ink/48">
                            Solte um lead aqui para marcar como {column.label.toLowerCase()}.
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      <LeadCreateModal
        canCreateMetaAdsLeads={leadState.canCreateMetaAdsLeads}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleLeadCreated}
        open={isCreateOpen}
      />
      <LeadDetailsPopup
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onDeleted={selectedLeadCanDelete ? handleLeadDeleted : undefined}
        onUpdated={selectedLeadCanEdit ? handleLeadUpdated : undefined}
      />
    </div>
  );
}

function FunnelLeadCard({
  active,
  lead,
  onDragEnd,
  onDragStart,
  onLeadOpen,
  onLeadStageChange,
  pending
}: {
  active: boolean;
  lead: Lead;
  onDragEnd: () => void;
  onDragStart: (event: DragEvent<HTMLElement>, lead: Lead) => void;
  onLeadOpen: (lead: Lead) => void;
  onLeadStageChange: (lead: Lead, nextStage: LeadStageValue) => void;
  pending: boolean;
}) {
  const currentStageValue = getLeadStageValue(lead.stage) ?? "new";
  const canEditLead = lead.canEdit ?? true;

  return (
    <article
      aria-busy={pending}
      className={`rounded-[30px] border border-white/72 bg-white/72 p-5 shadow-soft transition ${
        active
          ? "scale-[0.985] opacity-60"
          : "hover:-translate-y-1 hover:bg-white/84 hover:shadow-[0_24px_44px_rgba(18,23,33,0.12)]"
      } ${canEditLead ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-72"}`}
      draggable={canEditLead && !pending}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, lead)}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cobalt/10 px-3 py-1.5 text-xs font-semibold text-cobalt">
              {lead.score}% fit
            </span>
            <span className="rounded-full bg-white/84 px-3 py-1.5 text-xs font-semibold text-ink/64">
              {lead.source}
            </span>
          </div>
          <button
            className="min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50"
            onClick={() => onLeadOpen(lead)}
            type="button"
          >
            <span className="block text-lg font-semibold leading-tight">{lead.name}</span>
            <span className="mt-2 block text-sm leading-6 text-ink/54">{lead.interest}</span>
          </button>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white">
          {pending ? (
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
          ) : (
            <GripVertical size={16} aria-hidden="true" />
          )}
        </span>
      </div>

      <div className="grid gap-2.5 text-sm">
        <FunnelCardMeta icon={UserRound} label={lead.owner} />
        <FunnelCardMeta icon={PhoneCall} label={lead.phone} />
        <FunnelCardMeta icon={CircleDollarSign} label={lead.budget} />
        <FunnelCardMeta icon={Clock3} label={lead.nextContact} />
      </div>

      <div className="mt-5 grid gap-2.5">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">
            Mover para
          </span>
          <select
            aria-label={`Mover ${lead.name} para outra etapa`}
            className="liquid-input bg-white/72 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEditLead || pending}
            onChange={(event) => onLeadStageChange(lead, event.target.value as LeadStageValue)}
            value={currentStageValue}
          >
            {leadStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <Link
            className="icon-button h-11 w-11 bg-white/68"
            href={`/dashboard/whatsapp?lead=${lead.id}`}
            title={`Abrir WhatsApp para ${lead.name}`}
          >
            <MessageCircle size={16} aria-hidden="true" />
          </Link>
          <button className="icon-button h-11 w-11 bg-white/68" type="button" title="Ligar">
            <PhoneCall size={16} aria-hidden="true" />
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-semibold text-white transition hover:bg-ink/90"
            onClick={() => onLeadOpen(lead)}
            type="button"
          >
            Editar lead
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {!canEditLead && (
        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold text-ink/54">
          Somente leitura para este usuario.
        </p>
      )}
    </article>
  );
}

function FunnelHeroMetric({
  icon: Icon,
  label,
  note,
  tone,
  value
}: {
  icon: typeof Target;
  label: string;
  note: string;
  tone: "blue" | "teal" | "dark" | "yellow";
  value: string;
}) {
  const toneClass = {
    blue: "bg-cobalt text-white",
    teal: "bg-lagoon text-white",
    dark: "bg-ink text-white",
    yellow: "bg-signal text-ink"
  }[tone];

  return (
    <article className="rounded-[28px] border border-white/58 bg-white/44 p-4 shadow-[0_18px_40px_rgba(18,23,33,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/54">{label}</p>
          <strong className="mt-3 block text-4xl font-semibold">{value}</strong>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <span className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${toneClass}`}>
        {note}
      </span>
    </article>
  );
}

function FunnelCardMeta({
  icon: Icon,
  label
}: {
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-ink/62">
      <Icon className="shrink-0 text-ink/38" size={15} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function FunnelEmptyState({
  hasSearch,
  onCreateOpen,
  onSearchClear
}: {
  hasSearch: boolean;
  onCreateOpen: () => void;
  onSearchClear: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-white/60 bg-white/36 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
        <Sparkles size={22} aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-semibold">
        {hasSearch ? "Nenhum lead encontrado" : "Seu funil ainda esta vazio"}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/62">
        {hasSearch
          ? "Limpe a busca para voltar a ver os cards do funil."
          : "Crie um lead e comece a acompanhar cada etapa comercial em formato kanban."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasSearch && (
          <button
            className="inline-flex items-center justify-center rounded-full bg-white/64 px-5 py-3 text-sm font-semibold text-ink"
            onClick={onSearchClear}
            type="button"
          >
            Limpar busca
          </button>
        )}
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
          onClick={onCreateOpen}
          type="button"
        >
          <Plus size={18} aria-hidden="true" />
          Novo lead
        </button>
      </div>
    </section>
  );
}

function LeadDataNotice({ leadState }: { leadState: LeadDataState }) {
  if (leadState.mode === "supabase") {
    return (
      <p className="rounded-[24px] bg-lagoon/16 px-5 py-3 text-sm font-medium text-ink">
        Dados reais do Supabase carregados para o funil da organizacao logada.
      </p>
    );
  }

  if (leadState.mode === "not-configured") {
    return (
      <p className="rounded-[24px] bg-signal/30 px-5 py-3 text-sm font-medium text-ink">
        {leadState.message ?? "Usando dados mockados enquanto a base real nao esta disponivel."}
      </p>
    );
  }

  return null;
}

function LeadWorkspaceErrorState({
  message,
  onRetry
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <section className="glass-strong rounded-[34px] p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal/28 text-ink">
            <AlertCircle size={20} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-cobalt">Funil</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Nao foi possivel carregar o funil</h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">
            {message ?? "Tente novamente para recarregar os cards."}
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          onClick={onRetry}
          type="button"
        >
          <RefreshCcw size={18} aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    </section>
  );
}

function buildFunnelColumns(leads: Lead[]) {
  return leadStageOptions.map((option) => ({
    ...option,
    cards: leads.filter((lead) => getLeadStageValue(lead.stage) === option.value)
  }));
}

function matchesFunnelSearch(lead: Lead, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  return [
    lead.name,
    lead.phone,
    lead.email,
    lead.owner,
    lead.stage,
    lead.source,
    lead.city ?? "",
    lead.interest,
    lead.budget
  ]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm);
}

function countStaleLeads(leads: Lead[]) {
  return leads.filter((lead) => lead.nextContact === "A definir").length;
}

async function parseLeadStageUpdateResponse(response: Response): Promise<LeadStageUpdateResponse> {
  try {
    return (await response.json()) as LeadStageUpdateResponse;
  } catch {
    return {};
  }
}

function getLeadStageUpdateErrorMessage(error?: string) {
  if (!error) {
    return "Nao foi possivel mover o lead. Tente novamente.";
  }

  return error;
}
