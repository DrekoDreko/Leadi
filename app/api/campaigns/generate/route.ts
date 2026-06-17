import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvValidationError } from "@/lib/env/server";
import { containsSensitiveCompliancePattern } from "@/lib/openai/compliance-guardrails";
import { AiCreditsError, runAiActionWithCredits } from "@/lib/ai/credits";
import {
  generateCampaignText,
  LeadHealthOpenAIError,
  type CampaignTextInput
} from "@/lib/openai";
import {
  getMetaConnectionForOrganization
} from "@/lib/integrations/repository.server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { saveCampaignForCurrentUser } from "@/lib/campaigns/repository.server";
import { createCreativeRequestForCurrentUser } from "@/lib/creative-requests/repository.server";
import type {
  CampaignPublishMode,
  CampaignPublicationStatus,
  CampaignSaveInput
} from "@/lib/campaigns/types";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type CampaignRequestInput = CampaignTextInput & {
  creativeAssetType: string | null;
  creativeBrief: string | null;
  creativeFileNames: string[];
  creativeRequestMode: string | null;
  differentiator: string;
  objections: string | null;
  contractType: string | null;
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
  dailyBudget: number | null;
};

const MAX_FIELD_LENGTH = 280;
const DEFAULT_PRODUCT = "Plano de saude empresarial";
const publishModeSchema = z.enum(["draft", "manual_review", "scheduled", "paused"]).optional();
const campaignRequestSchema = z.object({
  audience: requiredTrimmedString("Informe o publico da campanha.").max(MAX_FIELD_LENGTH),
  offer: requiredTrimmedString("Informe a oferta da campanha.").max(MAX_FIELD_LENGTH),
  region: requiredTrimmedString("Informe a regiao da campanha.").max(MAX_FIELD_LENGTH),
  differentiator: requiredTrimmedString("Informe o diferencial da oferta.").max(MAX_FIELD_LENGTH),
  objections: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  contractType: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  tone: requiredTrimmedString("Informe o tom da campanha.").max(MAX_FIELD_LENGTH),
  metaPageId: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  metaAdAccountId: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  metaLeadFormId: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  publishMode: publishModeSchema,
  metaCampaignId: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  metaAdSetId: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  metaAdId: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  notes: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  creativeAssetType: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  creativeRequestMode: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  creativeBrief: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  creativeFileNames: z.array(z.string().trim().min(1).max(MAX_FIELD_LENGTH)).max(10).optional(),
  dailyBudget: z.number().min(1).max(100000).optional()
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-campaigns-generate",
      limit: 20,
      windowMs: 60 * 1000
    });
    const billingContext = await getBillingAuthContext();

    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const body = await parseJsonBody(request, campaignRequestSchema);
    const metaConnection = await getMetaConnectionForOrganization(billingContext.organizationId);
    const input = parseCampaignRequest(body, metaConnection?.id ?? null);
    const { differentiator, objections, contractType, ...campaignInput } = input;
    const localNotes = getLocalComplianceNotes([
      campaignInput.audience,
      campaignInput.offer ?? "",
      campaignInput.region ?? "",
      campaignInput.tone ?? "",
      ...(campaignInput.constraints ?? [])
    ]);
    const { result: campaign, remainingCredits } = await runAiActionWithCredits({
      orgId: billingContext.organizationId,
      userId: billingContext.profileId,
      feature: "generate_campaign_plan",
      description: "Geracao de campanha com IA",
      metadata: {
        route: "campaigns/generate",
        hasCreativeBrief: Boolean(input.creativeBrief),
        hasCreativeAsset: Boolean(input.creativeAssetType),
        hasMetaAssets: Boolean(input.metaPageId && input.metaAdAccountId)
      },
      generate: (apiKey) =>
        generateCampaignText(
          {
            audience: campaignInput.audience,
            product: campaignInput.product,
            brokerageName: billingContext.brokerageName,
            objective: campaignInput.objective,
            offer: campaignInput.offer,
            region: campaignInput.region,
            channel: campaignInput.channel,
            tone: campaignInput.tone,
            constraints: [...(campaignInput.constraints ?? []), ...localNotes]
          },
          { apiKey }
        )
    });
    const persistedCampaign = {
      ...campaign,
      complianceNotes: [...localNotes, ...campaign.complianceNotes]
    };
    let savedCampaign = null;

    try {
      const campaignToSave: CampaignSaveInput = {
        form: {
          brokerageName: billingContext.brokerageName,
          audience: campaignInput.audience,
          offer: campaignInput.offer ?? "",
          region: campaignInput.region ?? "",
          differentiator,
          objections: objections ?? null,
          contractType: contractType ?? null,
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
          approvalStatus: billingContext.role === "seller" ? "pending" : "not_required",
          metaCampaignId: input.metaCampaignId,
          metaAdSetId: input.metaAdSetId,
          metaAdId: input.metaAdId,
          dailyBudget: input.dailyBudget ?? null
        },
        campaign: persistedCampaign
      };

      savedCampaign = await saveCampaignForCurrentUser(campaignToSave);
    } catch (saveError) {
      console.error("Nao foi possivel salvar a campanha gerada.", saveError);
    }

    const creativeRequest = await maybeCreateCreativeRequest(input, persistedCampaign);

    return NextResponse.json({
      campaign: persistedCampaign,
      creativeRequest,
      savedCampaign,
      aiBalance: remainingCredits
    });
  } catch (error) {
    const { message, status } = getCampaignError(error);

    logApiError({
      route: "/api/campaigns/generate",
      operation: "GENERATE_CAMPAIGN",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function parseCampaignRequest(
  body: z.infer<typeof campaignRequestSchema>,
  connectedAccountId: string | null
): CampaignRequestInput {
  const audience = body.audience;
  const offer = body.offer;
  const region = body.region;
  const differentiator = body.differentiator;
  const objections = getOptionalString(body.objections);
  const contractType = getOptionalString(body.contractType);
  const tone = body.tone;
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
    objections,
    contractType,
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
    dailyBudget: typeof body.dailyBudget === "number" ? body.dailyBudget : null,
    constraints: [
      `Diferencial informado: ${differentiator}`,
      objections ? `Principais objecoes a quebrar: ${objections}` : "",
      contractType ? `Tipo de contratacao ou foco: ${contractType}` : "",
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

  // "paused" e o modo de publicacao escolhido (intencao), guardado em publish_mode.
  // No momento da geracao nada foi para a Meta ainda, entao publication_status NAO
  // pode ser "paused" (esse estado significa "pausada na Meta de verdade" e so e
  // gravado pelo fluxo de publish junto com meta_campaign_id). Antes disso a campanha
  // esta apenas pronta para preparar/publicar.
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
  if (error instanceof ApiRouteError) {
    return {
      message: error.message,
      status: getErrorStatus(error)
    };
  }

  if (error instanceof EnvValidationError) {
    return {
      message: error.message,
      status: 503
    };
  }

  if (error instanceof LeadHealthOpenAIError) {
    return {
      message: error.message,
      status: error.code === "missing_api_key" ? 503 : 502
    };
  }

  if (error instanceof AiCreditsError) {
    return {
      message: error.message,
      status: 400
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
