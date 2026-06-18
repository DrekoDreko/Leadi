"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";

type PageOption = { id: string; name: string };

const FIELD_OPTIONS = [
  { value: "full_name", label: "Nome completo", locked: true },
  { value: "email", label: "Email", locked: false },
  { value: "phone", label: "Telefone", locked: false },
  { value: "city", label: "Cidade", locked: false }
] as const;

type FieldValue = (typeof FIELD_OPTIONS)[number]["value"];

export function LeadFormBuilder({ pages }: { pages: PageOption[] }) {
  const router = useRouter();
  const [pageId, setPageId] = useState(pages[0]?.id ?? "");
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldValue[]>(["full_name", "phone"]);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);

  function toggleField(value: FieldValue) {
    setFields((current) =>
      current.includes(value)
        ? current.filter((field) => field !== value)
        : [...current, value]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCreatedFormId(null);

    if (!pageId) {
      setError("Selecione uma página.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/meta/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          name,
          fields,
          privacyPolicyUrl,
          thankYouMessage: thankYouMessage.trim() || undefined
        })
      });
      const data = (await response.json()) as { form?: { formId: string }; error?: string };
      if (!response.ok || !data.form) {
        throw new Error(data.error ?? "Não foi possível criar o formulário.");
      }
      setCreatedFormId(data.form.formId);
      setName("");
      setThankYouMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Formulários"
        title="Criar formulário de lead"
        description="Monte um formulário de captação direto pelo Leadi. Ele fica disponível na sua página da Meta e no seletor de campanhas."
      />

      {pages.length === 0 ? (
        <section className="glass-strong rounded-[30px] p-6">
          <h2 className="text-xl font-semibold">Nenhuma página conectada</h2>
          <p className="text-muted-soft mt-3 text-sm leading-7">
            Conecte uma página do Facebook na área de integrações da Meta antes de criar formulários.
          </p>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="surface-card-strong space-y-5 rounded-[30px] p-5 md:p-6">
          <div>
            <label htmlFor="form-page" className="text-sm font-semibold">
              Página
            </label>
            <select
              id="form-page"
              value={pageId}
              onChange={(event) => setPageId(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-cobalt/20 bg-surface-elevated px-4 text-sm focus:border-cobalt/45 focus:outline-none"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="form-name" className="text-sm font-semibold">
              Nome do formulário
            </label>
            <input
              id="form-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Captação plano empresarial"
              maxLength={200}
              className="mt-2 h-11 w-full rounded-2xl border border-cobalt/20 bg-surface-elevated px-4 text-sm focus:border-cobalt/45 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-sm font-semibold">Campos do formulário</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {FIELD_OPTIONS.map((option) => {
                const checked = fields.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.locked && toggleField(option.value)}
                    aria-pressed={checked}
                    disabled={option.locked}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      checked
                        ? "border-cobalt/30 bg-cobalt/10 text-cobalt"
                        : "border-cobalt/15 bg-surface-elevated text-ink/70 hover:bg-surface-elevated"
                    } ${option.locked ? "cursor-default opacity-90" : ""}`}
                  >
                    {checked ? <CheckCircle2 size={15} aria-hidden="true" /> : null}
                    {option.label}
                    {option.locked ? <span className="text-xs text-ink/40">(obrigatório)</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="form-privacy" className="text-sm font-semibold">
              URL da política de privacidade
            </label>
            <input
              id="form-privacy"
              type="url"
              value={privacyPolicyUrl}
              onChange={(event) => setPrivacyPolicyUrl(event.target.value)}
              placeholder="https://seusite.com/privacidade"
              className="mt-2 h-11 w-full rounded-2xl border border-cobalt/20 bg-surface-elevated px-4 text-sm focus:border-cobalt/45 focus:outline-none"
            />
            <p className="text-muted-soft mt-1 text-xs">Obrigatório pela Meta.</p>
          </div>

          <div>
            <label htmlFor="form-thanks" className="text-sm font-semibold">
              Mensagem de agradecimento (opcional)
            </label>
            <textarea
              id="form-thanks"
              value={thankYouMessage}
              onChange={(event) => setThankYouMessage(event.target.value)}
              placeholder="Recebemos seus dados. Em breve entraremos em contato!"
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-cobalt/20 bg-surface-elevated px-4 py-3 text-sm focus:border-cobalt/45 focus:outline-none"
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {createdFormId ? (
            <div className="flex items-center gap-2 rounded-[20px] border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 size={18} aria-hidden="true" />
              Formulário criado! Já está disponível na Meta e no seletor de campanhas.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/92 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <FileText size={16} aria-hidden="true" />
            )}
            Criar formulário
          </button>
        </form>
      )}
    </div>
  );
}
