"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Archive,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  MessageCircle,
  PhoneCall,
  Save,
  Send,
  UserRound,
  X
} from "lucide-react";
import type { Lead } from "@/data/mock";
import type { LeadComment } from "@/lib/leads/comments";
import {
  getLeadQualityLabel,
  getLeadQualityMeta,
  leadQualityOptions
} from "@/lib/leads/quality";
import {
  getLeadStageLabel,
  getLeadStageMeta,
  getLeadStageValue,
  type LeadStageTone
} from "@/lib/leads/stages";
import {
  getLeadOriginDescription,
  getLeadOriginDetails
} from "@/lib/leads/source";
import { normalizePhone } from "@/lib/leads/normalization";
import { LeadMessageGenerator } from "./lead-message-generator";
import type { SystemTemplate } from "@/lib/templates/types";
import type { LeadOwnerOption } from "@/lib/leads/repository.server";

type LeadUpdateMode = "supabase" | "mock" | "not-configured" | "unauthenticated" | "error";

type LeadDetailsPopupProps = {
  aiBalance?: number;
  canManageLeadOwners?: boolean;
  initialEditMode?: boolean;
  initialPanel?: "details" | "message";
  lead: Lead | null;
  leadOwnerOptions?: LeadOwnerOption[];
  messageGeneratorEnabled?: boolean;
  onClose: () => void;
  onDeleted?: (leadId: string, mode?: LeadUpdateMode) => void;
  onUpdated?: (lead: Lead, mode?: LeadUpdateMode) => void;
  whatsappTemplates?: SystemTemplate[];
};

type LeadEditValues = {
  name: string;
  email: string;
  phone: string;
  owner_profile_id: string;
  city: string;
  company_name: string;
  lives_count: string;
  quality: string;
  stage: string;
  interest: string;
  budget: string;
  last_interaction: string;
  notes: string;
  loss_reason: string;
};

type LeadEditErrors = Partial<Record<keyof LeadEditValues | "contact", string>>;

type LeadUpdateResponse = {
  lead?: Lead;
  error?: string;
  mode?: LeadUpdateMode;
};

type LeadDeleteResponse = {
  ok?: boolean;
  error?: string;
  mode?: LeadUpdateMode;
};

type LeadCommentsResponse = {
  comments?: LeadComment[];
  error?: string;
  mode?: LeadUpdateMode;
};

type LeadCommentResponse = {
  comment?: LeadComment;
  lead?: Lead;
  error?: string;
  mode?: LeadUpdateMode;
};

const emptyDisplayValues = new Set([
  "Sem telefone",
  "Sem email",
  "A qualificar",
  "Interesse ainda nao qualificado",
  "Lead recebido no CRM.",
  "Sem observacoes registradas."
]);

