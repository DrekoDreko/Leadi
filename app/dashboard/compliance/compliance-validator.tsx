"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Loader2,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";

type RiskLevel = "low" | "medium" | "high";

type ComplianceReview = {
  riskLevel: RiskLevel;
  score: number;
  reasons: Array<{
    title: string;
    detail: string;
    severity: RiskLevel;
  }>;
  suggestions: string[];
  rewrittenText: string;
  disclaimer: string;
  analysisSource: "local" | "local_ai";
  aiWarning: string;
};

type FormState = {
  text: string;
  channel: "meta_ads" | "lead_form" | "landing_page" | "whatsapp" | "other";
  audience: string;
  objective: string;
};

const initialForm: FormState = {
  text: "Plano empresarial com analise consultiva para comparar opcoes para sua empresa. Fale com um consultor e receba alternativas conforme regiao, quantidade de vidas e regras comerciais das operadoras.",
  channel: "meta_ads",
  audience: "Donos e gestores de empresas de 2 a 49 vidas",
  objective: "gerar leads qualificados para cotacao consultiva"
};

const channelLabels: Record<FormState["channel"], string> = {
  lead_form: "Formulario Meta",
  landing_page: "Landing page",
  meta_ads: "Meta Ads",
  other: "Outro",
  whatsapp: "WhatsApp"
};

const riskLabels: Record<RiskLevel, string> = {
  high: "Risco alto",
  low: "Risco baixo",
  medium: "Risco medio"
};

const severityClasses: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-800 ring-red-200/70",
  low: "bg-emerald-100 text-emerald-800 ring-emerald-200/70",
  medium: "bg-yellow-100 text-yellow-800 ring-yellow-200/70"
};

