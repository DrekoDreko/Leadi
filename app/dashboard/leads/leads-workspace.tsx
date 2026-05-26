"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Archive,
  Download,
  FileText,
  Filter,
  Inbox,
  Loader2,
  Megaphone,
  Plus,
  RefreshCcw,
  Search,
  UploadCloud,
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
  type LeadUrlFilters
} from "@/lib/leads/filters";
import { getLeadStageLabel, getLeadStageValue } from "@/lib/leads/stages";
import {
  DEFAULT_LEAD_PAGE_SIZE,
  type LeadDataMode,
  type LeadDataState,
  type LeadPaginationMeta
} from "@/lib/leads/repository";
import type { LeadOwnerOption } from "@/lib/leads/repository.server";
import { LeadCreateModal } from "./lead-create-modal";
import { LeadFiltersPopup } from "@/components/dashboard/lead-filters-popup";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import type { SystemTemplate } from "@/lib/templates/types";
import type {
  MetaLeadImportResponse,
  MetaLeadImportSource,
  MetaLeadImportSourcesState
} from "@/lib/meta/manual-lead-import.types";
import { getLeadQualityLabel, getLeadQualityMeta } from "@/lib/leads/quality";
import {
  getLeadOriginBadgeClassName,
  getLeadOriginSummary
} from "@/lib/leads/source";

const filterKeys: Array<keyof LeadUrlFilters> = [
  "stage",
  "source",
  "city",
  "period",
  "search",
  "archived",
  "owner",
  "campaign"
];
const paginationQueryKeys = ["limit", "offset"];
type LeadWorkspaceFeedbackTone = "success" | "warning" | "error";
type LeadBulkAssignMode = "supabase" | "not-configured";
type LeadBulkAssignResponse = {
  leads?: Lead[];
  updatedCount?: number;
  error?: string;
  mode?: LeadBulkAssignMode;
};

