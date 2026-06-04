"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Loader2, Send, Sparkles } from "lucide-react";
import type { Lead } from "@/data/mock";
import { getAiCreditCost } from "@/lib/ai/credit-costs";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import {
  buildFallbackWhatsAppMessage,
  buildWhatsAppStageObjective,
  getSuggestedWhatsAppTone,
  getWhatsAppStageLabel,
  getWhatsAppToneLabel,
  getWhatsAppTonePrompt,
  whatsappToneOptions,
  type WhatsAppToneValue
} from "@/lib/whatsapp/templates";
import type { WhatsAppHistoryItem, WhatsAppStage } from "@/lib/whatsapp/types";
import type { SystemTemplate, WhatsAppTemplateContent } from "@/lib/templates/types";
import { normalizePhone } from "@/lib/leads/normalization";

type LeadMessageGeneratorProps = {
  aiBalance: number;
  lead: Lead;
  systemTemplates?: SystemTemplate[];
  onMessageGenerated?: () => void;
};

type GeneratedMessage = {
  openingMessage: string;
  followUpMessage: string;
  objectionReply: string;
  complianceNotes: string[];
};

type WhatsAppGenerationResponse = {
  message?: GeneratedMessage;
  savedMessage?: WhatsAppHistoryItem;
  aiBalance?: number;
  error?: string;
};

type WhatsAppSendResponse = {
  updatedMessage?: WhatsAppHistoryItem;
  configurationStatus?: "ready" | "opt_in_required" | "credentials_missing" | "not_configured";
  error?: string;
};

const stageOptions: Array<{ value: WhatsAppStage; label: string }> = [
  { value: "new_lead", label: getWhatsAppStageLabel("new_lead") },
  { value: "first_contact", label: getWhatsAppStageLabel("first_contact") },
  { value: "negotiation", label: "Em negociacao" },
  { value: "awaiting_response", label: "Aguardando resposta" },
  { value: "closing", label: "Fechamento" },
  { value: "post_service", label: "Pos-atendimento" },
  { value: "objection_follow_up", label: "Follow-up de objecao" }
];

