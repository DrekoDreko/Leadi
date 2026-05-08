"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react";
import type { Lead } from "@/data/mock";
import {
  buildFallbackWhatsAppMessage,
  buildWhatsAppStageObjective,
  getWhatsAppToneLabel,
  getWhatsAppTonePrompt,
  whatsappToneOptions,
  type WhatsAppToneValue
} from "@/lib/whatsapp/templates";
import type { WhatsAppStage } from "@/lib/whatsapp/types";

type LeadMessageGeneratorProps = {
  hasOpenAIConnection: boolean;
  lead: Lead;
};

type GeneratedMessage = {
  openingMessage: string;
  followUpMessage: string;
  objectionReply: string;
  complianceNotes: string[];
};

type WhatsAppGenerationResponse = {
  message?: GeneratedMessage;
  error?: string;
};

const stageOptions: Array<{ value: WhatsAppStage; label: string }> = [
  { value: "new_lead", label: "Novo lead" },
  { value: "first_contact", label: "Primeiro contato" },
  { value: "negotiation", label: "Em negociacao" },
  { value: "awaiting_response", label: "Aguardando resposta" },
  { value: "closing", label: "Fechamento" },
  { value: "post_service", label: "Pos-atendimento" }
];

export function LeadMessageGenerator({
  hasOpenAIConnection,
  lead
}: LeadMessageGeneratorProps) {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<WhatsAppStage>(mapLeadStageToMessageStage(lead.stage));
  const [selectedTone, setSelectedTone] = useState<WhatsAppToneValue>("consultivo");
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedMessage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const visibleMessage = useMemo(
    () =>
      generatedMessage ??
      buildFallbackWhatsAppMessage({
        brokerageName: "LeadHealth",
        lead: {
          name: lead.name,
          city: lead.city,
          companyName: lead.companyName,
          interest: lead.interest,
          livesCount: lead.livesCount
        },
        stage: selectedStage,
        tone: selectedTone
      }),
    [generatedMessage, lead, selectedStage, selectedTone]
  );

  async function handleGenerate() {
    if (!hasOpenAIConnection) {
      router.push("/dashboard/perfil?section=empresa&highlight=openai");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/whatsapp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          leadContext: buildLeadContext(lead),
          product: lead.interest || "Plano de saude empresarial",
          stage: selectedStage,
          objective: buildWhatsAppStageObjective(selectedStage),
          tone: getWhatsAppTonePrompt(selectedTone)
        })
      });
      const payload = (await response.json().catch(() => null)) as WhatsAppGenerationResponse | null;

      if (!response.ok || !payload?.message) {
        throw new Error(payload?.error ?? "Nao foi possivel gerar a mensagem.");
      }

      setGeneratedMessage(payload.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel gerar a mensagem."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatMessage(visibleMessage));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError("Nao foi possivel copiar automaticamente neste navegador.");
    }
  }

  return (
    <section className="rounded-[28px] border border-white/50 bg-white/44 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">Gerar mensagem</p>
          <h3 className="mt-2 text-xl font-semibold">WhatsApp do lead</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Escolha a etapa da conversa e o tom desejado. Se a conta OpenAI da empresa nao estiver conectada, o Perfil sera destacado para configuracao.
          </p>
        </div>
        <Sparkles className="text-lagoon" size={20} aria-hidden="true" />
      </div>

      {!hasOpenAIConnection ? (
        <div className="mt-4 rounded-[24px] border border-cobalt/18 bg-cobalt/8 p-4 text-sm leading-6 text-ink/68">
          Conecte a OpenAI no Perfil para gerar mensagens com IA usando a conta do cliente.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink/72">Etapa do processo</span>
          <select
            className="liquid-input"
            onChange={(event) => {
              setSelectedStage(event.target.value as WhatsAppStage);
              setGeneratedMessage(null);
            }}
            value={selectedStage}
          >
            {stageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink/72">Perfil da mensagem</span>
          <select
            className="liquid-input"
            onChange={(event) => {
              setSelectedTone(event.target.value as WhatsAppToneValue);
              setGeneratedMessage(null);
            }}
            value={selectedTone}
          >
            {whatsappToneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGenerating}
          onClick={() => void handleGenerate()}
          type="button"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          {isGenerating ? "Gerando" : "Gerar mensagem"}
        </button>
        <button
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
            copied
              ? "bg-lagoon text-white"
              : "bg-white/70 text-ink hover:bg-white"
          }`}
          onClick={() => void handleCopy()}
          type="button"
        >
          {copied ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <Copy size={18} aria-hidden="true" />
          )}
          {copied ? "Copiado" : "Copiar mensagem"}
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        <MessageBlock label="Abertura" value={visibleMessage.openingMessage} />
        <MessageBlock label="Seguimento" value={visibleMessage.followUpMessage} />
        <MessageBlock label="Resposta de objecao" value={visibleMessage.objectionReply} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold text-ink/58">
          {stageOptions.find((option) => option.value === selectedStage)?.label ?? selectedStage}
        </span>
        <span className="rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold text-ink/58">
          {getWhatsAppToneLabel(selectedTone)}
        </span>
      </div>
    </section>
  );
}

function MessageBlock({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[22px] bg-white/56 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink/76">{value}</p>
    </article>
  );
}

function buildLeadContext(lead: Lead) {
  return [
    lead.companyName ? `Empresa: ${lead.companyName}` : "",
    lead.city ? `Cidade: ${lead.city}` : "",
    lead.interest ? `Interesse: ${lead.interest}` : "",
    lead.livesCount ? `Vidas: ${lead.livesCount}` : "",
    lead.notes ? `Observacoes: ${lead.notes}` : ""
  ]
    .filter(Boolean)
    .join(". ");
}

function formatMessage(message: GeneratedMessage) {
  return [
    message.openingMessage,
    "",
    message.followUpMessage,
    "",
    message.objectionReply
  ].join("\n");
}

function mapLeadStageToMessageStage(stage: Lead["stage"]) {
  switch (stage) {
    case "Novo lead":
      return "new_lead";
    case "Qualificação":
      return "first_contact";
    case "Proposta":
      return "awaiting_response";
    case "Negociação":
      return "negotiation";
    case "Venda":
      return "post_service";
    case "Perdido":
      return "closing";
    default:
      return "new_lead";
  }
}
