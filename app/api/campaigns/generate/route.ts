import { NextResponse } from "next/server";
import { EnvValidationError } from "@/lib/env/server";
import { containsSensitiveCompliancePattern } from "@/lib/openai/compliance-guardrails";
import {
  generateCampaignText,
  LeadHealthOpenAIError,
  type CampaignTextInput
} from "@/lib/openai";
import {
  getMetaConnectionForOrganization,
  resolveOpenAIKeyForOrganization
} from "@/lib/integrations/repository.server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { saveCampaignForCurrentUser } from "@/lib/campaigns/repository.server";
import { createCreativeRequestForCurrentUser } from "@/lib/creative-requests/repository.server";
import type {
  CampaignPublishMode,
  CampaignPublicationStatus
} from "@/lib/campaigns/types";

type CampaignRequestBody = {
  audience?: unknown;
  offer?: unknown;
  region?: unknown;
  differentiator?: unknown;
  tone?: unknown;
  metaPageId?: unknown;
  metaAdAccountId?: unknown;
  metaLeadFormId?: unknown;
  publishMode?: unknown;
  metaCampaignId?: unknown;
  metaAdSetId?: unknown;
  metaAdId?: unknown;
  notes?: unknown;
  creativeAssetType?: unknown;
  creativeRequestMode?: unknown;
  creativeBrief?: unknown;
  creativeFileNames?: unknown;
};

type CampaignRequestInput = CampaignTextInput & {
  creativeAssetType: string | null;
  creativeBrief: string | null;
  creativeFileNames: string[];
  creativeRequestMode: string | null;
  differentiator: string;
  notes: string | null;
  connectedAccountId: string | null;
  metaPageId: string | null;
  metaAdAccountId: string | null;
  metaLeadFormId: string | null;
  publishMode: CampaignPublishMode;
  publicationStatus: CampaignPublicationStatus;
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
};

const MAX_FIELD_LENGTH = 280;
const DEFAULT_PRODUCT = "Plano de saude empresarial";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CampaignRequestBody;
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const [metaConnection, openAiKey] = await Promise.all([
      getMetaConnectionForOrganization(billingContext.organizationId),
      resolveOpenAIKeyForOrganization(billingContext.organizationId)
    ]);
    const input = parseCampaignRequest(body, metaConnection?.id ?? null);

    if (!openAiKey) {
      return NextResponse.json(
        {
          error:
            "Conecte sua chave OpenAI no Perfil para gerar campanhas com IA usando a conta da sua organizacao."
        },
        { status: 400 }
      );
    }

    const { differentiator, ...campaignInput } = input;
    const localNotes = getLocalComplianceNotes([
      campaignInput.audience,
      campaignInput.offer ?? "",
      campaignInput.region ?? "",
      campaignInput.tone ?? "",
      ...(campaignInput.constraints ?? [])
    ]);
    const campaign = await generateCampaignText({
      audience: campaignInput.audience,
      product: campaignInput.product,
      brokerageName: billingContext.brokerageName,
      objective: campaignInput.objective,
      offer: campaignInput.offer,
      region: campaignInput.region,
      channel: campaignInput.channel,
      tone: campaignInput.tone,
      constraints: [...(campaignInput.constraints ?? []), ...localNotes]
    }, { apiKey: openAiKey });
    const persistedCampaign = {
      ...campaign,
      complianceNotes: [...localNotes, ...campaign.complianceNotes]
    };
    const savedCampaign = await saveCampaignForCurrentUser({
      form: {
        brokerageName: billingContext.brokerageName,
        audience: campaignInput.audience,
        offer: campaignInput.offer ?? "",
        region: campaignInput.region ?? "",
        differentiator,
        notes: input.notes ?? "",
        tone: campaignInput.tone ?? "",
        creativeAssetType: input.creativeAssetType,
        creativeBrief: input.creativeBrief,
        creativeRequestMode: input.creativeRequestMode,
        creativeFileNames: input.creativeFileNames,
        connectedAccountId: input.connectedAccountId,
        metaPageId: input.metaPageId,
        metaAdAccountId: input.metaAdAccountId,
        metaLeadFormId: input.metaLeadFormId,
        publishMode: input.publishMode,
        publicationStatus: input.publicationStatus,
        metaCampaignId: input.metaCampaignId,
        metaAdSetId: input.metaAdSetId,
        metaAdId: input.metaAdId
      },
      campaign: persistedCampaign
    });
    const creativeRequest = await maybeCreateCreativeRequest(input, persistedCampaign);

    return NextResponse.json({
      campaign: persistedCampaign,
      creativeRequest,
      savedCampaign
    });
  } catch (error) {
    const { message, status } = getCampaignError(error);

    return NextResponse.json({ error: message }, { status });
  }
}

