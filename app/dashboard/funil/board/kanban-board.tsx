"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarClock,
  CheckSquare,
  GripVertical,
  MessageCircle,
  MoreHorizontal,
  PhoneCall,
  Plus,
  Trash2
} from "lucide-react";
import type { Lead } from "@/data/mock";
import type { LeadDataMode } from "@/lib/leads/repository";
import type { BoardLabel, PipelineStage } from "@/lib/pipeline/types";
import { BOARD_COLOR_KEYS, getBoardColorClasses } from "@/lib/pipeline/colors";
import { positionBetween } from "@/lib/pipeline/position";
import { getLeadStageLabel, getLeadStageValue } from "@/lib/leads/stages";

type BoardFeedback = { type: "success" | "error"; message: string };

type KanbanBoardProps = {
  stages: PipelineStage[];
  leads: Lead[];
  mode: LeadDataMode;
  canReorderLeads: boolean;
  canManageColumns: boolean;
  onSelectLead: (lead: Lead) => void;
  onLeadsChange: (updater: (leads: Lead[]) => Lead[]) => void;
  onStagesChange: (updater: (stages: PipelineStage[]) => PipelineStage[]) => void;
  onAddCard: (stageId: string) => void;
  onFeedback: (feedback: BoardFeedback | null) => void;
};

type BoardColumnModel = {
  stage: PipelineStage;
  cards: Lead[];
};

const NAME_FALLBACK = "Sem título";

/** Animação de "aterrissagem": o card flutuante assenta suavemente na coluna de destino. */
const DROP_ANIMATION: DropAnimation = {
  duration: 260,
  easing: "cubic-bezier(0.18, 0.67, 0.34, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.35" } }
  })
};

function sortCards(cards: Lead[]): Lead[] {
  return [...cards].sort((a, b) => {
    const posA = typeof a.boardPosition === "number" ? a.boardPosition : Number.POSITIVE_INFINITY;
    const posB = typeof b.boardPosition === "number" ? b.boardPosition : Number.POSITIVE_INFINITY;
    if (posA !== posB) return posA - posB;
    return (a.name || "").localeCompare(b.name || "");
  });
}

/** Deriva o rótulo de etapa (enum legado) após um movimento otimista. */
function optimisticStageLabel(stage: PipelineStage, currentLabel: string): string {
  if (stage.slug) {
    const value = getLeadStageValue(stage.slug);
    if (value) return getLeadStageLabel(value);
  }
  if (stage.type === "won") return getLeadStageLabel("won");
  if (stage.type === "lost") return getLeadStageLabel("lost");
  return currentLabel;
}