export function LeadMessageGenerator({
  aiBalance,
  lead,
  systemTemplates = [],
  onMessageGenerated
}: LeadMessageGeneratorProps) {
  const messageCost = getAiCreditCost("generate_whatsapp_message");
  const [currentAiBalance, setCurrentAiBalance] = useState(aiBalance);
  const [selectedStage, setSelectedStage] = useState<WhatsAppStage>(mapLeadStageToMessageStage(lead.stage));
  const [selectedTone, setSelectedTone] = useState<WhatsAppToneValue>(() =>
    getSuggestedWhatsAppTone(mapLeadStageToMessageStage(lead.stage))
  );
  const [objectionReason, setObjectionReason] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedMessage | null>(null);
  const [savedMessage, setSavedMessage] = useState<WhatsAppHistoryItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    setCurrentAiBalance(aiBalance);
  }, [aiBalance]);

  const visibleMessage = useMemo(
    () =>
      generatedMessage ??
      buildFallbackWhatsAppMessage({
        brokerageName: "Leadi",
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

  function getWhatsAppHref() {
    const normalizedPhone = normalizePhone(lead.phone).e164;
    if (!normalizedPhone) return undefined;
    const phone = normalizedPhone.replace(/\D/g, "");
    const text = encodeURIComponent(formatMessage(visibleMessage));
    return `https://wa.me/${phone}?text=${text}`;
  }

  async function handleGenerate() {
    if (currentAiBalance < messageCost) {
      setError("Você não possui créditos de IA suficientes para executar esta ação.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCopied(false);
    setCopyFeedback(null);

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
          tone: getWhatsAppTonePrompt(selectedTone),
          objectionReason: selectedStage === "objection_follow_up" ? objectionReason : undefined
        })
      });
      const payload = (await response.json().catch(() => null)) as WhatsAppGenerationResponse | null;

      if (!response.ok || !payload?.message) {
        throw new Error(payload?.error ?? "Nao foi possivel gerar a mensagem.");
      }

      setGeneratedMessage(payload.message);
      setSavedMessage(payload.savedMessage ?? null);
      if (typeof payload.aiBalance === "number") {
        setCurrentAiBalance(payload.aiBalance);
      }
      setSendError("");
      setSendSuccess("");

      if (onMessageGenerated) {
        onMessageGenerated();
      }
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
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }

      await navigator.clipboard.writeText(formatMessage(visibleMessage));
      setCopied(true);
      setError("");
      setCopyFeedback({
        tone: "success",
        message: "Mensagem copiada. Agora e so colar no WhatsApp."
      });
      window.setTimeout(() => {
        setCopied(false);
        setCopyFeedback((current) =>
          current?.tone === "success" ? null : current
        );
      }, 2200);
    } catch (copyError) {
      setCopied(false);
      setCopyFeedback({
        tone: "error",
        message: getFriendlyErrorMessage(
          copyError,
          "Nao foi possivel copiar automaticamente neste navegador."
        ).message
      });
    }
  }

  async function handleSend() {
    if (!savedMessage?.id) {
      setSendError("Gere uma mensagem antes de tentar enviar.");
      return;
    }

    setIsSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messageId: savedMessage.id,
          leadId: lead.id,
          recipientPhone: lead.phone
        })
      });
      const payload = (await response.json().catch(() => null)) as WhatsAppSendResponse | null;

      if (!response.ok || !payload?.updatedMessage) {
        throw new Error(payload?.error ?? "Nao foi possivel enviar a mensagem.");
      }

      setSavedMessage(payload.updatedMessage);
      setGeneratedMessage(payload.updatedMessage.result as GeneratedMessage);
      setSendSuccess(
        payload.configurationStatus === "ready"
          ? "Mensagem enviada e historico atualizado."
          : "Envio registrado, mas a configuracao ainda nao permite disparo real."
      );
    } catch (requestError) {
      setSendError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel enviar a mensagem."
      );
    } finally {
      setIsSending(false);
    }
  }

  function applyTemplate(template: SystemTemplate) {
    const content = template.content as WhatsAppTemplateContent;
    setCopied(false);
    setCopyFeedback(null);
    setGeneratedMessage({
      openingMessage: content.openingMessage?.replace("[Nome do Lead]", lead.name) ?? "",
      followUpMessage: content.followUpMessage ?? "",
      objectionReply: content.objectionReply ?? "",
      complianceNotes: ["Template pronto aplicado. Revise antes de enviar."]
    });
  }

  return (
    <section className="rounded-[28px] border border-white/50 bg-white/44 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">Gerar mensagem</p>
          <h3 className="mt-2 text-xl font-semibold">WhatsApp do lead</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Escolha a etapa da conversa e o tom desejado. Esta ação consumirá {messageCost} crédito
            {messageCost === 1 ? "" : "s"} de IA da plataforma.
          </p>
          {selectedStage === "awaiting_response" ? (
            <p className="mt-2 text-sm leading-6 text-ink/54">
              O follow-up sem resposta retoma o contato com baixo atrito e abre espaço para uma
              resposta simples do lead.
            </p>
          ) : null}
        </div>
        <Sparkles className="text-lagoon" size={20} aria-hidden="true" />
      </div>

      {currentAiBalance < messageCost ? (
        <div className="mt-4 rounded-[24px] border border-cobalt/18 bg-cobalt/8 p-4 text-sm leading-6 text-ink/68">
          <p>Você não tem créditos suficientes para esta ação.</p>
          <Link
            className="mt-3 inline-flex font-semibold text-cobalt underline underline-offset-4"
            href="/dashboard/perfil/creditos"
          >
            Comprar créditos
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {sendError ? (
        <div className="mt-4 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
          {sendError}
        </div>
      ) : null}
      {sendSuccess ? (
        <div className="mt-4 rounded-[24px] border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          {sendSuccess}
        </div>
      ) : null}

      {systemTemplates.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-cobalt">Templates prontos</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {systemTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="flex h-full flex-col items-start justify-between rounded-[20px] border border-ink/10 bg-white p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-cobalt/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                type="button"
              >
                <span className="text-sm font-bold text-ink">
                  {template.title}
                </span>
                <span className="mt-1.5 text-xs leading-relaxed text-ink/60 line-clamp-2">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink/72">Etapa do processo</span>
          <select
            className="liquid-input"
            onChange={(event) => {
              const nextStage = event.target.value as WhatsAppStage;
              setSelectedStage(nextStage);
              setSelectedTone(getSuggestedWhatsAppTone(nextStage));
              setGeneratedMessage(null);
              setSavedMessage(null);
              setCopied(false);
              setCopyFeedback(null);
              setSendError("");
              setSendSuccess("");
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
              setSavedMessage(null);
              setCopied(false);
              setCopyFeedback(null);
              setSendError("");
              setSendSuccess("");
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

      {selectedStage === "objection_follow_up" && (
        <div className="mt-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink/72">Motivo da objecao</span>
            <input
              type="text"
              className="liquid-input w-full"
              placeholder="Ex: Achou caro, prefere outra operadora, vai ver com o socio..."
              value={objectionReason}
              onChange={(e) => {
                setObjectionReason(e.target.value);
                setGeneratedMessage(null);
                setSavedMessage(null);
                setCopied(false);
                setCopyFeedback(null);
                setSendError("");
                setSendSuccess("");
              }}
            />
          </label>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGenerating || currentAiBalance < messageCost}
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
        <a
          aria-disabled={isGenerating || isSending || !savedMessage?.id || !getWhatsAppHref()}
          className={`inline-flex items-center gap-2 rounded-full border border-cobalt/22 bg-white/70 px-5 py-3 text-sm font-semibold text-cobalt transition ${
            isGenerating || isSending || !savedMessage?.id || !getWhatsAppHref()
              ? "cursor-not-allowed opacity-70"
              : "hover:bg-white"
          }`}
          href={getWhatsAppHref() ?? "#"}
          onClick={(e) => {
            if (isGenerating || isSending || !savedMessage?.id || !getWhatsAppHref()) {
              e.preventDefault();
              return;
            }
            void handleSend();
          }}
          rel="noopener noreferrer"
          target="_blank"
        >
          {isSending ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Send size={18} aria-hidden="true" />
          )}
          Abrir no WhatsApp
        </a>
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

      {copyFeedback ? (
        <p
          aria-live="polite"
          className={`mt-3 inline-flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm font-medium ${
            copyFeedback.tone === "success"
              ? "bg-lagoon/12 text-lagoon"
              : "bg-red-50 text-red-800"
          }`}
        >
          {copyFeedback.tone === "success" ? (
            <CheckCircle2 size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {copyFeedback.message}
        </p>
      ) : null}

      {savedMessage ? (
        <div className="mt-3 rounded-[22px] border border-white/48 bg-white/40 px-4 py-3 text-sm text-ink/66">
          Status de envio: {formatDeliveryStatus(savedMessage.delivery.status)}
        </div>
      ) : null}

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
    lead.lastInteraction ? `Ultima interacao: ${lead.lastInteraction}` : "",
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

function formatDeliveryStatus(status: WhatsAppHistoryItem["delivery"]["status"]) {
  switch (status) {
    case "sent":
      return "Enviada";
    case "queued":
      return "Na fila";
    case "pending_config":
      return "Configuracao pendente";
    case "opt_in_required":
      return "Opt-in necessario";
    case "credentials_missing":
      return "Credenciais ausentes";
    case "rate_limited":
      return "Limite atingido";
    case "blocked":
      return "Bloqueada";
    case "failed":
      return "Falha";
    default:
      return "Nao enviada";
  }
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
