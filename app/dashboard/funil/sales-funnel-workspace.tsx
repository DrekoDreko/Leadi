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
import type { LeadOwnerOption } from "@/lib/leads/repository.server";
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
    accent: "bg-primary text-primary-foreground",
    card: "border-primary/18 bg-primary/10",
    pulse: "bg-cobalt"
  },
  qualification: {
    accent: "bg-info/22 text-foreground border border-info/28",
    card: "border-lagoon/20 bg-lagoon/12",
    pulse: "bg-lagoon"
  },
  proposal: {
    accent: "bg-signal text-accent-foreground",
    card: "border-signal/40 bg-signal/20",
    pulse: "bg-signal"
  },
  negotiation: {
    accent: "border border-border/72 bg-surface-elevated text-foreground",
    card: "border-border/70 bg-surface-elevated/88",
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
  canManageLeadOwners,
  canReorderLeads = true,
  createLeadAccess,
  leadState,
  leadFilters,
  leadOwnerOptions,
  whatsappTemplates = []
}: {
  aiBalance: number;
  canManageLeadOwners: boolean;
  canReorderLeads?: boolean;
  createLeadAccess: ResourceAccessSummary;
  leadState: LeadDataState;
  leadFilters: LeadUrlFilters;
  leadOwnerOptions: LeadOwnerOption[];
  whatsappTemplates?: SystemTemplate[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftLeadFilters, setDraftLeadFilters] = useState(leadFilters);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [leads, setLeads] = useState(leadState.leads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadEditMode, setIsLeadEditMode] = useState(false);
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
    if (!canReorderLeads || !(lead.canEdit ?? true)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lead.id);
    setDraggedLeadId(lead.id);
    setFeedback(null);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, stage: LeadStageValue) {
    if (!canReorderLeads) {
      return;
    }

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

    if (!canReorderLeads) {
      setDraggedLeadId(null);
      setActiveDropStage(null);
      return;
    }

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

    if (!canReorderLeads || getLeadStageValue(lead.stage) === nextStage || updatingLeadIds.has(lead.id)) {
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
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border/70">
                <Kanban size={14} aria-hidden="true" />
                Funil de vendas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-elevated/90 px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border/70">
                {canReorderLeads ? "Quadro drag and drop com popup de lead" : "Quadro de leitura com popup de lead"}
              </span>
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl xl:text-[2.8rem]">
              Um funil mais amplo, legível e pronto para o consultor agir sem sair da tela.
            </h1>
            <p className="text-muted-soft mt-4 max-w-3xl text-sm leading-7 md:text-base">
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
                className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                onClick={openFilterPopup}
                type="button"
              >
                <Filter size={18} aria-hidden="true" />
                {hasActiveLeadUrlFilters(leadFilters) ? "Filtros ativos" : "Filtros"}
              </button>
              <Link
                className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                href="/dashboard/leads"
              >
                Ver lista
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
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

        <p className="surface-pill mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold">
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
                {canReorderLeads
                  ? "Arraste os cards ou abra o lead para agir na conversa"
                  : "Abra o lead para acompanhar cada etapa da conversa"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink/62">
                {canReorderLeads
                  ? "O card inteiro abre o popup do cliente. Os controles rápidos continuam disponíveis para ligacao, abertura do lead e mudanca de etapa."
                  : "O card inteiro abre o popup do cliente para consulta. A movimentação entre etapas fica a cargo da equipe comercial."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="surface-pill inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold">
                {totalLeads} leads visiveis
              </span>
              <span className="surface-pill inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold">
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
                      className={`flex min-h-[74vh] max-h-[74vh] flex-col overflow-hidden rounded-2xl border transition ${
                        isActiveDrop
                          ? `border-cobalt/70 bg-cobalt/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)]`
                          : "border-border/60 bg-surface/50 dark:bg-surface-elevated/20"
                      }`}
                      key={column.value}
                      onDragLeave={(event) => handleDragLeave(event, column.value)}
                      onDragOver={(event) => handleDragOver(event, column.value)}
                      onDrop={(event) => handleDrop(event, column.value)}
                    >
                      <div className={`h-1.5 w-full ${tone.pulse}`} />
                      
                      <div className="mb-2 px-3 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink dark:text-cloud">
                            {column.label}
                          </h3>
                          <span
                            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold ${tone.accent}`}
                          >
                            {column.cards.length}
                          </span>
                        </div>
                        {column.description && (
                          <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-ink/60 dark:text-cloud/60">
                            {column.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 pb-2 pr-1">
                        {column.cards.map((lead) => (
                          <FunnelLeadCard
                            active={draggedLeadId === lead.id}
                            canManageLeadOwners={canManageLeadOwners}
                            canReorderLeads={canReorderLeads}
                            key={lead.id}
                            lead={lead}
                            onDragEnd={handleDragEnd}
                            onDragStart={handleDragStart}
                            onLeadOpen={(l) => {
                              setSelectedLead(l);
                              setIsLeadEditMode(false);
                            }}
                            onLeadReassign={(l) => {
                              setSelectedLead(l);
                              setIsLeadEditMode(true);
                            }}
                            pending={updatingLeadIds.has(lead.id)}
                          />
                        ))}

                        {column.cards.length === 0 && (
                          <div className="surface-card flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-border/55 p-6 text-center text-sm font-medium leading-6 text-muted-soft">
                            {canReorderLeads
                              ? `Solte um lead aqui para marcar como ${column.label.toLowerCase()}.`
                              : `Nenhum lead em ${column.label.toLowerCase()}.`}
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
        canManageLeadOwners={canManageLeadOwners}
        initialEditMode={isLeadEditMode}
        lead={selectedLead}
        leadOwnerOptions={leadOwnerOptions}
        messageGeneratorEnabled
        onClose={() => {
          setSelectedLead(null);
          setIsLeadEditMode(false);
        }}
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
  canManageLeadOwners,
  canReorderLeads,
  lead,
  onDragEnd,
  onDragStart,
  onLeadOpen,
  onLeadReassign,
  pending
}: {
  active: boolean;
  canManageLeadOwners: boolean;
  canReorderLeads: boolean;
  lead: Lead;
  onDragEnd: () => void;
  onDragStart: (event: DragEvent<HTMLElement>, lead: Lead) => void;
  onLeadOpen: (lead: Lead) => void;
  onLeadReassign: (lead: Lead) => void;
  pending: boolean;
}) {
  const canEditLead = lead.canEdit ?? true;
  const canDragLead = canReorderLeads && canEditLead;
  const phoneHref = buildPhoneHref(lead.phone);
  const stalledState = getLeadStalledState(lead);
  
  const stageValue = getLeadStageValue(lead.stage) as LeadStageValue | undefined;
  const tone = stageValue && stageToneByValue[stageValue] ? stageToneByValue[stageValue] : stageToneByValue.new;

  return (
    <article
      aria-busy={pending}
      className={`relative overflow-hidden rounded-xl border border-border/70 bg-white p-3.5 text-foreground shadow-sm transition dark:bg-surface-elevated ${
        stalledState.isStalled ? "ring-1 ring-signal/60" : ""
      } ${
        active
          ? "scale-[0.98] opacity-50"
          : "hover:-translate-y-0.5 hover:border-border hover:shadow-md"
      } ${
        canDragLead
          ? "cursor-grab active:cursor-grabbing"
          : canEditLead
            ? "cursor-pointer"
            : "cursor-default opacity-72"
      }`}
      draggable={canDragLead && !pending}
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
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${tone.pulse}`} />

      <div className="flex items-start justify-between gap-3 pl-1.5">
        <div className="min-w-0">
          <span className="block text-sm font-semibold leading-tight text-ink dark:text-cloud">{lead.name}</span>
          <span className="mt-1 block text-xs font-medium text-ink/60 dark:text-cloud/60">{lead.owner}</span>
          {stalledState.isStalled && stalledState.daysWithoutUpdate !== null ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-signal/20 px-2 py-0.5 text-[11px] font-semibold text-signal-dark dark:text-signal">
              <Clock3 size={12} aria-hidden="true" />
              Parado ha {stalledState.daysWithoutUpdate} dias
            </span>
          ) : null}
        </div>
        {pending ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-foreground ring-1 ring-border/70">
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
          </span>
        ) : canDragLead ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-foreground ring-1 ring-border/70">
            <GripVertical size={16} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {canManageLeadOwners && stalledState.isStalled ? (
            <button
              className="rounded-full bg-signal/15 px-2.5 py-1 text-[11px] font-semibold text-signal-dark hover:bg-signal/25"
              onClick={(event) => {
                event.stopPropagation();
                onLeadReassign(lead);
              }}
              type="button"
            >
              Redistribuir
            </button>
          ) : null}
          <span className="surface-pill rounded-full px-2.5 py-1 text-[11px] font-semibold">
            {lead.source}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            className="icon-button h-10 w-10 bg-surface-elevated/88"
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
            className="icon-button h-10 w-10 bg-surface-elevated/88"
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
        <p className="surface-pill mt-3 rounded-2xl px-3 py-2 text-xs font-semibold">
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
    blue: "bg-primary text-primary-foreground",
    teal: "border border-info/28 bg-info/22 text-foreground",
    dark: "border border-border/72 bg-surface-elevated text-foreground",
    yellow: "bg-signal text-accent-foreground"
  }[tone];

  return (
    <article className="surface-card-muted rounded-[28px] p-4 shadow-[0_18px_40px_rgba(18,23,33,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-soft text-sm">{label}</p>
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
    <section className="surface-card-muted rounded-[30px] p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
        <Sparkles size={22} aria-hidden="true" />
      </div>
      <h3 className="text-2xl font-semibold">
        {hasActiveFilters ? "Nenhum resultado com estes filtros" : "Seu funil ainda esta vazio"}
      </h3>
      <p className="text-muted-soft mx-auto mt-2 max-w-xl text-sm leading-6">
        {hasActiveFilters
          ? "Ajuste a busca ou limpe os filtros para voltar a ver os cards do funil."
          : "Crie um lead e comece a acompanhar cada etapa comercial em formato kanban."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasActiveFilters && (
          <button
            className="surface-action-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            onClick={onClearFilters}
            type="button"
          >
            Limpar filtros
          </button>
        )}
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
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
      <p className="rounded-[24px] bg-signal/30 px-5 py-3 text-sm font-medium text-foreground">
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
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal/28 text-accent-foreground">
            <AlertCircle size={20} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-cobalt">Funil</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Nao foi possivel carregar o funil</h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">
            {message ?? "Tente novamente para recarregar os cards."}
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
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
