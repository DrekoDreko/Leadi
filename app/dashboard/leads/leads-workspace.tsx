"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Inbox,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  X
} from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import type { Lead } from "@/data/mock";
import { LeadDetailsPopup } from "@/components/dashboard/lead-details-popup";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import {
  defaultLeadUrlFilters,
  hasActiveLeadUrlFilters,
  leadPeriodFilterOptions,
  leadScoreFilterOptions,
  leadSourceFilterOptions,
  leadStageFilterOptions,
  type LeadUrlFilters
} from "@/lib/leads/filters";
import {
  DEFAULT_LEAD_PAGE_SIZE,
  type LeadDataMode,
  type LeadDataState,
  type LeadPaginationMeta
} from "@/lib/leads/repository";
import { LeadCreateModal } from "./lead-create-modal";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";

const filterKeys: Array<keyof LeadUrlFilters> = [
  "stage",
  "source",
  "city",
  "score",
  "period",
  "search"
];
const paginationQueryKeys = ["limit", "offset"];

export function LeadsWorkspace({
  createLeadAccess,
  hasOpenAIConnection,
  initialLeadId,
  initialLeadPanel,
  leadFilters,
  leadState
}: {
  createLeadAccess: ResourceAccessSummary;
  hasOpenAIConnection: boolean;
  initialLeadId: string | null;
  initialLeadPanel: "details" | "message";
  leadFilters: LeadUrlFilters;
  leadState: LeadDataState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState(leadState.leads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(() =>
    initialLeadId ? leadState.leads.find((lead) => lead.id === initialLeadId) ?? null : null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(leadFilters.search);
  const [draftLeadFilters, setDraftLeadFilters] = useState(leadFilters);
  const [pagination, setPagination] = useState(leadState.pagination);
  const [isLoadingMoreLeads, setIsLoadingMoreLeads] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [selectedLeadPanel, setSelectedLeadPanel] = useState<"details" | "message">(initialLeadPanel);

  const visibleLeads = leads;
  const hasActiveFilters = searchTerm.trim().length > 0 || hasActiveLeadUrlFilters(leadFilters);
  const isErrorState = leadState.mode === "error" || leadState.mode === "unauthenticated";
  const isEmptyWithoutFilters = !isErrorState && leads.length === 0 && !hasActiveFilters;
  const isEmptyWithFilters = !isErrorState && hasActiveFilters && leads.length === 0;
  const kanbanColumns = buildKanbanColumns(visibleLeads);
  const newLeads = visibleLeads.filter((lead) => lead.stage === "Novo lead").length;
  const qualifiedLeads = visibleLeads.filter((lead) => lead.stage === "Qualificação").length;
  const proposalLeads = visibleLeads.filter((lead) => lead.stage === "Proposta").length;
  const selectedLeadCanEdit = selectedLead?.canEdit ?? true;
  const selectedLeadCanDelete = selectedLead?.canDelete ?? leadState.canDeleteLeads;
  const canCreateLeads = createLeadAccess.allowed;

  const replaceLeadUrlFilters = useCallback((nextFilters: LeadUrlFilters) => {
    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");

    for (const key of filterKeys) {
      const value = nextFilters[key];

      if (isDefaultLeadUrlFilterValue(key, value)) {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, value);
      }
    }

    for (const key of paginationQueryKeys) {
      nextSearchParams.delete(key);
    }

    const query = nextSearchParams.toString();
    const currentPathname = pathname ?? "/dashboard/leads";
    router.replace(query ? `${currentPathname}?${query}` : currentPathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setLeads(leadState.leads);
    setPagination(leadState.pagination);
    setLoadMoreError(null);
    setIsLoadingMoreLeads(false);
  }, [leadState.leads, leadState.pagination]);

  useEffect(() => {
    if (!initialLeadId) {
      return;
    }

    const leadFromQuery = leadState.leads.find((lead) => lead.id === initialLeadId) ?? null;
    setSelectedLead(leadFromQuery);
    setSelectedLeadPanel(initialLeadPanel);
  }, [initialLeadId, initialLeadPanel, leadState.leads]);

  useEffect(() => {
    setSearchTerm(leadFilters.search);
  }, [leadFilters.search]);

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

  function clearFilters() {
    setSearchTerm("");
    replaceLeadUrlFilters(defaultLeadUrlFilters);
  }

  function handleRefresh() {
    router.refresh();
  }

  async function handleLoadMoreLeads() {
    if (!pagination.hasMore || pagination.nextOffset === null || isLoadingMoreLeads) {
      return;
    }

    setIsLoadingMoreLeads(true);
    setLoadMoreError(null);

    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");
    nextSearchParams.set(
      "limit",
      String(pagination.limit ?? leadState.pagination.limit ?? DEFAULT_LEAD_PAGE_SIZE)
    );
    nextSearchParams.set("offset", String(pagination.nextOffset));

    try {
      const response = await fetch(`/api/leads?${nextSearchParams.toString()}`, {
        headers: {
          Accept: "application/json"
        }
      });
      const data = (await response.json()) as LeadDataState;

      if (!response.ok || data.mode === "error" || data.mode === "unauthenticated") {
        throw new Error(data.message ?? "Nao foi possivel carregar mais leads.");
      }

      setLeads((currentLeads) => {
        const currentLeadIds = new Set(currentLeads.map((lead) => lead.id));
        const nextLeads = data.leads.filter((lead) => !currentLeadIds.has(lead.id));

        return [...currentLeads, ...nextLeads];
      });
      setPagination(data.pagination);
    } catch (error) {
      setLoadMoreError(getFriendlyErrorMessage(error).message);
    } finally {
      setIsLoadingMoreLeads(false);
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

  function openLeadDetails(lead: Lead) {
    setSelectedLead(lead);
    setSelectedLeadPanel("details");
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
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canCreateLeads}
          onClick={() => (canCreateLeads ? setIsCreateOpen(true) : undefined)}
          type="button"
        >
          <Plus size={18} aria-hidden="true" />
          Novo lead
        </button>
      </PageHeading>

      {!canCreateLeads ? <SubscriptionAccessBanner notice={createLeadAccess} /> : null}

      <LeadDataNotice leadState={leadState} />

      {createFeedback && (
        <p className="flex items-center gap-2 rounded-[24px] bg-lagoon/16 px-5 py-3 text-sm font-medium text-ink">
          <CheckCircle2 className="shrink-0 text-lagoon" size={18} aria-hidden="true" />
          {createFeedback}
        </p>
      )}


      {isErrorState ? (
        <LeadWorkspaceErrorState message={leadState.message} onRetry={handleRefresh} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Metric
              label="Novos leads"
              value={String(newLeads)}
              note={`${visibleLeads.length} exibidos`}
              tone="blue"
            />
            <Metric label="Qualificação" value={String(qualifiedLeads)} note="em diagnóstico" tone="teal" />
            <Metric label="Propostas" value={String(proposalLeads)} note="em negociação" tone="yellow" />
          </div>

          <LeadFiltersPopup
            open={isFilterPopupOpen}
            onApply={applyDraftFilters}
            onClose={closeFilterPopup}
            onClear={clearDraftFilters}
            onChange={setDraftLeadFilters}
            value={draftLeadFilters}
          />

          {isEmptyWithoutFilters ? (
            <LeadWorkspaceEmptyState
              mode="empty"
              onCreateOpen={canCreateLeads ? () => setIsCreateOpen(true) : undefined}
              onRetry={handleRefresh}
            />
          ) : isEmptyWithFilters ? (
            <LeadWorkspaceEmptyState
              mode="filtered"
              onClearFilters={clearFilters}
              onCreateOpen={canCreateLeads ? () => setIsCreateOpen(true) : undefined}
            />
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
                <div className="min-w-0 flex h-full flex-col gap-4 xl:col-span-2">
                  <LeadTablePanel
                    leads={visibleLeads}
                    hasActiveFilters={hasActiveFilters}
                    onSearchChange={setSearchTerm}
                    searchTerm={searchTerm}
                    onOpenFilters={openFilterPopup}
                    onCreateOpen={canCreateLeads ? () => setIsCreateOpen(true) : undefined}
                    onLeadOpen={openLeadDetails}
                  />
                  <LeadKanbanPanel
                    columns={kanbanColumns}
                    onLeadOpen={openLeadDetails}
                  />
                </div>
              </section>
              <LeadPaginationControls
                error={loadMoreError}
                isLoading={isLoadingMoreLeads}
                onLoadMore={handleLoadMoreLeads}
                pagination={pagination}
                visibleCount={visibleLeads.length}
              />
            </>
          )}
        </>
      )}

      <LeadCreateModal
        canCreateMetaAdsLeads={leadState.canCreateMetaAdsLeads}
        createLeadAccess={createLeadAccess}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleLeadCreated}
        open={isCreateOpen}
      />
      <LeadDetailsPopup
        hasOpenAIConnection={hasOpenAIConnection}
        initialPanel={selectedLeadPanel}
        lead={selectedLead}
        messageGeneratorEnabled
        onClose={() => setSelectedLead(null)}
        onDeleted={selectedLeadCanDelete ? handleLeadDeleted : undefined}
        onUpdated={selectedLeadCanEdit ? handleLeadUpdated : undefined}
      />
    </div>
  );
}

function LeadPaginationControls({
  pagination,
  visibleCount,
  isLoading,
  error,
  onLoadMore
}: {
  pagination: LeadPaginationMeta;
  visibleCount: number;
  isLoading: boolean;
  error: string | null;
  onLoadMore: () => void;
}) {
  const total = Math.max(pagination.total, visibleCount);
  const countLabel =
    total > visibleCount
      ? `${visibleCount} de ${total} leads exibidos`
      : `${visibleCount} leads exibidos`;

  return (
    <div className="flex flex-col gap-3 rounded-[26px] border border-white/52 bg-white/38 px-5 py-4 text-sm font-medium text-ink/70 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span>{countLabel}</span>
        {error ? <p className="mt-1 text-sm text-ink">{error}</p> : null}
      </div>

      {pagination.hasMore ? (
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          onClick={onLoadMore}
          type="button"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          {isLoading ? "Carregando" : "Carregar mais"}
        </button>
      ) : (
        <span className="rounded-full bg-white/64 px-4 py-2 text-xs font-semibold text-ink/56">
          Todos carregados
        </span>
      )}
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

  if (leadState.mode === "not-configured") {
    return (
      <p className="rounded-[24px] bg-signal/30 px-5 py-3 text-sm font-medium text-ink">
        {leadState.message ?? "Usando dados mockados enquanto a base real nao esta disponivel."}
      </p>
    );
  }

  return null;
}

function LeadFiltersPopup({
  open,
  value,
  onChange,
  onApply,
  onClear,
  onClose
}: {
  open: boolean;
  value: LeadUrlFilters;
  onChange: (value: LeadUrlFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
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
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="mx-auto w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/70 bg-cloud/95 p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="text-sm font-medium text-cobalt">CRM</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Filtros de leads</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
              Ajuste os filtros e aplique em uma unica etapa.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={onClose} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <LeadFilterField label="Etapa">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    stage: event.target.value as LeadUrlFilters["stage"]
                  })
                }
                value={value.stage}
              >
                {leadStageFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>

            <LeadFilterField label="Origem">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    source: event.target.value as LeadUrlFilters["source"]
                  })
                }
                value={value.source}
              >
                {leadSourceFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>

            <LeadFilterField label="Cidade">
              <input
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    city: event.target.value
                  })
                }
                placeholder="Cidade"
                type="text"
                value={value.city}
              />
            </LeadFilterField>

            <LeadFilterField label="Score">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    score: event.target.value as LeadUrlFilters["score"]
                  })
                }
                value={value.score}
              >
                {leadScoreFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>

            <LeadFilterField label="Período">
              <select
                className="liquid-input text-sm"
                onChange={(event) =>
                  onChange({
                    ...value,
                    period: event.target.value as LeadUrlFilters["period"]
                  })
                }
                value={value.period}
              >
                {leadPeriodFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadFilterField>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-ink/10 pt-5">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/54 px-5 py-3 text-sm font-semibold text-ink"
              onClick={onClear}
              type="button"
            >
              Limpar filtros
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-white/72 px-5 py-3 text-sm font-semibold text-ink"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white"
              onClick={onApply}
              type="button"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function LeadFilterField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/72">{label}</span>
      {children}
    </label>
  );
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
          <p className="text-sm font-medium text-cobalt">Leads</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Nao foi possivel carregar os leads</h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">
            {message ? getFriendlyErrorMessage(message).message : "Tente novamente para recarregar a lista."}
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

function LeadWorkspaceEmptyState({
  mode,
  onClearFilters,
  onCreateOpen,
  onRetry
}: {
  mode: "empty" | "filtered";
  onClearFilters?: () => void;
  onCreateOpen?: () => void;
  onRetry?: () => void;
}) {
  const isFiltered = mode === "filtered";

  return (
    <section className="glass-strong rounded-[34px] p-6 md:p-8 xl:col-span-2">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
            {isFiltered ? <Filter size={20} aria-hidden="true" /> : <Inbox size={20} aria-hidden="true" />}
          </div>
          <p className="text-sm font-medium text-cobalt">Leads</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
            {isFiltered ? "Nenhum resultado com estes filtros" : "Nenhum lead cadastrado"}
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">
            {isFiltered
              ? "Ajuste a busca ou limpe os filtros para voltar a ver a lista."
              : "Crie o primeiro lead para iniciar o funil da equipe."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isFiltered && onClearFilters && (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/54 px-5 py-3 text-sm font-semibold text-ink"
              onClick={onClearFilters}
              type="button"
            >
              <Filter size={18} aria-hidden="true" />
              Limpar filtros
            </button>
          )}

          {onRetry && !isFiltered && (
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/54 px-5 py-3 text-sm font-semibold text-ink"
              onClick={onRetry}
              type="button"
            >
              <RefreshCcw size={18} aria-hidden="true" />
              Tentar novamente
            </button>
          )}

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!onCreateOpen}
            onClick={onCreateOpen}
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
            Novo lead
          </button>
        </div>
      </div>
    </section>
  );
}

