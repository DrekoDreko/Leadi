"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  MessageCircle,
  Send,
  Sparkles
} from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type { Lead } from "@/data/mock";
import {
  buildFallbackWhatsAppMessage,
  buildWhatsAppStageObjective,
  getWhatsAppToneLabel,
  getWhatsAppTonePrompt,
  type WhatsAppToneValue,
  whatsappStageStrategies,
  whatsappToneOptions
} from "@/lib/whatsapp/templates";
import type {
  WhatsAppHistoryItem,
  WhatsAppListState,
  WhatsAppStage
} from "@/lib/whatsapp/types";

type WhatsAppMessage = {
  openingMessage: string;
  followUpMessage: string;
  objectionReply: string;
  complianceNotes: string[];
};

type WhatsAppGenerationResponse = {
  message?: WhatsAppMessage;
  savedMessage?: WhatsAppHistoryItem;
  error?: string;
};

export function WhatsAppWorkspace({
  leads,
  initialLeadId,
  initialMessages,
  historyMode,
  historyMessage,
  brokerageName
}: {
  leads: Lead[];
  initialLeadId: string | null;
  initialMessages: WhatsAppHistoryItem[];
  historyMode: WhatsAppListState["mode"];
  historyMessage?: string;
  brokerageName: string;
}) {
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId ?? leads[0]?.id ?? null);
  const [selectedStage, setSelectedStage] = useState<WhatsAppStage>(() =>
    mapLeadStage(
      leads.find((lead) => lead.id === initialLeadId)?.stage ?? leads[0]?.stage
    )
  );
  const [selectedTone, setSelectedTone] = useState<WhatsAppToneValue>("consultivo");
  const [messageHistory, setMessageHistory] = useState(initialMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const selectedTonePrompt = getWhatsAppTonePrompt(selectedTone);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0] ?? null,
    [leads, selectedLeadId]
  );
  const selectedHistoryItem = useMemo(
    () =>
      messageHistory.find(
        (item) =>
          item.leadId === selectedLead?.id &&
          item.stage === selectedStage &&
          item.tone === selectedTonePrompt
      ) ?? null,
    [messageHistory, selectedLead, selectedStage, selectedTonePrompt]
  );
  const visibleMessage = normalizeWhatsAppMessageBrand(
    selectedHistoryItem?.result ??
      buildFallbackWhatsAppMessage({
        brokerageName,
        lead: selectedLead,
        stage: selectedStage,
        tone: selectedTone
      }),
    brokerageName
  );
  const metrics = getWhatsAppMetrics(leads);
  const visibleHistory = useMemo(() => messageHistory.slice(0, 4), [messageHistory]);
  const hasRealLeads = leads.length > 0;

  async function generateMessage() {
    if (!selectedLead) return;

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/whatsapp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          product: selectedLead.interest || "Plano de saude empresarial",
          leadName: selectedLead.name,
          leadContext: buildLeadContext(selectedLead),
          stage: selectedStage,
          objective: buildWhatsAppStageObjective(selectedStage),
          tone: selectedTonePrompt
        })
      });

      const payload = (await response.json().catch(() => null)) as WhatsAppGenerationResponse | null;

      if (!response.ok || !payload?.message) {
        throw new Error(payload?.error ?? "Nao foi possivel gerar a mensagem.");
      }

      const nextHistoryItem =
        payload.savedMessage ??
        createOptimisticHistoryItem({
          brokerageName,
          lead: selectedLead,
          message: payload.message,
          stage: selectedStage,
          tone: selectedTonePrompt
        });

      setMessageHistory((current) => [
        nextHistoryItem,
        ...current.filter((item) => item.id !== nextHistoryItem.id)
      ]);
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

  async function copyText(key: string, message: WhatsAppMessage) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }

      await navigator.clipboard.writeText(
        formatWhatsAppMessage(normalizeWhatsAppMessageBrand(message, brokerageName))
      );
      setError("");
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((currentKey) => (currentKey === key ? "" : currentKey));
      }, 2200);
    } catch {
      setError("Nao foi possivel copiar automaticamente neste navegador.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="WhatsApp"
        title={selectedLead ? `Conversa com ${selectedLead.name}` : "Conversa com leads cadastrados"}
        description={
          selectedLead
            ? "Gere mensagens comerciais com saldo de créditos e acompanhe o historico salvo por lead."
            : "Nenhum lead real disponível no momento. Assim que o CRM tiver leads cadastrados, a conversa aparece aqui."
        }
      >
        {selectedLead ? (
          <button
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isGenerating}
            onClick={generateMessage}
            type="button"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : (
              <Send size={18} aria-hidden="true" />
            )}
            {isGenerating ? "Gerando" : "Gerar nova versão"}
          </button>
        ) : (
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            href="/dashboard/leads"
          >
            <Send size={18} aria-hidden="true" />
            Ver leads
          </Link>
        )}
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Conversas" value={metrics.conversations} note={metrics.conversationsNote} tone="blue" />
        <Metric label="Respostas" value={metrics.responses} note={metrics.responsesNote} tone="teal" />
        <Metric label="Agendados" value={metrics.scheduled} note={metrics.scheduledNote} tone="yellow" />
        <Metric label="Aguardando" value={metrics.pending} note={metrics.pendingNote} tone="dark" />
      </div>

      {historyMessage ? (
        <div
          className={`rounded-[26px] border p-4 text-sm ${
            historyMode === "supabase"
              ? "border-white/46 bg-white/34 text-ink/72"
              : "border-amber-200/70 bg-amber-50/80 text-amber-900"
          }`}
        >
          {historyMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-stretch">
        <aside className="glass rounded-[34px] p-5 h-full">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Leads recentes</h2>
            <MessageCircle size={20} aria-hidden="true" />
          </div>
          {hasRealLeads ? (
            <div className="space-y-3">
              {leads.map((lead) => {
                const selected = lead.id === selectedLead?.id;

                return (
                  <button
                    className={`block w-full rounded-[24px] p-4 text-left transition hover:-translate-y-0.5 ${
                      selected ? "bg-cobalt/10 ring-1 ring-cobalt/20" : "bg-white/42"
                    }`}
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setSelectedStage(mapLeadStage(lead.stage));
                      setError("");
                    }}
                    key={lead.id}
                    type="button"
                  >
                    <h3 className="font-semibold">{lead.name}</h3>
                    <p className="mt-1 text-sm text-ink/56">{lead.phone}</p>
                    <p className="mt-1 text-sm text-ink/56">{lead.email}</p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold">
                      <Clock3 size={15} aria-hidden="true" />
                      {lead.nextContact}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-ink/58">
              Nenhum lead real cadastrado ainda. Quando os contatos entrarem no CRM, eles
              aparecem aqui com nome, telefone e email.
            </p>
          )}
        </aside>

        <section className="glass-strong rounded-[34px] p-5 h-full">
          {selectedLead ? (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cobalt">Mensagem gerada por IA</p>
                  <h2 className="mt-2 text-xl font-semibold">{selectedLead.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/64">
                    A abordagem abaixo considera o nome do cliente, o telefone, o email, o
                    interesse e o próximo passo sugerido.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-ink/58">
                    <span className="rounded-full bg-white/58 px-3 py-1.5">{selectedLead.phone}</span>
                    <span className="rounded-full bg-white/58 px-3 py-1.5">{selectedLead.email}</span>
                    {selectedLead.city ? (
                      <span className="rounded-full bg-white/58 px-3 py-1.5">{selectedLead.city}</span>
                    ) : null}
                  </div>
                </div>
                <Sparkles className="text-lagoon" size={21} aria-hidden="true" />
              </div>

              {error ? (
                <div className="mb-4 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="mb-4 grid gap-3 rounded-[28px] border border-white/44 bg-white/28 p-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-ink/72">
                  Etapa do funil
                  <select
                    className="mt-2 w-full rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-cobalt"
                    onChange={(event) => setSelectedStage(event.target.value as WhatsAppStage)}
                    value={selectedStage}
                  >
                    {Object.entries(whatsappStageStrategies).map(([value, strategy]) => (
                      <option key={value} value={value}>
                        {strategy.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-ink/72">
                  Tom da mensagem
                  <select
                    className="mt-2 w-full rounded-full border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-cobalt"
                    onChange={(event) =>
                      setSelectedTone(event.target.value as WhatsAppToneValue)
                    }
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

              <div className="rounded-[28px] border border-white/48 bg-white/36 p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-ink/42">
                      Rascunho pronto para envio
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{selectedLead.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-ink/56">
                      <span className="rounded-full bg-white/64 px-3 py-1.5">
                        {formatWhatsAppStage(selectedStage)}
                      </span>
                      <span className="rounded-full bg-white/64 px-3 py-1.5">
                        {getWhatsAppToneLabel(selectedTone)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/90"
                    onClick={() => copyText("current-message", visibleMessage)}
                    title={copiedKey === "current-message" ? "Copiado" : "Copiar mensagem gerada"}
                    type="button"
                  >
                    {copiedKey === "current-message" ? (
                      <CheckCircle2 className="text-lagoon" size={16} aria-hidden="true" />
                    ) : (
                      <Copy size={16} aria-hidden="true" />
                    )}
                    {copiedKey === "current-message" ? "Copiado" : "Copiar texto"}
                  </button>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-ink/72">
                  {visibleMessage.openingMessage}
                </p>
                <div className="mt-4 whitespace-pre-line text-sm leading-6 text-ink/72">
                  {visibleMessage.followUpMessage}
                </div>
                <div className="mt-4 whitespace-pre-line text-sm leading-6 text-ink/72">
                  {visibleMessage.objectionReply}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isGenerating}
                    onClick={generateMessage}
                    type="button"
                  >
                    {isGenerating ? (
                      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    ) : (
                      <Send size={16} aria-hidden="true" />
                    )}
                    {isGenerating ? "Gerando" : "Gerar nova versão"}
                  </button>
                  <span className="rounded-full bg-white/64 px-4 py-2 text-sm font-semibold text-ink">
                    {selectedHistoryItem ? "Historico desta etapa" : "Modelo por etapa"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {visibleMessage.complianceNotes.map((note) => (
                  <article
                    className="rounded-[24px] border border-white/40 bg-white/34 p-4 shadow-soft"
                    key={note}
                  >
                    <h3 className="text-sm font-semibold">Nota de compliance</h3>
                    <p className="mt-3 text-sm leading-6 text-ink/68">{note}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[28px] border border-white/48 bg-white/36 p-5 shadow-soft">
              <p className="text-sm font-medium text-cobalt">Mensagem gerada por IA</p>
              <h2 className="mt-2 text-xl font-semibold">Nenhum lead selecionado</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/64">
                Cadastre ou sincronize leads reais para montar a conversa automática com nome,
                telefone e email do contato.
              </p>
              <div className="mt-5">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  href="/dashboard/leads"
                >
                  <Send size={16} aria-hidden="true" />
                  Ir para leads
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/54">
              {historyMode === "supabase" ? "Historico salvo no banco" : "Historico de demonstracao"}
            </p>
            <h2 className="mt-1 text-xl font-semibold">Ultimas mensagens de WhatsApp</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5 text-xs font-semibold text-ink/58">
            <Clock3 size={14} aria-hidden="true" />
            {visibleHistory.length} registros
          </div>
        </div>

        {visibleHistory.length ? (
          <div className="grid gap-3">
            {visibleHistory.map((item) => (
              <article
                className="rounded-[24px] border border-white/44 bg-white/36 p-4 shadow-soft"
                key={item.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-full bg-white/62 px-3 py-1 text-xs font-semibold text-ink/58">
                      {formatWhatsAppStage(item.stage)}
                    </span>
                    <h3 className="mt-3 text-sm font-semibold leading-6 text-ink/86">
                      {item.leadName}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-ink/60">
                      {formatWhatsAppDate(item.createdAt)}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink transition hover:bg-white"
                    onClick={() => copyHistoryMessage(item)}
                    title={copiedKey === `history-${item.id}` ? "Copiado" : "Copiar mensagem"}
                    type="button"
                  >
                    {copiedKey === `history-${item.id}` ? (
                      <CheckCircle2 className="text-lagoon" size={16} aria-hidden="true" />
                    ) : (
                      <Copy size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-ink/68">
                  {normalizeWhatsAppMessageBrand(item.result, brokerageName).openingMessage}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/56">
                  <span className="rounded-full bg-white/62 px-3 py-1.5">{item.product}</span>
                  <span className="rounded-full bg-white/62 px-3 py-1.5">
                    {formatWhatsAppTone(item.tone)}
                  </span>
                  {item.leadContext ? (
                    <span className="rounded-full bg-white/62 px-3 py-1.5">{item.leadContext}</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/52 bg-white/24 p-5 text-sm leading-6 text-ink/58">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} aria-hidden="true" />
              <p>
                Nenhuma mensagem salva ainda. Gere uma mensagem para criar o primeiro registro
                do histórico.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  function copyHistoryMessage(item: WhatsAppHistoryItem) {
    void copyText(`history-${item.id}`, item.result);
  }
}

function getWhatsAppMetrics(leads: Lead[]) {
  const total = leads.length;
  const responses = leads.filter((lead) => lead.lastInteraction.trim().length > 0).length;
  const scheduled = leads.filter((lead) => lead.nextContactAt).length;
  const pending = Math.max(total - scheduled, 0);

  return {
    conversations: String(total),
    conversationsNote: total > 0 ? `${total} leads no CRM` : "aguardando leads reais",
    responses: String(responses),
    responsesNote: total > 0 ? `${Math.round((responses / total) * 100)}% com retorno` : "sem base ainda",
    scheduled: String(scheduled),
    scheduledNote: scheduled > 0 ? "agenda ativa" : "sem agendamentos",
    pending: String(pending),
    pendingNote: pending > 0 ? "follow-up pendente" : "sem pendências"
  };
}

function createOptimisticHistoryItem({
  brokerageName,
  lead,
  message,
  stage,
  tone
}: {
  brokerageName: string;
  lead: Lead;
  message: WhatsAppMessage;
  stage: WhatsAppStage;
  tone: string;
}): WhatsAppHistoryItem {
  const timestamp = new Date().toISOString();
  const firstName = lead.name.split(" ")[0] ?? "Olá";
  const leadContext = buildLeadContext(lead);
  const objective = buildWhatsAppStageObjective(stage);

  return {
    id: `pending-${crypto.randomUUID()}`,
    organizationId: "pending",
    createdByProfileId: "pending",
    leadId: lead.id,
    leadName: lead.name,
    leadContext,
    stage,
    objective,
    tone,
    product: lead.interest || "Plano de saude empresarial",
    input: {
      leadId: lead.id,
      leadName: lead.name,
      brokerageName,
      leadContext,
      stage,
      objective,
      tone,
      product: lead.interest || "Plano de saude empresarial"
    },
    result: {
      openingMessage: message.openingMessage || `Olá, ${firstName}!`,
      followUpMessage: message.followUpMessage,
      objectionReply: message.objectionReply,
      complianceNotes: message.complianceNotes
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function buildLeadContext(lead: Lead) {
  return [
    lead.companyName ? `Empresa: ${lead.companyName}` : "",
    lead.city ? `Cidade: ${lead.city}` : "",
    lead.phone ? `Telefone: ${lead.phone}` : "",
    lead.email ? `Email: ${lead.email}` : "",
    lead.interest ? `Interesse: ${lead.interest}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatWhatsAppMessage(message: WhatsAppMessage) {
  return [message.openingMessage, message.followUpMessage, message.objectionReply]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeWhatsAppMessageBrand(
  message: WhatsAppMessage,
  brokerageName: string
): WhatsAppMessage {
  return {
    ...message,
    openingMessage: message.openingMessage.replaceAll("LeadHealth", brokerageName),
    followUpMessage: message.followUpMessage.replaceAll("LeadHealth", brokerageName),
    objectionReply: message.objectionReply.replaceAll("LeadHealth", brokerageName)
  };
}

function formatWhatsAppStage(stage: WhatsAppHistoryItem["stage"]) {
  switch (stage) {
    case "new":
      return "Novo lead";
    case "qualification":
      return "Qualificação";
    case "proposal":
      return "Proposta";
    case "negotiation":
      return "Negociação";
    case "won":
      return "Venda";
    case "lost":
      return "Perdido";
    default:
      return "Novo lead";
  }
}

function formatWhatsAppDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatWhatsAppTone(tone: string) {
  const option = whatsappToneOptions.find((item) => item.prompt === tone || item.label === tone);

  return option?.label ?? tone;
}

function mapLeadStage(stage: Lead["stage"] | null | undefined): WhatsAppStage {
  switch (stage) {
    case "Novo lead":
      return "new";
    case "Qualificação":
      return "qualification";
    case "Proposta":
      return "proposal";
    case "Negociação":
      return "negotiation";
    case "Venda":
      return "won";
    case "Perdido":
      return "lost";
    default:
      return "new";
  }
}