export function LeadDetailsPopup({
  aiBalance = 0,
  canManageLeadOwners = false,
  initialEditMode = false,
  initialPanel = "details",
  lead,
  leadOwnerOptions = [],
  messageGeneratorEnabled = false,
  onClose,
  onDeleted,
  onUpdated,
  whatsappTemplates = []
}: LeadDetailsPopupProps) {
  const previousLeadIdRef = useRef<string | null>(null);
  const [activePanel, setActivePanel] = useState<"details" | "message">(initialPanel);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState<LeadEditValues | null>(null);
  const [errors, setErrors] = useState<LeadEditErrors>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsStatus, setCommentsStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [commentsRefreshCounter, setCommentsRefreshCounter] = useState(0);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentType, setCommentType] = useState<"comment" | "contact">("comment");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!lead) {
      previousLeadIdRef.current = null;
      return;
    }

    if (previousLeadIdRef.current === lead.id) {
      return;
    }

    previousLeadIdRef.current = lead.id;
    setFormValues(getLeadEditValues(lead));
    setErrors({});
    setStatus(null);
    setIsEditing(initialEditMode);
    setIsSubmitting(false);
    setIsConfirmingDelete(false);
    setIsDeleting(false);
    setDeleteError(null);
    setComments([]);
    setCommentsError(null);
    setCommentsStatus("idle");
    setActivePanel(messageGeneratorEnabled && initialPanel === "message" ? "message" : "details");
    setCommentDraft("");
    setCommentType("comment");
    setIsSubmittingComment(false);
  }, [initialEditMode, initialPanel, lead, messageGeneratorEnabled]);

  useEffect(() => {
    if (!lead) {
      return;
    }

    let active = true;
    setCommentsStatus("loading");
    setCommentsError(null);

    void fetch(`/api/leads/${encodeURIComponent(lead.id)}/comments`, {
      method: "GET",
      cache: "no-store"
    })
      .then(async (response) => {
        const data = await parseLeadCommentsResponse(response);

        if (!response.ok) {
          throw new Error(getFriendlyLeadCommentError(data.error, "load"));
        }

        if (!active) {
          return;
        }

        setComments(data.comments ?? []);
        setCommentsStatus("ready");
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setComments([]);
        setCommentsError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os comentarios deste lead."
        );
        setCommentsStatus("ready");
      });

    return () => {
      active = false;
    };
  }, [lead, commentsRefreshCounter]);

  useEffect(() => {
    if (!lead) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isSubmitting || isDeleting) {
        return;
      }

      if (isEditing) {
        setFormValues(getLeadEditValues(lead));
        setErrors({});
        setStatus(null);
        setDeleteError(null);
        setIsEditing(false);
        return;
      }

      if (isConfirmingDelete) {
        setDeleteError(null);
        setIsConfirmingDelete(false);
        return;
      }

      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isConfirmingDelete, isDeleting, isEditing, isSubmitting, lead, onClose]);

  if (!lead) {
    return null;
  }

  const activeLead = lead;
  const emailHref = buildEmailHref(lead.email);
  const phoneHref = buildPhoneHref(lead.phone);
  const whatsappHref = buildWhatsAppHref(lead);
  const activeStageMeta = getLeadStageMeta(activeLead.stage);
  const activeStageLabel = getLeadStageLabel(activeLead.stage);
  const isLostLead = activeStageMeta?.value === "lost";
  const resolvedOwnerName = getLeadOwnerName(activeLead, leadOwnerOptions);
  const activeStageDescription =
    activeStageMeta?.description ?? "Etapa comercial atual do lead no CRM.";
  const stageBadgeClassName = getLeadStageBadgeClassName(activeStageMeta?.tone);
  const stagePanelClassName = getLeadStagePanelClassName(activeStageMeta?.tone);
  const leadQualityMeta = getLeadQualityMeta(activeLead.quality);
  const lossReasonDescription = lead.lossReason?.trim() || "Motivo de perda ainda nao registrado.";

  const closePopup = () => {
    if (!isSubmitting && !isDeleting) {
      onClose();
    }
  };

  const startEdit = () => {
    setFormValues(getLeadEditValues(activeLead));
    setErrors({});
    setStatus(null);
    setDeleteError(null);
    setIsConfirmingDelete(false);
    setIsEditing(true);
  };

  function cancelEdit() {
    setFormValues(getLeadEditValues(activeLead));
    setErrors({});
    setStatus(null);
    setDeleteError(null);
    setIsEditing(false);
  }

  function startDelete() {
    setDeleteError(null);
    setStatus(null);
    setIsConfirmingDelete(true);
  }

  function cancelDelete() {
    if (!isDeleting) {
      setDeleteError(null);
      setIsConfirmingDelete(false);
    }
  }

  function updateField(field: keyof LeadEditValues, value: string) {
    setFormValues((currentValues) =>
      currentValues ? { ...currentValues, [field]: value } : currentValues
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues || !onUpdated) {
      return;
    }

    const nextErrors = validateLeadEdit(formValues);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({
        type: "error",
        message: nextErrors.contact ?? "Revise os campos destacados antes de salvar."
      });
      return;
    }

    setErrors({});
    setStatus(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(activeLead.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildLeadUpdatePayload(formValues))
      });
      const data = await parseLeadUpdateResponse(response);

      if (!response.ok || !data.lead) {
        throw new Error(getFriendlyUpdateError(data.error));
      }

      onUpdated(data.lead, data.mode);
      setFormValues(getLeadEditValues(data.lead));
      setIsEditing(false);
      setStatus({
        type: "success",
        message:
          data.mode === "not-configured"
            ? "Lead atualizado no modo demonstracao. Configure o Supabase para persistir dados reais."
            : "Lead atualizado e salvo no CRM."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o lead. Tente novamente em instantes."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!onDeleted) {
      return;
    }

    setDeleteError(null);
    setStatus(null);
    setIsDeleting(true);

    let deleted = false;

    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(activeLead.id)}`, {
        method: "DELETE"
      });
      const data = await parseLeadDeleteResponse(response);

      if (!response.ok || !data.ok) {
        throw new Error(getFriendlyDeleteError(data.error));
      }

      deleted = true;
      onDeleted(activeLead.id, data.mode);
      onClose();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel arquivar o lead. Tente novamente em instantes."
      );
    } finally {
      if (!deleted) {
        setIsDeleting(false);
      }
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = commentDraft.trim();

    if (!body) {
      setCommentsError("Escreva um comentario antes de enviar.");
      return;
    }

    setCommentsError(null);
    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(activeLead.id)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body, type: commentType })
      });
      const data = await parseLeadCommentResponse(response);

      if (!response.ok || !data.comment) {
        throw new Error(getFriendlyLeadCommentError(data.error, "create"));
      }

      setComments((currentComments) => [...currentComments, data.comment!]);
      setCommentDraft("");
      setCommentType("comment");
      setCommentsStatus("ready");
      setStatus({
        type: "success",
        message:
          data.mode === "not-configured"
            ? "Comentario adicionado no modo demonstracao."
            : "Comentario salvo no lead."
      });
      if (data.lead) {
        onUpdated?.(data.lead, data.mode);
      }
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Nao foi possivel salvar o comentario agora."
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const profileItems = [
    { icon: UserRound, label: "Responsavel", value: resolvedOwnerName },
    { icon: UserRound, label: "Empresa", value: lead.companyName ?? "Empresa nao informada" },
    { icon: PhoneCall, label: "Telefone", value: lead.phone },
    { icon: Mail, label: "Email", value: lead.email },
    { icon: CheckCircle2, label: "Cidade", value: lead.city ?? "Cidade nao informada" },
    { icon: CheckCircle2, label: "Vidas", value: formatLivesCount(lead.livesCount) },
    { icon: CheckCircle2, label: "Qualidade", value: getLeadQualityLabel(lead.quality) }
  ];
  const originDetails = getLeadOriginDetails(activeLead);
  const sourceItems = [
    { label: "Etapa", value: activeStageLabel },
    { label: "Origem", value: lead.source },
    { label: "Leitura da origem", value: getLeadOriginDescription(activeLead.source) },
    ...originDetails,
    { label: "Orcamento", value: lead.budget },
    { label: "Recebido em", value: formatLeadDateTime(lead.receivedAt) ?? lead.createdAt },
    { label: "Criado em", value: lead.createdAt }
  ];
  return (
    <div
      aria-labelledby="lead-popup-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={closePopup}
      role="dialog"
    >
      <section
        className="surface-modal mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cloud">
                {lead.id}
              </span>
              <span className={stageBadgeClassName}>
                Etapa: {activeStageLabel}
              </span>
              <LeadQualityBadge quality={lead.quality} />
            </div>
            <h2 className="text-2xl font-semibold sm:text-3xl" id="lead-popup-title">
              {isEditing ? "Editar lead" : lead.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/62 sm:text-base">
              {lead.interest}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            {!isEditing && onUpdated && (
              <button className="icon-button" onClick={startEdit} type="button" title="Editar lead">
                <Edit3 size={18} aria-hidden="true" />
              </button>
            )}
            {!isEditing && onDeleted && (
              <button
                aria-expanded={isConfirmingDelete}
                className="icon-button border-amber-200/80 bg-amber-50/80 text-amber-700 hover:bg-amber-100/90"
                disabled={isDeleting}
                onClick={startDelete}
                type="button"
                title="Arquivar lead"
              >
                <Archive size={18} aria-hidden="true" />
              </button>
            )}
            {!isEditing && (
              <>
                <a
                  className="icon-button"
                  href={emailHref ?? "#"}
                  onClick={(event) => {
                    if (!emailHref) {
                      event.preventDefault();
                    }
                  }}
                  title="Enviar e-mail"
                >
                  <Mail size={18} aria-hidden="true" />
                </a>
                {messageGeneratorEnabled ? (
                  <button
                    className={`icon-button ${activePanel === "message" ? "bg-cobalt text-white hover:bg-cobalt/90" : ""}`}
                    onClick={() => setActivePanel("message")}
                    title={`Gerar mensagem para ${lead.name}`}
                    type="button"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                  </button>
                ) : null}
                <a
                  aria-disabled={!whatsappHref}
                  aria-label="Abrir WhatsApp com mensagem pronta"
                  className={`icon-button ${
                    whatsappHref
                      ? "border-emerald-200/80 bg-emerald-50/85 text-emerald-700 hover:bg-emerald-100/90"
                      : "cursor-not-allowed border-border/60 bg-surface-elevated/55 text-muted-foreground/60 hover:bg-surface-elevated/55"
                  }`}
                  href={whatsappHref ?? "#"}
                  onClick={(event) => {
                    if (!whatsappHref) {
                      event.preventDefault();
                    }
                  }}
                  rel="noreferrer"
                  target="_blank"
                  title="Abrir WhatsApp com mensagem pronta"
                >
                  <Send size={18} aria-hidden="true" />
                </a>
                <a
                  className="icon-button"
                  href={phoneHref ?? "#"}
                  onClick={(event) => {
                    if (!phoneHref) {
                      event.preventDefault();
                    }
                  }}
                  title="Ligar"
                >
                  <PhoneCall size={18} aria-hidden="true" />
                </a>
              </>
            )}
            <button
              className="icon-button"
              disabled={isSubmitting || isDeleting}
              onClick={closePopup}
              type="button"
              title="Fechar"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {status && (
          <div
            aria-live="polite"
            className={`mt-5 flex items-start gap-3 rounded-[24px] px-4 py-3 text-sm font-medium ${
              status.type === "success" ? "surface-alert-success" : "surface-alert-warning"
            }`}
          >
            {status.type === "success" && (
              <CheckCircle2 className="mt-0.5 shrink-0 text-lagoon" size={18} aria-hidden="true" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {!isEditing && messageGeneratorEnabled ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activePanel === "details"
                  ? "bg-ink text-cloud"
                  : "surface-action-secondary"
              }`}
              onClick={() => setActivePanel("details")}
              type="button"
            >
              Detalhes do lead
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activePanel === "message"
                  ? "bg-cobalt text-white"
                  : "surface-action-secondary"
              }`}
              onClick={() => setActivePanel("message")}
              type="button"
            >
              Gerar mensagem
            </button>
          </div>
        ) : null}

        {isEditing && formValues ? (
          <form className="pt-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <LeadField error={errors.name} label="Nome">
                <input
                  aria-invalid={Boolean(errors.name)}
                  autoComplete="name"
                  className={fieldClass(Boolean(errors.name))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("name", event.target.value)}
                  type="text"
                  value={formValues.name}
                />
              </LeadField>

              <LeadField error={errors.phone ?? errors.contact} label="Telefone">
                <input
                  aria-invalid={Boolean(errors.phone ?? errors.contact)}
                  autoComplete="tel"
                  className={fieldClass(Boolean(errors.phone ?? errors.contact))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("phone", event.target.value)}
                  type="tel"
                  value={formValues.phone}
                />
              </LeadField>

              <LeadField error={errors.email ?? errors.contact} label="Email">
                <input
                  aria-invalid={Boolean(errors.email ?? errors.contact)}
                  autoComplete="email"
                  className={fieldClass(Boolean(errors.email ?? errors.contact))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("email", event.target.value)}
                  type="email"
                  value={formValues.email}
                />
              </LeadField>

              <LeadField error={errors.city} label="Cidade">
                <input
                  aria-invalid={Boolean(errors.city)}
                  autoComplete="address-level2"
                  className={fieldClass(Boolean(errors.city))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("city", event.target.value)}
                  type="text"
                  value={formValues.city}
                />
              </LeadField>

              <LeadField error={errors.company_name} label="Empresa">
                <input
                  aria-invalid={Boolean(errors.company_name)}
                  autoComplete="organization"
                  className={fieldClass(Boolean(errors.company_name))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("company_name", event.target.value)}
                  type="text"
                  value={formValues.company_name}
                />
              </LeadField>

              {canManageLeadOwners ? (
                <LeadField label="Responsável pelo lead">
                  <select
                    className={fieldClass(false)}
                    disabled={isSubmitting}
                    onChange={(event) => updateField("owner_profile_id", event.target.value)}
                    value={formValues.owner_profile_id}
                  >
                    <option value="">Selecione um responsavel</option>
                    {leadOwnerOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({getLeadOwnerRoleLabel(option.role)})
                      </option>
                    ))}
                  </select>
                </LeadField>
              ) : null}

              <LeadField error={errors.lives_count} label="Número de vidas">
                <input
                  aria-invalid={Boolean(errors.lives_count)}
                  className={fieldClass(Boolean(errors.lives_count))}
                  disabled={isSubmitting}
                  inputMode="numeric"
                  min={0}
                  onChange={(event) => updateField("lives_count", event.target.value)}
                  type="number"
                  value={formValues.lives_count}
                />
              </LeadField>

              <LeadField label="Etapa">
                <div className="liquid-input flex items-center bg-surface-elevated/70 text-sm font-medium opacity-80">
                  {activeStageLabel}
                </div>
              </LeadField>

              <LeadField label="Qualidade do lead">
                <select
                  className={fieldClass(false)}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("quality", event.target.value)}
                  value={formValues.quality}
                >
                  <option value="">Nao classificada</option>
                  {leadQualityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </LeadField>

              <LeadField error={errors.budget} label="Orçamento">
                <input
                  aria-invalid={Boolean(errors.budget)}
                  className={fieldClass(Boolean(errors.budget))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("budget", event.target.value)}
                  type="text"
                  value={formValues.budget}
                />
              </LeadField>

              <LeadField className="md:col-span-2" error={errors.interest} label="Interesse">
                <input
                  aria-invalid={Boolean(errors.interest)}
                  className={fieldClass(Boolean(errors.interest))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("interest", event.target.value)}
                  type="text"
                  value={formValues.interest}
                />
              </LeadField>

              <LeadField error={errors.last_interaction} label="Última interação">
                <textarea
                  aria-invalid={Boolean(errors.last_interaction)}
                  className={`${fieldClass(Boolean(errors.last_interaction))} min-h-[116px] resize-y`}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("last_interaction", event.target.value)}
                  value={formValues.last_interaction}
                />
              </LeadField>

              <LeadField className="md:col-span-2" error={errors.notes} label="Observações">
                <textarea
                  aria-invalid={Boolean(errors.notes)}
                  className={`${fieldClass(Boolean(errors.notes))} min-h-[132px] resize-y`}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("notes", event.target.value)}
                  value={formValues.notes}
                />
              </LeadField>

              {isLostLead ? (
                <LeadField className="md:col-span-2" error={errors.loss_reason} label="Motivo de perda">
                  <textarea
                    aria-invalid={Boolean(errors.loss_reason)}
                    className={`${fieldClass(Boolean(errors.loss_reason))} min-h-[116px] resize-y`}
                    disabled={isSubmitting}
                    maxLength={500}
                    onChange={(event) => updateField("loss_reason", event.target.value)}
                    placeholder="Registre por que esta oportunidade foi perdida."
                    value={formValues.loss_reason}
                  />
                </LeadField>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
              <button
                className="surface-action-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                disabled={isSubmitting}
                onClick={cancelEdit}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                ) : (
                  <Save size={18} aria-hidden="true" />
                )}
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        ) : activePanel === "message" && messageGeneratorEnabled ? (
          <div className="pt-5">
            <LeadMessageGenerator
              aiBalance={aiBalance}
              lead={lead}
              systemTemplates={whatsappTemplates}
              onMessageGenerated={() => setCommentsRefreshCounter((c) => c + 1)}
            />
          </div>
        ) : (
          <div className="space-y-4 pt-5">
            <section className="surface-card-muted rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-cloud">
                  <UserRound size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-muted-soft text-sm">Leitura rapida</p>
                  <h3 className="font-semibold">Dados basicos</h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {profileItems.map((item) => (
                  <div className="surface-card rounded-[24px] p-4" key={item.label}>
                    <div className="surface-pill mb-3 flex h-10 w-10 items-center justify-center rounded-full">
                      <item.icon size={18} aria-hidden="true" />
                    </div>
                    <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                      {item.label}
                    </p>
                    <p className="mt-1 font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
              <section className="surface-card-muted rounded-[28px] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-info/22 text-foreground">
                    <CheckCircle2 size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-muted-soft text-sm">Leitura comercial</p>
                    <h3 className="font-semibold">Contexto da oportunidade</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={stagePanelClassName}>
                    <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                      Etapa atual
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className={stageBadgeClassName}>{activeStageLabel}</span>
                      <LeadQualityBadge quality={lead.quality} />
                      <p className="text-muted-soft text-sm font-medium">{activeStageDescription}</p>
                    </div>
                  </div>

                  <div className="surface-card rounded-[22px] p-4">
                    <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                      Qualidade do lead
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <LeadQualityBadge quality={lead.quality} />
                      <p className="text-muted-soft text-sm font-medium">
                        {leadQualityMeta?.description ?? "Classificacao comercial ainda nao definida."}
                      </p>
                    </div>
                  </div>

                  <div className="surface-card rounded-[22px] p-4">
                    <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                      Interesse principal
                    </p>
                    <p className="text-muted-strong mt-2 text-sm leading-6">{lead.interest}</p>
                  </div>

                  <div className="surface-card rounded-[22px] p-4">
                    <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                      Ultima interacao
                    </p>
                    <p className="text-muted-strong mt-2 text-sm leading-6">{lead.lastInteraction}</p>
                  </div>

                  <div className="surface-card rounded-[22px] p-4">
                    <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                      Observacoes
                    </p>
                    <p className="text-muted-strong mt-2 text-sm leading-6">{lead.notes}</p>
                  </div>

                  {isLostLead ? (
                    <div className="surface-card rounded-[22px] p-4">
                      <p className="text-muted-soft text-xs font-semibold uppercase tracking-normal">
                        Motivo de perda
                      </p>
                      <p className="text-muted-strong mt-2 text-sm leading-6">{lossReasonDescription}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="surface-card-muted rounded-[28px] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt text-white">
                    <Clock3 size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-muted-soft text-sm">Origem e operacao</p>
                    <h3 className="font-semibold">Resumo de origem</h3>
                  </div>
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  {sourceItems.map((item) => (
                    <div className="flex items-center justify-between gap-3" key={item.label}>
                      <dt className="text-muted-soft">{item.label}</dt>
                      <dd className="max-w-[190px] text-right font-semibold">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>

            <section className="surface-card-muted rounded-[28px] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt text-white">
                    <MessageCircle size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-muted-soft text-sm">Historico do lead</p>
                    <h3 className="font-semibold">Comentarios internos</h3>
                  </div>
                </div>
                <span className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold">
                  {comments.length}
                </span>
              </div>

              <form className="mb-4 space-y-3" onSubmit={handleCommentSubmit}>
                <div className="flex items-center gap-4 px-1 pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="commentType"
                      value="comment"
                      checked={commentType === "comment"}
                      onChange={() => setCommentType("comment")}
                      className="text-cobalt focus:ring-cobalt"
                    />
                    Comentário
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="commentType"
                      value="contact"
                      checked={commentType === "contact"}
                      onChange={() => setCommentType("contact")}
                      className="text-cobalt focus:ring-cobalt"
                    />
                    Contato realizado
                  </label>
                </div>
                <textarea
                  className="liquid-input min-h-[120px] resize-y"
                  disabled={isSubmittingComment}
                  maxLength={2000}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Escreva um comentario para orientar a proxima abordagem."
                  value={commentDraft}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-soft text-xs font-medium">
                    {commentDraft.trim().length}/2000 caracteres
                  </span>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSubmittingComment}
                    type="submit"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    ) : (
                      <Send size={16} aria-hidden="true" />
                    )}
                    {isSubmittingComment ? "Enviando..." : "Salvar comentario"}
                  </button>
                </div>
              </form>

              {commentsError && (
                <p className="mb-4 rounded-[20px] bg-signal/26 px-4 py-3 text-sm font-medium text-ink dark:text-cloud">
                  {commentsError}
                </p>
              )}

              <div className="space-y-3">
                {commentsStatus === "loading" ? (
                  <div className="surface-card flex items-center gap-2 rounded-[20px] px-4 py-3 text-sm text-muted-soft">
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    Carregando comentarios...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="surface-card rounded-[20px] border border-dashed border-border/55 px-4 py-5 text-sm leading-6 text-muted-soft">
                    Nenhum comentario registrado ainda. Use esse espaco para contexto de ligacao,
                    objecoes e proximos passos.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <article
                      className={`rounded-[22px] p-4 ${
                        comment.type === "contact" ? "surface-alert-warning" : "surface-card"
                      }`}
                      key={comment.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-ink">{comment.authorName}</p>
                            {comment.type === "contact" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 uppercase tracking-wide">
                                <PhoneCall size={10} aria-hidden="true" />
                                Contato
                              </span>
                            )}
                          </div>
                          <p className="text-muted-soft mt-1 text-xs">{comment.authorEmail}</p>
                        </div>
                        <span className="surface-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold">
                          <Clock3 size={12} aria-hidden="true" />
                          {formatCommentTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-strong mt-3 whitespace-pre-line text-sm leading-6">
                        {comment.body}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <aside className="space-y-4">
              {onDeleted && (
                <section
                  aria-busy={isDeleting}
                  className="rounded-[28px] border border-red-200/80 bg-red-50/80 p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Archive size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-ink">Arquivar lead</h3>
                    </div>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm leading-6 text-ink/68">
                        Confirme para mover {activeLead.name} para os arquivados.
                      </p>
                      {deleteError && (
                        <p
                          aria-live="polite"
                          className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-medium text-red-700"
                          role="alert"
                        >
                          {deleteError}
                        </p>
                      )}
                      <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <button
                          className="inline-flex flex-1 items-center justify-center rounded-full bg-white/70 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isDeleting}
                          onClick={cancelDelete}
                          type="button"
                        >
                          Cancelar
                        </button>
                        <button
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isDeleting}
                          onClick={handleDeleteConfirmed}
                          type="button"
                        >
                          {isDeleting ? (
                            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                          ) : (
                            <Archive size={18} aria-hidden="true" />
                          )}
                          {isDeleting ? "Arquivando..." : "Arquivar lead"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-white"
                      onClick={startDelete}
                      type="button"
                    >
                      <Archive size={18} aria-hidden="true" />
                      Arquivar lead
                    </button>
                  )}
                </section>
              )}
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function LeadField({
  children,
  className,
  error,
  label
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  label: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-2 block text-sm font-medium text-ink/62">{label}</span>
      {children}
      {error && <span className="mt-2 block text-xs font-semibold text-ink/62">{error}</span>}
    </label>
  );
}

function LeadQualityBadge({ quality }: { quality: Lead["quality"] }) {
  const meta = getLeadQualityMeta(quality);

  if (!meta) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/78 px-3 py-1.5 text-xs font-semibold text-ink/58 ring-1 ring-inset ring-black/5">
        Qualidade: Nao classificada
      </span>
    );
  }

  return <span className={meta.badgeClassName}>Qualidade: {meta.label}</span>;
}

function getLeadEditValues(lead: Lead): LeadEditValues {
  return {
    name: editableValue(lead.name),
    email: editableValue(lead.email),
    phone: editableValue(lead.phone),
    city: editableValue(lead.city ?? ""),
    company_name: editableValue(lead.companyName ?? ""),
    lives_count:
      lead.livesCount === undefined || lead.livesCount === null ? "" : String(lead.livesCount),
    quality: lead.quality ?? "",
    stage: stageToValue(lead.stage),
    interest: editableValue(lead.interest),
    budget: editableValue(lead.budget),
    last_interaction: editableValue(lead.lastInteraction),
    notes: editableValue(lead.notes),
    loss_reason: editableValue(lead.lossReason ?? ""),
    owner_profile_id: editableValue(lead.ownerProfileId ?? "")
  };
}

function validateLeadEdit(values: LeadEditValues): LeadEditErrors {
  const nextErrors: LeadEditErrors = {};

  if (!values.name) {
    nextErrors.name = "Informe o nome do lead.";
  }

  if (!values.phone && !values.email) {
    nextErrors.contact = "Informe pelo menos um telefone ou email.";
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    nextErrors.email = "Use um email valido.";
  }

  if (values.phone && values.phone.replace(/\D/g, "").length < 8) {
    nextErrors.phone = "Informe um telefone com DDD.";
  }

  if (values.lives_count) {
    const livesCount = Number(values.lives_count);

    if (!Number.isInteger(livesCount) || livesCount < 0) {
      nextErrors.lives_count = "Informe um número inteiro valido.";
    }
  }

  return nextErrors;
}

function buildLeadUpdatePayload(values: LeadEditValues) {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email,
    city: values.city,
    company_name: values.company_name,
    lives_count: values.lives_count ? Number(values.lives_count) : null,
    quality: values.quality || null,
    stage: values.stage,
    interest: values.interest,
    budget: values.budget,
    last_interaction: values.last_interaction,
    notes: values.notes,
    loss_reason: values.loss_reason,
    owner_profile_id: values.owner_profile_id || undefined
  };
}

async function parseLeadUpdateResponse(response: Response): Promise<LeadUpdateResponse> {
  try {
    return (await response.json()) as LeadUpdateResponse;
  } catch {
    return {};
  }
}

async function parseLeadDeleteResponse(response: Response): Promise<LeadDeleteResponse> {
  try {
    return (await response.json()) as LeadDeleteResponse;
  } catch {
    return {};
  }
}

async function parseLeadCommentsResponse(response: Response): Promise<LeadCommentsResponse> {
  try {
    return (await response.json()) as LeadCommentsResponse;
  } catch {
    return {};
  }
}

async function parseLeadCommentResponse(response: Response): Promise<LeadCommentResponse> {
  try {
    return (await response.json()) as LeadCommentResponse;
  } catch {
    return {};
  }
}

function getFriendlyUpdateError(error?: string) {
  if (!error) {
    return "Nao foi possivel atualizar o lead agora.";
  }

  if (error.includes("Usuario nao autenticado") || error.includes("sessao expirou")) {
    return "Sua sessao expirou. Entre novamente para editar ou arquivar leads.";
  }

  if (error.includes("Nome do lead")) {
    return "Informe o nome do lead antes de salvar.";
  }

  if (error.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. A edicao sera mantida apenas nesta visualizacao.";
  }

  return error;
}

function getFriendlyDeleteError(error?: string) {
  if (!error) {
    return "Nao foi possivel arquivar o lead agora.";
  }

  if (error.includes("Usuario nao autenticado") || error.includes("sessao expirou")) {
    return "Sua sessao expirou. Entre novamente para excluir leads.";
  }

  if (error.includes("Conecte uma conta Meta ativa")) {
    return "Conecte uma conta Meta ativa para excluir leads vindos do Meta Ads.";
  }

  if (error.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. A exclusao exige a base real configurada.";
  }

  return error;
}

function getFriendlyLeadCommentError(error: string | undefined, action: "load" | "create") {
  if (!error) {
    return action === "load"
      ? "Nao foi possivel carregar os comentarios agora."
      : "Nao foi possivel salvar o comentario agora.";
  }

  if (error.includes("sessao expirou")) {
    return "Sua sessao expirou. Entre novamente para comentar no lead.";
  }

  return error;
}

function getLeadOwnerName(lead: Lead, leadOwnerOptions: LeadOwnerOption[]) {
  const ownerOption = lead.ownerProfileId
    ? leadOwnerOptions.find((option) => option.id === lead.ownerProfileId)
    : null;

  return ownerOption?.name ?? lead.owner ?? "Sem responsavel";
}

function getLeadOwnerRoleLabel(role: LeadOwnerOption["role"]) {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "Consultor";
}

function stageToValue(stage: string) {
  return getLeadStageValue(stage) ?? "new";
}

function getLeadStageBadgeClassName(tone?: LeadStageTone) {
  const sharedClassName = "rounded-full px-3 py-1.5 text-xs font-semibold";

  switch (tone) {
    case "cobalt":
      return `${sharedClassName} bg-cobalt text-white`;
    case "lagoon":
      return `${sharedClassName} bg-lagoon text-white`;
    case "signal":
      return `${sharedClassName} bg-signal text-ink dark:text-cloud`;
    case "ink":
      return `${sharedClassName} bg-ink text-cloud`;
    case "emerald":
      return `${sharedClassName} bg-emerald-600 text-white`;
    case "red":
      return `${sharedClassName} bg-red-600 text-white`;
    default:
      return `${sharedClassName} bg-white/64 text-ink`;
  }
}

function getLeadStagePanelClassName(tone?: LeadStageTone) {
  const sharedClassName = "rounded-[22px] p-4";

  switch (tone) {
    case "cobalt":
      return `${sharedClassName} border border-cobalt/18 bg-cobalt/10`;
    case "lagoon":
      return `${sharedClassName} border border-lagoon/20 bg-lagoon/12`;
    case "signal":
      return `${sharedClassName} border border-signal/40 bg-signal/20`;
    case "ink":
      return `${sharedClassName} border border-ink/14 bg-ink/8`;
    case "emerald":
      return `${sharedClassName} border border-emerald-500/20 bg-emerald-500/12`;
    case "red":
      return `${sharedClassName} border border-red-500/18 bg-red-500/10`;
    default:
      return `${sharedClassName} bg-white/52`;
  }
}

function editableValue(value: string) {
  return emptyDisplayValues.has(value) ? "" : value;
}

function buildPhoneHref(phone: string) {
  const normalizedPhone = normalizePhone(phone).e164;
  return normalizedPhone ? `tel:${normalizedPhone}` : undefined;
}

function buildEmailHref(email: string) {
  return email && !emptyDisplayValues.has(email) ? `mailto:${email}` : undefined;
}

function buildWhatsAppHref(lead: Lead) {
  const normalizedPhone = normalizePhone(lead.phone).e164;

  if (!normalizedPhone) {
    return undefined;
  }

  const phone = normalizedPhone.replace(/\D/g, "");
  const text = encodeURIComponent(buildWhatsAppMessage(lead));
  return `https://wa.me/${phone}?text=${text}`;
}

function buildWhatsAppMessage(lead: Lead) {
  const firstName = getLeadFirstName(lead.name);
  const hasInterest = hasMeaningfulDisplayValue(lead.interest);
  const hasCompanyName = hasMeaningfulDisplayValue(lead.companyName);
  const interestSnippet = hasInterest ? ` sobre ${lead.interest}` : "";
  const companySnippet = hasCompanyName ? ` para ${lead.companyName}` : "";

  return `Ola, ${firstName}! Tudo bem? Vi seu interesse${interestSnippet}${companySnippet} e posso te ajudar por aqui.`;
}

function getLeadFirstName(name: string) {
  const [firstName] = name.trim().split(/\s+/);
  return firstName || "ola";
}

function hasMeaningfulDisplayValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim() !== "" && !emptyDisplayValues.has(value);
}

function formatLivesCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Nao informado";
  }

  return `${value} vidas`;
}

function formatLeadDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatCommentTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function fieldClass(hasError: boolean) {
  return `liquid-input disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError ? "border-signal/80 bg-signal/20" : ""
  }`;
}
