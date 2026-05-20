"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import type { Lead } from "@/data/mock";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type { LeadDataMode } from "@/lib/leads/repository";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";

type LeadCreateModalProps = {
  canCreateMetaAdsLeads: boolean;
  createLeadAccess: ResourceAccessSummary;
  open: boolean;
  onClose: () => void;
  onCreated: (lead: Lead, mode?: LeadDataMode) => void;
};

type LeadFormValues = {
  name: string;
  email: string;
  phone: string;
  city: string;
  company_name: string;
  lives_count: string;
  interest: string;
  budget: string;
  stage: string;
  source: string;
  notes: string;
};

type LeadFormErrors = Partial<Record<keyof LeadFormValues | "contact", string>>;

type LeadCreateResponse = {
  lead?: Lead;
  error?: string;
  mode?: LeadDataMode;
};

const sourceOptions = [
  { value: "manual", label: "Cadastro manual" },
  { value: "csv_import", label: "CSV importado" },
  { value: "meta_lead_ads", label: "Meta Lead Form" },
  { value: "make_zapier", label: "Make/Zapier" },
  { value: "api", label: "API" }
];

export function LeadCreateModal({
  canCreateMetaAdsLeads,
  createLeadAccess,
  open,
  onClose,
  onCreated
}: LeadCreateModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
    setStatus(null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const closeModal = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!createLeadAccess.allowed) {
    return (
      <div
        aria-labelledby="lead-create-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
        onClick={closeModal}
        role="dialog"
      >
        <section
          className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/70 bg-cloud/95 p-4 shadow-glass sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
            <div>
              <p className="text-sm font-medium text-cobalt">CRM</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl" id="lead-create-title">
                Novo lead indisponível
              </h2>
            </div>
            <button className="icon-button shrink-0" onClick={closeModal} type="button" title="Fechar">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="pt-5">
            <SubscriptionAccessBanner notice={createLeadAccess} />
          </div>
        </section>
      </div>
    );
  }

  const visibleSourceOptions = canCreateMetaAdsLeads
    ? sourceOptions
    : sourceOptions.filter((option) => option.value !== "meta_lead_ads");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = getLeadFormValues(new FormData(event.currentTarget));
    const nextErrors = validateLeadForm(values);

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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildLeadPayload(values))
      });
      const data = await parseLeadCreateResponse(response);

      if (!response.ok || !data.lead) {
        throw new Error(getFriendlySubmitError(data.error));
      }

      onCreated(data.lead, data.mode);
      formRef.current?.reset();
      setStatus({
        type: "success",
        message:
          data.mode === "not-configured"
            ? "Lead criado no modo demonstracao. Configure o Supabase para salvar dados reais."
            : "Lead criado e salvo no CRM."
      });

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setStatus({
        type: "error",
        message: getFriendlyErrorMessage(error).message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      aria-labelledby="lead-create-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
      onClick={closeModal}
      role="dialog"
    >
      <section
        className="mx-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-white/70 bg-cloud/95 p-4 shadow-glass sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
          <div>
            <p className="text-sm font-medium text-cobalt">CRM</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl" id="lead-create-title">
              Novo lead
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
              Cadastre um contato manualmente e acompanhe o atendimento no funil do Leadi.
            </p>
          </div>
          <button className="icon-button shrink-0" onClick={closeModal} type="button" title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="pt-5" noValidate onSubmit={handleSubmit} ref={formRef}>
          {status && (
            <div
              aria-live="polite"
              className={`mb-5 flex items-start gap-3 rounded-[24px] px-4 py-3 text-sm font-medium ${
                status.type === "success" ? "bg-lagoon/16 text-ink" : "bg-signal/34 text-ink"
              }`}
            >
              {status.type === "success" && (
                <CheckCircle2 className="mt-0.5 shrink-0 text-lagoon" size={18} aria-hidden="true" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <LeadField error={errors.name} label="Nome">
              <input
                aria-invalid={Boolean(errors.name)}
                autoComplete="name"
                className={fieldClass(Boolean(errors.name))}
                disabled={isSubmitting}
                name="name"
                placeholder="Nome do lead"
                type="text"
              />
            </LeadField>

            <LeadField error={errors.phone ?? errors.contact} label="Telefone">
              <input
                aria-invalid={Boolean(errors.phone ?? errors.contact)}
                autoComplete="tel"
                className={fieldClass(Boolean(errors.phone ?? errors.contact))}
                disabled={isSubmitting}
                name="phone"
                placeholder="(11) 99999-0000"
                type="tel"
              />
            </LeadField>

            <LeadField error={errors.email ?? errors.contact} label="Email">
              <input
                aria-invalid={Boolean(errors.email ?? errors.contact)}
                autoComplete="email"
                className={fieldClass(Boolean(errors.email ?? errors.contact))}
                disabled={isSubmitting}
                name="email"
                placeholder="contato@empresa.com.br"
                type="email"
              />
            </LeadField>

            <LeadField error={errors.city} label="Cidade">
              <input
                aria-invalid={Boolean(errors.city)}
                autoComplete="address-level2"
                className={fieldClass(Boolean(errors.city))}
                disabled={isSubmitting}
                name="city"
                placeholder="Campinas"
                type="text"
              />
            </LeadField>

            <LeadField error={errors.company_name} label="Empresa">
              <input
                aria-invalid={Boolean(errors.company_name)}
                autoComplete="organization"
                className={fieldClass(Boolean(errors.company_name))}
                disabled={isSubmitting}
                name="company_name"
                placeholder="Nome da empresa"
                type="text"
              />
            </LeadField>

            <LeadField error={errors.lives_count} label="Número de vidas">
              <input
                aria-invalid={Boolean(errors.lives_count)}
                className={fieldClass(Boolean(errors.lives_count))}
                disabled={isSubmitting}
                inputMode="numeric"
                min={0}
                name="lives_count"
                placeholder="24"
                type="number"
              />
            </LeadField>

            <LeadField error={errors.interest} label="Interesse">
              <input
                aria-invalid={Boolean(errors.interest)}
                className={fieldClass(Boolean(errors.interest))}
                disabled={isSubmitting}
                name="interest"
                placeholder="Plano empresarial, adesão, migração..."
                type="text"
              />
            </LeadField>

            <LeadField error={errors.budget} label="Orçamento">
              <input
                aria-invalid={Boolean(errors.budget)}
                className={fieldClass(Boolean(errors.budget))}
                disabled={isSubmitting}
                name="budget"
                placeholder="R$ 8k/mês"
                type="text"
              />
            </LeadField>

            <LeadField label="Etapa">
              <div className="liquid-input flex items-center bg-white/40 text-sm font-medium opacity-70">
                Novo lead
              </div>
              <input name="stage" type="hidden" value="new" />
            </LeadField>

            <LeadField error={errors.source} label="Origem">
              <select
                aria-invalid={Boolean(errors.source)}
                className={fieldClass(Boolean(errors.source))}
                defaultValue="manual"
                disabled={isSubmitting}
                name="source"
              >
                {visibleSourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadField>

            <LeadField className="md:col-span-2" error={errors.notes} label="Observações">
              <textarea
                aria-invalid={Boolean(errors.notes)}
                className={`${fieldClass(Boolean(errors.notes))} min-h-[118px] resize-y`}
                disabled={isSubmitting}
                name="notes"
                placeholder="Registre contexto, objeções, próximos passos e informações comerciais relevantes."
              />
            </LeadField>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex items-center justify-center rounded-full bg-white/54 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/76 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={closeModal}
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
                <Plus size={18} aria-hidden="true" />
              )}
              {isSubmitting ? "Salvando..." : "Salvar lead"}
            </button>
          </div>
        </form>
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

function getLeadFormValues(formData: FormData): LeadFormValues {
  return {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    city: formString(formData, "city"),
    company_name: formString(formData, "company_name"),
    lives_count: formString(formData, "lives_count"),
    interest: formString(formData, "interest"),
    budget: formString(formData, "budget"),
    stage: formString(formData, "stage"),
    source: formString(formData, "source"),
    notes: formString(formData, "notes")
  };
}

function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const nextErrors: LeadFormErrors = {};

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

function buildLeadPayload(values: LeadFormValues) {
  return {
    name: values.name,
    phone: values.phone || undefined,
    email: values.email || undefined,
    city: values.city || undefined,
    company_name: values.company_name || undefined,
    lives_count: values.lives_count ? Number(values.lives_count) : undefined,
    interest: values.interest || undefined,
    budget: values.budget || undefined,
    stage: values.stage,
    source: values.source,
    notes: values.notes || undefined,
    last_interaction: "Lead cadastrado manualmente pelo dashboard."
  };
}

async function parseLeadCreateResponse(response: Response): Promise<LeadCreateResponse> {
  try {
    return (await response.json()) as LeadCreateResponse;
  } catch {
    return {};
  }
}

function getFriendlySubmitError(error?: string) {
  return getFriendlyErrorMessage(error).message;
}

function formString(formData: FormData, field: keyof LeadFormValues) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function fieldClass(hasError: boolean) {
  return `liquid-input disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError ? "border-signal/80 bg-signal/20" : ""
  }`;
}