export function LeadsWorkspace({
  canManageLeadOwners,
  createLeadAccess,
  aiBalance,
  initialLeadId,
  initialLeadPanel,
  leadFilters,
  leadOwnerOptions,
  leadState,
  whatsappTemplates = [],
  title = "Leads"
}: {
  canManageLeadOwners: boolean;
  createLeadAccess: ResourceAccessSummary;
  aiBalance: number;
  initialLeadId: string | null;
  initialLeadPanel: "details" | "message";
  leadFilters: LeadUrlFilters;
  leadOwnerOptions: LeadOwnerOption[];
  leadState: LeadDataState;
  whatsappTemplates?: SystemTemplate[];
  title?: string;
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
  const [feedback, setFeedback] = useState<{
    tone: LeadWorkspaceFeedbackTone;
    text: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState(leadFilters.search);
  const [draftLeadFilters, setDraftLeadFilters] = useState(leadFilters);
  const [pagination, setPagination] = useState(leadState.pagination);
  const [isLoadingMoreLeads, setIsLoadingMoreLeads] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [selectedLeadPanel, setSelectedLeadPanel] = useState<"details" | "message">(initialLeadPanel);
  const [isMetaImportOpen, setIsMetaImportOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedBulkOwnerProfileId, setSelectedBulkOwnerProfileId] = useState("");
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  const bulkAssignableOwnerOptions = canManageLeadOwners
    ? leadOwnerOptions.filter((option) => option.role === "seller")
    : [];

  const visibleLeads = leads;
  const hasActiveFilters = searchTerm.trim().length > 0 || hasActiveLeadUrlFilters(leadFilters);
  const isErrorState = leadState.mode === "error" || leadState.mode === "unauthenticated";
  const isEmptyWithoutFilters = !isErrorState && leads.length === 0 && !hasActiveFilters;
  const isEmptyWithFilters = !isErrorState && hasActiveFilters && leads.length === 0;
  const newLeads = visibleLeads.filter((lead) => getLeadStageValue(lead.stage) === "new").length;
  const qualifiedLeads = visibleLeads.filter((lead) => getLeadStageValue(lead.stage) === "qualification").length;
  const proposalLeads = visibleLeads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const selectedLeadCanEdit = selectedLead?.canEdit ?? true;
  const selectedLeadCanDelete = selectedLead?.canDelete ?? leadState.canDeleteLeads;
  const canCreateLeads = createLeadAccess.allowed;
  const exportHref = `/api/leads/export${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const visibleLeadIds = visibleLeads.map((lead) => lead.id);
  const selectedLeadIdsSet = new Set(selectedLeadIds);
  const allVisibleLeadsSelected = visibleLeads.length > 0 && visibleLeadIds.every((id) => selectedLeadIdsSet.has(id));
  const hasSelectedLeads = selectedLeadIds.length > 0;

  const replaceLeadUrlFilters = useCallback((nextFilters: LeadUrlFilters) => {
    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");

    for (const key of filterKeys) {
      const value = nextFilters[key];

      if (isDefaultLeadUrlFilterValue(key, value)) {
        nextSearchParams.delete(key);
      } else {
        nextSearchParams.set(key, String(value));
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
    const visibleLeadIdSet = new Set(leads.map((lead) => lead.id));

    setSelectedLeadIds((currentIds) => {
      const nextIds = currentIds.filter((id) => visibleLeadIdSet.has(id));
      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
  }, [leads]);

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
    setFeedback({
      tone: "success",
      text:
        mode === "not-configured"
          ? "Lead criado no modo demonstracao. Configure o Supabase para persistir novos cadastros."
          : "Lead criado e salvo no CRM."
    });

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
    setSelectedLeadIds((currentIds) => currentIds.filter((currentId) => currentId !== leadId));
    setFeedback({
      tone: "success",
      text:
        mode === "not-configured"
          ? "Lead removido no modo demonstracao. Configure o Supabase para persistir exclusoes reais."
          : "Lead removido do CRM."
    });

    if (mode === "supabase" || mode === undefined) {
      router.refresh();
    }
  }

  function handleMetaImportFinished(result: MetaLeadImportResponse) {
    const presentation = buildMetaImportPresentation(result);
    setFeedback({
      tone: presentation.tone,
      text: [result.message, result.detail].filter(Boolean).join(" ")
    });
    router.refresh();
  }

  function toggleLeadSelection(leadId: string) {
    setSelectedLeadIds((currentIds) =>
      currentIds.includes(leadId)
        ? currentIds.filter((currentId) => currentId !== leadId)
        : [...currentIds, leadId]
    );
  }

  function toggleVisibleLeadSelection() {
    setSelectedLeadIds((currentIds) => {
      if (allVisibleLeadsSelected) {
        return currentIds.filter((id) => !visibleLeadIds.includes(id));
      }

      return [...new Set([...currentIds, ...visibleLeadIds])];
    });
  }

  function clearLeadSelection() {
    setSelectedLeadIds([]);
  }

  async function handleBulkAssignSubmit() {
    if (!canManageLeadOwners || !selectedBulkOwnerProfileId || selectedLeadIds.length === 0) {
      return;
    }

    setIsBulkAssigning(true);

    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lead_ids: selectedLeadIds,
          owner_profile_id: selectedBulkOwnerProfileId
        })
      });
      const data = (await response.json()) as LeadBulkAssignResponse;

      if (!response.ok || !data.leads) {
        throw new Error(data.error ?? "Nao foi possivel distribuir os leads selecionados.");
      }

      const updatedLeadMap = new Map(data.leads.map((lead) => [lead.id, lead]));
      const selectedOwnerName =
        bulkAssignableOwnerOptions.find((option) => option.id === selectedBulkOwnerProfileId)?.name ??
        "o consultor selecionado";
      const assignedCount = data.updatedCount ?? data.leads.length;
      const assignedCountLabel = formatSelectedLeadCount(assignedCount);
      const assignedVerb = assignedCount === 1 ? "foi" : "foram";
      const assignedAction = assignedCount === 1 ? "distribuido" : "distribuidos";
      const reassignedAction = assignedCount === 1 ? "redistribuido" : "redistribuidos";

      setLeads((currentLeads) =>
        currentLeads.map((lead) => updatedLeadMap.get(lead.id) ?? lead)
      );
      setSelectedLead((currentLead) =>
        currentLead ? updatedLeadMap.get(currentLead.id) ?? currentLead : currentLead
      );
      setSelectedLeadIds([]);
      setFeedback({
        tone: "success",
        text:
          data.mode === "not-configured"
            ? `${assignedCountLabel} ${assignedVerb} ${reassignedAction} no modo demonstracao para ${selectedOwnerName}.`
            : `${assignedCountLabel} ${assignedVerb} ${assignedAction} para ${selectedOwnerName}.`
      });

      if (data.mode === "supabase" || data.mode === undefined) {
        router.refresh();
      }
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getFriendlyErrorMessage(error).message
      });
    } finally {
      setIsBulkAssigning(false);
    }
  }


  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="CRM"
        title={title}
        description="Lista dedicada para qualificar contatos, acompanhar responsáveis e priorizar próximos passos."
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
          onClick={() => setIsMetaImportOpen(true)}
          type="button"
        >
          <UploadCloud size={18} aria-hidden="true" />
          Importar leads Meta
        </button>
        <Link
          className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          href={exportHref}
        >
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </Link>
        <button
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
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

      {feedback && (
        <p
          className={`flex items-center gap-2 rounded-[24px] px-5 py-3 text-sm font-medium text-foreground ${
            feedback.tone === "success"
              ? "bg-lagoon/16"
              : feedback.tone === "warning"
                ? "bg-amber-400/16"
                : "bg-red-500/12"
          }`}
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 className="shrink-0 text-lagoon" size={18} aria-hidden="true" />
          ) : (
            <AlertCircle
              className={`shrink-0 ${feedback.tone === "warning" ? "text-amber-600" : "text-red-500"}`}
              size={18}
              aria-hidden="true"
            />
          )}
          {feedback.text}
        </p>
      )}


      {isErrorState ? (
        <LeadWorkspaceErrorState message={leadState.message} onRetry={handleRefresh} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Metric
              label={getLeadStageLabel("new")}
              value={String(newLeads)}
              note={`${visibleLeads.length} exibidos`}
              tone="blue"
            />
            <Metric
              label={getLeadStageLabel("qualification")}
              value={String(qualifiedLeads)}
              note="em diagnostico"
              tone="teal"
            />
            <Metric
              label={getLeadStageLabel("proposal")}
              value={String(proposalLeads)}
              note="em negociacao"
              tone="yellow"
            />
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
                    allVisibleLeadsSelected={allVisibleLeadsSelected}
                    bulkAssignableOwnerOptions={bulkAssignableOwnerOptions}
                    canManageLeadOwners={canManageLeadOwners}
                    hasSelectedLeads={hasSelectedLeads}
                    isBulkAssigning={isBulkAssigning}
                    leads={visibleLeads}
                    hasActiveFilters={hasActiveFilters}
                    leadOwnerOptions={leadOwnerOptions}
                    onBulkAssign={handleBulkAssignSubmit}
                    onBulkOwnerChange={setSelectedBulkOwnerProfileId}
                    onSearchChange={setSearchTerm}
                    onClearLeadSelection={clearLeadSelection}
                    searchTerm={searchTerm}
                    onOpenFilters={openFilterPopup}
                    onCreateOpen={canCreateLeads ? () => setIsCreateOpen(true) : undefined}
                    onLeadOpen={openLeadDetails}
                    onToggleLeadSelection={toggleLeadSelection}
                    onToggleVisibleLeadSelection={toggleVisibleLeadSelection}
                    selectedBulkOwnerProfileId={selectedBulkOwnerProfileId}
                    selectedLeadIds={selectedLeadIds}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <SalesFunnelGateway />
                    <ArchivedLeadsGateway />
                  </div>
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
      <MetaLeadImportModal
        open={isMetaImportOpen}
        onClose={() => setIsMetaImportOpen(false)}
        onImported={handleMetaImportFinished}
      />
      <LeadDetailsPopup
        aiBalance={aiBalance}
        canManageLeadOwners={canManageLeadOwners}
        initialPanel={selectedLeadPanel}
        lead={selectedLead}
        leadOwnerOptions={leadOwnerOptions}
        messageGeneratorEnabled
        onClose={() => setSelectedLead(null)}
        onDeleted={selectedLeadCanDelete ? handleLeadDeleted : undefined}
        onUpdated={selectedLeadCanEdit ? handleLeadUpdated : undefined}
        whatsappTemplates={whatsappTemplates}
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
    <div className="surface-card-muted flex flex-col gap-3 rounded-[26px] px-5 py-4 text-sm font-medium text-muted-soft sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span>{countLabel}</span>
        {error ? <p className="mt-1 text-sm text-ink">{error}</p> : null}
      </div>

      {pagination.hasMore ? (
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
          onClick={onLoadMore}
          type="button"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          {isLoading ? "Carregando" : "Carregar mais"}
        </button>
      ) : (
        <span className="surface-pill rounded-full px-4 py-2 text-xs font-semibold">
          Todos carregados
        </span>
      )}
    </div>
  );
}

function getResolvedLeadOwnerLabel(lead: Lead, leadOwnerOptions: LeadOwnerOption[]) {
  const ownerOption = lead.ownerProfileId
    ? leadOwnerOptions.find((option) => option.id === lead.ownerProfileId)
    : null;

  return ownerOption?.name ?? lead.owner ?? "Sem responsavel";
}

function formatSelectedLeadCount(count: number) {
  return count === 1 ? "1 lead" : `${count} leads`;
}

function MetaLeadImportModal({
  open,
  onClose,
  onImported
}: {
  open: boolean;
  onClose: () => void;
  onImported: (result: MetaLeadImportResponse) => void;
}) {
  const [sourcesState, setSourcesState] = useState<MetaLeadImportSourcesState | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MetaLeadImportResponse | null>(null);

  const sources = sourcesState?.sources ?? [];
  const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? null;
  const canImport = Boolean(sourcesState?.canImport && selectedSource && !isImporting);

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

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    setIsLoadingSources(true);
    setError(null);
    setResult(null);

    fetch("/api/meta/leads/sources", {
      headers: {
        Accept: "application/json"
      }
    })
      .then(async (response) => {
        const data = (await response.json()) as MetaLeadImportSourcesState;

        if (!response.ok || data.mode === "error" || data.mode === "unauthenticated") {
          throw new Error(data.message ?? "Nao foi possivel carregar fontes Meta.");
        }

        return data;
      })
      .then((data) => {
        if (ignore) {
          return;
        }

        setSourcesState(data);
        setSelectedSourceId(data.sources[0]?.id ?? null);
      })
      .catch((fetchError) => {
        if (ignore) {
          return;
        }

        setSourcesState(null);
        setSelectedSourceId(null);
        setError(getFriendlyErrorMessage(fetchError).message);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingSources(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [open]);

  async function handleImportSelected() {
    if (!selectedSource || isImporting) {
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/meta/leads/import", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceType: selectedSource.type,
          sourceId: selectedSource.id
        })
      });
      const data = (await response.json()) as MetaLeadImportResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Nao foi possivel importar leads Meta.");
      }

      setResult(data);
      onImported(data);
    } catch (importError) {
      setError(getFriendlyErrorMessage(importError).message);
    } finally {
      setIsImporting(false);
    }
  }

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
        className="surface-modal mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] shadow-glass"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-5 sm:p-6">
          <div>
            <p className="text-sm font-medium text-cobalt">Meta Lead Ads</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Importar leads Meta</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
              Escolha campanhas, anúncios ou formulários já existentes na conta conectada.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={onClose} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {isLoadingSources ? (
            <MetaImportState
              icon={<Loader2 className="animate-spin" size={22} aria-hidden="true" />}
              title="Carregando fontes Meta"
              description="Buscando formulários, campanhas e anúncios disponíveis para importação."
            />
          ) : error ? (
            <MetaImportState
              icon={<AlertCircle size={22} aria-hidden="true" />}
              title="Não foi possível carregar a importação"
              description={error}
            />
          ) : sourcesState && !sourcesState.hasConnection ? (
            <MetaImportState
              actionHref="/dashboard/perfil/meta"
              actionLabel="Ir para integrações"
              icon={<Megaphone size={22} aria-hidden="true" />}
              title="Conecte sua conta Meta para importar leads."
              description={sourcesState.message ?? "Depois de conectar a conta, sincronize os ativos Meta e volte para importar."}
            />
          ) : sources.length === 0 ? (
            <MetaImportState
              actionHref="/dashboard/perfil/meta"
              actionLabel="Sincronizar Meta"
              icon={<Inbox size={22} aria-hidden="true" />}
              title="Nenhuma campanha ou formulário de lead encontrado."
              description="Sincronize novamente a conta Meta ou confirme se há formulários de Lead Ads disponíveis."
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                {sources.map((source) => (
                  <MetaImportSourceOption
                    key={`${source.type}-${source.id}`}
                    selected={source.id === selectedSourceId}
                    source={source}
                    onSelect={() => setSelectedSourceId(source.id)}
                  />
                ))}
              </div>

              <aside className="surface-card-muted rounded-[26px] p-4">
                <p className="text-sm font-semibold text-ink">Resumo da seleção</p>
                {selectedSource ? (
                  <div className="mt-4 space-y-3 text-sm text-ink/66">
                    <InfoLine label="Tipo" value={getSourceTypeLabel(selectedSource.type)} />
                    <InfoLine label="Status" value={getSourceStatusLabel(selectedSource.status)} />
                    <InfoLine
                      label="Leads disponíveis"
                      value={formatLeadCount(selectedSource.availableLeadCount)}
                    />
                    <InfoLine
                      label="Última coleta"
                      value={formatMetaImportDate(selectedSource.lastCollectedAt)}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-ink/58">Selecione uma fonte para continuar.</p>
                )}

                {result ? <MetaImportResultSummary result={result} /> : null}

                {error ? (
                  <p className="mt-4 rounded-[20px] bg-red-500/10 px-4 py-3 text-sm font-medium text-ink">
                    {error}
                  </p>
                ) : null}

                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canImport}
                  onClick={handleImportSelected}
                  type="button"
                >
                  {isImporting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
                  {isImporting ? "Importando" : "Importar leads selecionados"}
                </button>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetaImportSourceOption({
  source,
  selected,
  onSelect
}: {
  source: MetaLeadImportSource;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full rounded-[24px] border p-4 text-left transition ${
        selected
          ? "surface-card border-cobalt/40 shadow-glass"
          : "surface-card-muted hover:border-cobalt/18"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3 py-1 text-xs font-semibold text-cobalt">
              {source.type === "form" ? (
                <FileText size={14} aria-hidden="true" />
              ) : (
                <Megaphone size={14} aria-hidden="true" />
              )}
              {getSourceTypeLabel(source.type)}
            </span>
            <span className="surface-pill rounded-full px-3 py-1 text-xs font-semibold">
              {getSourceStatusLabel(source.status)}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-tight text-ink">{source.name}</h3>
          <p className="mt-1 text-sm text-ink/54">
            {source.parentName ?? source.pageName ?? source.adAccountName ?? "Conta Meta conectada"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-[220px]">
          <InfoPill label="Leads" value={formatLeadCount(source.availableLeadCount)} />
          <InfoPill label="Coleta" value={formatMetaImportDate(source.lastCollectedAt)} />
        </div>
      </div>
    </button>
  );
}

function MetaImportResultSummary({ result }: { result: MetaLeadImportResponse }) {
  const presentation = buildMetaImportPresentation(result);
  const errorItems = result.items.filter((item) => item.status === "error").slice(0, 3);

  return (
    <div
      className={`mt-4 rounded-[22px] p-4 ${
        presentation.tone === "success"
          ? "bg-lagoon/14"
          : presentation.tone === "warning"
            ? "bg-amber-400/14"
            : "bg-red-500/10"
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        {presentation.tone === "success" ? (
          <CheckCircle2 className="text-lagoon" size={18} aria-hidden="true" />
        ) : (
          <AlertCircle
            className={presentation.tone === "warning" ? "text-amber-600" : "text-red-500"}
            size={18}
            aria-hidden="true"
          />
        )}
        {presentation.title}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink/68">{result.message}</p>
      {result.detail ? <p className="mt-2 text-sm leading-6 text-ink/62">{result.detail}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-ink/72">
        <InfoPill label="Encontrados" value={String(result.summary.totalFound)} />
        <InfoPill label="Importados" value={String(result.summary.imported)} />
        <InfoPill label="Duplicados" value={String(result.summary.duplicates)} />
        <InfoPill label="Arquivados" value={String(result.summary.archived)} />
        <InfoPill label="Erros" value={String(result.summary.errors)} />
      </div>
      {errorItems.length > 0 ? (
        <div className="surface-card mt-3 rounded-[18px] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/42">
            Erros desta tentativa
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-ink/68">
            {errorItems.map((item, index) => (
              <li key={`${item.externalLeadId ?? "erro"}-${index}`}>
                {item.message ?? "Nao foi possivel importar este lead."}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function MetaImportState({
  icon,
  title,
  description,
  actionHref,
  actionLabel
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="surface-card-muted rounded-[28px] p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
        {icon}
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="surface-pill rounded-[18px] px-3 py-2">
      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink/38">
        {label}
      </span>
      <span className="mt-1 block text-xs font-semibold text-ink">{value}</span>
    </span>
  );
}

function getSourceTypeLabel(type: MetaLeadImportSource["type"]) {
  switch (type) {
    case "campaign":
      return "Campanha";
    case "ad":
      return "Anúncio";
    case "form":
      return "Formulário";
  }
}

function getSourceStatusLabel(status: MetaLeadImportSource["status"]) {
  switch (status) {
    case "active":
      return "Ativo";
    case "paused":
      return "Pausado";
    case "ended":
      return "Encerrado";
    case "unknown":
    default:
      return "Não informado";
  }
}

function formatLeadCount(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("pt-BR") : "Não informado";
}

function formatMetaImportDate(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function buildMetaImportPresentation(result: MetaLeadImportResponse): {
  tone: LeadWorkspaceFeedbackTone;
  title: string;
} {
  switch (result.status) {
    case "success":
      return {
        tone: "success",
        title: "Importacao concluida"
      };
    case "duplicates_only":
      return {
        tone: "warning",
        title: "Nenhum lead novo entrou no CRM"
      };
    case "empty":
      return {
        tone: "warning",
        title: "Nenhum lead disponivel para importar"
      };
    case "partial":
      return {
        tone: "warning",
        title: "Importacao concluida com ressalvas"
      };
    case "error":
    default:
      return {
        tone: "error",
        title: "Importacao nao concluida"
      };
  }
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
          <p className="text-sm font-medium text-cobalt">Leads</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Nao foi possivel carregar os leads</h2>
          <p className="mt-3 max-w-xl leading-7 text-ink/64">
            {message ? getFriendlyErrorMessage(message).message : "Tente novamente para recarregar a lista."}
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
              className="surface-action-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              onClick={onClearFilters}
              type="button"
            >
              <Filter size={18} aria-hidden="true" />
              Limpar filtros
            </button>
          )}

          {onRetry && !isFiltered && (
            <button
              className="surface-action-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              onClick={onRetry}
              type="button"
            >
              <RefreshCcw size={18} aria-hidden="true" />
              Tentar novamente
            </button>
          )}

          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
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

function SalesFunnelGateway() {
  return (
    <Link
      href="/dashboard/funil"
      className="surface-card-muted group relative flex flex-col overflow-hidden rounded-[34px] p-1 transition-all hover:border-cobalt/30 hover:shadow-2xl hover:shadow-cobalt/10 sm:flex-row sm:items-center sm:gap-8"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[30px] sm:aspect-square sm:w-[280px] sm:shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/kanban-animation.png"
          alt="Funil de vendas"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-cobalt/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Animated Hand/Cursor simulation */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-cobalt/10">
            <div className="h-4 w-4 rounded-sm bg-cobalt animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center p-6 sm:p-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cobalt/60">
          <div className="h-1.5 w-1.5 rounded-full bg-cobalt animate-pulse" />
          Gestão Visual
        </div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Acessar funil de vendas
        </h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/60">
          Visualize seus leads em um quadro Kanban interativo. Arraste e solte para mover contatos entre as etapas de venda.
        </p>
        
        <div className="mt-8 flex items-center gap-3 text-sm font-bold text-cobalt">
          Explorar Funil 
          <ChevronRight className="transition-transform group-hover:translate-x-1" size={18} />
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-cobalt/5 blur-3xl transition-colors group-hover:bg-cobalt/10" />
    </Link>
  );
}

function ArchivedLeadsGateway() {
  return (
    <Link
      href="/dashboard/leads/arquivados"
      className="surface-card-muted group relative flex flex-col overflow-hidden rounded-[34px] p-1 transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-[30px] sm:aspect-video sm:w-full">
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50">
          <Archive
            className="text-amber-500/40 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3"
            size={80}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      <div className="flex flex-col justify-center p-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600/70">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Histórico
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
          Leads arquivados
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Acesse a lista de leads que foram removidos do fluxo principal para manter sua organização limpa.
        </p>
        
        <div className="mt-6 flex items-center gap-3 text-sm font-bold text-amber-600">
          Ver Arquivados 
          <ChevronRight className="transition-transform group-hover:translate-x-1" size={18} />
        </div>
      </div>

      <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl transition-colors group-hover:bg-amber-500/10" />
    </Link>
  );
}

function LeadTablePanel({
  allVisibleLeadsSelected,
  bulkAssignableOwnerOptions,
  canManageLeadOwners,
  hasSelectedLeads,
  isBulkAssigning,
  leads,
  hasActiveFilters,
  leadOwnerOptions,
  onBulkAssign,
  onBulkOwnerChange,
  onSearchChange,
  onClearLeadSelection,
  searchTerm,
  onOpenFilters,
  onCreateOpen,
  onLeadOpen,
  onToggleLeadSelection,
  onToggleVisibleLeadSelection,
  selectedBulkOwnerProfileId,
  selectedLeadIds
}: {
  allVisibleLeadsSelected: boolean;
  bulkAssignableOwnerOptions: LeadOwnerOption[];
  canManageLeadOwners: boolean;
  hasSelectedLeads: boolean;
  isBulkAssigning: boolean;
  leads: Lead[];
  hasActiveFilters: boolean;
  leadOwnerOptions: LeadOwnerOption[];
  onBulkAssign: () => void;
  onBulkOwnerChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClearLeadSelection: () => void;
  searchTerm: string;
  onOpenFilters: () => void;
  onCreateOpen?: () => void;
  onLeadOpen: (lead: Lead) => void;
  onToggleLeadSelection: (leadId: string) => void;
  onToggleVisibleLeadSelection: () => void;
  selectedBulkOwnerProfileId: string;
  selectedLeadIds: string[];
}) {
  const selectedLeadIdsSet = new Set(selectedLeadIds);
  const showBulkActions = canManageLeadOwners && leads.length > 0;
  const tableGridClassName = canManageLeadOwners
    ? "hidden grid-cols-[44px_minmax(220px,1.2fr)_150px_210px_140px_120px_44px] gap-4 border-b border-ink/8 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid"
    : "hidden grid-cols-[minmax(220px,1.2fr)_150px_210px_140px_120px_44px] gap-4 border-b border-ink/8 px-5 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid";
  const rowGridClassName = canManageLeadOwners
    ? "grid gap-3 border-b border-ink/8 px-5 py-4 text-left transition hover:bg-white/34 last:border-0 md:grid-cols-[44px_minmax(220px,1.2fr)_150px_210px_140px_120px_44px] md:items-center"
    : "grid gap-3 border-b border-ink/8 px-5 py-4 text-left transition hover:bg-white/34 last:border-0 md:grid-cols-[minmax(220px,1.2fr)_150px_210px_140px_120px_44px] md:items-center";

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
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Buscar leads"
              className="liquid-input pl-11 text-sm"
              enterKeyHint="search"
              name="leads-search"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome, email, telefone, cidade ou empresa"
              spellCheck={false}
              type="search"
              value={searchTerm}
            />
          </label>
          <button
            className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            onClick={onOpenFilters}
            type="button"
          >
            <Filter size={18} aria-hidden="true" />
            {hasActiveFilters ? "Filtros ativos" : "Filtros"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!onCreateOpen}
            onClick={onCreateOpen}
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
            Novo lead
          </button>
        </div>
      </div>

      {showBulkActions ? (
        <div className="mb-4 flex flex-col gap-3 rounded-[26px] border border-cobalt/12 bg-cobalt/6 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              {hasSelectedLeads
                ? `${selectedLeadIds.length} ${selectedLeadIds.length === 1 ? "lead selecionado" : "leads selecionados"}`
                : "Selecione os leads que deseja distribuir"}
            </p>
            <p className="text-sm text-ink/60">
              Distribuicao em lote disponivel apenas para gestores e sempre restrita aos consultores da equipe.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              className="surface-action-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold"
              onClick={onToggleVisibleLeadSelection}
              type="button"
            >
              {allVisibleLeadsSelected ? "Desmarcar visiveis" : "Selecionar visiveis"}
            </button>
            <button
              className="surface-action-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold"
              disabled={!hasSelectedLeads}
              onClick={onClearLeadSelection}
              type="button"
            >
              Limpar selecao
            </button>
            <label className="sr-only" htmlFor="bulk-owner-profile-id">
              Distribuir leads selecionados para
            </label>
            <select
              aria-label="Distribuir leads selecionados para"
              className="rounded-full border border-border/70 bg-surface-elevated/92 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-cobalt/40"
              id="bulk-owner-profile-id"
              onChange={(event) => onBulkOwnerChange(event.target.value)}
              value={selectedBulkOwnerProfileId}
            >
              <option value="">Selecione um consultor</option>
              {bulkAssignableOwnerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <button
              className="inline-flex items-center justify-center rounded-full bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt/92 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasSelectedLeads || !selectedBulkOwnerProfileId || isBulkAssigning}
              onClick={onBulkAssign}
              type="button"
            >
              {isBulkAssigning ? "Distribuindo" : "Distribuir em lote"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="surface-card-muted overflow-hidden rounded-[26px]">
        <div className={tableGridClassName}>
          {canManageLeadOwners ? (
            <span className="flex items-center justify-center">
              <input
                aria-label="Selecionar todos os leads visiveis"
                checked={allVisibleLeadsSelected}
                className="h-4 w-4 rounded border border-ink/20 text-cobalt focus:ring-cobalt"
                onChange={onToggleVisibleLeadSelection}
                type="checkbox"
              />
            </span>
          ) : null}
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
              className={rowGridClassName}
              key={lead.id}
            >
              {canManageLeadOwners ? (
                <div
                  className="flex items-start md:items-center md:justify-center"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <input
                    aria-label={`Selecionar lead ${lead.name}`}
                    checked={selectedLeadIdsSet.has(lead.id)}
                    className="mt-1 h-4 w-4 rounded border border-ink/20 text-cobalt focus:ring-cobalt md:mt-0"
                    onChange={() => onToggleLeadSelection(lead.id)}
                    type="checkbox"
                  />
                </div>
              ) : null}
              <button
                className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt/50 md:pr-2"
                onClick={() => onLeadOpen(lead)}
                type="button"
              >
                <span className="block font-semibold leading-tight">{lead.name}</span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <LeadQualityBadge quality={lead.quality} />
                  <LeadOriginBadge source={lead.source} />
                </div>
                <div className="mt-2 space-y-1">
                  <span className="block text-sm text-ink/58">{getLeadOriginSummary(lead)}</span>
                  <span className="block text-sm text-ink/54 md:hidden">{lead.phone}</span>
                </div>
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
                {getResolvedLeadOwnerLabel(lead, leadOwnerOptions)}
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
                className="surface-action-secondary hidden h-10 w-10 items-center justify-center rounded-full md:inline-flex"
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


function isDefaultLeadUrlFilterValue(key: keyof LeadUrlFilters, value: string | boolean) {
  return value === defaultLeadUrlFilters[key];
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
            : "bg-surface-elevated/92 text-foreground ring-black/5 shadow-sm"
        }`}
      >
        {getLeadStageLabel(stage)}
      </div>
    </div>
  );
}

function LeadQualityBadge({ quality }: { quality: Lead["quality"] }) {
  const meta = getLeadQualityMeta(quality);

  return (
    <span
      className={
        meta?.badgeClassName ??
        "inline-flex items-center rounded-full bg-surface-elevated/92 px-2.5 py-1 text-[11px] font-semibold text-muted-soft ring-1 ring-inset ring-black/5"
      }
    >
      {meta ? meta.label : getLeadQualityLabel(quality)}
    </span>
  );
}

function LeadOriginBadge({ source }: { source: Lead["source"] }) {
  return <span className={getLeadOriginBadgeClassName(source)}>{source}</span>;
}