function parseCampaignRequest(
  body: CampaignRequestBody,
  connectedAccountId: string | null
): CampaignRequestInput {
  const audience = getRequiredString(body.audience, "Informe o publico da campanha.");
  const offer = getRequiredString(body.offer, "Informe a oferta da campanha.");
  const region = getRequiredString(body.region, "Informe a regiao da campanha.");
  const differentiator = getRequiredString(body.differentiator, "Informe o diferencial da oferta.");
  const tone = getRequiredString(body.tone, "Informe o tom da campanha.");
  const metaPageId = getOptionalString(body.metaPageId);
  const metaAdAccountId = getOptionalString(body.metaAdAccountId);
  const metaLeadFormId = getOptionalString(body.metaLeadFormId);
  const publishMode = getPublishMode(body.publishMode);
  const metaCampaignId = getOptionalString(body.metaCampaignId);
  const metaAdSetId = getOptionalString(body.metaAdSetId);
  const metaAdId = getOptionalString(body.metaAdId);
  const notes = getOptionalString(body.notes);
  const creativeAssetType = getOptionalString(body.creativeAssetType);
  const creativeRequestMode = getOptionalString(body.creativeRequestMode);
  const creativeBrief = getOptionalString(body.creativeBrief);
  const creativeFileNames = Array.isArray(body.creativeFileNames)
    ? body.creativeFileNames
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim().slice(0, MAX_FIELD_LENGTH))
    : [];
  const publicationStatus = resolvePublicationStatus({
    hasConnectedMetaAccount: Boolean(connectedAccountId),
    metaPageId,
    metaAdAccountId,
    publishMode
  });

  return {
    audience,
    differentiator,
    notes,
    connectedAccountId,
    product: DEFAULT_PRODUCT,
    objective: "gerar leads qualificados para cotacao consultiva",
    offer,
    region,
    channel: "meta_ads",
    tone,
    creativeAssetType,
    creativeBrief,
    creativeFileNames,
    creativeRequestMode,
    metaPageId,
    metaAdAccountId,
    metaLeadFormId,
    publishMode,
    publicationStatus,
    metaCampaignId,
    metaAdSetId,
    metaAdId,
    constraints: [
      `Diferencial informado: ${differentiator}`,
      notes ? `Observacoes da campanha: ${notes}` : "",
      creativeAssetType ? `Tipo de criativo solicitado: ${creativeAssetType}` : "",
      creativeRequestMode ? `Modo de criativo: ${creativeRequestMode}` : "",
      creativeBrief ? `Briefing criativo: ${creativeBrief}` : "",
      creativeFileNames.length ? `Arquivos enviados: ${creativeFileNames.join(", ")}` : "",
      "Nao usar promessa de economia garantida, aprovacao garantida ou resultado medico.",
      "Nao chamar o usuario por condicao de saude, idade sensivel, diagnostico ou situacao pessoal protegida.",
      "Priorizar empresas, decisores comerciais, quantidade de vidas, regiao e necessidade de cotacao."
    ]
  };
}

function getRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(message);
  }

  return value.trim().slice(0, MAX_FIELD_LENGTH);
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_FIELD_LENGTH)
    : null;
}

