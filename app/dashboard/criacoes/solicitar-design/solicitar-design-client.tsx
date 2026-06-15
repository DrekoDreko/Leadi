"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  FileText,
  Loader2,
  Palette,
  Paperclip,
  Send,
  Upload,
  X
} from "lucide-react";
import { InfiniteGridHero } from "@/components/ui/the-infinite-grid";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import {
  CREATIVE_REQUEST_ATTACHMENT_ACCEPT,
  CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES,
  validateCreativeRequestAttachment
} from "@/lib/creative-requests/attachments";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";

const MAX_ATTACHMENTS = 6;
const ATTACHMENT_LIMIT_MB = Math.round(
  CREATIVE_REQUEST_ATTACHMENT_MAX_SIZE_BYTES / (1024 * 1024)
);

const typeOptions = [
  { value: "design", label: "Design / Arte" },
  { value: "video", label: "Vídeo" },
  { value: "campaign", label: "Kit de campanha" }
];

type FormState = {
  type: string;
  title: string;
  objective: string;
  briefing: string;
  dueAt: string;
  notes: string;
};

const initialForm: FormState = {
  type: "design",
  title: "",
  objective: "",
  briefing: "",
  dueAt: "",
  notes: ""
};

type AttachmentFile = {
  id: string;
  file: File;
};

type CreateCreativeRequestResponse = {
  request?: { id: string };
  error?: string;
};