export function KanbanBoard({
  stages,
  leads,
  mode,
  canReorderLeads,
  canManageColumns,
  onSelectLead,
  onLeadsChange,
  onStagesChange,
  onAddCard,
  onFeedback
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Snapshot dos leads no início do arraste — usado para reverter se a persistência falhar,
  // já que `onDragOver` muda o estado otimista várias vezes durante o movimento.
  const dragSnapshot = useRef<Lead[] | null>(null);
  const stageIds = useMemo(() => new Set(stages.map((stage) => stage.id)), [stages]);

  const resolveStageId = useCallback(
    (lead: Lead | undefined): string =>
      lead?.stageId ?? getLeadStageValue(lead?.stage ?? "") ?? "",
    []
  );

  const columns: BoardColumnModel[] = useMemo(() => {
    const orderedStages = [...stages].sort((a, b) => a.position - b.position);
    const cardsByStage = new Map<string, Lead[]>();
    for (const lead of leads) {
      const stageId = lead.stageId ?? getLeadStageValue(lead.stage) ?? orderedStages[0]?.id ?? "";
      const list = cardsByStage.get(stageId) ?? [];
      list.push(lead);
      cardsByStage.set(stageId, list);
    }
    return orderedStages.map((stage) => ({
      stage,
      cards: sortCards(cardsByStage.get(stage.id) ?? [])
    }));
  }, [stages, leads]);

  const leadById = useMemo(() => new Map(leads.map((lead) => [lead.id, lead])), [leads]);
  const activeLead = activeId ? leadById.get(activeId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persistMove = useCallback(
    async (leadId: string, stageId: string, position: number, revert: () => void) => {
      if (mode !== "supabase") return;
      try {
        const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId, position })
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Não foi possível mover o card.");
        }
      } catch (error) {
        revert();
        onFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível mover o card."
        });
      }
    },
    [mode, onFeedback]
  );

  const persistStageOrder = useCallback(
    async (orderedIds: string[], revert: () => void) => {
      if (mode !== "supabase") return;
      try {
        const response = await fetch("/api/pipeline/stages/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds })
        });
        if (!response.ok) throw new Error("Falha ao reordenar colunas.");
      } catch (error) {
        revert();
        onFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Falha ao reordenar colunas."
        });
      }
    },
    [mode, onFeedback]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    dragSnapshot.current = leads;
  }

  /**
   * Move o card entre colunas ao vivo, durante o arraste, para dar a sensação de
   * "entregar o card na coluna". A reordenação dentro da mesma coluna fica a cargo
   * da estratégia do SortableContext (transforms), então aqui só tratamos a troca
   * de coluna. A posição definitiva e a persistência acontecem no `handleDragEnd`.
   */
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;
    // Ignora o arraste de colunas — só cards trocam de container aqui.
    if (stageIds.has(activeIdStr)) return;
    if (!canReorderLeads) return;

    const lead = leadById.get(activeIdStr);
    if (!lead || !(lead.canEdit ?? true)) return;
    const activeStageId = resolveStageId(lead);

    let overStageId: string;
    let overCardId: string | null = null;
    if (stageIds.has(overIdStr)) {
      overStageId = overIdStr;
    } else {
      const overLead = leadById.get(overIdStr);
      if (!overLead) return;
      overStageId = resolveStageId(overLead);
      overCardId = overIdStr;
    }
    if (!overStageId || overStageId === activeStageId) return;

    const targetStage = stages.find((stage) => stage.id === overStageId);
    if (!targetStage) return;

    const targetCards = (columns.find((column) => column.stage.id === overStageId)?.cards ?? []).filter(
      (card) => card.id !== activeIdStr
    );
    let index = targetCards.length;
    if (overCardId) {
      const overIndex = targetCards.findIndex((card) => card.id === overCardId);
      if (overIndex !== -1) index = overIndex;
    }
    const before = targetCards[index - 1]?.boardPosition ?? null;
    const after = targetCards[index]?.boardPosition ?? null;
    const nextPosition = positionBetween(
      typeof before === "number" ? before : null,
      typeof after === "number" ? after : null
    );
    const nextStageLabel = optimisticStageLabel(targetStage, lead.stage);

    onLeadsChange((current) =>
      current.map((item) =>
        item.id === activeIdStr
          ? { ...item, stageId: overStageId, boardPosition: nextPosition, stage: nextStageLabel }
          : item
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;

    // Reordenação de colunas.
    if (stageIds.has(activeIdStr)) {
      if (!canManageColumns) return;
      // A coluna pode ser solta sobre outra coluna ou sobre um card dela.
      let targetStageId = overIdStr;
      if (!stageIds.has(overIdStr)) {
        const overLead = leadById.get(overIdStr);
        targetStageId = overLead?.stageId ?? getLeadStageValue(overLead?.stage ?? "") ?? "";
      }
      if (!stageIds.has(targetStageId) || targetStageId === activeIdStr) return;
      const ordered = [...stages].sort((a, b) => a.position - b.position);
      const from = ordered.findIndex((stage) => stage.id === activeIdStr);
      const to = ordered.findIndex((stage) => stage.id === targetStageId);
      if (from === -1 || to === -1) return;
      const next = arrayMove(ordered, from, to).map((stage, index) => ({
        ...stage,
        position: (index + 1) * 1000
      }));
      const previous = stages;
      onStagesChange(() => next);
      void persistStageOrder(
        next.map((stage) => stage.id),
        () => onStagesChange(() => previous)
      );
      return;
    }

    // Movimentação de card.
    if (!canReorderLeads) return;
    const lead = leadById.get(activeIdStr);
    if (!lead) return;
    if (!(lead.canEdit ?? true)) {
      onFeedback({ type: "error", message: "Sem permissão para mover este card." });
      return;
    }

    // Coluna de destino: solto sobre uma coluna vazia (id = stageId) ou sobre um card.
    let targetStageId: string;
    if (stageIds.has(overIdStr)) {
      targetStageId = overIdStr;
    } else {
      const overLead = leadById.get(overIdStr);
      if (!overLead) return;
      targetStageId = overLead.stageId ?? getLeadStageValue(overLead.stage) ?? "";
    }
    const targetStage = stages.find((stage) => stage.id === targetStageId);
    if (!targetStage) return;

    const targetCards = (columns.find((column) => column.stage.id === targetStageId)?.cards ?? []).filter(
      (card) => card.id !== activeIdStr
    );
    let index = targetCards.length;
    if (!stageIds.has(overIdStr)) {
      const overIndex = targetCards.findIndex((card) => card.id === overIdStr);
      if (overIndex !== -1) index = overIndex;
    }
    const before = targetCards[index - 1]?.boardPosition ?? null;
    const after = targetCards[index]?.boardPosition ?? null;
    const nextPosition = positionBetween(
      typeof before === "number" ? before : null,
      typeof after === "number" ? after : null
    );

    // Reverte para o estado anterior ao início do arraste (antes das mudanças de `onDragOver`).
    const previousLeads = dragSnapshot.current ?? leads;
    const nextStageLabel = optimisticStageLabel(targetStage, lead.stage);
    onLeadsChange((current) =>
      current.map((item) =>
        item.id === activeIdStr
          ? { ...item, stageId: targetStageId, boardPosition: nextPosition, stage: nextStageLabel }
          : item
      )
    );

    if (mode === "supabase") {
      void persistMove(activeIdStr, targetStageId, nextPosition, () =>
        onLeadsChange(() => previousLeads)
      );
    } else {
      onFeedback({
        type: "success",
        message: `${lead.name} movido para ${targetStage.name} (modo demonstração).`
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        // Desfaz qualquer troca de coluna otimista feita durante o arraste.
        if (dragSnapshot.current) {
          const snapshot = dragSnapshot.current;
          onLeadsChange(() => snapshot);
        }
        dragSnapshot.current = null;
      }}
    >
      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4 px-1">
          <SortableContext items={columns.map((column) => column.stage.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <BoardColumn
                key={column.stage.id}
                column={column}
                mode={mode}
                canReorderLeads={canReorderLeads}
                canManageColumns={canManageColumns}
                allStages={stages}
                onSelectLead={onSelectLead}
                onAddCard={onAddCard}
                onStagesChange={onStagesChange}
                onLeadsChange={onLeadsChange}
                onFeedback={onFeedback}
              />
            ))}
          </SortableContext>

          {canManageColumns ? (
            <AddColumnButton mode={mode} onStagesChange={onStagesChange} onFeedback={onFeedback} />
          ) : null}
        </div>
      </div>

      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {activeLead ? <BoardCard lead={activeLead} overlay onSelect={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─────────────────────────────── Coluna ───────────────────────────────

function BoardColumn({
  column,
  mode,
  canReorderLeads,
  canManageColumns,
  allStages,
  onSelectLead,
  onAddCard,
  onStagesChange,
  onLeadsChange,
  onFeedback
}: {
  column: BoardColumnModel;
  mode: LeadDataMode;
  canReorderLeads: boolean;
  canManageColumns: boolean;
  allStages: PipelineStage[];
  onSelectLead: (lead: Lead) => void;
  onAddCard: (stageId: string) => void;
  onStagesChange: (updater: (stages: PipelineStage[]) => PipelineStage[]) => void;
  onLeadsChange: (updater: (leads: Lead[]) => Lead[]) => void;
  onFeedback: (feedback: BoardFeedback | null) => void;
}) {
  const { stage, cards } = column;
  const colors = getBoardColorClasses(stage.color);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: !canManageColumns
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(stage.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const overLimit = typeof stage.wipLimit === "number" && cards.length > stage.wipLimit;

  async function patchStage(patch: Record<string, unknown>, optimistic: (s: PipelineStage) => PipelineStage) {
    const previous = allStages;
    onStagesChange((current) => current.map((s) => (s.id === stage.id ? optimistic(s) : s)));
    if (mode !== "supabase") return;
    try {
      const response = await fetch(`/api/pipeline/stages/${encodeURIComponent(stage.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Falha ao atualizar a coluna.");
      }
    } catch (error) {
      onStagesChange(() => previous);
      onFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Falha ao atualizar a coluna."
      });
    }
  }

  function commitRename() {
    const name = nameDraft.trim();
    setRenaming(false);
    if (!name || name === stage.name) {
      setNameDraft(stage.name);
      return;
    }
    void patchStage({ name }, (s) => ({ ...s, name }));
  }

  async function deleteColumn() {
    setMenuOpen(false);
    const others = allStages.filter((s) => s.id !== stage.id);
    if (others.length === 0) {
      onFeedback({ type: "error", message: "O funil precisa ter ao menos uma coluna." });
      return;
    }
    let reassignTo: string | null = null;
    if (cards.length > 0) {
      reassignTo = others[0].id;
      onLeadsChange((current) =>
        current.map((lead) => (lead.stageId === stage.id ? { ...lead, stageId: reassignTo } : lead))
      );
    }
    const previous = allStages;
    onStagesChange((current) => current.filter((s) => s.id !== stage.id));
    if (mode !== "supabase") return;
    try {
      const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : "";
      const response = await fetch(`/api/pipeline/stages/${encodeURIComponent(stage.id)}${query}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Falha ao excluir a coluna.");
      }
    } catch (error) {
      onStagesChange(() => previous);
      onFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Falha ao excluir a coluna."
      });
    }
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      aria-label={`Coluna ${stage.name}`}
      className="flex max-h-[74vh] w-[288px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/50 dark:bg-surface-elevated/20"
    >
      <div className={`h-1.5 w-full ${colors.dot}`} />
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {canManageColumns ? (
            <button
              className="cursor-grab text-muted-foreground/70 hover:text-foreground active:cursor-grabbing"
              aria-label="Reordenar coluna"
              type="button"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={15} aria-hidden="true" />
            </button>
          ) : null}
          {renaming ? (
            <input
              autoFocus
              className="liquid-input h-7 min-w-0 flex-1 px-2 text-[13px] font-bold"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") {
                  setNameDraft(stage.name);
                  setRenaming(false);
                }
              }}
            />
          ) : (
            <h3
              className="truncate text-[13px] font-bold uppercase tracking-wider text-foreground"
              onDoubleClick={() => canManageColumns && setRenaming(true)}
              title={stage.name}
            >
              {stage.name || NAME_FALLBACK}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold ${colors.soft} ${
              overLimit ? "text-red-600 dark:text-red-400" : "text-foreground"
            }`}
          >
            {cards.length}
            {typeof stage.wipLimit === "number" ? `/${stage.wipLimit}` : ""}
          </span>
          {canManageColumns ? (
            <div className="relative">
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Opções da coluna"
                type="button"
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>
              {menuOpen ? (
                <div className="surface-modal absolute right-0 z-20 mt-1 w-56 rounded-xl p-2 shadow-lg">
                  <button
                    className="surface-action-secondary w-full rounded-lg px-3 py-2 text-left text-sm font-medium"
                    onClick={() => {
                      setRenaming(true);
                      setMenuOpen(false);
                    }}
                    type="button"
                  >
                    Renomear
                  </button>
                  <div className="px-1 py-2">
                    <p className="mb-1.5 px-2 text-xs font-semibold text-muted-soft">Cor</p>
                    <div className="flex flex-wrap gap-1.5 px-2">
                      {BOARD_COLOR_KEYS.map((colorKey) => (
                        <button
                          key={colorKey}
                          aria-label={`Cor ${colorKey}`}
                          className={`h-6 w-6 rounded-full ${getBoardColorClasses(colorKey).dot} ${
                            stage.color === colorKey ? "ring-2 ring-offset-1 ring-offset-transparent " + colors.ring : ""
                          }`}
                          onClick={() => {
                            void patchStage({ color: colorKey }, (s) => ({ ...s, color: colorKey }));
                            setMenuOpen(false);
                          }}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    onClick={deleteColumn}
                    type="button"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Excluir coluna
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-1 flex-col gap-2.5 overflow-y-auto px-2 pb-2">
        <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          {cards.map((lead) => (
            <SortableCard
              key={lead.id}
              lead={lead}
              draggable={canReorderLeads && (lead.canEdit ?? true)}
              onSelect={onSelectLead}
            />
          ))}
        </SortableContext>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/55 p-5 text-center text-xs font-medium leading-5 text-muted-soft">
            {canReorderLeads ? "Solte um card aqui." : "Nenhum card nesta coluna."}
          </div>
        ) : null}
      </div>

      <button
        className="m-2 mt-0 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
        onClick={() => onAddCard(stage.id)}
        type="button"
      >
        <Plus size={16} aria-hidden="true" />
        Adicionar cartão
      </button>
    </section>
  );
}

function AddColumnButton({
  mode,
  onStagesChange,
  onFeedback
}: {
  mode: LeadDataMode;
  onStagesChange: (updater: (stages: PipelineStage[]) => PipelineStage[]) => void;
  onFeedback: (feedback: BoardFeedback | null) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const busy = useRef(false);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || busy.current) {
      setAdding(false);
      setName("");
      return;
    }
    busy.current = true;
    if (mode !== "supabase") {
      onFeedback({ type: "success", message: "Colunas só podem ser criadas com o Supabase configurado." });
      setAdding(false);
      setName("");
      busy.current = false;
      return;
    }
    try {
      const response = await fetch("/api/pipeline/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      const data = (await response.json().catch(() => ({}))) as { stage?: PipelineStage; error?: string };
      if (!response.ok || !data.stage) throw new Error(data.error ?? "Falha ao criar coluna.");
      const created = data.stage;
      onStagesChange((current) => [...current, created]);
      setName("");
      setAdding(false);
    } catch (error) {
      onFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Falha ao criar coluna."
      });
    } finally {
      busy.current = false;
    }
  }

  if (!adding) {
    return (
      <button
        className="flex h-11 w-[288px] shrink-0 items-center gap-2 rounded-2xl border border-dashed border-border/60 px-4 text-sm font-semibold text-muted-foreground hover:border-border hover:text-foreground"
        onClick={() => setAdding(true)}
        type="button"
      >
        <Plus size={16} aria-hidden="true" />
        Adicionar coluna
      </button>
    );
  }

  return (
    <div className="w-[288px] shrink-0 rounded-2xl border border-border/60 bg-surface-elevated/40 p-2">
      <input
        autoFocus
        className="liquid-input h-9 w-full px-3 text-sm"
        placeholder="Nome da coluna"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void create();
          if (event.key === "Escape") {
            setAdding(false);
            setName("");
          }
        }}
      />
      <div className="mt-2 flex gap-2">
        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/92"
          onClick={() => void create()}
          type="button"
        >
          Adicionar
        </button>
        <button
          className="surface-action-secondary rounded-lg px-3 py-1.5 text-sm font-semibold"
          onClick={() => {
            setAdding(false);
            setName("");
          }}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────── Card ───────────────────────────────

function SortableCard({
  lead,
  draggable,
  onSelect
}: {
  lead: Lead;
  draggable: boolean;
  onSelect: (lead: Lead) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    disabled: !draggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard lead={lead} onSelect={onSelect} />
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDue(dueAt: string): { label: string; overdue: boolean } {
  const date = new Date(dueAt);
  if (Number.isNaN(date.getTime())) return { label: "", overdue: false };
  const overdue = date.getTime() < Date.now();
  const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return { label, overdue };
}

function BoardCard({
  lead,
  overlay = false,
  onSelect
}: {
  lead: Lead;
  overlay?: boolean;
  onSelect: (lead: Lead) => void;
}) {
  const labels = lead.labels ?? [];
  const members = lead.members ?? [];
  const cover = lead.cover ?? null;
  const checklistTotal = lead.checklistTotal ?? 0;
  const checklistDone = lead.checklistDone ?? 0;
  const due = lead.dueAt ? formatDue(lead.dueAt) : null;
  const phoneDigits = lead.phone?.replace(/\D/g, "") ?? "";

  return (
    <article
      className={`group overflow-hidden rounded-xl border border-border/70 bg-white text-foreground shadow-sm transition dark:bg-surface-elevated ${
        overlay
          ? "rotate-3 scale-[1.03] cursor-grabbing shadow-2xl ring-1 ring-cobalt/30"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-border hover:shadow-md"
      }`}
      onClick={overlay ? undefined : () => onSelect(lead)}
      role={overlay ? undefined : "button"}
      tabIndex={overlay ? undefined : 0}
      onKeyDown={(event) => {
        if (overlay) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(lead);
        }
      }}
    >
      {cover?.imageUrl ? (
        <div className="h-20 w-full bg-cover bg-center" style={{ backgroundImage: `url(${cover.imageUrl})` }} />
      ) : cover?.color ? (
        <div className={`h-8 w-full ${getBoardColorClasses(cover.color).dot}`} />
      ) : null}

      <div className="p-3">
        {labels.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {labels.map((label: BoardLabel) => {
              const c = getBoardColorClasses(label.color);
              return label.name ? (
                <span
                  key={label.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.solid}`}
                >
                  {label.name}
                </span>
              ) : (
                <span key={label.id} className={`h-2 w-9 rounded-full ${c.dot}`} />
              );
            })}
          </div>
        ) : null}

        <span className="block text-sm font-semibold leading-tight">{lead.name || NAME_FALLBACK}</span>
        <span className="mt-1 block text-xs font-medium text-muted-foreground">{lead.owner}</span>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="surface-pill rounded-full px-2 py-0.5 text-[10px] font-semibold">{lead.source}</span>
          {due ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                due.overdue ? "bg-red-500/15 text-red-600 dark:text-red-400" : "surface-pill"
              }`}
            >
              <CalendarClock size={11} aria-hidden="true" />
              {due.label}
            </span>
          ) : null}
          {checklistTotal > 0 ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                checklistDone === checklistTotal ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "surface-pill"
              }`}
            >
              <CheckSquare size={11} aria-hidden="true" />
              {checklistDone}/{checklistTotal}
            </span>
          ) : null}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <span
                key={member.profileId}
                title={member.name}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-card bg-cobalt/15 text-[10px] font-bold text-cobalt"
              >
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatarUrl} alt={member.name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  initials(member.name)
                )}
              </span>
            ))}
          </div>
          {!overlay ? (
            <div className="flex gap-1.5 opacity-0 transition group-hover:opacity-100">
              <button
                className="icon-button h-8 w-8 bg-surface-elevated/88"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(lead);
                }}
                title="Abrir card"
                type="button"
              >
                <MessageCircle size={14} aria-hidden="true" />
              </button>
              <a
                className="icon-button h-8 w-8 bg-surface-elevated/88"
                href={phoneDigits ? `tel:${phoneDigits}` : "#"}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!phoneDigits) event.preventDefault();
                }}
                title="Ligar"
              >
                <PhoneCall size={14} aria-hidden="true" />
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