function LeadTablePanel({
  leads,
  hasActiveFilters,
  onSearchChange,
  searchTerm,
  onOpenFilters,
  onCreateOpen,
  onLeadOpen
}: {
  leads: Lead[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  searchTerm: string;
  onOpenFilters: () => void;
  onCreateOpen?: () => void;
  onLeadOpen: (lead: Lead) => void;
}) {
  return (
    <section className="glass-strong flex h-full flex-col rounded-[34px] p-5">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-ink/54">CRM</p>
          <h2 className="text-2xl font-semibold">Leads</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:w-[320px] xl:w-[380px]">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/42"
              size={17}
              aria-hidden="true"
            />
            <input
              aria-label="Buscar leads"
              className="liquid-input pl-11 text-sm"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome, email, telefone, cidade ou empresa"
              type="search"
              value={searchTerm}
            />
          </label>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/54 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            onClick={onOpenFilters}
            type="button"
          >
            <Filter size={18} aria-hidden="true" />
            {hasActiveFilters ? "Filtros ativos" : "Filtros"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!onCreateOpen}
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

        {leads.map((lead) => {
          return (
            <article
              className="grid gap-3 border-b border-ink/8 px-5 py-4 text-left transition hover:bg-white/34 last:border-0 md:grid-cols-[minmax(240px,1.35fr)_160px_210px_120px_110px_44px] md:items-center"
              key={lead.id}
            >
              <button
                className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 md:pr-2"
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                <span className="block font-semibold leading-tight">{lead.name}</span>
                <span className="mt-1 block text-sm text-ink/54 md:hidden">{lead.phone}</span>
              </button>

              <button
                className="text-left text-sm font-medium text-ink/84 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 md:pr-2"
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                {lead.phone}
              </button>

              <button
                className="text-left text-sm text-ink/62 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 md:pr-2"
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                {lead.email}
              </button>

              <button
                className="text-left text-sm text-ink/62 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 md:pr-2"
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                {lead.owner}
              </button>

              <div
                className="md:pr-2"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <LeadStageBadge
                  stage={lead.stage}
                  variant="table"
                />
              </div>

              <button
                className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/54 text-ink/58 transition hover:bg-white/76 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 md:inline-flex"
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                <span className="sr-only">Abrir detalhes de {lead.name}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </article>
          );
        })}
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
        <Link
          className="icon-button"
          href="/dashboard/funil"
          title="Visualizar todo o funil"
        >
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
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
              <article
                className={`${column.color} flex w-full flex-col justify-between rounded-[24px] p-4 text-left shadow-soft transition hover:-translate-y-0.5`}
                key={lead.id}
              >
                <div className="space-y-3">
                  <button
                    className="block text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50"
                    onClick={() => onLeadOpen(lead)}
                    type="button"
                  >
                    <span className="block font-semibold leading-tight">{lead.name}</span>
                    <span className="mt-1 block text-sm opacity-85">{lead.owner}</span>
                  </button>
                </div>
                <div
                  className="mt-4"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <LeadStageBadge
                    stage={lead.stage}
                    variant="kanban"
                  />
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function isDefaultLeadUrlFilterValue(key: keyof LeadUrlFilters, value: string) {
  return value === defaultLeadUrlFilters[key];
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


function LeadStageBadge({
  stage,
  variant
}: {
  stage: string;
  variant: "table" | "kanban";
}) {
  const isKanban = variant === "kanban";

  return (
    <div className={`block ${isKanban ? "w-full" : "w-full max-w-[220px]"}`}>
      <span
        className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] ${
          isKanban ? "text-white/70" : "text-ink/40"
        }`}
      >
        Etapa
      </span>
      <div
        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
          isKanban
            ? "bg-white/10 text-white ring-white/20"
            : "bg-white/80 text-ink ring-black/5 shadow-sm"
        }`}
      >
        {stage}
      </div>
    </div>
  );
}
