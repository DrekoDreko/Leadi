"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type DragEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
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
  TrendingUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Lead } from "@/data/mock";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { LeadFiltersPopup } from "@/components/dashboard/lead-filters-popup";
import {
  defaultLeadUrlFilters,
  filterKeys,
  hasActiveLeadUrlFilters,
  type LeadUrlFilters
} from "@/lib/leads/filters";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import {
  getLeadStageLabel,
  getLeadStageMeta,
  getLeadStageValue,
  isLeadClosedStage,
  isLeadWonStage,
  leadStageOptions,
  type LeadStageValue
} from "@/lib/leads/stages";
import type { LeadDataMode, LeadDataState } from "@/lib/leads/repository";
import type { SystemTemplate } from "@/lib/templates/types";
import { LeadCreateModal } from "../leads/lead-create-modal";

type StageTone = {
  accent: string;
  card: string;
  pulse: string;
};

type LeadStageUpdateResponse = {
  lead?: Lead;
  error?: string;
  mode?: LeadDataMode;
};

const STALLED_LEAD_DAYS = 7;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const stageToneByValue: Record<LeadStageValue, StageTone> = {
  new: {
    accent: "bg-cobalt text-white",
    card: "border-cobalt/18 bg-cobalt/10",
    pulse: "bg-cobalt"
  },
  qualification: {
    accent: "bg-lagoon text-white",
    card: "border-lagoon/20 bg-lagoon/12",
    pulse: "bg-lagoon"
  },
  proposal: {
    accent: "bg-signal text-ink dark:text-cloud",
    card: "border-signal/40 bg-signal/20",
    pulse: "bg-signal"
  },
  negotiation: {
    accent: "bg-ink text-cloud",
    card: "border-ink/14 bg-ink/8",
    pulse: "bg-ink"
  },
  won: {
    accent: "bg-emerald-600 text-white",
    card: "border-emerald-500/20 bg-emerald-500/12",
    pulse: "bg-emerald-600"
  },
  lost: {
    accent: "bg-red-600 text-white",
    card: "border-red-500/18 bg-red-500/10",
    pulse: "bg-red-600"
  }
};

