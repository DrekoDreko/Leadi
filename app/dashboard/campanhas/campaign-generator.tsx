"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  ArrowUpRight,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { campaignDraft } from "@/data/mock";
import { getAiCreditCost } from "@/lib/ai/credit-costs";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type { ConnectedAccountsState } from "@/lib/integrations/types";
import type {
  CampaignHistoryItem,
  CampaignListState,
  CampaignTextOutput
} from "@/lib/campaigns/types";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import type { SystemTemplate, CampaignTemplateContent } from "@/lib/templates/types";

type ComplianceQuestionsOutput = {
  questions: Array<{
    question: string;
    reason: string;
    answerType: "short_text" | "single_choice" | "multiple_choice" | "number";
    reviewRequired: boolean;
    reviewReason: string;
  }>;
  complianceNotes: string[];
};

const initialForm = {
  audience: "Donos e gestores de ME, LTDA e empresas de 2 a 49 vidas",
  offer: "Analise consultiva para comparar plano empresarial",
  region: "Campinas e regiao",
  differentiator: "Atendimento rapido com comparativo objetivo entre operadoras",
  notes: "",
  creativeAssetType: "imagem",
  creativeBrief: "",
  creativeRequestMode: "enviar_arquivo",
  tone: "consultivo, direto e seguro",
  metaPageId: "",
  metaAdAccountId: "",
  metaLeadFormId: "",
  publishMode: "manual_review"
};

const formFields = [
  {
    id: "audience",
    label: "Publico",
    placeholder: "Ex.: empresas de 2 a 49 vidas"
  },
  {
    id: "offer",
    label: "Oferta",
    placeholder: "Ex.: cotacao consultiva de plano empresarial"
  },
  {
    id: "region",
    label: "Regiao",
    placeholder: "Ex.: Campinas e regiao"
  },
  {
    id: "differentiator",
    label: "Diferencial",
    placeholder: "Ex.: comparativo claro entre operadoras"
  }
] satisfies Array<{
  id: keyof Pick<typeof initialForm, "audience" | "offer" | "region" | "differentiator">;
  label: string;
  placeholder: string;
}>;

type FormState = typeof initialForm;

const answerTypeLabels: Record<
  ComplianceQuestionsOutput["questions"][number]["answerType"],
  string
> = {
  multiple_choice: "Multipla escolha",
  number: "Numero",
  short_text: "Texto curto",
  single_choice: "Escolha unica"
};

const campaignHistoryDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  year: "numeric"
});

type CampaignGeneratorProps = {
  aiBalance: number;
  connectedAccounts: ConnectedAccountsState;
  initialCampaigns: CampaignHistoryItem[];
  historyMode: CampaignListState["mode"];
  historyMessage?: string;
  systemTemplates?: SystemTemplate[];
};

