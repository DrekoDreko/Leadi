"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Filter,
  Kanban,
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
  getLeadStageValue,
  isLeadClosedStage,
  isLeadWonStage
} from "@/lib/leads/stages";
import type { LeadDataMode, LeadDataState } from "@/lib/leads/repository";
import type { LeadOwnerOption } from "@/lib/leads/repository.server";
import type { SystemTemplate } from "@/lib/templates/types";
import type { BoardLabel, PipelineStage } from "@/lib/pipeline/types";
import { useBoardRealtime } from "@/lib/pipeline/use-board-realtime";
import { LeadCreateModal } from "../leads/lead-create-modal";
import { KanbanBoard } from "./board/kanban-board";
import { CardDetailModal } from "./board/card-detail-modal";

const STALLED_LEAD_DAYS = 7;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

type BoardFeedback = { type: "success" | "error"; message: string };

export function SalesFunnelWorkspace({
  aiBalance,
  canManageLeadOwners,
  canManageColumns = false,
  canReorderLeads = true,
  createLeadAccess,
  leadState,
  leadFilters,
  leadOwnerOptions,
  whatsappTemplates = [],
  stages: stagesProp = [],
  boardLabels = [],
  organizationId = null
}: {
  aiBalance: number;
  canManageLeadOwners: boolean;
  canManageColumns?: boolean;
  canReorderLeads?: boolean;
  createLeadAccess: ResourceAccessSummary;
  leadState: LeadDataState;
  leadFilters: LeadUrlFilters;
  leadOwnerOptions: LeadOwnerOption[];
  whatsappTemplates?: SystemTemplate[];
  stages?: PipelineStage[];
  boardLabels?: BoardLabel[];
  organizationId?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draftLeadFilters, setDraftLeadFilters] = useState(leadFilters);
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [leads, setLeads] = useState(leadState.leads);
  const [stages, setStages] = useState(stagesProp);
  const [labels, setLabels] = useState(boardLabels);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [boardCardId, setBoardCardId] = useState<string | null>(null);
  const [isLeadEditMode, setIsLeadEditMode] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(leadFilters.search);
  const [feedback, setFeedback] = useState<BoardFeedback | null>(null);

  const visibleLeads = leads;
  const hasActiveFilters = searchTerm.trim().length > 0 || hasActiveLeadUrlFilters(leadFilters);
  const totalLeads = visibleLeads.length;
  const openLeads = visibleLeads.filter((lead) => !isLeadClosedStage(lead.stage)).length;
  const wonLeads = visibleLeads.filter((lead) => isLeadWonStage(lead.stage)).length;
  const proposalLeads = visibleLeads.filter((lead) => getLeadStageValue(lead.stage) === "proposal").length;
  const stalledOpenLeads = visibleLeads.filter((lead) => getLeadStalledState(lead).isStalled).length;
  const selectedLeadCanEdit = selectedLead?.canEdit ?? true;
  const selectedLeadCanDelete = selectedLead?.canDelete ?? leadState.canDeleteLeads;
  const isErrorState = leadState.mode === "error" || leadState.mode === "unauthenticated";

  const boardCard = useMemo(
    () => (boardCardId ? leads.find((lead) => lead.id === boardCardId) ?? null : null),
    [boardCardId, leads]
  );

  useEffect(() => setLeads(leadState.leads), [leadState.leads]);
  useEffect(() => setStages(stagesProp), [stagesProp]);
  useEffect(() => setLabels(boardLabels), [boardLabels]);

  useEffect(() => {
    if (selectedLead && !leads.some((lead) => lead.id === selectedLead.id)) {
      setSelectedLead(null);
    }
  }, [leads, selectedLead]);

  useEffect(() => {
    if (!isFilterPopupOpen) setDraftLeadFilters(leadFilters);
  }, [isFilterPopupOpen, leadFilters]);

  // Sincronização em tempo real entre a equipe.
  useBoardRealtime(
    leadState.mode === "supabase" ? organizationId : null,
    useCallback(() => router.refresh(), [router])
  );

  const replaceLeadUrlFilters = useCallback(
    (nextFilters: LeadUrlFilters) => {
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
    },
    [pathname, router, searchParams]
  );

  useEffect(() => setSearchTerm(leadFilters.search), [leadFilters.search]);

  useEffect(() => {
    const nextSearch = searchTerm.trim();
    if (nextSearch === leadFilters.search) return;
    const debounceId = window.setTimeout(() => {
      replaceLeadUrlFilters({ ...leadFilters, search: nextSearch });
    }, 350);
    return () => window.clearTimeout(debounceId);
  }, [leadFilters, replaceLeadUrlFilters, searchTerm]);

  function handleRefresh() {
    router.refresh();
  }

  function handleLeadCreated(lead: Lead, mode?: LeadDataMode) {
    setLeads((current) => [lead, ...current.filter((item) => item.id !== lead.id)]);
    setFeedback({
      type: "success",
      message:
        mode === "not-configured"
          ? "Lead criado no modo demonstração e adicionado ao funil."
          : "Lead criado e adicionado ao funil."
    });
    if (mode === "supabase" || mode === undefined) router.refresh();
  }

  function handleLeadUpdated(lead: Lead, mode?: LeadDataMode) {
    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...lead } : item)));
    setSelectedLead(lead);
    if (mode === "supabase" || mode === undefined) router.refresh();
  }

  function handleLeadDeleted(leadId: string, mode?: LeadDataMode) {
    setLeads((current) => current.filter((lead) => lead.id !== leadId));
    setSelectedLead(null);
    setBoardCardId((current) => (current === leadId ? null : current));
    setFeedback({
      type: "success",
      message:
        mode === "not-configured"
          ? "Lead removido do funil no modo demonstração."
          : "Lead removido do funil."
    });
    if (mode === "supabase" || mode === undefined) router.refresh();
  }

  const patchLead = useCallback((leadId: string, patch: Partial<Lead>) => {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, ...patch } : lead)));
  }, []);

  function openFilterPopup() {
    setDraftLeadFilters(leadFilters);
    setIsFilterPopupOpen(true);
  }

  function applyDraftFilters() {
    replaceLeadUrlFilters(draftLeadFilters);
    setIsFilterPopupOpen(false);
  }

  function clearDraftFilters() {
    setDraftLeadFilters(defaultLeadUrlFilters);
    replaceLeadUrlFilters(defaultLeadUrlFilters);
    setIsFilterPopupOpen(false);
  }

  function clearAllFilters() {
    setSearchTerm("");
    replaceLeadUrlFilters(defaultLeadUrlFilters);
    setDraftLeadFilters(defaultLeadUrlFilters);
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
                {canReorderLeads ? "Quadro estilo Trello · arraste, edite e colabore" : "Quadro de leitura com popup de lead"}
              </span>
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl xl:text-[2.8rem]">
              Um funil que funciona como um quadro Trello para a sua equipe comercial.
            </h1>
            <p className="text-muted-soft mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Colunas customizáveis, cards com etiquetas, checklists, vencimento, capa e membros —
              arraste para reordenar e acompanhe em tempo real com todo o time.
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
            note="em simulação"
            tone="teal"
            value={String(proposalLeads)}
          />
          <FunnelHeroMetric
            icon={TrendingUp}
            label={getLeadStageLabel("won")}
            note="fechados no período"
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
              <h2 className="mt-2 text-2xl font-semibold md:text-[2rem]">
                {canReorderLeads
                  ? "Arraste os cards, personalize as colunas e abra o card para agir"
                  : "Abra o card para acompanhar cada etapa da conversa"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="surface-pill inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold">
                {totalLeads} leads visíveis
              </span>
              <span className="surface-pill inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold">
                {stages.length} colunas
              </span>
            </div>
          </div>

          {visibleLeads.length === 0 && stages.length === 0 ? (
            <FunnelEmptyState
              hasActiveFilters={hasActiveFilters}
              onCreateOpen={() => setIsCreateOpen(true)}
              onClearFilters={clearAllFilters}
            />
          ) : (
            <KanbanBoard
              stages={stages}
              leads={visibleLeads}
              mode={leadState.mode}
              canReorderLeads={canReorderLeads}
              canManageColumns={canManageColumns}
              onSelectLead={(lead) => setBoardCardId(lead.id)}
              onLeadsChange={(updater) => setLeads(updater)}
              onStagesChange={(updater) => setStages(updater)}
              onAddCard={() => setIsCreateOpen(true)}
              onFeedback={setFeedback}
            />
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

      <CardDetailModal
        lead={boardCard}
        labels={labels}
        memberOptions={leadOwnerOptions}
        canManageLabels={canManageColumns}
        mode={leadState.mode}
        onClose={() => setBoardCardId(null)}
        onLeadPatch={patchLead}
        onLabelsChange={(updater) => setLabels(updater)}
        onOpenFullDetails={(lead) => {
          setBoardCardId(null);
          setSelectedLead(lead);
          setIsLeadEditMode(false);
        }}
        onFeedback={setFeedback}
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
        onClose={() => setIsFilterPopupOpen(false)}
        onClear={clearDraftFilters}
        onChange={setDraftLeadFilters}
        value={draftLeadFilters}
      />
    </div>
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
        {hasActiveFilters ? "Nenhum resultado com estes filtros" : "Seu funil ainda está vazio"}
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
        Dados reais do Supabase carregados para o funil da organização logada.
      </p>
    );
  }

  if (leadState.mode === "not-configured") {
    return (
      <p className="rounded-[24px] bg-signal/30 px-5 py-3 text-sm font-medium text-foreground">
        {leadState.message ?? "Usando dados mockados enquanto a base real não está disponível."}
      </p>
    );
  }

  return null;
}

function LeadWorkspaceErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <section className="glass-strong rounded-[34px] p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
            <AlertCircle size={20} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-cobalt">Funil</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Não foi possível carregar o funil</h2>
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

function isDefaultLeadUrlFilterValue(key: keyof LeadUrlFilters, value: string | boolean) {
  if (key === "search") return value === "";
  return value === defaultLeadUrlFilters[key];
}

type LeadStalledState = { isStalled: boolean; daysWithoutUpdate: number | null };

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
  return { isStalled: daysWithoutUpdate >= STALLED_LEAD_DAYS, daysWithoutUpdate };
}
