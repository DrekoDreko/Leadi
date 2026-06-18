"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Loader2
} from "lucide-react";
import type { Lead } from "@/data/mock";
import { getAiCreditCost } from "@/lib/ai/credit-costs";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import {
  buildFallbackWhatsAppMessage,
  buildWhatsAppStageObjective,
  getSuggestedWhatsAppTone,
  getWhatsAppStageLabel,
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

type MessageSource = "ai" | "template" | null;

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

const messageBlocks: Array<{ key: keyof GeneratedMessage; label: string; hint: string }> = [
  { key: "openingMessage", label: "Abertura", hint: "Primeira mensagem para enviar agora." },
  { key: "followUpMessage", label: "Seguimento", hint: "Use se o lead nao responder." },
  { key: "objectionReply", label: "Resposta a objecao", hint: "Tenha pronta caso ele hesite." }
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
  const [messageSource, setMessageSource] = useState<MessageSource>(null);
  const [savedMessage, setSavedMessage] = useState<WhatsAppHistoryItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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

  const firstName = getFirstName(lead.name);
  const hasInsufficientCredits = currentAiBalance < messageCost;

  const previewMessage = useMemo(
    () =>
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
    [lead, selectedStage, selectedTone]
  );

  const displayMessage = generatedMessage ?? previewMessage;
  const hasResult = messageSource !== null && generatedMessage !== null;
  const whatsappHref = getWhatsAppHref(lead, displayMessage);

  function resetResult() {
    setGeneratedMessage(null);
    setMessageSource(null);
    setSavedMessage(null);
    setCopiedKey(null);
    setCopyFeedback(null);
    setSendError("");
    setSendSuccess("");
  }

  async function handleGenerate() {
    if (hasInsufficientCredits) {
      setError("Voce nao possui creditos de IA suficientes para executar esta acao.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setCopiedKey(null);
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
      setMessageSource("ai");
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

  async function copyToClipboard(text: string, key: string) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }

      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setError("");
      setCopyFeedback({
        tone: "success",
        message: "Mensagem copiada. Agora e so colar no WhatsApp."
      });
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
        setCopyFeedback((current) => (current?.tone === "success" ? null : current));
      }, 2200);
    } catch (copyError) {
      setCopiedKey(null);
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
        throw new Error(payload?.error ?? "Nao foi possivel registrar o envio.");
      }

      setSavedMessage(payload.updatedMessage);
      setGeneratedMessage(payload.updatedMessage.result as GeneratedMessage);
      setSendSuccess(
        payload.configurationStatus === "ready"
          ? "Mensagem enviada e historico atualizado."
          : "Abrimos o WhatsApp e registramos a abordagem no historico do lead."
      );
    } catch (requestError) {
      setSendError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel registrar o envio."
      );
    } finally {
      setIsSending(false);
    }
  }

  function applyTemplate(template: SystemTemplate) {
    const content = template.content as WhatsAppTemplateContent;
    setCopiedKey(null);
    setCopyFeedback(null);
    setSavedMessage(null);
    setSendError("");
    setSendSuccess("");
    setMessageSource("template");
    setGeneratedMessage({
      openingMessage: content.openingMessage?.replace("[Nome do Lead]", lead.name) ?? "",
      followUpMessage: content.followUpMessage ?? "",
      objectionReply: content.objectionReply ?? "",
      complianceNotes: ["Template pronto aplicado. Revise antes de enviar."]
    });
  }

  return (
    <section className="space-y-4">
      {/* Cabecalho */}
      <div className="surface-card rounded-[28px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-cobalt">Mensagem com IA</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">
              Gerar mensagem para {firstName}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-soft">
              Escolha a etapa da conversa e o tom. A IA escreve uma abordagem pronta com os dados
              deste lead.
            </p>
          </div>
          <span className="surface-pill inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="text-cobalt" size={14} aria-hidden="true" />
            {messageCost} credito{messageCost === 1 ? "" : "s"} por mensagem
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ${
              hasInsufficientCredits
                ? "surface-alert-warning"
                : "bg-success/14 text-foreground"
            }`}
          >
            <Sparkles size={13} aria-hidden="true" />
            Saldo: {currentAiBalance} credito{currentAiBalance === 1 ? "" : "s"}
          </span>
          {hasInsufficientCredits ? (
            <Link
              className="inline-flex items-center gap-1 font-semibold text-cobalt underline underline-offset-4"
              href="/dashboard/perfil/creditos"
            >
              Comprar creditos
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="surface-danger flex items-start gap-3 rounded-[24px] px-4 py-3 text-sm font-medium">
          <AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Passo 1 - Configurar */}
      <div className="surface-card-muted rounded-[28px] p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt text-xs font-bold text-white">
            1
          </span>
          <h4 className="text-sm font-semibold text-foreground">Configurar a abordagem</h4>
        </div>

        {systemTemplates.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-soft">
              Comece de um modelo (opcional)
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {systemTemplates.map((template) => {
                const isActive =
                  messageSource === "template" && generatedMessage !== null &&
                  applyTemplateIsActive(template, generatedMessage, lead.name);
                return (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`surface-card flex h-full flex-col items-start justify-between rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 ${
                      isActive ? "border-cobalt ring-1 ring-cobalt/40" : "border-border hover:border-cobalt/40"
                    }`}
                    type="button"
                  >
                    <span className="text-sm font-semibold text-foreground">{template.title}</span>
                    <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-soft">
                      {template.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Etapa do processo</span>
            <select
              className="liquid-input"
              onChange={(event) => {
                setSelectedStage(event.target.value as WhatsAppStage);
                setSelectedTone(getSuggestedWhatsAppTone(event.target.value as WhatsAppStage));
                resetResult();
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
            <span className="text-sm font-semibold text-foreground">Perfil da mensagem</span>
            <select
              className="liquid-input"
              onChange={(event) => {
                setSelectedTone(event.target.value as WhatsAppToneValue);
                resetResult();
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

        {selectedStage === "awaiting_response" ? (
          <p className="mt-3 rounded-[18px] bg-cobalt/8 px-4 py-2.5 text-xs leading-5 text-muted-soft">
            O follow-up sem resposta retoma o contato com baixo atrito e abre espaco para uma
            resposta simples do lead.
          </p>
        ) : null}

        {selectedStage === "objection_follow_up" && (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-semibold text-foreground">Motivo da objecao</span>
            <input
              type="text"
              className="liquid-input w-full"
              placeholder="Ex: Achou caro, prefere outra operadora, vai ver com o socio..."
              value={objectionReason}
              onChange={(event) => {
                setObjectionReason(event.target.value);
                resetResult();
              }}
            />
          </label>
        )}

        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isGenerating || hasInsufficientCredits}
          onClick={() => void handleGenerate()}
          type="button"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          {isGenerating
            ? "Gerando mensagem..."
            : `Gerar mensagem · ${messageCost} credito${messageCost === 1 ? "" : "s"}`}
        </button>
      </div>

      {/* Passo 2 - Resultado */}
      <div className="surface-card-muted rounded-[28px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt text-xs font-bold text-white">
              2
            </span>
            <h4 className="text-sm font-semibold text-foreground">Sua mensagem</h4>
          </div>
          {hasResult ? (
            <span className="surface-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground">
              {messageSource === "ai" ? (
                <>
                  <Sparkles className="text-cobalt" size={13} aria-hidden="true" />
                  Gerada por IA
                </>
              ) : (
                <>
                  <MessageCircle className="text-cobalt" size={13} aria-hidden="true" />
                  Modelo aplicado
                </>
              )}
            </span>
          ) : null}
        </div>

        {!hasResult ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">
              Sua mensagem aparecera aqui
            </p>
            <p className="mt-1 max-w-sm text-sm leading-6 text-muted-soft">
              Ajuste a etapa e o tom acima e clique em <strong>Gerar mensagem</strong>. Cada geracao
              consome {messageCost} credito{messageCost === 1 ? "" : "s"} de IA.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {messageBlocks.map((block) => {
                const value = displayMessage[block.key] as string;
                if (!value) {
                  return null;
                }
                const copied = copiedKey === block.key;
                return (
                  <article className="surface-card rounded-[22px] p-4" key={block.key}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-soft">
                          {block.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-soft/80">{block.hint}</p>
                      </div>
                      <button
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          copied
                            ? "bg-success/16 text-foreground"
                            : "surface-action-secondary"
                        }`}
                        onClick={() => void copyToClipboard(value, block.key)}
                        type="button"
                      >
                        {copied ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : (
                          <Copy size={14} aria-hidden="true" />
                        )}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">
                      {value}
                    </p>
                  </article>
                );
              })}
            </div>

            {displayMessage.complianceNotes?.length ? (
              <div className="mt-3 rounded-[20px] border border-border bg-card px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-soft">
                  <ShieldCheck className="text-cobalt" size={14} aria-hidden="true" />
                  Pontos de atencao
                </p>
                <ul className="mt-2 space-y-1.5">
                  {displayMessage.complianceNotes.map((note, index) => (
                    <li className="flex gap-2 text-xs leading-5 text-muted-soft" key={index}>
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cobalt" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  copiedKey === "all"
                    ? "bg-success/16 text-foreground"
                    : "surface-action-secondary"
                }`}
                onClick={() => void copyToClipboard(formatMessage(displayMessage), "all")}
                type="button"
              >
                {copiedKey === "all" ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
                {copiedKey === "all" ? "Tudo copiado" : "Copiar tudo"}
              </button>
              <a
                aria-disabled={isSending || !whatsappHref}
                className={`inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition ${
                  isSending || !whatsappHref
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-cobalt/90"
                }`}
                href={whatsappHref ?? "#"}
                onClick={(event) => {
                  if (isSending || !whatsappHref) {
                    event.preventDefault();
                    return;
                  }
                  if (savedMessage?.id) {
                    void handleSend();
                  }
                }}
                rel="noopener noreferrer"
                target="_blank"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <Send size={16} aria-hidden="true" />
                )}
                Abrir no WhatsApp
              </a>
            </div>

            {!whatsappHref ? (
              <p className="mt-2 text-xs text-muted-soft">
                Cadastre um telefone valido no lead para abrir direto no WhatsApp.
              </p>
            ) : null}

            {copyFeedback ? (
              <p
                aria-live="polite"
                className={`mt-3 inline-flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm font-medium ${
                  copyFeedback.tone === "success"
                    ? "bg-success/14 text-foreground"
                    : "surface-danger"
                }`}
              >
                {copyFeedback.tone === "success" ? (
                  <CheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <AlertCircle size={16} aria-hidden="true" />
                )}
                {copyFeedback.message}
              </p>
            ) : null}

            {sendSuccess ? (
              <p className="surface-alert-success mt-3 flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm font-medium">
                <CheckCircle2 size={16} aria-hidden="true" />
                {sendSuccess}
              </p>
            ) : null}
            {sendError ? (
              <p className="surface-danger mt-3 flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm font-medium">
                <AlertCircle size={16} aria-hidden="true" />
                {sendError}
              </p>
            ) : null}

            {savedMessage ? (
              <p className="mt-3 text-xs text-muted-soft">
                Status de envio: {formatDeliveryStatus(savedMessage.delivery.status)}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function getWhatsAppHref(lead: Lead, message: GeneratedMessage) {
  const normalizedPhone = normalizePhone(lead.phone).e164;
  if (!normalizedPhone) {
    return undefined;
  }
  const phone = normalizedPhone.replace(/\D/g, "");
  const text = encodeURIComponent(formatMessage(message));
  return `https://wa.me/${phone}?text=${text}`;
}

function applyTemplateIsActive(
  template: SystemTemplate,
  current: GeneratedMessage,
  leadName: string
) {
  const content = template.content as WhatsAppTemplateContent;
  const expectedOpening = content.openingMessage?.replace("[Nome do Lead]", leadName) ?? "";
  return expectedOpening === current.openingMessage;
}

function getFirstName(name: string) {
  const [first] = name.trim().split(/\s+/);
  return first || "o lead";
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
  return [message.openingMessage, "", message.followUpMessage, "", message.objectionReply]
    .filter((line, index) => line !== "" || index % 2 === 1)
    .join("\n");
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