export function ComplianceValidator({
  eyebrow = "Compliance",
  title = "Validador de campanha",
  description = "Cole textos de anuncio, formulario ou mensagem para detectar linguagem sensivel antes de publicar."
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
} = {}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [review, setReview] = useState<ComplianceReview | null>(null);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibleReview = review ?? getInitialReview();
  const highRiskCount = visibleReview.reasons.filter(
    (reason) => reason.severity === "high"
  ).length;
  const sourceLabel = visibleReview.analysisSource === "local_ai" ? "local + IA" : "local";

  const metricTone = useMemo(() => {
    if (visibleReview.riskLevel === "high") {
      return "yellow";
    }

    if (visibleReview.riskLevel === "medium") {
      return "blue";
    }

    return "teal";
  }, [visibleReview.riskLevel]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsValidating(true);

    try {
      const response = await fetch("/api/compliance/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = (await response.json().catch(() => null)) as {
        review?: ComplianceReview;
        error?: string;
      } | null;

      if (!response.ok || !payload?.review) {
        throw new Error(payload?.error ?? "Nao foi possivel validar o texto.");
      }

      setReview(payload.review);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel validar o texto."
      );
    } finally {
      setIsValidating(false);
    }
  }

  function updateField<Field extends keyof FormState>(field: Field, value: FormState[Field]) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function copyRewrite() {
    try {
      await navigator.clipboard.writeText(visibleReview.rewrittenText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Nao foi possivel copiar automaticamente neste navegador.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isValidating}
          form="compliance-validator-form"
          type="submit"
        >
          {isValidating ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <ClipboardCheck size={18} aria-hidden="true" />
          )}
          {isValidating ? "Validando" : "Validar texto"}
        </button>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Resultado" value={`${visibleReview.score}%`} note={riskLabels[visibleReview.riskLevel]} tone={metricTone} />
        <Metric label="Alertas" value={String(visibleReview.reasons.length)} note="motivos" tone="dark" />
        <Metric label="Risco alto" value={String(highRiskCount)} note="bloqueios" tone={highRiskCount ? "yellow" : "teal"} />
        <Metric label="Analise" value={sourceLabel} note={channelLabels[form.channel]} tone="blue" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="min-w-0 space-y-4">
          <section className="glass-strong rounded-[34px] p-5 md:p-6">
            <form className="grid gap-4" id="compliance-validator-form" onSubmit={handleSubmit}>
              <label className="space-y-2" htmlFor="text">
                <span className="text-sm font-semibold text-ink/62">Texto para revisar</span>
                <textarea
                  className="liquid-input min-h-[190px] resize-y leading-6"
                  id="text"
                  maxLength={4000}
                  onChange={(event) => updateField("text", event.target.value)}
                  placeholder="Cole aqui o texto do anuncio, formulario ou mensagem."
                  required
                  value={form.text}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2" htmlFor="channel">
                  <span className="text-sm font-semibold text-ink/62">Canal</span>
                  <select
                    className="liquid-input"
                    id="channel"
                    onChange={(event) =>
                      updateField("channel", event.target.value as FormState["channel"])
                    }
                    value={form.channel}
                  >
                    {Object.entries(channelLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2" htmlFor="audience">
                  <span className="text-sm font-semibold text-ink/62">Publico</span>
                  <input
                    className="liquid-input"
                    id="audience"
                    maxLength={280}
                    onChange={(event) => updateField("audience", event.target.value)}
                    value={form.audience}
                  />
                </label>
              </div>

              <label className="space-y-2" htmlFor="objective">
                <span className="text-sm font-semibold text-ink/62">Objetivo</span>
                <input
                  className="liquid-input"
                  id="objective"
                  maxLength={280}
                  onChange={(event) => updateField("objective", event.target.value)}
                  value={form.objective}
                />
              </label>
            </form>

            {error ? (
              <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                <p>{error}</p>
              </div>
            ) : null}
          </section>

          <section className="glass-strong rounded-[34px] p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink/54">Resultado da revisao</p>
                <h2 className="mt-1 text-2xl font-semibold">{riskLabels[visibleReview.riskLevel]}</h2>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${severityClasses[visibleReview.riskLevel]}`}
              >
                Score {visibleReview.score}%
              </span>
            </div>

            {visibleReview.aiWarning ? (
              <div className="mb-4 flex items-start gap-3 rounded-[22px] border border-yellow-300/60 bg-yellow-100/58 p-4 text-sm leading-6 text-ink/72">
                <AlertTriangle className="mt-0.5 shrink-0 text-yellow-700" size={17} aria-hidden="true" />
                <p>{visibleReview.aiWarning}</p>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {visibleReview.reasons.map((reason) => (
                <article className="rounded-[24px] border border-white/44 bg-white/36 p-4 shadow-soft" key={`${reason.title}-${reason.detail}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold leading-tight">{reason.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${severityClasses[reason.severity]}`}
                    >
                      {riskLabels[reason.severity]}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-ink/62">{reason.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink/54">Reescrita segura</p>
                <h2 className="mt-1 text-xl font-semibold">Versao sugerida</h2>
              </div>
              <button
                aria-label="Copiar reescrita"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink transition hover:bg-white"
                onClick={copyRewrite}
                title={copied ? "Copiado" : "Copiar reescrita"}
                type="button"
              >
                {copied ? (
                  <CheckCircle2 className="text-lagoon" size={17} aria-hidden="true" />
                ) : (
                  <Copy size={17} aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="whitespace-pre-line rounded-[24px] bg-white/40 p-4 text-sm leading-6 text-ink/72">
              {visibleReview.rewrittenText}
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Sugestoes</h2>
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {visibleReview.suggestions.map((suggestion) => (
                <div className="flex gap-3 rounded-[22px] bg-white/42 p-4" key={suggestion}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-lagoon" size={18} aria-hidden="true" />
                  <p className="text-sm leading-6 text-ink/68">{suggestion}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Ressalva</h2>
              <ShieldAlert size={20} aria-hidden="true" />
            </div>
            <p className="rounded-[22px] bg-white/42 p-4 text-sm leading-6 text-ink/68">
              {visibleReview.disclaimer}
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}

function getInitialReview(): ComplianceReview {
  return {
    riskLevel: "low",
    score: 92,
    reasons: [
      {
        title: "Pronto para revisar",
        detail:
          "Envie um texto para validar promessas, atributos sensiveis, segmentacao e coleta de dados.",
        severity: "low"
      }
    ],
    suggestions: [
      "Use criterios comerciais: empresa, quantidade de vidas, regiao e interesse em cotacao.",
      "Evite promessas de economia, aprovacao, cobertura ou resultado garantido."
    ],
    rewrittenText:
      "Compare alternativas de plano de saude empresarial para sua equipe com uma analise consultiva. Informe a cidade da empresa, quantidade aproximada de vidas e melhor contato para receber orientacao comercial.",
    disclaimer:
      "Esta validacao ajuda a reduzir riscos de linguagem, mas nao substitui revisao juridica, regulatoria ou comercial.",
    analysisSource: "local",
    aiWarning: ""
  };
}
