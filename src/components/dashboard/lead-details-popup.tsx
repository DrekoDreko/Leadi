"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Mail,
  MessageCircle,
  PhoneCall,
  Save,
  Send,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import type { Lead } from "@/data/mock";
import type { LeadComment } from "@/lib/leads/comments";

type LeadUpdateMode = "supabase" | "mock" | "not-configured" | "unauthenticated" | "error";

type LeadDetailsPopupProps = {
  lead: Lead | null;
  onClose: () => void;
  onDeleted?: (leadId: string, mode?: LeadUpdateMode) => void;
  onUpdated?: (lead: Lead, mode?: LeadUpdateMode) => void;
};

type LeadEditValues = {
  name: string;
  email: string;
  phone: string;
  city: string;
  company_name: string;
  lives_count: string;
  stage: string;
  interest: string;
  budget: string;
  next_contact_at: string;
  last_interaction: string;
  notes: string;
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
  error?: string;
  mode?: LeadUpdateMode;
};

const stageOptions = [
  { value: "new", label: "Novo lead" },
  { value: "qualification", label: "Qualificação" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Venda" },
  { value: "lost", label: "Perdido" }
];

const emptyDisplayValues = new Set([
  "Sem telefone",
  "Sem email",
  "A qualificar",
  "Interesse ainda nao qualificado",
  "Lead recebido no CRM.",
  "Sem observacoes registradas."
]);

export function LeadDetailsPopup({ lead, onClose, onDeleted, onUpdated }: LeadDetailsPopupProps) {
  const previousLeadIdRef = useRef<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState<LeadEditValues | null>(null);
  const [errors, setErrors] = useState<LeadEditErrors>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [comments, setComments] = useState<LeadComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsStatus, setCommentsStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [commentDraft, setCommentDraft] = useState("");
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
    setIsEditing(false);
    setIsSubmitting(false);
    setIsConfirmingDelete(false);
    setIsDeleting(false);
    setDeleteError(null);
    setComments([]);
    setCommentsError(null);
    setCommentsStatus("idle");
    setCommentDraft("");
    setIsSubmittingComment(false);
  }, [lead]);

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
  }, [lead]);

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
        body: JSON.stringify(buildLeadUpdatePayload(formValues, activeLead))
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
          : "Nao foi possivel excluir o lead. Tente novamente em instantes."
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
        body: JSON.stringify({ body })
      });
      const data = await parseLeadCommentResponse(response);

      if (!response.ok || !data.comment) {
        throw new Error(getFriendlyLeadCommentError(data.error, "create"));
      }

      setComments((currentComments) => [...currentComments, data.comment!]);
      setCommentDraft("");
      setCommentsStatus("ready");
      setStatus({
        type: "success",
        message:
          data.mode === "not-configured"
            ? "Comentario adicionado no modo demonstracao."
            : "Comentario salvo no lead."
      });
    } catch (error) {
      setCommentsError(
        error instanceof Error ? error.message : "Nao foi possivel salvar o comentario agora."
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const profileItems = [
    { icon: UserRound, label: "Nome", value: lead.name },
    { icon: UserRound, label: "Empresa", value: lead.companyName ?? "Empresa nao informada" },
    { icon: PhoneCall, label: "Telefone", value: lead.phone },
    { icon: Mail, label: "Email", value: lead.email },
    { icon: CheckCircle2, label: "Cidade", value: lead.city ?? "Cidade nao informada" }
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
                className="icon-button border-red-200/80 bg-red-50/80 text-red-700 hover:bg-red-100/90"
                disabled={isDeleting}
                onClick={startDelete}
                type="button"
                title="Excluir lead"
              >
                <Trash2 size={18} aria-hidden="true" />
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
                <Link
                  className="icon-button"
                  href={`/dashboard/whatsapp?lead=${lead.id}`}
                  title={`Abrir sugestões de mensagem para ${lead.name}`}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                </Link>
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
              status.type === "success" ? "bg-lagoon/16 text-ink" : "bg-signal/34 text-ink"
            }`}
          >
            {status.type === "success" && (
              <CheckCircle2 className="mt-0.5 shrink-0 text-lagoon" size={18} aria-hidden="true" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {isConfirmingDelete && !isEditing && (
          <div
            aria-live="polite"
            className="mt-5 flex flex-col gap-3 rounded-[24px] bg-red-50/90 px-4 py-3 text-sm font-medium text-red-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <span>
                {deleteError ?? "Confirme a exclusao deste lead. Essa acao remove o registro do CRM real."}
              </span>
            </span>
            <span className="flex shrink-0 gap-2">
              <button
                className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white"
                disabled={isDeleting}
                onClick={cancelDelete}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isDeleting}
                onClick={handleDeleteConfirmed}
                type="button"
              >
                {isDeleting && <Loader2 className="animate-spin" size={15} aria-hidden="true" />}
                {isDeleting ? "Excluindo..." : "Confirmar exclusao"}
              </button>
            </span>
          </div>
        )}

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

              <LeadField error={errors.stage} label="Etapa">
                <select
                  aria-invalid={Boolean(errors.stage)}
                  className={fieldClass(Boolean(errors.stage))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("stage", event.target.value)}
                  value={formValues.stage}
                >
                  {stageOptions.map((option) => (
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

              <LeadField error={errors.next_contact_at} label="Próximo contato">
                <input
                  aria-invalid={Boolean(errors.next_contact_at)}
                  className={fieldClass(Boolean(errors.next_contact_at))}
                  disabled={isSubmitting}
                  onChange={(event) => updateField("next_contact_at", event.target.value)}
                  type="datetime-local"
                  value={formValues.next_contact_at}
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
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-full bg-white/54 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/76 disabled:cursor-not-allowed disabled:opacity-60"
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
        ) : (
          <div className="grid gap-4 pt-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
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

              <section className="rounded-[28px] bg-white/42 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt text-white">
                      <MessageCircle size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm text-ink/54">Historico do lead</p>
                      <h3 className="font-semibold">Comentarios internos</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink/62">
                    {comments.length}
                  </span>
                </div>

                <form className="mb-4 space-y-3" onSubmit={handleCommentSubmit}>
                  <textarea
                    className="liquid-input min-h-[120px] resize-y"
                    disabled={isSubmittingComment}
                    maxLength={2000}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Escreva um comentario para orientar a próxima abordagem."
                    value={commentDraft}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-ink/46">
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
                  <p className="mb-4 rounded-[20px] bg-signal/26 px-4 py-3 text-sm font-medium text-ink">
                    {commentsError}
                  </p>
                )}

                <div className="space-y-3">
                  {commentsStatus === "loading" ? (
                    <div className="flex items-center gap-2 rounded-[20px] bg-white/60 px-4 py-3 text-sm text-ink/62">
                      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      Carregando comentarios...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-ink/12 bg-white/54 px-4 py-5 text-sm leading-6 text-ink/56">
                      Nenhum comentario registrado ainda. Use esse espaço para contexto de ligação,
                      objeções e próximos passos.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <article className="rounded-[22px] bg-white/58 p-4" key={comment.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink">{comment.authorName}</p>
                            <p className="mt-1 text-xs text-ink/46">{comment.authorEmail}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/72 px-3 py-1.5 text-[11px] font-semibold text-ink/56">
                            <Clock3 size={12} aria-hidden="true" />
                            {formatCommentTimestamp(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink/70">
                          {comment.body}
                        </p>
                      </article>
                    ))
                  )}
                </div>
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
                <h3 className="font-semibold">Comercial</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink/54">Etapa</dt>
                    <dd className="max-w-[170px] truncate font-semibold">{lead.stage}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink/54">Empresa</dt>
                    <dd className="max-w-[170px] truncate font-semibold">
                      {lead.companyName ?? "Nao informada"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink/54">Vidas</dt>
                    <dd className="max-w-[170px] truncate font-semibold">
                      {formatLivesCount(lead.livesCount)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink/54">Orçamento</dt>
                    <dd className="max-w-[170px] truncate font-semibold">{lead.budget}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink/54">Origem</dt>
                    <dd className="max-w-[170px] truncate font-semibold">{lead.source}</dd>
                  </div>
                </dl>
              </section>

              {onDeleted && (
                <section
                  aria-busy={isDeleting}
                  className="rounded-[28px] border border-red-200/80 bg-red-50/80 p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                      <AlertTriangle size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm text-red-700/72">Zona sensível</p>
                      <h3 className="font-semibold text-ink">Excluir lead</h3>
                    </div>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm leading-6 text-ink/68">
                        Confirme para remover {activeLead.name} do CRM. Essa ação nao pode ser desfeita.
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
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isDeleting}
                          onClick={handleDeleteConfirmed}
                          type="button"
                        >
                          {isDeleting ? (
                            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                          ) : (
                            <Trash2 size={18} aria-hidden="true" />
                          )}
                          {isDeleting ? "Excluindo..." : "Excluir definitivamente"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/70 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-white"
                      onClick={startDelete}
                      type="button"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                      Excluir lead
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

function getLeadEditValues(lead: Lead): LeadEditValues {
  return {
    name: editableValue(lead.name),
    email: editableValue(lead.email),
    phone: editableValue(lead.phone),
    city: editableValue(lead.city ?? ""),
    company_name: editableValue(lead.companyName ?? ""),
    lives_count:
      lead.livesCount === undefined || lead.livesCount === null ? "" : String(lead.livesCount),
    stage: stageToValue(lead.stage),
    interest: editableValue(lead.interest),
    budget: editableValue(lead.budget),
    next_contact_at: toDateTimeLocal(lead.nextContactAt),
    last_interaction: editableValue(lead.lastInteraction),
    notes: editableValue(lead.notes)
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

  if (values.next_contact_at) {
    const date = new Date(values.next_contact_at);

    if (Number.isNaN(date.getTime())) {
      nextErrors.next_contact_at = "Escolha uma data valida.";
    }
  }

  return nextErrors;
}

function buildLeadUpdatePayload(values: LeadEditValues, lead: Lead) {
  return {
    name: values.name,
    phone: values.phone,
    email: values.email,
    city: values.city,
    company_name: values.company_name,
    lives_count: values.lives_count ? Number(values.lives_count) : null,
    stage: values.stage,
    interest: values.interest,
    budget: values.budget,
    next_contact_at: values.next_contact_at
      ? normalizeDateTimeLocal(values.next_contact_at)
      : lead.nextContactAt === undefined
        ? undefined
        : null,
    last_interaction: values.last_interaction,
    notes: values.notes
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
    return "Sua sessao expirou. Entre novamente para editar leads.";
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
    return "Nao foi possivel excluir o lead agora.";
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

function stageToValue(stage: string) {
  return stageOptions.find((option) => option.label === stage)?.value ?? "new";
}

function editableValue(value: string) {
  return emptyDisplayValues.has(value) ? "" : value;
}

function buildPhoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:${digits}` : undefined;
}

function buildEmailHref(email: string) {
  return email && !emptyDisplayValues.has(email) ? `mailto:${email}` : undefined;
}

function normalizeDateTimeLocal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function formatLivesCount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Nao informado";
  }

  return `${value} vidas`;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
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