function getPublishMode(value: unknown): CampaignPublishMode {
  if (
    value === "draft" ||
    value === "manual_review" ||
    value === "scheduled" ||
    value === "paused"
  ) {
    return value;
  }

  return "manual_review";
}

function resolvePublicationStatus(input: {
  hasConnectedMetaAccount: boolean;
  metaPageId: string | null;
  metaAdAccountId: string | null;
  publishMode: CampaignPublishMode;
}): CampaignPublicationStatus {
  if (!input.hasConnectedMetaAccount) {
    return "not_connected";
  }

  if (!input.metaPageId || !input.metaAdAccountId) {
    return "ready_to_prepare";
  }

  if (input.publishMode === "draft") {
    return "draft_created";
  }

  if (input.publishMode === "manual_review") {
    return "pending_review";
  }

  if (input.publishMode === "paused") {
    return "paused";
  }

  return "ready_to_prepare";
}

function getLocalComplianceNotes(values: string[]) {
  const joinedValues = values.join(" ");

  if (!containsSensitiveCompliancePattern(joinedValues)) {
    return [
      "Revisao local: manter o texto ancorado em empresa, regiao, faixa de vidas, prazo, rede, atendimento e necessidade de cotacao."
    ];
  }

  return [
    "Revisao local: a entrada trouxe termo sensivel ou promessa forte; reescreva com foco comercial, sem explorar saude, atributo pessoal, garantia ou facilidade enganosa."
  ];
}

function getCampaignError(error: unknown) {
  if (error instanceof EnvValidationError) {
    return {
      message: error.message,
      status: 503
    };
  }

  if (error instanceof LeadHealthOpenAIError) {
    return {
      message: error.message,
      status: error.code === "missing_api_key" ? 400 : 502
    };
  }

  if (error instanceof Error && error.message) {
    return {
      message: error.message,
      status: 400
    };
  }

  return {
    message: "Nao foi possivel gerar a campanha. Revise os dados e tente novamente.",
    status: 400
  };
}

async function maybeCreateCreativeRequest(
  input: CampaignRequestInput,
  campaign: Awaited<ReturnType<typeof generateCampaignText>>
) {
  const shouldCreateRequest =
    input.creativeRequestMode === "solicitar_criativo" ||
    Boolean(input.creativeBrief) ||
    input.creativeFileNames.length > 0;

  if (!shouldCreateRequest) {
    return null;
  }

  try {
    return await createCreativeRequestForCurrentUser({
      type: mapCreativeRequestType(input.creativeAssetType),
      title: `Campanha IA - ${input.region ?? input.audience}`,
      objective: `Validar campanha e criativo para ${input.audience}. Oferta: ${input.offer ?? "cotacao consultiva"}.`,
      briefing: [
        `Nome sugerido: ${campaign.campaignName}.`,
        input.creativeBrief ? `Briefing criativo: ${input.creativeBrief}.` : "",
        `Headline base: ${campaign.headline}.`,
        `CTA: ${campaign.callToAction}.`,
        input.creativeFileNames.length
          ? `Arquivos enviados: ${input.creativeFileNames.join(", ")}.`
          : ""
      ]
        .filter(Boolean)
        .join(" "),
      notes: [
        input.notes ? `Observacoes: ${input.notes}.` : "",
        input.creativeAssetType ? `Tipo de criativo: ${input.creativeAssetType}.` : "",
        input.creativeRequestMode
          ? `Modo solicitado: ${formatCreativeRequestMode(input.creativeRequestMode)}.`
          : ""
      ]
        .filter(Boolean)
        .join(" ")
    });
  } catch (error) {
    console.error("Nao foi possivel criar o pedido criativo vinculado a campanha.", error);
    return null;
  }
}

function mapCreativeRequestType(assetType: string | null) {
  if (assetType === "video") {
    return "video";
  }

  return "campaign";
}

function formatCreativeRequestMode(value: string) {
  if (value === "solicitar_criativo") {
    return "solicitar criativo";
  }

  return "carregar criativo";
}
