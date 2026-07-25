"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  CalendarClock,
  Check,
  Clock3,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  PenLine,
  PhoneCall,
  Plus,
  Send,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import type { Lead } from "@/data/mock";
import type { LeadDataMode } from "@/lib/leads/repository";
import type { LeadOwnerOption } from "@/lib/leads/repository.server";
import type { LeadComment } from "@/lib/leads/comments";
import type { BoardChecklist, BoardLabel, BoardMember } from "@/lib/pipeline/types";
import { BOARD_COLOR_KEYS, getBoardColorClasses } from "@/lib/pipeline/colors";
import { getLeadStageLabel } from "@/lib/leads/stages";
import { getLeadQualityLabel } from "@/lib/leads/quality";
import { getLeadOriginDescription } from "@/lib/leads/source";
import { normalizePhone } from "@/lib/leads/normalization";

type BoardFeedback = { type: "success" | "error"; message: string };

type CardDetailModalProps = {
  lead: Lead | null;
  labels: BoardLabel[];
  memberOptions: LeadOwnerOption[];
  canManageLabels: boolean;
  mode: LeadDataMode;
  onClose: () => void;
  onLeadPatch: (leadId: string, patch: Partial<Lead>) => void;
  onLabelsChange: (updater: (labels: BoardLabel[]) => BoardLabel[]) => void;
  onOpenFullDetails: (lead: Lead) => void;
  onFeedback: (feedback: BoardFeedback | null) => void;
};

// Valores placeholder que o repositório usa quando não há dado real — tratamos como vazio.
const PLACEHOLDER_VALUES = new Set([
  "Sem telefone",
  "Sem email",
  "A qualificar",
  "Interesse ainda nao qualificado",
  "Lead recebido no CRM.",
  "Sem observacoes registradas.",
  "Sem observações registradas."
]);

function isMeaningful(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "" && !PLACEHOLDER_VALUES.has(value.trim());
}

async function apiJson(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) {
    throw new Error(data.error ?? "Não foi possível concluir a operação.");
  }
  return data;
}