export function CampaignGenerator({
  aiBalance,
  connectedAccounts,
  initialCampaigns,
  historyMessage,
  historyMode,
  systemTemplates = []
}: CampaignGeneratorProps) {
  const [form, setForm] = useState<FormState>(() => createInitialForm(connectedAccounts));
  const [currentAiBalance, setCurrentAiBalance] = useState(aiBalance);
  const [campaign, setCampaign] = useState<CampaignTextOutput | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryItem[]>(initialCampaigns);
  const [questions, setQuestions] = useState<ComplianceQuestionsOutput | null>(null);
  const [error, setError] = useState("");
  const [questionsError, setQuestionsError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [creativeFileNames, setCreativeFileNames] = useState<string[]>([]);
  const [submissionNotice, setSubmissionNotice] = useState("");
  const [publicationNotice, setPublicationNotice] = useState("");
  const metaConnection = connectedAccounts.metaConnection;
  const campaignCost = getAiCreditCost("generate_campaign_plan");
  const briefCost = getAiCreditCost("generate_creative_brief");
  const selectedMetaPage = connectedAccounts.metaPages.find(
    (page) => page.metaPageId === form.metaPageId
  );
  const selectedMetaAdAccount = connectedAccounts.metaAdAccounts.find(
    (account) => account.metaAdAccountId === form.metaAdAccountId
  );
  const selectedMetaLeadForm = connectedAccounts.metaLeadForms.find(
    (leadForm) => leadForm.metaFormId === form.metaLeadFormId
  );
  const hasMinimumMetaAssets = Boolean(metaConnection && form.metaPageId && form.metaAdAccountId);
  const publicationState = resolvePublicationState({
    hasMetaConnection: Boolean(metaConnection),
    hasMinimumMetaAssets,
    form
  });

  useEffect(() => {
    setCurrentAiBalance(aiBalance);
  }, [aiBalance]);

  const campaignTags = useMemo(
    () =>
      [
        form.region,
        "Meta Ads",
        publicationState.label,
        selectedMetaPage?.name,
        selectedMetaLeadForm?.name
      ].filter(Boolean),
    [form.region, publicationState.label, selectedMetaLeadForm?.name, selectedMetaPage?.name]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmissionNotice("");

    if (currentAiBalance < campaignCost) {
      setError("Você não possui créditos de IA suficientes para executar esta ação.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/campaigns/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          ...form,
          creativeFileNames
        })
      });
      const payload = (await response.json().catch(() => null)) as {
        campaign?: CampaignTextOutput;
        savedCampaign?: CampaignHistoryItem;
        aiBalance?: number;
        error?: string;
      } | null;

      if (!response.ok || !payload?.campaign) {
        throw new Error(payload?.error ?? "Nao foi possivel gerar a campanha.");
      }

      setCampaign(payload.campaign);
      const savedCampaign = payload.savedCampaign;
      if (savedCampaign) {
        setCampaignHistory((currentHistory) => [
          savedCampaign,
          ...currentHistory.filter((item) => item.id !== savedCampaign.id)
        ]);
      }
      if (typeof payload.aiBalance === "number") {
        setCurrentAiBalance(payload.aiBalance);
      }
      setSubmissionNotice(
        "Recebemos a solicitacao. Retornaremos com o valor e o andamento da campanha na area Validador de campanha."
      );
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError).message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateQuestions() {
    setQuestionsError("");

    if (currentAiBalance < briefCost) {
      setQuestionsError("Você não possui créditos de IA suficientes para executar esta ação.");
      return;
    }

    setIsGeneratingQuestions(true);

    try {
      const response = await fetch("/api/campaigns/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          audience: form.audience,
          offer: form.offer,
          region: form.region,
          differentiator: form.differentiator
        })
      });
      const payload = (await response.json().catch(() => null)) as {
        questions?: ComplianceQuestionsOutput;
        aiBalance?: number;
        error?: string;
      } | null;

      if (!response.ok || !payload?.questions) {
        throw new Error(payload?.error ?? "Nao foi possivel gerar perguntas.");
      }

      setQuestions(payload.questions);
      if (typeof payload.aiBalance === "number") {
        setCurrentAiBalance(payload.aiBalance);
      }
    } catch (requestError) {
      setQuestionsError(getFriendlyErrorMessage(requestError).message);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }

  async function handlePublishPausedCampaign() {
    const latestCampaign = campaignHistory[0];
    if (!latestCampaign) {
      setError("Gere e salve uma campanha antes de publicar.");
      return;
    }

    setError("");
    setPublicationNotice("");
    setIsPublishing(true);

    try {
      const response = await fetch("/api/campaigns/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          campaignId: latestCampaign.id,
          publishMode: form.publishMode
        })
      });
      const payload = (await response.json().catch(() => null)) as {
        campaign?: CampaignHistoryItem;
        attempt?: { status?: string };
        error?: string;
      } | null;

      if (!response.ok || !payload?.campaign) {
        throw new Error(payload?.error ?? "Nao foi possivel publicar a campanha.");
      }

      const publishedCampaign = payload.campaign;
      setCampaignHistory((currentHistory) => [
        publishedCampaign,
        ...currentHistory.filter((item) => item.id !== publishedCampaign.id)
      ]);

      setPublicationNotice(
        payload.attempt?.status === "skipped"
          ? "Rascunho salvo localmente. Nenhuma chamada foi enviada para a Meta."
          : "Campanha enviada para a Meta em modo pausado. O histórico foi atualizado."
      );
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError).message);
    } finally {
      setIsPublishing(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 2200);
    } catch (error) {
      setError(getFriendlyErrorMessage(error, "Nao foi possivel copiar automaticamente neste navegador.").message);
    }
  }

  function applyTemplate(template: SystemTemplate) {
    const content = template.content as CampaignTemplateContent;
    setForm((currentForm) => ({
      ...currentForm,
      audience: content.audience ?? currentForm.audience,
      offer: content.offer ?? currentForm.offer,
      region: content.region ?? currentForm.region,
      differentiator: content.differentiator ?? currentForm.differentiator,
      tone: content.tone ?? currentForm.tone,
      notes: content.notes ?? currentForm.notes
    }));
  }

  const visibleCampaign = campaign ?? {
    campaignName: campaignDraft.title,
    primaryText: campaignDraft.copy,
    headline: "Plano empresarial com analise consultiva",
    description: "Compare opcoes para a sua empresa com apoio comercial especializado.",
    callToAction: "Solicitar cotacao",
    suggestedAudience: initialForm.audience,
    variants: [
      "Compare alternativas de plano empresarial com uma abordagem consultiva.",
      "Receba uma analise objetiva para escolher o melhor caminho para sua empresa."
    ],
    complianceNotes: [
      "Modelo inicial: revise oferta, publico e regras comerciais antes de publicar."
    ]
  } satisfies CampaignTextOutput;

  const visibleQuestions = questions ?? {
    questions: [
      {
        question: "Qual e o nome da empresa e o CNPJ para contato comercial?",
        reason: "Ajuda a identificar a empresa sem coletar dado sensivel de saude.",
        answerType: "short_text",
        reviewRequired: false,
        reviewReason: ""
      },
      {
        question: "Quantas vidas a empresa pretende incluir no plano?",
        reason: "Define porte da cotacao e elegibilidade comercial.",
        answerType: "number",
        reviewRequired: false,
        reviewReason: ""
      },
      {
        question: "Qual e a cidade ou regiao da empresa?",
        reason: "Direciona operadoras e cobertura regional disponivel.",
        answerType: "short_text",
        reviewRequired: false,
        reviewReason: ""
      },
      {
        question: "Quando voce pretende receber uma cotacao ou iniciar a avaliacao?",
        reason: "Ajuda a priorizar o follow-up comercial.",
        answerType: "single_choice",
        reviewRequired: false,
        reviewReason: ""
      },
      {
        question: "Qual e o melhor canal para a equipe falar com voce?",
        reason: "Facilita contato sem pedir informacoes desnecessarias.",
        answerType: "single_choice",
        reviewRequired: false,
        reviewReason: ""
      }
    ],
    complianceNotes: [
      "Modelo inicial: evitar perguntas sobre saude, diagnosticos, idade ou atributos protegidos."
    ]
  } satisfies ComplianceQuestionsOutput;

  const visibleHistory = campaignHistory.slice(0, 4);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Criações"
        title="IA Gerador de Campanha"
        description="Crie campanhas com publico, objetivo, oferta, observacoes e apoio criativo sem sair do hub de Criações."
      >
        <button
          className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGenerating || currentAiBalance < campaignCost}
          form="campaign-generator-form"
          type="submit"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          {isGenerating
            ? "Gerando"
            : hasMinimumMetaAssets
              ? "Preparar campanha"
              : "Gerar campanha"}
        </button>
      </PageHeading>

      {currentAiBalance < campaignCost ? (
        <div className="rounded-[26px] border border-cobalt/18 bg-cobalt/8 p-4 text-sm leading-6 text-ink/68">
          Você não possui créditos de IA suficientes para executar esta ação. Adicione créditos
          ou atualize seu plano em{" "}
          <Link
            className="font-semibold text-cobalt underline underline-offset-4"
            href="/dashboard/creditos"
          >
            Créditos de IA
          </Link>{" "}
          para continuar gerando campanhas, mensagens e perguntas.
        </div>
      ) : null}

      {submissionNotice ? (
        <div className="rounded-[24px] border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-800">
          {submissionNotice}
        </div>
      ) : null}

      {publicationNotice ? (
        <div className="rounded-[24px] border border-sky-200/70 bg-sky-50/80 p-4 text-sm text-sky-800">
          {publicationNotice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Campanhas salvas"
          value={String(campaignHistory.length)}
          note={historyMode === "supabase" ? "persistidas no banco" : "modo demonstracao"}
          tone="blue"
        />
        <Metric label="Leads captados" value="128" note="+18% no mes" tone="teal" />
        <Metric label="CPL medio" value="R$ 19" note="-8% na semana" tone="yellow" />
        <Metric label="Aprovacao" value="94%" note="compliance" tone="dark" />
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <div className="min-w-0 space-y-4">
          {systemTemplates.length > 0 && (
            <div className="rounded-[28px] border border-white/50 bg-white/44 p-4">
              <p className="text-sm font-medium text-cobalt">Templates prontos</p>
              <h3 className="mt-2 text-lg font-semibold">Exemplos de campanhas</h3>
              <p className="mt-2 text-sm leading-6 text-ink/64">
                Use um exemplo pronto para agilizar a criação da sua campanha.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {systemTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="flex flex-col items-start rounded-[22px] bg-white/54 p-4 text-left transition hover:bg-white/82"
                    type="button"
                  >
                    <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cobalt">
                      {template.category}
                    </span>
                    <span className="mt-2 text-sm font-semibold text-ink">
                      {template.title}
                    </span>
                    <span className="mt-1 text-xs text-ink/54 line-clamp-2">
                      {template.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <section className="glass-strong rounded-[34px] p-5 md:p-6">
            <form
              className="grid gap-4 md:grid-cols-2"
              id="campaign-generator-form"
              onSubmit={handleSubmit}
            >
              <div className="md:col-span-2 rounded-[28px] border border-white/50 bg-white/34 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-sm font-medium text-cobalt">Conexões da campanha</p>
                    <h3 className="mt-2 text-lg font-semibold">Meta e publicação controlada</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/64">
                      O LeadHealth usa a conta Meta conectada da empresa e prepara a campanha
                      para revisão antes da publicação. Sem página e conta de anúncio selecionadas,
                      a geração fica salva como texto, sem avançar para preparo.
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                      metaConnection ? "bg-lagoon text-white" : "bg-signal text-ink"
                    }`}
                  >
                    {metaConnection ? "Meta conectada" : "Conecte a Meta"}
                  </span>
                </div>

                {metaConnection ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <DetailTile
                      label="Conta Meta"
                      value={metaConnection.metaUserName ?? "Conta conectada"}
                    />
                    <DetailTile
                      label="Saldo de IA"
                      value={
                        currentAiBalance > 0
                          ? `${currentAiBalance.toLocaleString("pt-BR")} créditos`
                          : "Sem saldo"
                      }
                    />
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-ink/62">Pagina Meta</span>
                      <select
                        className="liquid-input"
                        onChange={(event) => updateField("metaPageId", event.target.value)}
                        value={form.metaPageId}
                      >
                        <option value="">Escolha uma pagina conectada</option>
                        {connectedAccounts.metaPages.map((page) => (
                          <option key={page.id} value={page.metaPageId}>
                            {page.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-ink/62">Conta de anuncio</span>
                      <select
                        className="liquid-input"
                        onChange={(event) => updateField("metaAdAccountId", event.target.value)}
                        value={form.metaAdAccountId}
                      >
                        <option value="">Escolha uma conta de anuncio</option>
                        {connectedAccounts.metaAdAccounts.map((account) => (
                          <option key={account.id} value={account.metaAdAccountId}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-ink/62">Formulario Lead Ads</span>
                      <select
                        className="liquid-input"
                        onChange={(event) => updateField("metaLeadFormId", event.target.value)}
                        value={form.metaLeadFormId}
                      >
                        <option value="">Escolha um formulario</option>
                        {connectedAccounts.metaLeadForms.map((leadForm) => (
                          <option key={leadForm.id} value={leadForm.metaFormId}>
                            {leadForm.name} • {leadForm.pageName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-semibold text-ink/62">
                        Modo de publicação
                      </span>
                      <select
                        className="liquid-input"
                        onChange={(event) => updateField("publishMode", event.target.value)}
                        value={form.publishMode}
                      >
                        <option value="manual_review">Revisão manual antes de publicar</option>
                        <option value="draft">Criar rascunho</option>
                        <option value="scheduled">Preparar para agendar depois</option>
                        <option value="paused">Deixar pausada</option>
                      </select>
                    </label>
                    <div className="md:col-span-2 flex flex-wrap gap-2">
                      <SmallStatusChip label="Status" value={publicationState.label} tone={publicationState.tone} />
                      <SmallStatusChip
                        label="Conta"
                        value={publicationState.connectedAccountLabel}
                        tone="neutral"
                      />
                      <SmallStatusChip
                        label="Pagina"
                        value={selectedMetaPage?.name ?? "Escolha uma pagina"}
                        tone="neutral"
                      />
                      <SmallStatusChip
                        label="Conta de anuncio"
                        value={selectedMetaAdAccount?.name ?? "Escolha uma conta"}
                        tone="neutral"
                      />
                      <SmallStatusChip
                        label="Formulario"
                        value={selectedMetaLeadForm?.name ?? "Opcional"}
                        tone="neutral"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] border border-dashed border-cobalt/20 bg-white/50 p-4 text-sm leading-6 text-ink/64">
                    Conecte sua conta Meta em{" "}
                    <Link
                      className="font-semibold text-cobalt underline underline-offset-4"
                      href="/dashboard/perfil?section=empresa"
                    >
                      Perfil
                    </Link>{" "}
                    para escolher página, conta de anúncio e formulário de Lead Ads antes da revisão.
                  </div>
                )}
              </div>

              {formFields.map((field) => (
                <label className="space-y-2" htmlFor={field.id} key={field.id}>
                  <span className="text-sm font-semibold text-ink/62">{field.label}</span>
                  <input
                    className="liquid-input"
                    id={field.id}
                    maxLength={280}
                    onChange={(event) => updateField(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    required
                    value={form[field.id]}
                  />
                </label>
              ))}
              <label className="space-y-2 md:col-span-2" htmlFor="notes">
                <span className="text-sm font-semibold text-ink/62">Observacoes</span>
                <textarea
                  className="liquid-input min-h-[110px] resize-y"
                  id="notes"
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Ex.: evitar promessas fortes, reforcar atendimento consultivo e destacar foco em empresas."
                  value={form.notes}
                />
              </label>
              <label className="space-y-2 md:col-span-2" htmlFor="tone">
                <span className="text-sm font-semibold text-ink/62">Tom</span>
                <select
                  className="liquid-input"
                  id="tone"
                  onChange={(event) => updateField("tone", event.target.value)}
                  value={form.tone}
                >
                  <option value="consultivo, direto e seguro">Consultivo e direto</option>
                  <option value="profissional, objetivo e premium">Profissional premium</option>
                  <option value="humano, claro e acolhedor">Humano e claro</option>
                  <option value="educativo, pratico e confiavel">Educativo pratico</option>
                </select>
              </label>
              <div className="md:col-span-2 rounded-[28px] border border-white/50 bg-white/34 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-cobalt">Criativo</p>
                    <h3 className="mt-2 text-lg font-semibold">Arquivo ou solicitacao</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/64">
                      Carregue um criativo existente ou solicite video, arte, imagem ou outro material para esta campanha.
                    </p>
                  </div>
                  <Paperclip size={20} aria-hidden="true" />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink/62">Tipo de criativo</span>
                    <select
                      className="liquid-input"
                      onChange={(event) => updateField("creativeAssetType", event.target.value)}
                      value={form.creativeAssetType}
                    >
                      <option value="video">Video</option>
                      <option value="arte">Arte</option>
                      <option value="imagem">Imagem</option>
                      <option value="outro">Outro arquivo</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-ink/62">Como seguir</span>
                    <select
                      className="liquid-input"
                      onChange={(event) => updateField("creativeRequestMode", event.target.value)}
                      value={form.creativeRequestMode}
                    >
                      <option value="enviar_arquivo">Carregar criativo</option>
                      <option value="solicitar_criativo">Solicitar criativo</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-semibold text-ink/62">Briefing do criativo</span>
                  <textarea
                    className="liquid-input min-h-[96px] resize-y"
                    onChange={(event) => updateField("creativeBrief", event.target.value)}
                    placeholder="Ex.: imagem limpa, foco em PME, CTA para cotacao consultiva e identidade mais profissional."
                    value={form.creativeBrief}
                  />
                </label>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/78">
                  <Paperclip size={16} aria-hidden="true" />
                  Adicionar arquivo
                  <input
                    className="sr-only"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.currentTarget.files ?? []);
                      setCreativeFileNames(files.map((file) => file.name));
                    }}
                    type="file"
                  />
                </label>

                {creativeFileNames.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {creativeFileNames.map((fileName) => (
                      <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/58" key={fileName}>
                        {fileName}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </form>
            {error ? (
              <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                <p>{error}</p>
              </div>
            ) : null}
          </section>

          <section className="glass-strong rounded-[34px] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink/54">Texto sugerido</p>
                <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
                  {visibleCampaign.campaignName}
                </h2>
              </div>
              <Sparkles className="text-cobalt" size={28} aria-hidden="true" />
            </div>
            <ResultBlock
              copied={copiedKey === "primaryText"}
              label="Texto principal"
              onCopy={() => copyText("primaryText", visibleCampaign.primaryText)}
              value={visibleCampaign.primaryText}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ResultBlock
                copied={copiedKey === "headline"}
                label="Headline"
                onCopy={() => copyText("headline", visibleCampaign.headline)}
                value={visibleCampaign.headline}
              />
              <ResultBlock
                copied={copiedKey === "description"}
                label="Descricao"
                onCopy={() => copyText("description", visibleCampaign.description)}
                value={visibleCampaign.description}
              />
              <ResultBlock
                copied={copiedKey === "callToAction"}
                label="CTA"
                onCopy={() => copyText("callToAction", visibleCampaign.callToAction)}
                value={visibleCampaign.callToAction}
              />
              <ResultBlock
                copied={copiedKey === "suggestedAudience"}
                label="Publico sugerido"
                onCopy={() => copyText("suggestedAudience", visibleCampaign.suggestedAudience)}
                value={visibleCampaign.suggestedAudience}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {campaignTags.map((tag) => (
                <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Variacoes</h2>
              <FileText size={21} aria-hidden="true" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {visibleCampaign.variants.map((variant, index) => (
                <ResultBlock
                  copied={copiedKey === `variant-${index}`}
                  key={`${variant}-${index}`}
                  label={`Opcao ${index + 1}`}
                  onCopy={() => copyText(`variant-${index}`, variant)}
                  value={variant}
                />
              ))}
            </div>
          </section>

          <section className="glass-strong rounded-[34px] p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink/54">Formulario Meta</p>
                <h2 className="mt-1 text-xl font-semibold">Perguntas seguras</h2>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isGeneratingQuestions || currentAiBalance < briefCost}
                onClick={handleGenerateQuestions}
                type="button"
              >
                {isGeneratingQuestions ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <ClipboardList size={16} aria-hidden="true" />
                )}
                {isGeneratingQuestions ? "Gerando" : "Gerar perguntas"}
              </button>
            </div>

            {questionsError ? (
              <div className="mb-4 flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                <p>{questionsError}</p>
              </div>
            ) : null}

            <div className="grid gap-3">
              {visibleQuestions.questions.map((question, index) => (
                <QuestionBlock
                  answerType={answerTypeLabels[question.answerType]}
                  copied={copiedKey === `question-${index}`}
                  key={`${question.question}-${index}`}
                  onCopy={() => copyText(`question-${index}`, question.question)}
                  question={question.question}
                  reason={question.reason}
                  reviewReason={question.reviewReason}
                  reviewRequired={question.reviewRequired}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Revisao segura</h2>
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {visibleCampaign.complianceNotes.map((note) => (
                <div className="flex gap-3 rounded-[22px] bg-white/42 p-4" key={note}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-lagoon" size={18} aria-hidden="true" />
                  <p className="text-sm leading-6 text-ink/68">{note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Notas do formulario</h2>
              <ClipboardList size={20} aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {visibleQuestions.complianceNotes.map((note) => (
                <div className="flex gap-3 rounded-[22px] bg-white/42 p-4" key={note}>
                  <ShieldCheck className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
                  <p className="text-sm leading-6 text-ink/68">{note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-strong rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink/54">Publicação</p>
                <h2 className="font-semibold">Fluxo controlado</h2>
              </div>
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <div className="space-y-3 text-sm leading-6 text-ink/68">
              <p>
                O LeadHealth prepara a campanha com base nas contas conectadas. Você revisa
                antes de publicar.
              </p>
              <div className="rounded-[24px] bg-white/42 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/44">
                  Status atual
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{publicationState.label}</p>
                <p className="mt-2 text-sm text-ink/58">
                  {selectedMetaPage?.name
                    ? `Página selecionada: ${selectedMetaPage.name}.`
                    : "Selecione uma página conectada para preparar a campanha."}
                </p>
              </div>
              {!metaConnection ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white"
                  href="/dashboard/perfil?section=empresa"
                >
                  Conectar Meta
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ) : !hasMinimumMetaAssets ? (
                <p className="rounded-[20px] bg-signal/18 px-4 py-3 text-sm font-semibold text-ink">
                  Selecione uma página e uma conta de anúncio para preparar o rascunho Meta.
                </p>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isPublishing || !campaignHistory[0]}
                  onClick={handlePublishPausedCampaign}
                  type="button"
                >
                  {isPublishing ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={16} aria-hidden="true" />
                  )}
                  {form.publishMode === "draft"
                    ? "Salvar rascunho"
                    : "Enviar pausada para Meta"}
                </button>
              )}
            </div>
          </section>

          <section className="glass rounded-[34px] p-5">
            <h2 className="font-semibold">Fila criativa</h2>
            <div className="mt-5 space-y-3">
              {["Carrossel consultivo", "Video curto para empresas", "Imagem para lead form"].map((item, index) => (
                <div className="rounded-[24px] bg-white/42 p-4" key={item}>
                  <p className="text-sm text-ink/52">Peca {index + 1}</p>
                  <h3 className="mt-1 font-semibold">{item}</h3>
                  <span className="mt-4 inline-flex rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink">
                    aguardando briefing
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-strong rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink/54">Historico salvo</p>
                <h2 className="font-semibold">Ultimas campanhas</h2>
              </div>
              <Clock3 size={20} aria-hidden="true" />
            </div>

            {visibleHistory.length ? (
              <div className="space-y-3">
                {visibleHistory.map((item) => (
                  <article
                    className="rounded-[24px] border border-white/44 bg-white/36 p-4 shadow-soft"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rounded-full bg-white/62 px-3 py-1 text-xs font-semibold text-ink/58">
                          {formatCampaignStatus(item.status, item.publicationStatus)}
                        </span>
                        <h3 className="mt-3 text-sm font-semibold leading-6 text-ink/86">
                          {item.campaignName}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-ink/60">{item.region}</p>
                      </div>
                      <button
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink transition hover:bg-white"
                        onClick={() => copyText(`history-${item.id}`, item.result.primaryText)}
                        title={copiedKey === `history-${item.id}` ? "Copiado" : "Copiar campanha"}
                        type="button"
                      >
                        {copiedKey === `history-${item.id}` ? (
                          <CheckCircle2 size={16} className="text-lagoon" aria-hidden="true" />
                        ) : (
                          <Copy size={16} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/68">{item.result.primaryText}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/56">
                      <span className="rounded-full bg-white/62 px-3 py-1.5">{item.input.audience}</span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        {formatCampaignDate(item.createdAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-ink/58">
                Nenhuma campanha salva ainda. Gere uma campanha para criar o primeiro registro.
              </p>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function ResultBlock({
  label,
  value,
  onCopy,
  copied
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <article className="rounded-[24px] border border-white/44 bg-white/36 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-ink/42">{label}</p>
          <p className="mt-2 text-sm leading-6 text-ink/76">{value}</p>
        </div>
        <button
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink transition hover:bg-white"
          onClick={onCopy}
          title={copied ? "Copiado" : `Copiar ${label.toLowerCase()}`}
          type="button"
        >
          {copied ? (
            <CheckCircle2 size={16} className="text-lagoon" aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}

function QuestionBlock({
  answerType,
  copied,
  onCopy,
  question,
  reason,
  reviewReason,
  reviewRequired
}: {
  answerType: string;
  copied: boolean;
  onCopy: () => void;
  question: string;
  reason: string;
  reviewReason: string;
  reviewRequired: boolean;
}) {
  return (
    <article className="rounded-[24px] border border-white/44 bg-white/36 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="rounded-full bg-white/62 px-3 py-1 text-xs font-semibold text-ink/58">
            {answerType}
          </span>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/84">{question}</p>
        </div>
        <button
          aria-label="Copiar pergunta"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink transition hover:bg-white"
          onClick={onCopy}
          title={copied ? "Copiado" : "Copiar pergunta"}
          type="button"
        >
          {copied ? (
            <CheckCircle2 size={16} className="text-lagoon" aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/66">{reason}</p>
      {reviewRequired ? (
        <p className="mt-3 rounded-[18px] bg-yellow-50/80 px-3 py-2 text-xs font-medium text-yellow-900">
          Revisao manual: {reviewReason}
        </p>
      ) : null}
    </article>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white/44 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/44">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function SmallStatusChip({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "neutral" | "blue" | "yellow" | "teal" | "dark";
}) {
  const toneClasses = {
    neutral: "bg-white/62 text-ink/72",
    blue: "bg-cobalt text-white",
    yellow: "bg-signal text-ink",
    teal: "bg-lagoon text-white",
    dark: "bg-ink text-white"
  }[tone];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${toneClasses}`}>
      <span className="uppercase tracking-[0.14em] text-[10px] opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function createInitialForm(connectedAccounts: ConnectedAccountsState): FormState {
  return {
    ...initialForm,
    metaPageId: connectedAccounts.metaPages[0]?.metaPageId ?? "",
    metaAdAccountId: connectedAccounts.metaAdAccounts[0]?.metaAdAccountId ?? "",
    metaLeadFormId: connectedAccounts.metaLeadForms[0]?.metaFormId ?? "",
    publishMode: connectedAccounts.metaConnection ? "manual_review" : "manual_review"
  };
}

function resolvePublicationState({
  hasMetaConnection,
  hasMinimumMetaAssets,
  form
}: {
  hasMetaConnection: boolean;
  hasMinimumMetaAssets: boolean;
  form: FormState;
}) {
  if (!hasMetaConnection) {
    return {
      label: "Sem Meta conectada",
      tone: "yellow" as const,
      connectedAccountLabel: "Conecte sua conta na Empresa"
    };
  }

  if (!hasMinimumMetaAssets) {
    return {
      label: "Aguardando ativos",
      tone: "yellow" as const,
      connectedAccountLabel: "Escolha página e conta"
    };
  }

  if (form.publishMode === "draft") {
    return {
      label: "Rascunho preparado",
      tone: "blue" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  if (form.publishMode === "paused") {
    return {
      label: "Pausada",
      tone: "dark" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  if (form.publishMode === "scheduled") {
    return {
      label: "Pronta para agendar",
      tone: "teal" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  return {
    label: "Aguardando revisão",
    tone: "yellow" as const,
    connectedAccountLabel: "Conta Meta pronta"
  };
}

function formatCampaignStatus(
  status: CampaignHistoryItem["status"],
  publicationStatus?: CampaignHistoryItem["publicationStatus"]
) {
  const baseLabel = status === "archived" ? "Arquivada" : "Gerada";

  if (!publicationStatus) {
    return baseLabel;
  }

  const publicationLabel = {
    not_connected: "Sem Meta",
    ready_to_prepare: "Pronta para preparar",
    draft_created: "Rascunho criado",
    pending_review: "Em revisão",
    published: "Publicada",
    paused: "Pausada",
    failed: "Falhou"
  }[publicationStatus];

  return `${baseLabel} • ${publicationLabel}`;
}

function formatCampaignDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : campaignHistoryDateFormatter.format(date);
}
