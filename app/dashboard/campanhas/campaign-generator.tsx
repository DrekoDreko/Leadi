"use client";

import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileImage,
  FileText,
  ImagePlus,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Upload,
  X
} from "lucide-react";
import { systemTemplatesFallback } from "@/data/system-templates";
import { getAiCreditCost } from "@/lib/ai/credit-costs";
import { CREATIVE_REQUEST_ATTACHMENT_ACCEPT } from "@/lib/creative-requests/attachments";
import type { ConnectedAccountsState } from "@/lib/integrations/types";
import type {
  CampaignListState,
  CampaignPublishMode,
  CampaignTextOutput
} from "@/lib/campaigns/types";
import { getFriendlyErrorMessage } from "@/lib/utils/error-handler";
import type { CampaignTemplateContent, SystemTemplate } from "@/lib/templates/types";
import { reviewTextLocally, type LocalComplianceReview } from "@/lib/openai/compliance-guardrails";

export type PublishMode = CampaignPublishMode;
export type CreativeMode = "solicitar_criativo" | "enviar_arquivo";
export type CreativeType = "arte_estatica" | "video" | "imagem_anuncio" | "carrossel";
export type RegionTag = string;

export type CampaignTemplate = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  audience: string;
  offer: string;
  regions: RegionTag[];
  differential: string;
  objections: string;
  contractType: string;
  notes: string;
  tone: ToneValue;
};

type ToneValue =
  | "Consultivo e direto"
  | "Humano e claro"
  | "Profissional e objetivo"
  | "Educativo e simples";

type CampaignFormState = {
  selectedTemplateId: string;
  profileId: string;
  businessId: string;
  pageId: string;
  adAccountId: string;
  leadFormId: string;
  aiCredits: number;
  audience: string;
  offer: string;
  regions: RegionTag[];
  differential: string;
  objections: string;
  contractType: string;
  notes: string;
  adNotes: string;
  tone: ToneValue;
  publishMode: PublishMode;
  creativeMode: CreativeMode;
  creativeType: CreativeType;
  creativeObjective: string;
  creativeNotes: string;
  creativeBriefing: string;
  uploadedFiles: string[];
};

type DirtyFields = Partial<Record<keyof CampaignFormState, boolean>>;

const toneOptions: ToneValue[] = [
  "Consultivo e direto",
  "Humano e claro",
  "Profissional e objetivo",
  "Educativo e simples"
];

const publishModeOptions: Array<{ value: PublishMode; title: string; description: string }> = [
  {
    value: "manual_review",
    title: "Revisão manual na Leadi (Não publicar na Meta)",
    description: "A IA prepara a estrutura e salva na Leadi. A publicação na Meta dependerá de ação manual."
  },
  {
    value: "draft",
    title: "Criar anúncio",
    description: "Gera a estrutura da campanha/anúncio conforme as conexões selecionadas."
  },
  {
    value: "scheduled",
    title: "Preparar para agendar depois",
    description: "Deixa a campanha preparada para agendamento posterior."
  },
  {
    value: "paused",
    title: "Publicar pausada na Meta",
    description:
      "Prepara a campanha com os ativos escolhidos e deixa o envio pronto para subir em estado pausado, sem ativar a veiculação."
  }
];

const creativeTypes: Array<{ value: CreativeType; label: string }> = [
  { value: "arte_estatica", label: "Arte estática" },
  { value: "video", label: "Vídeo" },
  { value: "imagem_anuncio", label: "Imagem para anúncio" },
  { value: "carrossel", label: "Carrossel" }
];

const campaignFlowSteps = [
  {
    number: 1,
    title: "Exemplos seguros",
    description: "Escolha uma base para começar com mais velocidade."
  },
  {
    number: 2,
    title: "Conexões Meta",
    description: "Defina conta, página, anúncio e formulário."
  },
  {
    number: 3,
    title: "Público e oferta",
    description: "Direcione a IA com contexto comercial claro."
  },
  {
    number: 4,
    title: "Tom e observações",
    description: "Ajuste nuances da mensagem e restrições."
  },
  {
    number: 5,
    title: "Publicação",
    description: "Escolha como a campanha será preparada."
  },
  {
    number: 6,
    title: "Criativo",
    description: "Envie a peça ou peça uma criação guiada."
  },
  {
    number: 7,
    title: "Resumo final",
    description: "Revise tudo antes de disparar a geração."
  }
] as const;

const validToneValues = new Set<ToneValue>([
  "Consultivo e direto",
  "Humano e claro",
  "Profissional e objetivo",
  "Educativo e simples"
]);

function normalizeTone(value: string): ToneValue {
  return validToneValues.has(value as ToneValue) ? (value as ToneValue) : "Consultivo e direto";
}

function getCampaignTemplateTags(template: SystemTemplate, content: CampaignTemplateContent) {
  switch (template.category) {
    case "MEI consultivo":
      return ["MEI", "CNPJ", "Elegibilidade"];
    case "Reajuste":
      return ["Reajuste", "Comparativo", "Rede"];
    case "Rede hospitalar":
      return ["Rede", "Hospitais", "Comparativo"];
    case "Pequena equipe":
      return ["Equipe", "Benefício", "Empresarial"];
    case "Elegibilidade":
      return ["Elegibilidade", "Dependentes", "Documentação"];
    case "Primeira contratação":
      return ["Primeira contratação", "CNPJ", "Planejamento"];
    default:
      return [template.category, normalizeTone(content.tone)];
  }
}

function getCampaignTemplateCommercialContext(template: SystemTemplate) {
  switch (template.category) {
    case "MEI consultivo":
      return {
        objections: "Receio de não ter tempo de CNPJ suficiente ou de a contratação não se encaixar nas regras.",
        contractType: "Empresarial (MEI)"
      };
    case "Reajuste":
      return {
        objections: "Medo de trocar e enfrentar novas carências ou perder uma rede importante.",
        contractType: "Empresarial (PME)"
      };
    case "Rede hospitalar":
      return {
        objections: "Dúvida sobre qual operadora atende melhor a rede e os hospitais desejados.",
        contractType: "Empresarial e Adesão"
      };
    case "Pequena equipe":
      return {
        objections: "Percepção de custo alto por vida e receio de burocracia para implantar o benefício.",
        contractType: "Empresarial (PME)"
      };
    case "Elegibilidade":
      return {
        objections: "Insegurança sobre quem pode entrar no contrato e quais documentos serão exigidos.",
        contractType: "Empresarial"
      };
    case "Primeira contratação":
      return {
        objections: "Falta de clareza sobre número mínimo de vidas, documentação e próximos passos da contratação.",
        contractType: "Empresarial (PME e MEI)"
      };
    default:
      return {
        objections: "Receio com carências, reajustes e aderência da rede ao uso da empresa.",
        contractType: "Empresarial"
      };
  }
}