export function SalesFunnelWorkspace({
  aiBalance,
  createLeadAccess,
  leadState,
  leadFilters,
  whatsappTemplates = []
}: {
  aiBalance: number;
  createLeadAccess: ResourceAccessSummary;
  leadState: LeadDataState;
  leadFilters: LeadUrlFilters;
  whatsappTemplates?: SystemTemplate[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftLeadFilters, setDraftLeadFilters] = useState(leadFilters);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [leads, setLeads] = useState(leadState.leads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(leadFilters.search);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeDropStage, setActiveDropStage] = useState<LeadStageValue | null>(null);
  const [updatingLeadIds, setUpdatingLeadIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const visibleLeads = leads;
  const hasActiveFilters = searchTerm.trim().length > 0 || hasActiveLeadUrlFilters(leadFilters);
  const columns = buildFunnelColumns(visibleLeads);
  const totalLeads = visibleLeads.length;
  const openLeads = visibleLeads.filter((lead) => !isLeadClosedStage(lead.stage)).length;
  const wonLeads = visibleLeads.filter((lead) => isLeadWonStage(lead.stage)).length;
  const proposalLeads = visibleLeads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const stalledOpenLeads = visibleLeads.filter((lead) => getLeadStalledState(lead).isStalled).length;
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

  useEffect(() => {
    if (!isFilterPopupOpen) {
      setDraftLeadFilters(leadFilters);
    }
  }, [isFilterPopupOpen, leadFilters]);

  const replaceLeadUrlFilters = useCallback((nextFilters: LeadUrlFilters) => {
    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");

    for (const key of filterKeys) {
      const value = nextFilters[key];

      if (isDefaultLeadUrlFilterValue(key, value as string | boolean)) {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, String(value));
      }
    }

    const query = nextSearchParams.toString();
    const currentPathname = pathname ?? "/dashboard/funil";
    router.replace(query ? `${currentPathname}?${query}` : currentPathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setSearchTerm(leadFilters.search);
  }, [leadFilters.search]);

  useEffect(() => {
    const nextSearch = searchTerm.trim();

    if (nextSearch === leadFilters.search) {
      return;
    }

    const debounceId = window.setTimeout(() => {
      replaceLeadUrlFilters({
        ...leadFilters,
        search: nextSearch
      });
    }, 350);

    return () => window.clearTimeout(debounceId);
  }, [leadFilters, replaceLeadUrlFilters, searchTerm]);

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



  function openFilterPopup() {
    setDraftLeadFilters(leadFilters);
    setIsFilterPopupOpen(true);
  }

  function closeFilterPopup() {
    setIsFilterPopupOpen(false);
  }

  function applyDraftFilters() {
    replaceLeadUrlFilters(draftLeadFilters);
    setIsFilterPopupOpen(false);
  }

  function clearDraftFilters() {
    const nextFilters = defaultLeadUrlFilters;
    setDraftLeadFilters(nextFilters);
    replaceLeadUrlFilters(nextFilters);
    setIsFilterPopupOpen(false);
  }

  function clearAllFilters() {
    setSearchTerm("");
    replaceLeadUrlFilters(defaultLeadUrlFilters);
    setDraftLeadFilters(defaultLeadUrlFilters);
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

    if (getLeadStageValue(lead.stage) === nextStage || updatingLeadIds.has(lead.id)) {
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
    setUpdatingLeadIds((prev) => {
      const next = new Set(prev);
      next.add(lead.id);
      return next;
    });
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
      setUpdatingLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass-strong overflow-hidden rounded-[40px] p-5 md:p-6 xl:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cloud">
                <Kanban size={14} aria-hidden="true" />
                Funil de vendas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/64 px-3 py-1.5 text-xs font-semibold text-ink/68">
                Quadro drag and drop com popup de lead
              </span>
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl xl:text-[2.8rem]">
              Um funil mais amplo, legível e pronto para o consultor agir sem sair da tela.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/64 md:text-base">
              Mantivemos as etapas atuais do CRM, mas com uma leitura mais próxima de quadro
              comercial: colunas largas, cards clicáveis e acesso rápido a ligação, mensagem e
              comentários do lead.
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
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                aria-label="Buscar no funil"
                className="liquid-input pl-11 text-sm"
                enterKeyHint="search"
                name="sales-funnel-search"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, telefone, cidade ou interesse"
                spellCheck={false}
                type="search"
                value={searchTerm}
              />
            </label>

            <div className="flex w-full flex-wrap gap-2 xl:justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/54 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                onClick={openFilterPopup}
                type="button"
              >
                <Filter size={18} aria-hidden="true" />
                {hasActiveLeadUrlFilters(leadFilters) ? "Filtros ativos" : "Filtros"}
              </button>
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

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FunnelHeroMetric
            icon={BriefcaseBusiness}
            label="Leads no funil"
            note={`${openLeads} em aberto`}
            tone="blue"
            value={String(totalLeads)}
          />
          <FunnelHeroMetric
            icon={Sparkles}
            label={getLeadStageLabel("proposal")}
            note="em simulacao"
            tone="teal"
            value={String(proposalLeads)}
          />
          <FunnelHeroMetric
            icon={TrendingUp}
            label={getLeadStageLabel("won")}
            note="fechados no periodo"
            tone="dark"
            value={String(wonLeads)}
          />
          <FunnelHeroMetric
            icon={Clock3}
            label="Leads parados"
            note={`${STALLED_LEAD_DAYS}+ dias sem atualizar`}
            tone="yellow"
            value={String(stalledOpenLeads)}
          />
        </div>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-xs font-semibold text-ink/64">
          <Clock3 className="text-signal" size={14} aria-hidden="true" />
          Parado = lead em etapa aberta sem atualizacao ha pelo menos {STALLED_LEAD_DAYS} dias.
        </p>

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
                    <p className="mt-1 text-xs leading-5 text-ink/56">{column.description}</p>
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
          className={`flex items-center gap-2 rounded-[24px] px-5 py-3 text-sm font-medium text-ink dark:text-cloud ${
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
                Arraste os cards ou abra o lead para agir na conversa
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink/62">
                O card inteiro abre o popup do cliente. Os controles rápidos continuam disponíveis
                para ligacao, abertura do lead e mudanca de etapa.
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
              hasActiveFilters={hasActiveFilters}
              onCreateOpen={() => setIsCreateOpen(true)}
              onClearFilters={clearAllFilters}
            />
          ) : (
            <div className="-mx-1 overflow-x-auto pb-2">
              <div className="grid min-w-max auto-cols-[minmax(260px,290px)] grid-flow-col gap-4 px-1">
                {columns.map((column) => {
                  const tone = stageToneByValue[column.value];
                  const isActiveDrop = activeDropStage === column.value;

                  return (
                    <section
                      aria-label={`Etapa ${column.label}`}
                      className={`flex min-h-[74vh] max-h-[74vh] flex-col rounded-[30px] border p-3 transition ${
                        isActiveDrop
                          ? "border-cobalt/70 bg-cobalt/14 shadow-[0_28px_72px_rgba(52,98,238,0.18)]"
                          : `${tone.card} border-white/56`
                      }`}
                      key={column.value}
                      onDragLeave={(event) => handleDragLeave(event, column.value)}
                      onDragOver={(event) => handleDragOver(event, column.value)}
                      onDrop={(event) => handleDrop(event, column.value)}
                    >
                      <div className="mb-3 rounded-[24px] bg-white/54 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`mb-3 block h-2.5 w-14 rounded-full ${tone.pulse}`} />
                            <h3 className="text-lg font-semibold">{column.label}</h3>
                            <p className="mt-1 text-sm leading-6 text-ink/56">{column.description}</p>
                          </div>
                          <span
                            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold ${tone.accent}`}
                          >
                            {column.cards.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
                        {column.cards.map((lead) => (
                          <FunnelLeadCard
                            active={draggedLeadId === lead.id}
                            key={lead.id}
                            lead={lead}
                            onDragEnd={handleDragEnd}
                            onDragStart={handleDragStart}
                            onLeadOpen={setSelectedLead}
                            pending={updatingLeadIds.has(lead.id)}
                          />
                        ))}

                        {column.cards.length === 0 && (
                          <div className="flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-ink/14 bg-white/30 p-6 text-center text-sm font-medium leading-6 text-ink/48">
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
        createLeadAccess={createLeadAccess}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleLeadCreated}
        open={isCreateOpen}
      />
      <LeadDetailsPopup
        aiBalance={aiBalance}
        lead={selectedLead}
        messageGeneratorEnabled
        onClose={() => setSelectedLead(null)}
        onDeleted={selectedLeadCanDelete ? handleLeadDeleted : undefined}
        onUpdated={selectedLeadCanEdit ? handleLeadUpdated : undefined}
        whatsappTemplates={whatsappTemplates}
      />
      <LeadFiltersPopup
        open={isFilterPopupOpen}
        onApply={applyDraftFilters}
        onClose={closeFilterPopup}
        onClear={clearDraftFilters}
        onChange={setDraftLeadFilters}
        value={draftLeadFilters}
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
  pending
}: {
  active: boolean;
  lead: Lead;
  onDragEnd: () => void;
  onDragStart: (event: DragEvent<HTMLElement>, lead: Lead) => void;
  onLeadOpen: (lead: Lead) => void;
  pending: boolean;
}) {
  const canEditLead = lead.canEdit ?? true;
  const phoneHref = buildPhoneHref(lead.phone);
  const stalledState = getLeadStalledState(lead);

  return (
    <article
      aria-busy={pending}
      className={`rounded-[18px] border border-white/72 bg-white/72 p-3.5 text-ink shadow-soft transition ${
        stalledState.isStalled ? "ring-1 ring-signal/35" : ""
      } ${
        active
          ? "scale-[0.985] opacity-60"
          : "hover:-translate-y-1 hover:bg-white/84 hover:shadow-[0_24px_44px_rgba(18,23,33,0.12)]"
      } ${canEditLead ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-72"}`}
      draggable={canEditLead && !pending}
      onClick={() => onLeadOpen(lead)}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, lead)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onLeadOpen(lead);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <span className="mb-2.5 block h-1.5 w-10 rounded-full bg-lagoon" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-sm font-semibold leading-tight text-ink">{lead.name}</span>
          <span className="mt-1 block text-xs font-medium text-ink/56">{lead.owner}</span>
          {stalledState.isStalled && stalledState.daysWithoutUpdate !== null ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-signal/26 px-2.5 py-1 text-[11px] font-semibold text-ink">
              <Clock3 size={12} aria-hidden="true" />
              Parado ha {stalledState.daysWithoutUpdate} dias
            </span>
          ) : null}
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-cloud">
          {pending ? (
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
          ) : (
            <GripVertical size={16} aria-hidden="true" />
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink/6 px-2.5 py-1 text-[11px] font-semibold text-ink/64">
            {lead.source}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            className="icon-button h-10 w-10 bg-white/68"
            onClick={(event) => {
              event.stopPropagation();
              onLeadOpen(lead);
            }}
            title={`Abrir lead ${lead.name}`}
            type="button"
          >
            <MessageCircle size={16} aria-hidden="true" />
          </button>
          <a
            className="icon-button h-10 w-10 bg-white/68"
            href={phoneHref ?? "#"}
            onClick={(event) => {
              event.stopPropagation();

              if (!phoneHref) {
                event.preventDefault();
              }
            }}
            title="Ligar"
          >
            <PhoneCall size={16} aria-hidden="true" />
          </a>
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
  icon: LucideIcon;
  label: string;
  note: string;
  tone: "blue" | "teal" | "dark" | "yellow";
  value: string;
}) {
  const toneClass = {
    blue: "bg-cobalt text-white",
    teal: "bg-lagoon text-white",
    dark: "bg-ink text-cloud",
    yellow: "bg-signal text-ink dark:text-cloud"
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

function FunnelEmptyState({
  hasActiveFilters,
  onCreateOpen,
  onClearFilters
}: {
  hasActiveFilters: boolean;
  onCreateOpen: () => void;
  onClearFilters: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-white/60 bg-white/36 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
        <Sparkles size={22} aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-semibold">
        {hasActiveFilters ? "Nenhum resultado com estes filtros" : "Seu funil ainda esta vazio"}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/62">
        {hasActiveFilters
          ? "Ajuste a busca ou limpe os filtros para voltar a ver os cards do funil."
          : "Crie um lead e comece a acompanhar cada etapa comercial em formato kanban."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasActiveFilters && (
          <button
            className="inline-flex items-center justify-center rounded-full bg-white/64 px-5 py-3 text-sm font-semibold text-ink"
            onClick={onClearFilters}
            type="button"
          >
            Limpar filtros
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
      <p className="rounded-[24px] bg-signal/30 px-5 py-3 text-sm font-medium text-ink dark:text-cloud">
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
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal/28 text-ink dark:text-cloud">
            <AlertCircle size={20} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-cobalt">Funil</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Nao foi possivel carregar o funil</h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">
            {message ?? "Tente novamente para recarregar os cards."}
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud"
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
    description: getLeadStageMeta(option.value)?.description ?? "",
    cards: leads.filter((lead) => getLeadStageValue(lead.stage) === option.value)
  }));
}

function isDefaultLeadUrlFilterValue(key: keyof LeadUrlFilters, value: string | boolean) {
  if (key === "search") return value === "";
  return value === defaultLeadUrlFilters[key];
}

function buildPhoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : undefined;
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

type LeadStalledState = {
  isStalled: boolean;
  daysWithoutUpdate: number | null;
};

function getLeadStalledState(lead: Lead, now = new Date()): LeadStalledState {
  if (isLeadClosedStage(lead.stage)) {
    return { isStalled: false, daysWithoutUpdate: null };
  }

  const activityAt = lead.updatedAt ?? lead.receivedAt;

  if (!activityAt) {
    return { isStalled: false, daysWithoutUpdate: null };
  }

  const activityDate = new Date(activityAt);

  if (Number.isNaN(activityDate.getTime())) {
    return { isStalled: false, daysWithoutUpdate: null };
  }

  const daysWithoutUpdate = Math.max(0, Math.floor((now.getTime() - activityDate.getTime()) / DAY_IN_MS));

  return {
    isStalled: daysWithoutUpdate >= STALLED_LEAD_DAYS,
    daysWithoutUpdate
  };
}