export function SolicitarDesignClient({
  createRequestAccess,
  workspaceName
}: {
  createRequestAccess: ResourceAccessSummary;
  workspaceName: string;
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreate = createRequestAccess.allowed;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (incoming.length === 0) return;

    setAttachments((current) => {
      const next = [...current];

      for (const file of incoming) {
        if (next.length >= MAX_ATTACHMENTS) {
          setError(`Você pode anexar no máximo ${MAX_ATTACHMENTS} arquivos.`);
          break;
        }

        const validationError = validateCreativeRequestAttachment({
          name: file.name,
          size: file.size,
          type: file.type
        });

        if (validationError) {
          setError(validationError);
          continue;
        }

        next.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file
        });
      }

      return next;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  function resetForm() {
    setForm(initialForm);
    setAttachments([]);
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canCreate) {
      setError(createRequestAccess.message);
      return;
    }

    if (!form.title.trim()) {
      setError("Informe um título para o pedido.");
      return;
    }

    if (!form.objective.trim()) {
      setError("Descreva o objetivo do criativo.");
      return;
    }

    if (!form.briefing.trim()) {
      setError("Descreva o briefing para a equipe de design.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/creative-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          objective: form.objective,
          briefing: form.briefing,
          due_at: form.dueAt,
          notes: form.notes
        })
      });

      const payload = (await response
        .json()
        .catch(() => null)) as CreateCreativeRequestResponse | null;

      if (!response.ok || !payload?.request) {
        setError(payload?.error ?? "Não foi possível enviar o pedido. Tente novamente.");
        return;
      }

      const requestId = payload.request.id;

      for (const attachment of attachments) {
        const attachmentData = new FormData();
        attachmentData.append("file", attachment.file, attachment.file.name);

        const attachmentResponse = await fetch(
          `/api/creative-requests/${encodeURIComponent(requestId)}/attachments`,
          {
            method: "POST",
            body: attachmentData
          }
        );

        if (!attachmentResponse.ok) {
          const attachmentPayload = (await attachmentResponse
            .json()
            .catch(() => null)) as { error?: string } | null;
          setError(
            attachmentPayload?.error ??
              "O pedido foi criado, mas não conseguimos enviar um dos anexos."
          );
          return;
        }
      }

      setSuccess(true);
    } catch (submitError) {
      setError(getFriendlyErrorMessage(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <InfiniteGridHero
          eyebrow={
            <>
              <Palette size={14} aria-hidden="true" />
              Equipe de design
            </>
          }
          title="Pedido enviado para a equipe de design"
          subtitle="Recebemos o seu briefing. Nossa equipe vai produzir o material e você acompanha o andamento com a operação."
        />

        <section className="surface-card space-y-5 rounded-[34px] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt text-white shadow-soft">
              <Check size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Solicitação registrada</h2>
              <p className="text-muted-soft text-sm leading-6">
                O pedido de <span className="font-medium text-foreground">{workspaceName}</span> já
                está na fila da equipe de design.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90"
          >
            <Send size={17} aria-hidden="true" />
            Fazer outra solicitação
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InfiniteGridHero
        eyebrow={
          <>
            <Palette size={14} aria-hidden="true" />
            Equipe de design
          </>
        }
        title="Solicitar criativo à equipe de design"
        subtitle="Abra um briefing e a nossa equipe de design produz o material para você — sem uso de IA. Quanto mais detalhes e referências, melhor o resultado."
      />

      <form className="grid gap-4 lg:grid-cols-[1.4fr_1fr]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <FieldGroup title="Sobre o pedido" description="O que a equipe precisa produzir.">
            <SelectField
              label="Tipo de pedido"
              value={form.type}
              onChange={(value) => updateField("type", value)}
              required
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Título"
              placeholder="Ex: Carrossel para plano empresarial PME"
              value={form.title}
              onChange={(value) => updateField("title", value)}
              required
            />

            <TextField
              label="Objetivo"
              placeholder="Ex: gerar leads qualificados para empresas de 2 a 29 vidas"
              value={form.objective}
              onChange={(value) => updateField("objective", value)}
              required
            />
          </FieldGroup>

          <FieldGroup
            title="Briefing"
            description="Contexto, público, formato e referências para a equipe seguir."
          >
            <TextAreaField
              label="Briefing detalhado"
              placeholder={
                "Descreva contexto, público, formato, ângulo criativo e referências importantes.\n\nExemplos:\n• Público: empresas de 2 a 29 vidas em São Paulo\n• Formato: carrossel para feed (1:1)\n• Tom: consultivo, sem promessas exageradas\n• Incluir CTA para contato no WhatsApp"
              }
              value={form.briefing}
              onChange={(value) => updateField("briefing", value)}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <DateField
                label="Prazo desejado (opcional)"
                value={form.dueAt}
                onChange={(value) => updateField("dueAt", value)}
              />
            </div>

            <TextAreaField
              label="Observações (opcional)"
              placeholder="Ex: evitar promessas, manter tom consultivo e incluir contato para dúvidas."
              value={form.notes}
              onChange={(value) => updateField("notes", value)}
            />
          </FieldGroup>
        </div>

        <div className="space-y-4">
          <FieldGroup
            title="Referências"
            description="Anexe imagens, PDFs ou outros arquivos que ajudem a equipe."
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={CREATIVE_REQUEST_ATTACHMENT_ACCEPT}
              multiple
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_ATTACHMENTS}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-border/70 bg-surface-elevated/60 px-4 py-8 text-center transition hover:border-cobalt/40 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-cobalt flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-border/70">
                <Upload size={22} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">Adicionar anexos</span>
              <span className="text-muted-soft text-xs">
                Imagem, PDF, vídeo curto, ZIP, DOCX ou PPTX · até {ATTACHMENT_LIMIT_MB} MB ·{" "}
                {attachments.length}/{MAX_ATTACHMENTS}
              </span>
            </button>

            {attachments.length > 0 ? (
              <ul className="space-y-2">
                {attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center gap-3 rounded-[20px] bg-surface-elevated/60 px-4 py-3 ring-1 ring-border/70"
                  >
                    <span className="text-cobalt flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-surface-elevated ring-1 ring-border/70">
                      <Paperclip size={16} aria-hidden="true" />
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">
                      {attachment.file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-elevated text-muted-foreground ring-1 ring-border/70 transition hover:bg-ink/10"
                      aria-label={`Remover ${attachment.file.name}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </FieldGroup>

          <div className="surface-card space-y-4 rounded-[34px] p-6">
            {!canCreate ? (
              <p className="surface-alert-danger flex items-start gap-2 rounded-[20px] px-4 py-3 text-sm">
                <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                {createRequestAccess.message}
              </p>
            ) : null}

            {error ? (
              <p className="surface-alert-danger flex items-start gap-2 rounded-[20px] px-4 py-3 text-sm">
                <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                {error}
              </p>
            ) : null}

            <div className="text-muted-soft flex items-start gap-2 text-xs leading-5">
              <FileText size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
              O pedido vai direto para a nossa equipe de design. Você acompanha o andamento com a
              operação.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} aria-hidden="true" className="animate-spin" />
                  Enviando pedido...
                </>
              ) : (
                <>
                  <Send size={18} aria-hidden="true" />
                  Enviar para a equipe de design
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FieldGroup({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card space-y-4 rounded-[34px] p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-soft mt-1 text-sm leading-6">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
  required
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <input
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
        required={required}
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <input
        type="date"
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  required
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <textarea
        className="liquid-input min-h-[120px] resize-y border-border/70 bg-surface-elevated/88 leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
        required={required}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-muted-soft text-sm font-semibold">{label}</span>
      <select
        className="liquid-input border-border/70 bg-surface-elevated/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        required={required}
      >
        {children}
      </select>
    </label>
  );
}