function resolveCampaignTemplates(systemTemplates?: SystemTemplate[]): CampaignTemplate[] {
  const templateSource =
    systemTemplates?.length
      ? systemTemplates
      : systemTemplatesFallback.filter((template) => template.templateType === "campaign");

  return templateSource
    .filter((template): template is SystemTemplate & { content: CampaignTemplateContent } => {
      return (
        template.templateType === "campaign" &&
        typeof template.content === "object" &&
        template.content !== null &&
        "audience" in template.content &&
        "offer" in template.content &&
        "region" in template.content &&
        "differentiator" in template.content &&
        "tone" in template.content &&
        "notes" in template.content
      );
    })
    .map((template) => {
      const content = template.content;
      const commercialContext = getCampaignTemplateCommercialContext(template);
      const regions = content.region
        .split(",")
        .map((region) => region.trim())
        .filter(Boolean);

      return {
        id: template.id,
        title: template.title,
        description: template.description,
        tags: getCampaignTemplateTags(template, content),
        audience: content.audience,
        offer: content.offer,
        regions: regions.length ? regions : ["Região não informada"],
        differential: content.differentiator,
        objections: commercialContext.objections,
        contractType: commercialContext.contractType,
        notes: content.notes,
        tone: normalizeTone(content.tone)
      };
    });
}

function getMetaPreparationItems(
  form: CampaignFormState,
  connectedAccounts: ConnectedAccountsState
) {
  const pageName = connectedAccounts.metaPages.find((page) => page.metaPageId === form.pageId)?.name;
  const adAccountName = connectedAccounts.metaAdAccounts.find(
    (account) => account.metaAdAccountId === form.adAccountId
  )?.name;
  const leadFormName = connectedAccounts.metaLeadForms.find(
    (leadForm) => leadForm.metaFormId === form.leadFormId
  )?.name;

  return [
    {
      label: "Pagina",
      value: pageName ?? "Nao selecionada",
      ready: Boolean(form.pageId && pageName)
    },
    {
      label: "Conta de anuncio",
      value: adAccountName ?? "Nao selecionada",
      ready: Boolean(form.adAccountId && adAccountName)
    },
    {
      label: "Formulario de lead",
      value: leadFormName ?? "Nao selecionado",
      ready: Boolean(form.leadFormId && leadFormName)
    }
  ];
}

function buildCampaignSubmissionNotice(
  form: CampaignFormState,
  connectedAccounts: ConnectedAccountsState
) {
  if (form.publishMode === "manual_review") {
    return "Campanha gerada na Leadi para revisao manual. A equipe pode revisar os textos e decidir depois se vai publicar na Meta.";
  }

  if (form.publishMode === "paused") {
    const preparedTargets = getMetaPreparationItems(form, connectedAccounts)
      .filter((item) => item.ready)
      .map((item) => `${item.label}: ${item.value}`);

    if (preparedTargets.length > 0) {
      return `Campanha gerada e preparada na Leadi para publicacao pausada. Itens vinculados para a Meta: ${preparedTargets.join(", ")}. A ativacao continua manual.`;
    }

    return "Campanha gerada na Leadi com modo de publicacao pausada. Antes de enviar para a Meta, revise os ativos que ainda faltam vincular.";
  }

  return "Recebemos a solicitacao. Retornaremos com o valor e o andamento da campanha na area Validador de campanha.";
}