export function CardDetailModal({
  lead,
  labels,
  memberOptions,
  canManageLabels,
  mode,
  onClose,
  onLeadPatch,
  onLabelsChange,
  onOpenFullDetails,
  onFeedback
}: CardDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [checklists, setChecklists] = useState<BoardChecklist[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  useEffect(() => setMounted(true), []);

  const leadId = lead?.id ?? null;
  const isSupabase = mode === "supabase";

  const loadChecklists = useCallback(async () => {
    if (!leadId || !isSupabase) return;
    setLoadingChecklists(true);
    try {
      const data = await apiJson(`/api/leads/${encodeURIComponent(leadId)}/checklists`, "GET");
      setChecklists((data.checklists as BoardChecklist[]) ?? []);
    } catch {
      setChecklists([]);
    } finally {
      setLoadingChecklists(false);
    }
  }, [leadId, isSupabase]);

  useEffect(() => {
    if (leadId) {
      void loadChecklists();
    } else {
      setChecklists([]);
    }
  }, [leadId, loadChecklists]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (lead) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [lead, onClose]);

  if (!mounted || !lead) return null;

  const activeLabelIds = new Set((lead.labels ?? []).map((label) => label.id));
  const activeMemberIds = new Set((lead.members ?? []).map((member) => member.profileId));

  function guardSupabase(): boolean {
    if (!isSupabase) {
      onFeedback({ type: "success", message: "Disponível apenas com o Supabase configurado." });
      return false;
    }
    return true;
  }

  async function toggleLabel(label: BoardLabel) {
    if (!leadId || !guardSupabase()) return;
    const attached = !activeLabelIds.has(label.id);
    const nextLabels = attached
      ? [...(lead!.labels ?? []), label]
      : (lead!.labels ?? []).filter((item) => item.id !== label.id);
    onLeadPatch(leadId, { labels: nextLabels });
    try {
      await apiJson(`/api/leads/${encodeURIComponent(leadId)}/labels`, "POST", {
        labelId: label.id,
        attached
      });
    } catch (error) {
      onLeadPatch(leadId, { labels: lead!.labels ?? [] });
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao aplicar etiqueta." });
    }
  }

  async function toggleMember(option: LeadOwnerOption) {
    if (!leadId || !guardSupabase()) return;
    const attached = !activeMemberIds.has(option.id);
    const member: BoardMember = { profileId: option.id, name: option.name, avatarUrl: null };
    const nextMembers = attached
      ? [...(lead!.members ?? []), member]
      : (lead!.members ?? []).filter((item) => item.profileId !== option.id);
    onLeadPatch(leadId, { members: nextMembers });
    try {
      await apiJson(`/api/leads/${encodeURIComponent(leadId)}/members`, "POST", {
        profileId: option.id,
        attached
      });
    } catch (error) {
      onLeadPatch(leadId, { members: lead!.members ?? [] });
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao alterar membro." });
    }
  }

  async function updateCard(patch: { dueAt?: string | null; cover?: Lead["cover"] }) {
    if (!leadId || !guardSupabase()) return;
    const previous = { dueAt: lead!.dueAt, cover: lead!.cover };
    onLeadPatch(leadId, patch);
    try {
      await apiJson(`/api/leads/${encodeURIComponent(leadId)}/card`, "PATCH", patch);
    } catch (error) {
      onLeadPatch(leadId, previous);
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao atualizar o card." });
    }
  }

  async function createLabel() {
    if (!guardSupabase()) return;
    try {
      const data = await apiJson("/api/labels", "POST", { name: "Nova etiqueta", color: "cobalt" });
      const label = data.label as BoardLabel;
      onLabelsChange((current) => [...current, label]);
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao criar etiqueta." });
    }
  }

  const dueInputValue = lead.dueAt ? toDateInputValue(lead.dueAt) : "";
  const stageLabel = getLeadStageLabel(lead.stage);
  const phoneHref = buildPhoneHref(lead.phone);
  const emailHref = isMeaningful(lead.email) ? `mailto:${lead.email}` : undefined;
  const whatsappHref = buildWhatsAppHref(lead);

  const profileItems: { icon: typeof PhoneCall; label: string; value: string; href?: string }[] = [
    { icon: PhoneCall, label: "Telefone", value: isMeaningful(lead.phone) ? lead.phone : "Sem telefone", href: phoneHref },
    { icon: Mail, label: "Email", value: isMeaningful(lead.email) ? lead.email : "Sem email", href: emailHref },
    { icon: UserRound, label: "Responsável", value: lead.owner || "Sem responsável" },
    { icon: MessageCircle, label: "Origem", value: lead.source },
    { icon: CalendarClock, label: "Cidade/UF", value: [lead.city, lead.estado].filter(isMeaningful).join(" · ") || "Não informado" },
    { icon: UserRound, label: "Empresa", value: isMeaningful(lead.companyName) ? lead.companyName! : "Não informada" },
    { icon: Check, label: "Qualidade", value: getLeadQualityLabel(lead.quality) },
    { icon: CalendarClock, label: "Orçamento", value: isMeaningful(lead.budget) ? lead.budget : "Não informado" }
  ];

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-md md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="surface-modal relative my-auto w-full max-w-5xl overflow-hidden rounded-3xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="icon-button absolute right-4 top-4 z-10 h-9 w-9 bg-surface-elevated/88"
            onClick={onClose}
            aria-label="Fechar"
            type="button"
          >
            <X size={16} aria-hidden="true" />
          </button>

          <div className="grid max-h-[92vh] grid-cols-1 lg:grid-cols-[1fr_368px]">
            {/* ─────────── Conteúdo principal ─────────── */}
            <div className="max-h-[92vh] overflow-y-auto p-5 md:p-6">
              <header className="pr-10">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold leading-tight">{lead.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lead.owner} · {stageLabel}
                    </p>
                  </div>
                </div>
              </header>

              {/* Barra de ações rápidas */}
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton icon={UserRound} label="Detalhes do lead" onClick={() => onOpenFullDetails(lead)} />
                {whatsappHref ? (
                  <ActionLink icon={Send} label="WhatsApp" href={whatsappHref} external />
                ) : null}
                {phoneHref ? <ActionLink icon={PhoneCall} label="Ligar" href={phoneHref} /> : null}
                {emailHref ? <ActionLink icon={Mail} label="E-mail" href={emailHref} /> : null}
              </div>

              {/* Etiquetas */}
              <section className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Tag size={15} aria-hidden="true" /> Etiquetas
                  </h3>
                  {canManageLabels ? (
                    <button className="text-xs font-semibold text-cobalt hover:underline" onClick={createLabel} type="button">
                      + Nova
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {labels.length === 0 ? (
                    <p className="text-xs text-muted-soft">Nenhuma etiqueta criada ainda.</p>
                  ) : (
                    labels.map((label) => {
                      const colors = getBoardColorClasses(label.color);
                      const active = activeLabelIds.has(label.id);
                      return (
                        <button
                          key={label.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            active ? colors.solid : `${colors.soft} ${colors.text}`
                          }`}
                          onClick={() => toggleLabel(label)}
                          type="button"
                        >
                          {active ? <Check size={12} aria-hidden="true" /> : null}
                          {label.name || "Etiqueta"}
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Membros */}
              <section className="mt-6">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <UsersRound size={15} aria-hidden="true" /> Membros
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {memberOptions.length === 0 ? (
                    <p className="text-xs text-muted-soft">Nenhum membro disponível.</p>
                  ) : (
                    memberOptions.map((option) => {
                      const active = activeMemberIds.has(option.id);
                      return (
                        <button
                          key={option.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            active ? "bg-cobalt text-white" : "surface-action-secondary"
                          }`}
                          onClick={() => toggleMember(option)}
                          type="button"
                        >
                          {active ? <Check size={12} aria-hidden="true" /> : null}
                          {option.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Vencimento + Capa */}
              <section className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <CalendarClock size={15} aria-hidden="true" /> Vencimento
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="liquid-input h-9 flex-1 px-3 text-sm"
                      value={dueInputValue}
                      onChange={(event) =>
                        updateCard({ dueAt: event.target.value ? new Date(event.target.value).toISOString() : null })
                      }
                    />
                    {lead.dueAt ? (
                      <button
                        className="icon-button h-9 w-9 bg-surface-elevated/88"
                        onClick={() => updateCard({ dueAt: null })}
                        title="Remover vencimento"
                        type="button"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <ImageIcon size={15} aria-hidden="true" /> Capa
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {BOARD_COLOR_KEYS.map((colorKey) => (
                      <button
                        key={colorKey}
                        aria-label={`Capa ${colorKey}`}
                        className={`h-7 w-7 rounded-md ${getBoardColorClasses(colorKey).dot} ${
                          lead.cover?.color === colorKey ? "ring-2 ring-cobalt/50" : ""
                        }`}
                        onClick={() => updateCard({ cover: { color: colorKey } })}
                        type="button"
                      />
                    ))}
                    {lead.cover ? (
                      <button
                        className="icon-button h-7 w-7 bg-surface-elevated/88"
                        onClick={() => updateCard({ cover: null })}
                        title="Remover capa"
                        type="button"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* Descrição (mapeada para notes) */}
              <DescriptionSection
                key={lead.id}
                leadId={leadId!}
                value={isMeaningful(lead.notes) ? lead.notes : ""}
                disabled={!isSupabase}
                onSaved={(notes) => onLeadPatch(leadId!, { notes })}
                onFeedback={onFeedback}
              />

              {/* Informações do lead */}
              <section className="mt-6">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <UserRound size={15} aria-hidden="true" /> Informações do lead
                </h3>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {profileItems.map((item) => (
                    <div key={item.label} className="surface-card-muted rounded-xl px-3 py-2">
                      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
                        <item.icon size={12} aria-hidden="true" /> {item.label}
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-medium">
                        {item.href ? (
                          <a className="text-cobalt hover:underline" href={item.href}>
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                {isMeaningful(lead.source) ? (
                  <p className="mt-2 text-xs text-muted-soft">{getLeadOriginDescription(lead.source)}</p>
                ) : null}
              </section>

              {/* Checklists */}
              <section className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Checklists</h3>
                  {loadingChecklists ? <Loader2 size={14} className="animate-spin text-muted-foreground" /> : null}
                </div>
                <ChecklistSection
                  leadId={leadId!}
                  checklists={checklists}
                  disabled={!isSupabase}
                  onReload={loadChecklists}
                  onLocalCountChange={(total, done) =>
                    leadId && onLeadPatch(leadId, { checklistTotal: total, checklistDone: done })
                  }
                  onFeedback={onFeedback}
                />
              </section>
            </div>

            {/* ─────────── Comentários e atividade ─────────── */}
            <ActivitySidebar key={`activity-${lead.id}`} lead={lead} onFeedback={onFeedback} onLeadPatch={onLeadPatch} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─────────────────────────── Ações rápidas ───────────────────────────

function ActionButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="surface-action-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
      onClick={onClick}
      type="button"
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  );
}

function ActionLink({
  icon: Icon,
  label,
  href,
  external = false
}: {
  icon: typeof UserRound;
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      className="surface-action-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </a>
  );
}

// ─────────────────────────── Descrição ───────────────────────────

function DescriptionSection({
  leadId,
  value,
  disabled,
  onSaved,
  onFeedback
}: {
  leadId: string;
  value: string;
  disabled: boolean;
  onSaved: (notes: string) => void;
  onFeedback: (feedback: BoardFeedback | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
    setEditing(false);
  }, [value, leadId]);

  async function save() {
    if (disabled) {
      onFeedback({ type: "success", message: "Disponível apenas com o Supabase configurado." });
      setEditing(false);
      return;
    }
    const next = draft.trim();
    setSaving(true);
    try {
      await apiJson(`/api/leads/${encodeURIComponent(leadId)}`, "PATCH", { notes: next });
      onSaved(next);
      setEditing(false);
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao salvar descrição." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <AlignLeft size={15} aria-hidden="true" /> Descrição
        </h3>
        {!editing && value ? (
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold text-cobalt hover:underline"
            onClick={() => setEditing(true)}
            type="button"
          >
            <PenLine size={12} aria-hidden="true" /> Editar
          </button>
        ) : null}
      </div>

      {editing ? (
        <div>
          <textarea
            autoFocus
            className="liquid-input min-h-[120px] w-full resize-y px-3 py-2 text-sm"
            value={draft}
            disabled={saving}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Adicione contexto, próximos passos e observações sobre este lead."
          />
          <div className="mt-2 flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/92 disabled:opacity-70"
              onClick={save}
              disabled={saving}
              type="button"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Salvar
            </button>
            <button
              className="surface-action-secondary rounded-lg px-3 py-1.5 text-sm font-semibold"
              onClick={() => {
                setDraft(value);
                setEditing(false);
              }}
              disabled={saving}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : value ? (
        <button
          className="surface-card-muted w-full whitespace-pre-line rounded-xl px-3 py-2.5 text-left text-sm leading-6 text-foreground hover:bg-surface-elevated"
          onClick={() => setEditing(true)}
          type="button"
        >
          {value}
        </button>
      ) : (
        <button
          className="surface-action-secondary w-full rounded-xl px-3 py-2.5 text-left text-sm text-muted-soft"
          onClick={() => setEditing(true)}
          type="button"
        >
          Adicionar uma descrição mais detalhada…
        </button>
      )}
    </section>
  );
}

// ─────────────────────── Comentários e atividade ───────────────────────

type FeedItem =
  | { kind: "comment"; id: string; at: string; comment: LeadComment }
  | { kind: "event"; id: string; at: string; label: string };

function ActivitySidebar({
  lead,
  onFeedback,
  onLeadPatch
}: {
  lead: Lead;
  onFeedback: (feedback: BoardFeedback | null) => void;
  onLeadPatch: (leadId: string, patch: Partial<Lead>) => void;
}) {
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [draft, setDraft] = useState("");
  const [commentType, setCommentType] = useState<"comment" | "contact">("comment");
  const [submitting, setSubmitting] = useState(false);
  const leadIdRef = useRef(lead.id);
  leadIdRef.current = lead.id;

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setComments([]);
    void fetch(`/api/leads/${encodeURIComponent(lead.id)}/comments`, { method: "GET", cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { comments?: LeadComment[] };
        if (active) {
          setComments(data.comments ?? []);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("ready");
      });
    return () => {
      active = false;
    };
  }, [lead.id]);

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = comments.map((comment) => ({
      kind: "comment",
      id: comment.id,
      at: comment.createdAt,
      comment
    }));
    const createdAt = lead.receivedAt ?? lead.updatedAt ?? null;
    if (createdAt) {
      items.push({ kind: "event", id: "lead-created", at: createdAt, label: "Lead adicionado ao CRM" });
    }
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [comments, lead.receivedAt, lead.updatedAt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(lead.id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, type: commentType })
      });
      const data = (await response.json().catch(() => ({}))) as { comment?: LeadComment; lead?: Lead; error?: string };
      if (!response.ok || !data.comment) {
        throw new Error(data.error ?? "Não foi possível salvar o comentário.");
      }
      setComments((current) => [...current, data.comment!]);
      setDraft("");
      setCommentType("comment");
      if (data.lead) onLeadPatch(lead.id, data.lead);
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao comentar." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="flex max-h-[92vh] flex-col border-t border-border/60 bg-surface/40 dark:bg-surface-elevated/20 lg:border-l lg:border-t-0">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <MessageCircle size={16} aria-hidden="true" />
        <h3 className="text-sm font-semibold">Comentários e atividade</h3>
        <span className="surface-pill ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold">{comments.length}</span>
      </div>

      <form className="px-5 pb-3" onSubmit={submit}>
        <div className="mb-2 flex items-center gap-4 text-xs font-medium">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="cardCommentType"
              checked={commentType === "comment"}
              onChange={() => setCommentType("comment")}
              className="text-cobalt focus:ring-cobalt"
            />
            Comentário
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="cardCommentType"
              checked={commentType === "contact"}
              onChange={() => setCommentType("contact")}
              className="text-cobalt focus:ring-cobalt"
            />
            Contato realizado
          </label>
        </div>
        <textarea
          className="liquid-input min-h-[72px] w-full resize-y px-3 py-2 text-sm"
          placeholder="Escrever um comentário…"
          value={draft}
          maxLength={2000}
          disabled={submitting}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-cobalt px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:opacity-70"
            disabled={submitting || !draft.trim()}
            type="submit"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar
          </button>
        </div>
      </form>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-5">
        {status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted-soft">
            <Loader2 size={14} className="animate-spin" /> Carregando…
          </div>
        ) : feed.length === 0 ? (
          <p className="text-sm leading-6 text-muted-soft">
            Nenhuma atividade ainda. Use este espaço para registrar contatos, objeções e próximos passos.
          </p>
        ) : (
          feed.map((item) =>
            item.kind === "comment" ? (
              <CommentItem key={item.id} comment={item.comment} />
            ) : (
              <div key={item.id} className="flex items-center gap-2 pl-1 text-xs text-muted-soft">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-elevated">
                  <Clock3 size={12} aria-hidden="true" />
                </span>
                <span>
                  {item.label} · {formatTimestamp(item.at)}
                </span>
              </div>
            )
          )
        )}
      </div>
    </aside>
  );
}

function CommentItem({ comment }: { comment: LeadComment }) {
  const isContact = comment.type === "contact";
  return (
    <article className="flex gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cobalt/15 text-[11px] font-bold text-cobalt">
        {initials(comment.authorName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold">{comment.authorName}</span>
          {isContact ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              <PhoneCall size={9} aria-hidden="true" /> Contato
            </span>
          ) : null}
          <span className="text-[11px] text-muted-soft">{formatTimestamp(comment.createdAt)}</span>
        </div>
        <div
          className={`mt-1 whitespace-pre-line rounded-xl px-3 py-2 text-sm leading-6 ${
            isContact ? "surface-alert-warning" : "surface-card"
          }`}
        >
          {comment.body}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────── Checklists ───────────────────────────

function ChecklistSection({
  leadId,
  checklists,
  disabled,
  onReload,
  onLocalCountChange,
  onFeedback
}: {
  leadId: string;
  checklists: BoardChecklist[];
  disabled: boolean;
  onReload: () => Promise<void> | void;
  onLocalCountChange: (total: number, done: number) => void;
  onFeedback: (feedback: BoardFeedback | null) => void;
}) {
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  function recomputeCounts(list: BoardChecklist[]) {
    let total = 0;
    let done = 0;
    for (const checklist of list) {
      for (const item of checklist.items) {
        total += 1;
        if (item.done) done += 1;
      }
    }
    onLocalCountChange(total, done);
  }

  async function addChecklist() {
    if (disabled) return;
    try {
      await apiJson(`/api/leads/${encodeURIComponent(leadId)}/checklists`, "POST", { title: "Checklist" });
      await onReload();
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao criar checklist." });
    }
  }

  async function deleteChecklist(id: string) {
    if (disabled) return;
    try {
      await apiJson(`/api/checklists/${encodeURIComponent(id)}`, "DELETE");
      await onReload();
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao excluir checklist." });
    }
  }

  async function addItem(checklistId: string) {
    const text = (newItemText[checklistId] ?? "").trim();
    if (!text || disabled) return;
    setNewItemText((current) => ({ ...current, [checklistId]: "" }));
    try {
      await apiJson(`/api/checklists/${encodeURIComponent(checklistId)}/items`, "POST", { leadId, text });
      await onReload();
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao adicionar item." });
    }
  }

  async function toggleItem(checklistId: string, itemId: string, done: boolean) {
    if (disabled) return;
    // Otimista nos contadores.
    const nextList = checklists.map((checklist) =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: checklist.items.map((item) => (item.id === itemId ? { ...item, done } : item))
          }
        : checklist
    );
    recomputeCounts(nextList);
    try {
      await apiJson(`/api/checklist-items/${encodeURIComponent(itemId)}`, "PATCH", { done });
      await onReload();
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao atualizar item." });
      await onReload();
    }
  }

  async function deleteItem(itemId: string) {
    if (disabled) return;
    try {
      await apiJson(`/api/checklist-items/${encodeURIComponent(itemId)}`, "DELETE");
      await onReload();
    } catch (error) {
      onFeedback({ type: "error", message: error instanceof Error ? error.message : "Falha ao excluir item." });
    }
  }

  return (
    <div className="space-y-4">
      {checklists.map((checklist) => {
        const done = checklist.items.filter((item) => item.done).length;
        const total = checklist.items.length;
        return (
          <div key={checklist.id} className="surface-card-muted rounded-2xl p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{checklist.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {done}/{total}
                </span>
                <button
                  className="icon-button h-7 w-7 bg-surface-elevated/88"
                  onClick={() => deleteChecklist(checklist.id)}
                  title="Excluir checklist"
                  type="button"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
            {total > 0 ? (
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round((done / total) * 100)}%` }}
                />
              </div>
            ) : null}
            <ul className="space-y-1">
              {checklist.items.map((item) => (
                <li key={item.id} className="group flex items-center gap-2">
                  <button
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      item.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"
                    }`}
                    onClick={() => toggleItem(checklist.id, item.id, !item.done)}
                    aria-label={item.done ? "Desmarcar" : "Marcar"}
                    type="button"
                  >
                    {item.done ? <Check size={11} aria-hidden="true" /> : null}
                  </button>
                  <span
                    className={`flex-1 text-sm ${item.done ? "text-muted-soft line-through" : "text-foreground"}`}
                  >
                    {item.text}
                  </span>
                  <button
                    className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                    onClick={() => deleteItem(item.id)}
                    aria-label="Excluir item"
                    type="button"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <input
                className="liquid-input h-8 flex-1 px-3 text-sm"
                placeholder="Adicionar item"
                value={newItemText[checklist.id] ?? ""}
                onChange={(event) =>
                  setNewItemText((current) => ({ ...current, [checklist.id]: event.target.value }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") void addItem(checklist.id);
                }}
              />
            </div>
          </div>
        );
      })}
      <button
        className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        onClick={addChecklist}
        disabled={disabled}
        type="button"
      >
        <Plus size={15} aria-hidden="true" />
        Adicionar checklist
      </button>
    </div>
  );
}

// ─────────────────────────── Utilitários ───────────────────────────

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function buildPhoneHref(phone: string): string | undefined {
  const normalized = normalizePhone(phone).e164;
  return normalized ? `tel:${normalized}` : undefined;
}

function buildWhatsAppHref(lead: Lead): string | undefined {
  const normalized = normalizePhone(lead.phone).e164;
  if (!normalized) return undefined;
  const phone = normalized.replace(/\D/g, "");
  const firstName = lead.name.trim().split(/\s+/)[0] || "";
  const interest = isMeaningful(lead.interest) ? ` sobre ${lead.interest}` : "";
  const text = encodeURIComponent(`Olá, ${firstName}! Tudo bem? Vi seu interesse${interest} e posso te ajudar por aqui.`);
  return `https://wa.me/${phone}?text=${text}`;
}