function formatMetricNumber(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function CampaignStatCard({
  accent,
  label,
  note,
  value
}: {
  accent: "blue" | "teal" | "yellow" | "dark";
  label: string;
  note: string;
  value: string;
}) {
  const cardClass = {
    blue: "border-cobalt/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(236,242,255,0.9))]",
    teal: "border-lagoon/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(236,251,247,0.9))]",
    yellow: "border-signal/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,249,232,0.92))]",
    dark: "border-ink/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,244,251,0.92))]"
  }[accent];

  const noteClass = {
    blue: "bg-cobalt text-white",
    teal: "bg-lagoon text-white",
    yellow: "bg-signal text-ink dark:text-cloud",
    dark: "bg-ink text-cloud"
  }[accent];

  return (
    <article className={`min-h-[150px] rounded-[28px] border p-5 shadow-[0_18px_44px_rgba(18,23,33,0.06)] ${cardClass}`}>
      <p className="text-sm text-ink/54">{label}</p>
      <div className="mt-3 flex min-h-[96px] flex-col justify-between gap-3">
        <strong className="text-4xl font-semibold leading-none text-ink">{value}</strong>
        <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${noteClass}`}>
          {note}
        </span>
      </div>
    </article>
  );
}

function CampaignStatsGrid({
  campaignCost,
  leadsCapturedCount,
  publishedAdsCount,
  totalSpentCredits
}: {
  campaignCost: number;
  leadsCapturedCount: number;
  publishedAdsCount: number;
  totalSpentCredits: number;
}) {
  const spentPerLead = leadsCapturedCount > 0 ? totalSpentCredits / leadsCapturedCount : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <CampaignStatCard
        accent="blue"
        label="Anúncios publicados"
        note="publicados na conta"
        value={formatMetricNumber(publishedAdsCount)}
      />
      <CampaignStatCard
        accent="teal"
        label="Leads captados"
        note="leads no CRM"
        value={formatMetricNumber(leadsCapturedCount)}
      />
      <CampaignStatCard
        accent="yellow"
        label="Valor gasto por lead"
        note="créditos por lead"
        value={formatMetricNumber(spentPerLead, 1)}
      />
      <CampaignStatCard
        accent="dark"
        label="Créditos de geração de anúncio"
        note="por campanha"
        value={formatMetricNumber(campaignCost)}
      />
    </div>
  );
}

type CampaignGeneratorProps = {
  aiBalance: number;
  connectedAccounts: ConnectedAccountsState;
  historyMode: CampaignListState["mode"];
  historyMessage?: string;
  leadsCapturedCount: number;
  publishedAdsCount: number;
  totalSpentCredits: number;
  systemTemplates?: SystemTemplate[];
};

export function CampaignGenerator({
  aiBalance,
  connectedAccounts,
  historyMessage,
  historyMode,
  leadsCapturedCount,
  publishedAdsCount,
  systemTemplates,
  totalSpentCredits
}: CampaignGeneratorProps) {
  const [form, setForm] = useState<CampaignFormState>(() =>
    createInitialForm(connectedAccounts, aiBalance)
  );
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [dirtyFields, setDirtyFields] = useState<DirtyFields>({});
  const [openStep, setOpenStep] = useState(1);
  const [currentAiBalance, setCurrentAiBalance] = useState(aiBalance);
  const [error, setError] = useState("");
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [templateNotice, setTemplateNotice] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const [submissionNotice, setSubmissionNotice] = useState("");
  const metaConnection = connectedAccounts.metaConnection;
  const campaignCost = getAiCreditCost("generate_campaign_plan");
  const campaignTemplates = resolveCampaignTemplates(systemTemplates);
  const selectedTemplate = campaignTemplates.find((template) => template.id === form.selectedTemplateId);
  const hasMinimumMetaAssets = Boolean(metaConnection && form.pageId && form.adAccountId);
  const publicationState = resolvePublicationState({
    hasMetaConnection: Boolean(metaConnection),
    hasMinimumMetaAssets,
    publishMode: form.publishMode
  });
  const campaignTextContent = [
    form.audience,
    form.offer,
    form.regions.join(", "),
    form.differential,
    form.objections,
    form.contractType,
    form.notes,
    form.adNotes,
    form.creativeNotes,
    form.creativeBriefing
  ].filter(Boolean).join(" ");
  const complianceReview = reviewTextLocally(campaignTextContent);

  useEffect(() => {
    setCurrentAiBalance(aiBalance);
    setForm((currentForm) => ({ ...currentForm, aiCredits: aiBalance }));
  }, [aiBalance]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmissionNotice("");
    setDraftNotice("");

    const nextValidationMessages = validateForm(form);
    setValidationMessages(nextValidationMessages);

    if (nextValidationMessages.length > 0) {
      setOpenStep(7);
      return;
    }

    if (currentAiBalance < campaignCost) {
      setError("Você não possui créditos de IA suficientes para executar esta ação.");
      return;
    }

    try {
      const response = await fetch("/api/campaigns/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify(buildCampaignRequestPayload(form))
      });
      const payload = (await response.json().catch(() => null)) as {
        campaign?: CampaignTextOutput;
        aiBalance?: number;
        error?: string;
      } | null;

      if (!response.ok || !payload?.campaign) {
        throw new Error(payload?.error ?? "Nao foi possivel gerar a campanha.");
      }
      if (typeof payload.aiBalance === "number") {
        setCurrentAiBalance(payload.aiBalance);
        setForm((currentForm) => ({ ...currentForm, aiCredits: payload.aiBalance ?? currentForm.aiCredits }));
      }
      setCompletedSteps(campaignFlowSteps.map((step) => step.number));
      setSubmissionNotice(buildCampaignSubmissionNotice(form, connectedAccounts));
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError).message);
    }
  }

  function completeStep(step: number) {
    setCompletedSteps((currentSteps) => {
      if (currentSteps.includes(step)) return currentSteps;
      return [...currentSteps, step].sort((left, right) => left - right);
    });
  }

  function advanceFromStep(step: number, nextStep: number) {
    completeStep(step);
    setOpenStep(nextStep);
  }

  function updateField<K extends keyof CampaignFormState>(
    field: K,
    value: CampaignFormState[K],
    markDirty = true
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    if (markDirty) {
      setDirtyFields((currentFields) => ({ ...currentFields, [field]: true }));
    }
  }

  function applyTemplate(template: CampaignTemplate) {
    let preservedFields = 0;

    setForm((currentForm) => {
      const nextForm = { ...currentForm, selectedTemplateId: template.id };

      const setFromTemplate = <K extends keyof CampaignFormState>(
        field: K,
        value: CampaignFormState[K]
      ) => {
        if (dirtyFields[field]) {
          preservedFields += 1;
          return;
        }
        nextForm[field] = value;
      };

      setFromTemplate("audience", template.audience);
      setFromTemplate("offer", template.offer);
      setFromTemplate("regions", template.regions);
      setFromTemplate("differential", template.differential);
      setFromTemplate("objections", template.objections);
      setFromTemplate("contractType", template.contractType);
      setFromTemplate("notes", template.notes);
      setFromTemplate("tone", template.tone);

      return nextForm;
    });

    setTemplateNotice(
      preservedFields
        ? "Exemplo selecionado. Mantive os campos que você já tinha editado manualmente."
        : "Exemplo selecionado. Os campos das próximas etapas foram preenchidos automaticamente."
    );
    advanceFromStep(1, 2);
  }

  function handleSaveDraft() {
    const nextValidationMessages = validateForm(form);
    setValidationMessages(nextValidationMessages);

    if (nextValidationMessages.length > 0) {
      setDraftNotice("Revise os campos destacados antes de salvar o rascunho.");
      return;
    }

    // TODO: Persistir rascunho sem gerar campanha quando existir endpoint dedicado.
    setDraftNotice("Rascunho simulado salvo nesta sessão. A persistência real depende de backend dedicado.");
  }

  return (
    <div className="space-y-5 pb-4">
      <CampaignHero />

      {currentAiBalance <= 0 ? (
        <div className="space-y-4">
          <div className="rounded-[28px] border border-cobalt/18 bg-cobalt/8 p-5 text-sm leading-6 text-ink/72 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 shrink-0 text-cobalt" size={20} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">Créditos de IA insuficientes</p>
                  <p className="mt-1">
                    Você pode navegar e preparar a campanha, mas a geração final depende de créditos disponíveis.
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/72 px-4 py-2.5 text-sm font-semibold text-cobalt transition hover:bg-white"
                href="/dashboard/perfil/creditos"
              >
                Adicionar créditos
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <CampaignStatsGrid
            campaignCost={campaignCost}
            leadsCapturedCount={leadsCapturedCount}
            publishedAdsCount={publishedAdsCount}
            totalSpentCredits={totalSpentCredits}
          />
        </div>
      ) : null}

      {submissionNotice ? <Notice tone="success" message={submissionNotice} /> : null}
      {draftNotice ? <Notice tone="info" message={draftNotice} /> : null}

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

      <section className="space-y-4">
        <form className="space-y-4" id="campaign-generator-form" onSubmit={handleSubmit}>
          <CampaignStepCard
            current={openStep === 1}
            description="Escolha um exemplo seguro para começar mais rápido."
            done={completedSteps.includes(1)}
            icon={<Sparkles size={18} aria-hidden="true" />}
            number={1}
            onAdvance={() => advanceFromStep(1, 2)}
            onToggle={() => setOpenStep(openStep === 1 ? 0 : 1)}
            title="Primeiro passo: exemplos de campanha"
          >
            <CampaignTemplateSelector
              onSelect={applyTemplate}
              selectedTemplateId={form.selectedTemplateId}
              templates={campaignTemplates}
            />
            {templateNotice ? (
              <p className="mt-4 rounded-[20px] bg-cobalt/8 px-4 py-3 text-sm font-semibold text-cobalt">
                {templateNotice}
              </p>
            ) : null}
          </CampaignStepCard>

          <CampaignStepCard
            current={openStep === 2}
            description="Confirme onde a campanha será criada e quais ativos da Meta serão usados."
            done={completedSteps.includes(2)}
            icon={<ShieldCheck size={18} aria-hidden="true" />}
            number={2}
            onAdvance={() => advanceFromStep(2, 3)}
            onToggle={() => setOpenStep(openStep === 2 ? 0 : 2)}
            title="Conexões da campanha"
          >
            <CampaignConnectionsStep
              connectedAccounts={connectedAccounts}
              currentAiBalance={currentAiBalance}
              form={form}
              metaConnection={metaConnection}
              onChange={updateField}
              publicationStateLabel={publicationState.label}
              publicationStateTone={publicationState.tone}
            />
          </CampaignStepCard>

          <CampaignStepCard
            current={openStep === 3}
            description="Defina quem a campanha deve alcançar e qual proposta será usada pela IA."
            done={completedSteps.includes(3)}
            icon={<ClipboardList size={18} aria-hidden="true" />}
            number={3}
            onAdvance={() => advanceFromStep(3, 4)}
            onToggle={() => setOpenStep(openStep === 3 ? 0 : 3)}
            title="Público, oferta e região"
          >
            <CampaignAudienceStep form={form} onChange={updateField} />
          </CampaignStepCard>

          <CampaignStepCard
            current={openStep === 4}
            description="Adicione direcionamentos específicos e escolha como a campanha deve se comunicar."
            done={completedSteps.includes(4)}
            icon={<FileText size={18} aria-hidden="true" />}
            number={4}
            onAdvance={() => advanceFromStep(4, 5)}
            onToggle={() => setOpenStep(openStep === 4 ? 0 : 4)}
            title="Observações e tom da mensagem"
          >
            <CampaignToneStep form={form} onChange={updateField} />
          </CampaignStepCard>

          <CampaignStepCard
            current={openStep === 5}
            description="Escolha como a campanha será preparada após a geração."
            done={completedSteps.includes(5)}
            icon={<ShieldCheck size={18} aria-hidden="true" />}
            number={5}
            onAdvance={() => advanceFromStep(5, 6)}
            onToggle={() => setOpenStep(openStep === 5 ? 0 : 5)}
            title="Modo de publicação"
          >
            <CampaignPublishModeStep form={form} onChange={updateField} />
          </CampaignStepCard>

          <CampaignStepCard
            current={openStep === 6}
            description="Arquivo ou solicitação: carregue um criativo existente ou solicite uma arte/vídeo para esta campanha."
            done={completedSteps.includes(6)}
            featured
            icon={<ImagePlus size={18} aria-hidden="true" />}
            number={6}
            onAdvance={() => advanceFromStep(6, 7)}
            onToggle={() => setOpenStep(openStep === 6 ? 0 : 6)}
            title="Criativo"
          >
            <CampaignCreativeStep form={form} onChange={updateField} />
          </CampaignStepCard>

          <CampaignStepCard
            current={openStep === 7}
            description="Revise as informações antes de enviar."
            done={completedSteps.includes(7)}
            icon={<CheckCircle2 size={18} aria-hidden="true" />}
            number={7}
            onToggle={() => setOpenStep(openStep === 7 ? 0 : 7)}
            title="Resumo da campanha"
          >
            <CampaignSummaryStep
              connectedAccounts={connectedAccounts}
              complianceReview={complianceReview}
              form={form}
              onSaveDraft={handleSaveDraft}
              selectedTemplate={selectedTemplate}
              validationMessages={validationMessages}
            />
          </CampaignStepCard>

          {error ? (
            <div className="flex items-start gap-3 rounded-[24px] border border-red-200/70 bg-red-50/70 p-4 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}

function CampaignHero() {
  return (
    <section className="campaign-liquid-hero relative overflow-hidden rounded-[38px] border border-white/32 p-5 text-white shadow-[0_36px_120px_rgba(10,18,39,0.34)] md:p-6 xl:p-7">
      <div
        aria-hidden="true"
        className="campaign-liquid-glow absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="campaign-liquid-grid absolute inset-0"
      />

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_300px]">
        <div>
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white md:text-[2.85rem]">
            Crie anúncios com IA, do briefing à publicação, sem começar do zero.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/74 md:text-[15px]">
            A Leadi transforma público, oferta, região e diferenciais em campanhas estruturadas,
            com textos prontos para revisar e preparar para o Meta com mais clareza e controle.
          </p>
        </div>

      </div>
    </section>
  );
}

function CampaignStepCard({
  children,
  current,
  description,
  done,
  featured = false,
  icon,
  number,
  onAdvance,
  onToggle,
  title
}: {
  children: React.ReactNode;
  current: boolean;
  description: string;
  done: boolean;
  featured?: boolean;
  icon: React.ReactNode;
  number: number;
  onAdvance?: () => void;
  onToggle: () => void;
  title: string;
}) {
  const open = current;

  return (
    <section
      className={`group relative overflow-hidden rounded-[34px] border p-0 shadow-[0_24px_72px_rgba(18,23,33,0.08)] transition duration-200 ${
        featured
          ? "border-cobalt/28 bg-[linear-gradient(135deg,rgba(52,98,238,0.18),rgba(255,255,255,0.82)_40%,rgba(74,145,168,0.18))]"
          : current
            ? "border-cobalt/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(240,246,255,0.84))]"
            : done
              ? "border-emerald-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(236,253,245,0.72))]"
              : "border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.48))]"
      } backdrop-blur-2xl`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/82 to-transparent"
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${
          current
            ? "bg-[radial-gradient(circle_at_top_right,rgba(52,98,238,0.12),transparent_30%)]"
            : done
              ? "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%)]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.56),transparent_24%)]"
        }`}
      />
      <button
        aria-expanded={current}
        className="relative flex w-full items-start justify-between gap-4 p-5 text-left md:p-6"
        onClick={onToggle}
        type="button"
      >
        <div className="flex min-w-0 gap-4">
          <span
            className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-[0_16px_40px_rgba(18,23,33,0.08)] ${
              done
                ? "bg-[linear-gradient(135deg,#10b981,#34d399)] text-white"
                : current
                  ? "bg-[linear-gradient(135deg,#3462EE,#4A91A8)] text-white"
                  : "bg-white/78 text-ink/58"
            }`}
          >
            {done ? <CheckCircle2 size={18} aria-hidden="true" /> : number}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
                {icon}
                Etapa {number}
              </span>
              {current ? (
                <span className="rounded-full bg-cobalt/10 px-2.5 py-1 text-xs font-semibold text-cobalt">
                  Em andamento
                </span>
              ) : done ? (
                <span className="rounded-full bg-lagoon/12 px-2.5 py-1 text-xs font-semibold text-lagoon">
                  Concluída
                </span>
              ) : (
                <span className="rounded-full bg-white/66 px-2.5 py-1 text-xs font-semibold text-ink/48">
                  Aguardando avanço
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-ink md:text-2xl">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/64">{description}</p>
          </div>
        </div>
        <span
          className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-[0_12px_28px_rgba(18,23,33,0.08)] transition ${
            current
              ? "border-cobalt/22 bg-cobalt/10 text-cobalt"
              : "border-white/62 bg-white/78 text-ink/52 group-hover:bg-white"
          }`}
        >
          <ChevronDown
            className={`transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${current ? "rotate-180" : ""}`}
            size={18}
            aria-hidden="true"
          />
        </span>
      </button>
      <div
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[grid-template-rows,opacity,transform] ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        style={{ pointerEvents: open ? "auto" : "none" }}
      >
        <div
          className={`overflow-hidden transition-[transform,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-y-0 blur-0" : "-translate-y-2 blur-[1px]"
          }`}
        >
          <div className="relative border-t border-white/54 px-5 pb-5 pt-4 md:px-6 md:pb-6">
            {children}
            {onAdvance ? (
              <div className="mt-5 flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2d5bf0,#4A91A8)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(52,98,238,0.24)] transition hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50"
                  onClick={onAdvance}
                  type="button"
                >
                  Continuar fluxo
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CampaignTemplateSelector({
  onSelect,
  selectedTemplateId,
  templates
}: {
  onSelect: (template: CampaignTemplate) => void;
  selectedTemplateId: string;
  templates: CampaignTemplate[];
}) {
  return (
    <div>
      <div className="rounded-[26px] border border-cobalt/12 bg-[linear-gradient(135deg,rgba(52,98,238,0.08),rgba(255,255,255,0.84)_58%,rgba(74,145,168,0.08))] p-4 text-sm leading-6 text-ink/66">
        <p className="font-semibold text-ink">Curadoria inicial com linguagem mais segura.</p>
        <p className="mt-1">
          Escolha um modelo para dar contexto para a IA. Você continua com liberdade total para editar
          público, oferta, tom e criativo depois.
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {templates.map((template) => {
          const selected = selectedTemplateId === template.id;

          return (
            <button
              className={`group relative flex min-h-[270px] flex-col overflow-hidden rounded-[28px] border p-5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50 ${
                selected
                  ? "border-cobalt/70 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(74,145,168,0.24),transparent_34%),linear-gradient(145deg,rgba(52,98,238,0.18)_0%,rgba(255,255,255,0.98)_48%,rgba(74,145,168,0.2)_100%)] shadow-[0_30px_80px_rgba(52,98,238,0.2)]"
                  : "border-white/58 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(74,145,168,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.84),rgba(249,251,253,0.72)_52%,rgba(239,245,248,0.62))] hover:-translate-y-0.5 hover:bg-white/80"
              }`}
              key={template.id}
              onClick={() => onSelect(template)}
              type="button"
            >
              <div
                aria-hidden="true"
                className={`absolute inset-0 ${
                  selected
                    ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent_24%),radial-gradient(circle_at_top_right,rgba(52,98,238,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(74,145,168,0.18),transparent_34%)]"
                    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.3),transparent_28%),radial-gradient(circle_at_top_right,rgba(74,145,168,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.22),transparent_26%)]"
                }`}
              />
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cobalt">
                  {template.tags[0]}
                </span>
                {selected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cobalt px-3 py-1 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(52,98,238,0.26)]">
                    <CheckCircle2 size={13} aria-hidden="true" />
                    Selecionado
                  </span>
                ) : null}
              </div>
              <h3 className="relative mt-5 text-lg font-semibold leading-7 text-ink">{template.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-ink/62">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {template.tags.slice(1).map((tag) => (
                  <span
                    className="rounded-full border border-white/66 bg-white/78 px-2.5 py-1 text-xs font-semibold text-ink/56"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-auto rounded-[22px] border border-white/60 bg-white/60 p-3 text-xs leading-5 text-ink/58">
                <p>
                  <strong className="text-ink/74">Região:</strong> {template.regions.join(", ")}
                </p>
                <p className="mt-1">
                  <strong className="text-ink/74">Tom:</strong> {template.tone}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CampaignConnectionsStep({
  connectedAccounts,
  currentAiBalance,
  form,
  metaConnection,
  onChange,
  publicationStateLabel,
  publicationStateTone
}: {
  connectedAccounts: ConnectedAccountsState;
  currentAiBalance: number;
  form: CampaignFormState;
  metaConnection: ConnectedAccountsState["metaConnection"];
  onChange: <K extends keyof CampaignFormState>(
    field: K,
    value: CampaignFormState[K],
    markDirty?: boolean
  ) => void;
  publicationStateLabel: string;
  publicationStateTone: "blue" | "yellow" | "teal" | "dark";
}) {
  const metaPreparationItems = getMetaPreparationItems(form, connectedAccounts);

  if (!metaConnection) {
    return (
      <div className="rounded-[28px] border border-dashed border-cobalt/24 bg-[linear-gradient(135deg,rgba(52,98,238,0.08),rgba(255,255,255,0.8))] p-5 text-sm leading-6 text-ink/68">
        <p className="font-semibold text-ink">Nenhuma conexão Meta ativa encontrada.</p>
        <p className="mt-2">
          Conecte sua conta Meta para escolher página, conta de anúncio e formulário de Lead Ads.
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-cloud"
          href="/dashboard/perfil/meta"
        >
          Conectar Meta
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/58 bg-[linear-gradient(135deg,rgba(52,98,238,0.08),rgba(255,255,255,0.86)_52%,rgba(74,145,168,0.08))] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cobalt/72">
              Torre de controle Meta
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/66">
              Escolha os ativos que a IA vai usar para estruturar a campanha de ponta a ponta.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SmallStatusChip label="Status" value={publicationStateLabel} tone={publicationStateTone} />
            <SmallStatusChip
              label="Perfil"
              value={metaConnection.metaUserName ?? "Conta conectada"}
              tone="neutral"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Perfil conectado"
          onChange={(value) => onChange("profileId", value)}
          value={form.profileId}
        >
          <option value={metaConnection.id}>
            {metaConnection.metaUserName ?? metaConnection.connectionStatusLabel ?? "Conta Meta conectada"}
          </option>
        </SelectField>
        <SelectField
          label="Empresa/Portfólio empresarial"
          onChange={(value) => onChange("businessId", value)}
          value={form.businessId}
        >
          <option value={connectedAccounts.organizationId ?? "workspace"}>
            {connectedAccounts.organizationName ?? "Empresa conectada"}
          </option>
        </SelectField>
        <SelectField
          label="Página do Facebook/Instagram"
          onChange={(value) => onChange("pageId", value)}
          value={form.pageId}
        >
          <option value="">Escolha uma página conectada</option>
          {connectedAccounts.metaPages.map((page) => (
            <option key={page.id} value={page.metaPageId}>
              {page.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Conta de anúncio"
          onChange={(value) => onChange("adAccountId", value)}
          value={form.adAccountId}
        >
          <option value="">Escolha uma conta de anúncio</option>
          {connectedAccounts.metaAdAccounts.map((account) => (
            <option key={account.id} value={account.metaAdAccountId}>
              {account.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Formulário de lead"
          onChange={(value) => onChange("leadFormId", value)}
          value={form.leadFormId}
        >
          <option value="">Escolha um formulário</option>
          {connectedAccounts.metaLeadForms.map((leadForm) => (
            <option key={leadForm.id} value={leadForm.metaFormId}>
              {leadForm.name} • {leadForm.pageName}
            </option>
          ))}
        </SelectField>
        <DetailTile
          label="Saldo/créditos de IA disponível"
          value={
            currentAiBalance > 0
              ? `${currentAiBalance.toLocaleString("pt-BR")} créditos`
              : "0 créditos"
          }
        />
        <div className="md:col-span-2 flex flex-wrap gap-2">
          <SmallStatusChip
            label="Formulário"
            value={
              connectedAccounts.metaLeadForms.find((leadForm) => leadForm.metaFormId === form.leadFormId)
                ?.name ?? "Escolha um formulário"
            }
            tone="neutral"
          />
          <SmallStatusChip
            label="Conta"
            value={
              connectedAccounts.metaAdAccounts.find((account) => account.metaAdAccountId === form.adAccountId)?.name ??
              "Escolha uma conta"
            }
            tone="neutral"
          />
        </div>
      </div>

      {form.publishMode === "paused" ? (
        <div className="rounded-[28px] border border-ink/10 bg-[linear-gradient(135deg,rgba(18,23,33,0.05),rgba(255,255,255,0.92)_50%,rgba(52,98,238,0.06))] p-4 text-sm leading-6 text-ink/70">
          <p className="font-semibold text-ink">Modo pausado selecionado</p>
          <p className="mt-1">
            A Leadi vai preparar a campanha com os ativos abaixo e manter a veiculacao bloqueada ate a equipe ativar manualmente.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {metaPreparationItems.map((item) => (
              <div
                className={`rounded-[22px] border px-4 py-3 ${
                  item.ready
                    ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-900"
                    : "border-amber-200/80 bg-amber-50/80 text-amber-900"
                }`}
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{item.label}</p>
                <p className="mt-2 font-semibold">{item.value}</p>
                <p className="mt-1 text-xs">{item.ready ? "Pronto para publicar pausada" : "Ainda precisa ser selecionado"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CampaignAudienceStep({
  form,
  onChange
}: {
  form: CampaignFormState;
  onChange: <K extends keyof CampaignFormState>(
    field: K,
    value: CampaignFormState[K],
    markDirty?: boolean
  ) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextAreaField
        label="Perfil do público-alvo"
        minHeightClass="min-h-[100px]"
        onChange={(value) => onChange("audience", value)}
        placeholder="Ex.: empresas com CNPJ que desejam avaliar alternativas de plano empresarial."
        value={form.audience}
      />
      <TextAreaField
        label="Oferta e benefícios"
        minHeightClass="min-h-[100px]"
        onChange={(value) => onChange("offer", value)}
        placeholder="Ex.: análise consultiva para comparar opções conforme perfil da empresa."
        value={form.offer}
      />
      <TextAreaField
        label="Tipo de contratação ou foco"
        minHeightClass="min-h-[100px]"
        onChange={(value) => onChange("contractType", value)}
        placeholder="Ex.: Adesão, Empresarial (PME), Individual, MEI."
        value={form.contractType}
      />
      <TextAreaField
        label="Diferencial do produto/serviço"
        minHeightClass="min-h-[100px]"
        onChange={(value) => onChange("differential", value)}
        placeholder="Ex.: explicação clara das regras, comparação de rede e apoio consultivo."
        value={form.differential}
      />
      <div className="md:col-span-2">
        <RegionTagsInput
          onChange={(regions) => onChange("regions", regions)}
          regions={form.regions}
        />
      </div>
      <TextAreaField
        label="Objeções comuns a quebrar"
        minHeightClass="min-h-[100px]"
        onChange={(value) => onChange("objections", value)}
        placeholder="Ex.: preço alto, medo de cumprir carência, muita burocracia."
        value={form.objections}
      />
      <TextAreaField
        label="Observações adicionais"
        minHeightClass="min-h-[100px]"
        onChange={(value) => onChange("notes", value)}
        placeholder="Ex.: evitar promessas absolutas e focar em orientação."
        value={form.notes}
      />
    </div>
  );
}

function CampaignToneStep({
  form,
  onChange
}: {
  form: CampaignFormState;
  onChange: <K extends keyof CampaignFormState>(
    field: K,
    value: CampaignFormState[K],
    markDirty?: boolean
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <TextAreaField
        label="Observações para o anúncio"
        minHeightClass="min-h-[150px]"
        onChange={(value) => onChange("adNotes", value)}
        placeholder="Inclua direcionamentos de copy, restrições comerciais e pontos que a IA deve respeitar."
        value={form.adNotes}
      />
      <div>
        <p className="text-sm font-semibold text-ink/62">Tom da mensagem</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {toneOptions.map((tone) => {
            const selected = form.tone === tone;

            return (
              <button
                className={`rounded-[24px] border px-4 py-3.5 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50 ${
                  selected
                    ? "border-cobalt/70 bg-[linear-gradient(135deg,rgba(52,98,238,0.14),rgba(255,255,255,0.96))] text-cobalt shadow-[0_18px_46px_rgba(52,98,238,0.14)]"
                    : "border-white/58 bg-white/56 text-ink/68 hover:bg-white/80"
                }`}
                key={tone}
                onClick={() => onChange("tone", tone)}
                type="button"
              >
                {tone}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CampaignPublishModeStep({
  form,
  onChange
}: {
  form: CampaignFormState;
  onChange: <K extends keyof CampaignFormState>(
    field: K,
    value: CampaignFormState[K],
    markDirty?: boolean
  ) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {publishModeOptions.map((option) => {
        const selected = form.publishMode === option.value;

        return (
          <button
            className={`rounded-[26px] border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt/50 ${
              selected
                ? "border-cobalt/70 bg-[linear-gradient(145deg,rgba(52,98,238,0.12),rgba(255,255,255,0.98)_52%,rgba(74,145,168,0.16))] shadow-[0_24px_60px_rgba(52,98,238,0.16)]"
                : "border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,255,255,0.56))] hover:bg-white/78"
            }`}
            key={option.value}
            onClick={() => onChange("publishMode", option.value)}
            type="button"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-semibold text-ink">{option.title}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  selected ? "bg-cobalt text-white" : "bg-white/84 text-ink/46"
                }`}
              >
                {selected ? <CheckCircle2 size={15} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
              </span>
            </span>
            <span className="mt-3 block text-sm leading-6 text-ink/62">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function CampaignCreativeStep({
  form,
  onChange
}: {
  form: CampaignFormState;
  onChange: <K extends keyof CampaignFormState>(
    field: K,
    value: CampaignFormState[K],
    markDirty?: boolean
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] border border-cobalt/18 bg-[linear-gradient(135deg,rgba(52,98,238,0.08),rgba(255,255,255,0.86)_56%,rgba(74,145,168,0.08))] p-4 md:flex-row md:items-start">
        <FileImage className="shrink-0 text-cobalt" size={24} aria-hidden="true" />
        <div className="text-sm leading-6 text-ink/66">
          <p className="font-semibold text-ink">
            Arquivo ou solicitação: carregue um criativo existente ou solicite uma arte/vídeo para esta campanha.
          </p>
          <p className="mt-1">
            Caso você já tenha as artes ou o criativo para este anúncio, insira os arquivos aqui. Se ainda não tiver, solicite a criação de um criativo com um briefing.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { value: "solicitar_criativo" as const, title: "Solicitar criativo", icon: <ImagePlus size={18} aria-hidden="true" /> },
          { value: "enviar_arquivo" as const, title: "Enviar criativo existente", icon: <Upload size={18} aria-hidden="true" /> }
        ].map((option) => {
          const selected = form.creativeMode === option.value;

          return (
            <button
              className={`flex items-center gap-3 rounded-[24px] border px-4 py-3.5 text-left font-semibold transition ${
                selected
                  ? "border-cobalt/70 bg-[linear-gradient(145deg,rgba(52,98,238,0.14),rgba(255,255,255,0.96))] text-cobalt shadow-[0_18px_46px_rgba(52,98,238,0.12)]"
                  : "border-white/58 bg-white/56 text-ink/66"
              }`}
              key={option.value}
              onClick={() => onChange("creativeMode", option.value)}
              type="button"
            >
              {option.icon}
              {option.title}
            </button>
          );
        })}
      </div>

      {form.creativeMode === "solicitar_criativo" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Tipo de criativo"
            onChange={(value) => onChange("creativeType", value as CreativeType)}
            value={form.creativeType}
          >
            {creativeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </SelectField>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-ink/62">Objetivo do criativo</span>
            <input
              className="liquid-input"
              onChange={(event) => onChange("creativeObjective", event.target.value)}
              placeholder="Ex.: gerar leads para análise consultiva."
              value={form.creativeObjective}
            />
          </label>
          <TextAreaField
            label="Observações"
            minHeightClass="min-h-[120px]"
            onChange={(value) => onChange("creativeNotes", value)}
            placeholder="Ex.: evitar promessas de economia e manter visual profissional."
            value={form.creativeNotes}
          />
          <TextAreaField
            label="Briefing"
            minHeightClass="min-h-[160px]"
            onChange={(value) => onChange("creativeBriefing", value)}
            placeholder="Exemplo: quero uma arte limpa, profissional, voltada para empresários com CNPJ, destacando uma análise consultiva de plano empresarial, sem promessa de economia garantida."
            value={form.creativeBriefing}
          />
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-cobalt/26 bg-white/56 p-5">
          <p className="font-semibold text-ink">Você já tem a arte ou vídeo do anúncio? Envie aqui para anexarmos à campanha.</p>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Envie imagens ou vídeos já prontos para esta campanha.
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-cobalt/90">
            <Paperclip size={16} aria-hidden="true" />
            Adicionar arquivo
            <input
              accept={CREATIVE_REQUEST_ATTACHMENT_ACCEPT}
              className="sr-only"
              multiple
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? []);
                // TODO: Enviar arquivos reais quando houver vínculo de upload direto com a campanha gerada.
                onChange("uploadedFiles", files.map((file) => file.name));
              }}
              type="file"
            />
          </label>
          {form.uploadedFiles.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.uploadedFiles.map((fileName) => (
                <span
                  className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-xs font-semibold text-ink/64"
                  key={fileName}
                >
                  <Paperclip size={13} aria-hidden="true" />
                  {fileName}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-[20px] bg-signal/16 px-4 py-3 text-sm font-semibold text-ink dark:text-cloud/70">
              Nenhum arquivo adicionado ainda. Você pode continuar, mas a equipe precisará receber o criativo depois.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CampaignSummaryStep({
  connectedAccounts,
  complianceReview,
  form,
  onSaveDraft,
  selectedTemplate,
  validationMessages
}: {
  connectedAccounts: ConnectedAccountsState;
  complianceReview: LocalComplianceReview | null;
  form: CampaignFormState;
  onSaveDraft: () => void;
  selectedTemplate?: CampaignTemplate;
  validationMessages: string[];
}) {
  const metaPreparationItems = getMetaPreparationItems(form, connectedAccounts);
  const pageName = metaPreparationItems[0]?.ready ? metaPreparationItems[0].value : undefined;
  const adAccountName = metaPreparationItems[1]?.ready ? metaPreparationItems[1].value : undefined;
  const leadFormName = metaPreparationItems[2]?.ready ? metaPreparationItems[2].value : undefined;
  const publishLabel = publishModeOptions.find((mode) => mode.value === form.publishMode)?.title;

  return (
    <div className="space-y-4">
      {validationMessages.length ? (
        <div className="rounded-[24px] border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950">
          <p className="font-semibold">Revise antes de enviar:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : complianceReview && (complianceReview.riskLevel === "high" || complianceReview.riskLevel === "medium") ? (
        <div className="rounded-[28px] border border-amber-200/80 bg-[linear-gradient(135deg,rgba(254,243,199,0.4),rgba(255,255,255,0.92)_50%,rgba(254,243,199,0.2))] p-5 text-sm leading-6 text-amber-950 shadow-[0_18px_44px_rgba(18,23,33,0.04)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900">Atenção ao conteúdo da campanha</p>
              <p className="mt-1 opacity-90">Alguns termos identificados podem gerar restrições ou reprovações na Meta:</p>
              <ul className="mt-3 space-y-3">
                {complianceReview.reasons.map((reason, index) => (
                  <li key={index} className="rounded-2xl bg-amber-100/50 p-3">
                    <strong className="block text-amber-900">{reason.title}</strong>
                    <span className="mt-1 block opacity-80">{reason.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-white/60 p-3">
                <p className="font-medium text-amber-900">Sugestões de ajuste:</p>
                <ul className="mt-2 list-inside list-disc opacity-90">
                  {complianceReview.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-[13px] font-medium opacity-70">
                Você ainda pode enviar a campanha, mas recomendamos ajustar os campos (Oferta, Observações, etc.) para evitar bloqueios reais.
              </p>
            </div>
          </div>
        </div>
      ) : form.publishMode === "paused" ? (
        <div className="rounded-[28px] border border-ink/10 bg-[linear-gradient(135deg,rgba(18,23,33,0.05),rgba(255,255,255,0.94)_52%,rgba(52,98,238,0.08))] p-5 text-sm leading-6 text-ink/68">
          <p className="font-semibold text-ink">Publicacao pausada: a campanha sera preparada, nao ativada.</p>
          <p className="mt-1">
            Ao enviar, a Leadi gera a copy, salva o historico e deixa a campanha pronta para uma etapa posterior de envio em estado pausado na Meta.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {metaPreparationItems.map((item) => (
              <div
                className={`rounded-[22px] border px-4 py-3 ${
                  item.ready
                    ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-900"
                    : "border-amber-200/80 bg-amber-50/80 text-amber-900"
                }`}
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{item.label}</p>
                <p className="mt-2 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] font-medium text-ink/60">
            O envio efetivo e a ativacao continuam em etapa manual e segura, sem subir a campanha ja em veiculacao.
          </p>
        </div>
      ) : form.publishMode === "manual_review" ? (
        <div className="rounded-[28px] border border-cobalt/20 bg-[linear-gradient(135deg,rgba(52,98,238,0.08),rgba(255,255,255,0.92)_50%,rgba(52,98,238,0.04))] p-4 text-sm leading-6 text-ink/68">
          <p className="font-semibold text-ink">Revisão manual: a campanha não será enviada à Meta agora.</p>
          <p className="mt-1">
            Ao enviar, a IA vai gerar os textos e preparar tudo na Leadi. Você poderá revisar o resultado com a equipe e exportar ou publicar na Meta apenas quando estiver pronto.
          </p>
        </div>
      ) : (
        <div className="rounded-[28px] border border-emerald-200/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0.92)_50%,rgba(52,98,238,0.06))] p-4 text-sm leading-6 text-ink/68">
          <p className="font-semibold text-ink">Resumo pronto para a camada final de IA.</p>
          <p className="mt-1">
            Revise os sinais abaixo, salve um rascunho se quiser e envie quando estiver confortável com
            o briefing completo.
          </p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <SummaryItem label="Template selecionado" value={selectedTemplate?.title ?? "Sem template selecionado"} />
        <SummaryItem label="Perfil/empresa conectada" value={connectedAccounts.organizationName ?? "Empresa conectada"} />
        <SummaryItem label="Página selecionada" value={pageName ?? "Não selecionada"} />
        <SummaryItem label="Conta de anúncio" value={adAccountName ?? "Não selecionada"} />
        <SummaryItem label="Formulário de lead" value={leadFormName ?? "Não selecionado"} />
        <SummaryItem label="Créditos de IA" value={`${form.aiCredits} créditos`} />
        <SummaryItem label="Público" value={form.audience} />
        <SummaryItem label="Oferta" value={form.offer} />
        <SummaryItem label="Região/tags" value={form.regions.join(", ") || "Sem região"} />
        <SummaryItem label="Diferencial" value={form.differential} />
        <SummaryItem label="Observações" value={[form.notes, form.adNotes].filter(Boolean).join(" ")} />
        <SummaryItem label="Tom da mensagem" value={form.tone} />
        <SummaryItem label="Modo de publicação" value={publishLabel ?? form.publishMode} />
        <SummaryItem
          label="Tipo de criativo"
          value={
            form.creativeMode === "solicitar_criativo"
              ? creativeTypes.find((type) => type.value === form.creativeType)?.label ?? form.creativeType
              : "Criativo existente"
          }
        />
        <SummaryItem
          label="Briefing ou arquivos anexados"
          value={
            form.creativeMode === "solicitar_criativo"
              ? form.creativeBriefing || "Briefing não preenchido"
              : form.uploadedFiles.join(", ") || "Nenhum arquivo adicionado"
          }
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white/78 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          onClick={onSaveDraft}
          type="button"
        >
          Salvar rascunho para publicar depois
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-cobalt/90"
          type="submit"
        >
          Enviar campanha
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function RegionTagsInput({
  onChange,
  regions
}: {
  onChange: (regions: RegionTag[]) => void;
  regions: RegionTag[];
}) {
  const [draft, setDraft] = useState("");

  function addTag(value: string) {
    const nextValue = value.trim().replace(/,$/, "");
    if (!nextValue) return;

    const exists = regions.some((region) => region.toLowerCase() === nextValue.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }

    onChange([...regions, nextValue]);
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
      if (draft.trim()) {
        event.preventDefault();
        addTag(draft);
      }
    }
  }

  function removeTag(region: string) {
    onChange(regions.filter((currentRegion) => currentRegion !== region));
  }

  return (
    <div>
      <label className="text-sm font-semibold text-ink/62" htmlFor="campaign-region-tags">
        Região
      </label>
      <div className="mt-2 rounded-[24px] border border-white/56 bg-white/58 p-3 transition focus-within:border-cobalt/45 focus-within:bg-white/84 focus-within:shadow-[0_0_0_4px_rgba(52,98,238,0.12)]">
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <span
              className="inline-flex items-center gap-2 rounded-full bg-cobalt/10 px-3 py-1.5 text-sm font-semibold text-cobalt"
              key={region}
            >
              {region}
              <button
                aria-label={`Remover ${region}`}
                className="rounded-full text-cobalt transition hover:bg-cobalt/10"
                onClick={() => removeTag(region)}
                type="button"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            aria-label="Adicionar região"
            className="min-h-[36px] min-w-[180px] flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-ink/36"
            id="campaign-region-tags"
            onBlur={() => addTag(draft)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite cidade/estado e pressione Tab, Enter ou vírgula"
            value={draft}
          />
        </div>
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  minHeightClass,
  onChange,
  placeholder,
  value
}: {
  label: string;
  minHeightClass: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-ink/62">{label}</span>
      <textarea
        className={`liquid-input ${minHeightClass} resize-y border-white/58 bg-white/58 leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-ink/62">{label}</span>
      <select
        className="liquid-input border-white/58 bg-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.6))] px-4 py-3 shadow-[0_14px_34px_rgba(18,23,33,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/44">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-ink">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/58 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.62))] px-4 py-3 shadow-[0_14px_34px_rgba(18,23,33,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/76">{value || "Não informado"}</p>
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
    neutral: "border-white/58 bg-white/72 text-ink/72",
    blue: "border-cobalt/12 bg-cobalt text-white",
    yellow: "border-signal/20 bg-signal text-ink dark:text-cloud",
    teal: "border-lagoon/14 bg-lagoon text-white",
    dark: "border-ink/14 bg-ink text-cloud"
  }[tone];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClasses}`}>
      <span className="uppercase tracking-[0.14em] text-[10px] opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function Notice({ message, tone }: { message: string; tone: "success" | "info" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0.92))] text-emerald-800"
      : "border-sky-200/70 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0.92))] text-sky-800";

  return <div className={`rounded-[26px] border p-4 text-sm leading-6 shadow-[0_18px_44px_rgba(18,23,33,0.04)] ${toneClass}`}>{message}</div>;
}

function createInitialForm(
  connectedAccounts: ConnectedAccountsState,
  aiCredits: number
): CampaignFormState {
  return {
    selectedTemplateId: "",
    profileId: connectedAccounts.metaConnection?.id ?? "",
    businessId: connectedAccounts.organizationId ?? "workspace",
    pageId: connectedAccounts.metaPages[0]?.metaPageId ?? "",
    adAccountId: connectedAccounts.metaAdAccounts[0]?.metaAdAccountId ?? "",
    leadFormId: connectedAccounts.metaLeadForms[0]?.metaFormId ?? "",
    aiCredits,
    audience: "Donos e gestores de ME, LTDA e empresas de 2 a 49 vidas",
    offer: "Análise consultiva para comparar plano empresarial",
    regions: ["Campinas", "Região"],
    differential: "Atendimento rápido com comparativo objetivo entre operadoras",
    objections: "Medo de carências na troca e receio com reajustes altos",
    contractType: "Empresarial (MEI/PME)",
    notes: "",
    adNotes: "",
    tone: "Consultivo e direto",
    publishMode: "manual_review",
    creativeMode: "enviar_arquivo",
    creativeType: "imagem_anuncio",
    creativeObjective: "",
    creativeNotes: "",
    creativeBriefing: "",
    uploadedFiles: []
  };
}

function buildCampaignRequestPayload(form: CampaignFormState) {
  return {
    audience: form.audience,
    offer: form.offer,
    region: form.regions.join(", "),
    differentiator: form.differential,
    objections: form.objections,
    contractType: form.contractType,
    notes: [form.notes, form.adNotes, form.creativeNotes].filter(Boolean).join("\n"),
    tone: form.tone,
    creativeAssetType: form.creativeType,
    creativeBrief: [form.creativeObjective, form.creativeBriefing].filter(Boolean).join("\n"),
    creativeRequestMode: form.creativeMode,
    creativeFileNames: form.uploadedFiles,
    metaPageId: form.pageId,
    metaAdAccountId: form.adAccountId,
    metaLeadFormId: form.leadFormId,
    publishMode: form.publishMode
  };
}

function validateForm(form: CampaignFormState) {
  const messages: string[] = [];
  const hasPrimaryFields = Boolean(form.audience.trim() && form.offer.trim() && form.regions.length);

  if (!form.selectedTemplateId && !hasPrimaryFields) {
    messages.push("Escolha um template ou preencha público, oferta e região.");
  }
  if (!form.pageId) messages.push("Selecione uma página do Facebook/Instagram.");
  if (!form.adAccountId) messages.push("Selecione uma conta de anúncio.");
  if (!form.leadFormId) messages.push("Selecione um formulário de lead.");
  if (!form.audience.trim()) messages.push("Preencha o público.");
  if (!form.offer.trim()) messages.push("Preencha a oferta.");
  if (!form.regions.length) messages.push("Adicione pelo menos uma região.");
  if (!form.differential.trim()) messages.push("Preencha o diferencial.");
  if (!form.publishMode) messages.push("Selecione um modo de publicação.");
  if (form.creativeMode === "solicitar_criativo" && !form.creativeBriefing.trim()) {
    messages.push("Preencha o briefing ao solicitar criativo.");
  }

  return messages;
}

function resolvePublicationState({
  hasMetaConnection,
  hasMinimumMetaAssets,
  publishMode
}: {
  hasMetaConnection: boolean;
  hasMinimumMetaAssets: boolean;
  publishMode: PublishMode;
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

  if (publishMode === "draft") {
    return {
      label: "Anúncio preparado",
      tone: "blue" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  if (publishMode === "paused") {
    return {
      label: "Pronta para publicar pausada",
      tone: "dark" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  if (publishMode === "scheduled") {
    return {
      label: "Pronta para agendar",
      tone: "teal" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  if (publishMode === "manual_review") {
    return {
      label: "Revisão manual",
      tone: "blue" as const,
      connectedAccountLabel: "Conta Meta pronta"
    };
  }

  return {
    label: "Aguardando revisão",
    tone: "yellow" as const,
    connectedAccountLabel: "Conta Meta pronta"
  };
}
