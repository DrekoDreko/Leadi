import "server-only";

import sharp from "sharp";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import {
  getMetaGraphApiVersion
} from "@/lib/meta/config";
import {
  getMetaConnectionForOrganization,
  resolveMetaAccessTokenForOrganization,
  getMetaConnectionForProfile,
  resolveMetaAccessTokenForProfile
} from "@/lib/integrations/repository.server";
import {
  parseCampaignInputPayload,
  parseCampaignResultPayload
} from "@/lib/campaigns/payload";
import { isCampaignCopyBlocked, reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
import { getBestAudienceIdForAccount } from "@/lib/meta/custom-audience.server";
import { sanitizeCreativeRequestAttachmentName } from "@/lib/creative-requests/attachments";
import type { CampaignHistoryItem, CampaignPublicationStatus, CampaignPublishMode, CampaignApprovalStatus } from "@/lib/campaigns/types";

type CampaignRow = {
  id: string;
  organization_id: string;
  created_by_profile_id: string;
  status: "generated" | "archived";
  connected_account_id: string | null;
  meta_page_id: string | null;
  meta_ad_account_id: string | null;
  meta_lead_form_id: string | null;
  publish_mode: CampaignPublishMode;
  publication_status: CampaignPublicationStatus;
  approval_status: CampaignApprovalStatus;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  publication_message: string | null;
  prepared_at: string | null;
  published_at: string | null;
  last_publication_attempt_at: string | null;
  last_publication_error: string | null;
  product: string;
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
  tone: string;
  campaign_name: string;
  primary_text: string;
  headline: string;
  description: string;
  call_to_action: string;
  suggested_audience: string;
  variants: Json;
  compliance_notes: Json;
  input_payload: Json;
  result_payload: Json;
  created_at: string;
  updated_at: string;
};

type CampaignPublicationAttemptRow = {
  id: string;
  organization_id: string;
  campaign_id: string;
  connected_account_id: string | null;
  created_by_profile_id: string;
  publish_mode: CampaignPublishMode;
  status: "pending" | "success" | "failed" | "skipped";
  request_payload: Json;
  response_payload: Json;
  error_message: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
  created_at: string;
  updated_at: string;
};

type MetaPermissionRow = {
  permission?: string;
  status?: string;
};

type MetaCampaignCreateResponse = {
  id?: string;
  success?: boolean;
};

type MetaMarketingPublicationInput = {
  organizationId: string;
  campaignId: string;
  createdByProfileId: string;
  // Quando definido, só permite publicar campanhas criadas por esse perfil (consultor
  // publicando a própria campanha). null = sem restrição (owner/admin).
  restrictToCreatorProfileId?: string | null;
  publishMode?: CampaignPublishMode;
  dailyBudget?: number;
  // Quanto o corretor considera que vale um lead (R$). Usado para calcular o piso
  // diário de orçamento necessário para o conjunto sair da fase de aprendizado.
  cplTarget?: number;
  // Mudança 2: quando true, cria uma campanha nova mesmo existindo uma
  // reaproveitável para a mesma praça (opt-out). Reinicia o aprendizado.
  forceNewCampaign?: boolean;
  // Mudança 3: como resolver o conflito quando forceNewCampaign encontra uma
  // campanha concorrente ativa. "replace" pausa a(s) antiga(s) antes de publicar.
  conflictResolution?: "replace";
};

// Resumo de uma campanha concorrente ativa (mesma praça), devolvido ao bloquear
// uma publicação duplicada (Mudança 3).
export type CompetingCampaignSummary = {
  id: string;
  metaCampaignId: string | null;
  campaignName: string;
  metaAdSetId: string | null;
  optimizationGoal: string | null;
};

// Erro de bloqueio: já existe campanha ativa concorrente na mesma praça. Carrega as
// concorrentes para a UI oferecer as duas saídas (adicionar à existente / pausar a
// antiga e publicar a nova).
export class DuplicateCampaignError extends Error {
  public readonly status = 409;
  public readonly code = "duplicate_campaign";
  public readonly competitors: CompetingCampaignSummary[];

  constructor(competitors: CompetingCampaignSummary[]) {
    super(
      "Já existe uma campanha ativa para a mesma praça. Adicione o criativo a ela ou pause a antiga antes de publicar uma nova."
    );
    this.name = "DuplicateCampaignError";
    this.competitors = competitors;
  }
}

// CPL padrão (R$) para plano de saúde empresarial quando o corretor não informa.
const DEFAULT_CPL_TARGET_REAIS = 40;

// A Meta exige ~50 conversões por conjunto por semana para sair do aprendizado.
const LEARNING_CONVERSIONS_PER_WEEK = 50;

// Objetivo de conversão "cheio". Só é sustentável quando o orçamento diário cobre
// o piso (cpl * 50 / 7). Abaixo disso, degradamos para um evento mais barato.
const FULL_OPTIMIZATION_GOAL = "LEAD_GENERATION";

// Cadeia de fallback para o modo degradado (orçamento abaixo do piso). Como o
// destino é formulário instantâneo (destination_type ON_AD), LINK_CLICKS pode ser
// recusado pela Meta; nesse caso caímos para QUALITY_LEAD e, por fim, para o
// objetivo cheio — a própria API arbitra o que é compatível com a estrutura.
const DEGRADED_OPTIMIZATION_GOALS = ["LINK_CLICKS", "QUALITY_LEAD", FULL_OPTIMIZATION_GOAL] as const;

// Calcula o piso de orçamento diário (R$) para sair do aprendizado dado o CPL alvo.
function computeDailyBudgetFloorReais(cplTargetReais: number): number {
  return (cplTargetReais * LEARNING_CONVERSIONS_PER_WEEK) / 7;
}

type MetaMarketingPublicationResult = {
  campaign: CampaignHistoryItem;
  attempt: CampaignPublicationAttemptRow;
};

const REQUIRED_MARKETING_PERMISSION = "ads_management";

// Planos de saude sao Categoria Especial de Anuncio na Meta (Produtos e servicos
// financeiros). Declarar a categoria e obrigatorio para nao haver rejeicao/
// ma-classificacao e impoe restricoes de targeting: sem filtro de idade/genero/CEP
// e raio minimo de 25 km por cidade (ver buildTargeting/resolveGeoLocations).
// A Meta descontinuou a categoria "CREDIT" (subcode 2909060) e agora exige
// "FINANCIAL_PRODUCTS_SERVICES". Se a Meta recusar este valor, o erro retornado
// lista os validos para a conta.
const META_SPECIAL_AD_CATEGORY = "FINANCIAL_PRODUCTS_SERVICES";

// Raio minimo (km) exigido pela Categoria Especial ao segmentar por cidade.
const SPECIAL_CATEGORY_MIN_RADIUS_KM = 25;

export class MetaMarketingPermissionError extends Error {
  public readonly status = 403;

  constructor(message = "A conta Meta conectada nao possui permissao de Marketing API para publicar campanhas.") {
    super(message);
    this.name = "MetaMarketingPermissionError";
  }
}

export async function publishPausedMetaCampaign(
  input: MetaMarketingPublicationInput
): Promise<MetaMarketingPublicationResult> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const supabase = createSupabaseAdminClient();
  const campaign = await loadCampaign(supabase, input.organizationId, input.campaignId);

  if (!campaign) {
    throw new Error("Campanha nao encontrada para esta organizacao.");
  }

  if (
    input.restrictToCreatorProfileId &&
    campaign.created_by_profile_id !== input.restrictToCreatorProfileId
  ) {
    throw new Error("Voce so pode publicar campanhas que voce mesmo criou.");
  }

  if (campaign.approval_status !== "approved" && campaign.approval_status !== "not_required") {
    throw new Error("A campanha precisa ser aprovada antes da publicacao na Meta.");
  }

  const publishMode = input.publishMode ?? campaign.publish_mode ?? "paused";

  // Gate de compliance: risco alto bloqueia a publicacao real na Meta (defense in depth,
  // alem do gate na UI). Drafts nao tocam a Meta, entao nao precisam do bloqueio.
  if (publishMode !== "draft") {
    const complianceReview = reviewCampaignCopyLocally({
      primaryText: campaign.primary_text,
      headline: campaign.headline,
      description: campaign.description,
      callToAction: campaign.call_to_action
    });

    if (isCampaignCopyBlocked(complianceReview)) {
      throw new Error(
        "A campanha tem risco de compliance alto e nao pode ser publicada na Meta. Ajuste o texto do anuncio antes de publicar."
      );
    }
  }
  const requestPayload = buildSanitizedRequestPayload(campaign, publishMode);

  const attempt = await insertAttempt(supabase, {
    organization_id: input.organizationId,
    campaign_id: campaign.id,
    connected_account_id: campaign.connected_account_id,
    created_by_profile_id: input.createdByProfileId,
    publish_mode: publishMode,
    status: "pending",
    request_payload: requestPayload,
    response_payload: {}
  });

  try {
    if (publishMode === "draft") {
      const skippedCampaign = await updateCampaignAfterDraft(supabase, campaign.id);

      const updatedAttempt = await updateAttempt(supabase, attempt.id, {
        status: "skipped",
        response_payload: {
          skipped: true,
          reason: "draft_mode_only",
          publicationStatus: skippedCampaign.publicationStatus
        },
        error_message: null
      });

      return {
        campaign: skippedCampaign,
        attempt: updatedAttempt
      };
    }

    // Quando a campanha foi criada por um consultor com conexão Meta pessoal, publica na
    // conta de anúncios DELE; caso contrário, usa a conexão da corretora.
    const personalConnection = await getMetaConnectionForProfile(campaign.created_by_profile_id);
    const usePersonalConnection = Boolean(personalConnection);

    const connection =
      personalConnection ?? (await getMetaConnectionForOrganization(input.organizationId));
    if (!connection) {
      throw new Error(
        usePersonalConnection
          ? "Conexao Meta pessoal do consultor nao encontrada."
          : "Conexao Meta nao encontrada para esta organizacao."
      );
    }

    const accessToken = usePersonalConnection
      ? await resolveMetaAccessTokenForProfile(campaign.created_by_profile_id)
      : await resolveMetaAccessTokenForOrganization(input.organizationId);
    if (!accessToken) {
      throw new Error("A conexao Meta nao possui um access token valido.");
    }

    await ensureMetaMarketingPermission(accessToken);

    if (!campaign.meta_ad_account_id) {
      throw new Error("Selecione uma conta de anuncio antes de publicar a campanha.");
    }

    // Orcamento diario (centavos) fica no nivel da CAMPANHA (Advantage Campaign
    // Budget / CBO). Assim o limite e aplicado a campanha inteira — exatamente o
    // que a UI promete ("valor maximo que a campanha pode gastar por dia") — em
    // vez de ficar no conjunto, onde a campanha aparecia "sem limite" na Meta.
    const dailyBudgetCents = input.dailyBudget
      ? Math.round(input.dailyBudget * 100)
      : 2000;

    // Mudanca 1: o objetivo de otimizacao do conjunto passa a depender do
    // orcamento. Com orcamento abaixo do piso de aprendizado (cpl * 50 / 7), o
    // objetivo cheio (LEAD_GENERATION) nunca acumula as ~50 conversoes/semana e a
    // entrega estrangula. Nesse caso degradamos para um evento mais barato para o
    // algoritmo acumular volume e sair do aprendizado — o formulario continua sendo
    // o destino e os leads continuam sendo capturados.
    const cplTargetReais =
      input.cplTarget && input.cplTarget > 0 ? input.cplTarget : DEFAULT_CPL_TARGET_REAIS;
    const dailyBudgetReais = dailyBudgetCents / 100;
    const isBudgetBelowLearningFloor =
      dailyBudgetReais < computeDailyBudgetFloorReais(cplTargetReais);
    const optimizationGoalCandidates = isBudgetBelowLearningFloor
      ? DEGRADED_OPTIMIZATION_GOALS
      : [FULL_OPTIMIZATION_GOAL];

    // Segmentacao real por localizacao, resolvida ANTES de criar a campanha para
    // decidir reaproveitamento (Mudanca 2) e detectar duplicatas (Mudanca 3).
    const geoLocations = await resolveGeoLocations(accessToken, campaign.region);
    const geoSignature = buildGeoSignature(geoLocations);

    // Mudanca 3: se o corretor forcou campanha nova mas ja ha uma concorrente ativa
    // na mesma praca, bloquear (e devolver as opcoes) — a menos que ele ja tenha
    // escolhido pausar a antiga. Nunca publicar duas em paralelo silenciosamente.
    if (input.forceNewCampaign) {
      const competitors = await findCompetingActiveCampaigns(
        supabase,
        input.organizationId,
        geoSignature,
        campaign.id
      );
      if (competitors.length > 0) {
        if (input.conflictResolution === "replace") {
          for (const competitor of competitors) {
            if (competitor.metaCampaignId) {
              await pauseMetaObject(accessToken, competitor.metaCampaignId);
              await markCampaignPausedLocally(supabase, competitor.id);
            }
          }
        } else {
          throw new DuplicateCampaignError(competitors);
        }
      }
    }

    // Mudanca 2: reaproveitar campanha+conjunto ativos da mesma praca em vez de
    // criar estrutura nova a cada publicacao (o que zerava o aprendizado e
    // fragmentava o orcamento). Opt-out via forceNewCampaign.
    const reusable = input.forceNewCampaign
      ? null
      : await findReusableCampaign(supabase, input.organizationId, geoSignature, campaign.id);

    let metaCampaignId: string;
    let resolvedOptimizationGoal: string | null = reusable?.optimizationGoal ?? null;

    if (reusable) {
      metaCampaignId = reusable.metaCampaignId;
    } else {
      const metaCampaign = await createPausedMetaCampaign({
        accessToken,
        adAccountId: campaign.meta_ad_account_id,
        campaignName: campaign.campaign_name,
        dailyBudgetCents
      });

      if (!metaCampaign.id) {
        throw new Error("A Meta nao retornou o ID da campanha criada.");
      }
      metaCampaignId = metaCampaign.id;
    }

    let metaAdSetId: string | null = reusable?.metaAdSetId ?? null;
    let metaAdCreativeId: string | null = null;
    let metaAdId: string | null = null;

    const orgWebsite = await loadOrganizationWebsite(supabase, input.organizationId);

    // Tipo de criativo escolhido no gerador (carrossel x imagem unica) e regiao
    // vem do payload de input persistido da campanha.
    const inputForm = parseCampaignInputPayload(campaign);
    const isCarousel = inputForm.creativeAssetType === "carrossel";

    const creativeHashes = await uploadCampaignCreativesToMeta({
      supabase,
      organizationId: input.organizationId,
      campaignId: campaign.id,
      connectedAccountId: campaign.connected_account_id,
      accessToken,
      adAccountId: campaign.meta_ad_account_id,
      includeCarousel: isCarousel
    });

    const pixelId = await resolveAdAccountPixel(accessToken, campaign.meta_ad_account_id);

    if (campaign.meta_page_id && campaign.meta_lead_form_id) {
      // Conjunto novo apenas quando NAO ha reaproveitamento; caso contrario
      // reutiliza o conjunto existente e cria so o anuncio novo dentro dele.
      if (!reusable) {
        // Mudanca 6: usa o Lookalike/Custom Audience da carteira quando houver.
        const audienceId = await getBestAudienceIdForAccount(
          supabase,
          input.organizationId,
          campaign.meta_ad_account_id
        );
        const customAudienceIds = audienceId ? [audienceId] : [];

        let adSet;
        try {
          adSet = await createPausedAdSet({
            accessToken,
            adAccountId: campaign.meta_ad_account_id,
            campaignId: metaCampaignId,
            name: `${campaign.campaign_name} - Conjunto`,
            pageId: campaign.meta_page_id,
            leadFormId: campaign.meta_lead_form_id,
            geoLocations,
            optimizationGoalCandidates,
            customAudienceIds
          });
        } catch (adSetError) {
          // Fallback Mudanca 6: publico personalizado recusado (ex.: Categoria
          // Especial) → recria o conjunto com targeting aberto, sem quebrar.
          if (customAudienceIds.length > 0) {
            adSet = await createPausedAdSet({
              accessToken,
              adAccountId: campaign.meta_ad_account_id,
              campaignId: metaCampaignId,
              name: `${campaign.campaign_name} - Conjunto`,
              pageId: campaign.meta_page_id,
              leadFormId: campaign.meta_lead_form_id,
              geoLocations,
              optimizationGoalCandidates
            });
          } else {
            throw adSetError;
          }
        }
        metaAdSetId = adSet.id ?? null;
        resolvedOptimizationGoal = adSet.optimizationGoal;
      }

      if (metaAdSetId) {
        // Carrossel exige >= 2 imagens; caso contrario cai no fluxo de imagem unica.
        const carouselImageHashes =
          isCarousel && creativeHashes.carouselHashes.length >= 2
            ? creativeHashes.carouselHashes
            : null;

        const adCreative = await createAdCreative({
          accessToken,
          adAccountId: campaign.meta_ad_account_id,
          name: `${campaign.campaign_name} - Criativo`,
          pageId: campaign.meta_page_id,
          leadFormId: campaign.meta_lead_form_id!,
          link: orgWebsite,
          feedImageHash: creativeHashes.feedHash,
          verticalImageHash: creativeHashes.verticalHash,
          carouselImageHashes,
          primaryText: campaign.primary_text,
          headline: campaign.headline,
          description: campaign.description,
          callToAction: campaign.call_to_action
        });
        metaAdCreativeId = adCreative.id ?? null;

        if (metaAdCreativeId) {
          const ad = await createPausedAd({
            accessToken,
            adAccountId: campaign.meta_ad_account_id,
            adSetId: metaAdSetId,
            creativeId: metaAdCreativeId,
            name: `${campaign.campaign_name} - Anuncio`,
            pixelId
          });
          metaAdId = ad.id ?? null;
        }
      }
    }

    const updatedCampaign = await updateCampaignAfterPublication(supabase, campaign.id, {
      metaCampaignId,
      metaAdSetId,
      metaAdId,
      geoSignature,
      optimizationGoal: resolvedOptimizationGoal,
      reusedExisting: Boolean(reusable)
    });

    const updatedAttempt = await updateAttempt(supabase, attempt.id, {
      status: "success",
      response_payload: buildSanitizedResponsePayload({
        metaCampaignId,
        metaAdSetId,
        metaAdCreativeId,
        metaAdId,
        success: true,
        status: "PAUSED"
      }),
      error_message: null,
      meta_campaign_id: metaCampaignId,
      meta_adset_id: metaAdSetId,
      meta_ad_id: metaAdId
    });

    return {
      campaign: updatedCampaign,
      attempt: updatedAttempt
    };
  } catch (error) {
    const failureMessage = error instanceof Error && error.message
      ? error.message
      : "Nao foi possivel publicar a campanha na Meta agora.";

    await updateAttempt(supabase, attempt.id, {
      status: "failed",
      response_payload: buildSanitizedResponsePayload({
        error: failureMessage
      }),
      error_message: failureMessage
    });

    await updateCampaignAfterFailure(supabase, campaign.id, failureMessage);

    if (isMissingMarketingPermissionError(error)) {
      throw new MetaMarketingPermissionError(failureMessage);
    }

    throw new Error(failureMessage, { cause: error });
  }
}

const FALLBACK_WEBSITE = "https://www.example.com";

async function loadOrganizationWebsite(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string
): Promise<string> {
  const { data } = await supabase
    .from("organizations")
    .select("website")
    .eq("id", organizationId)
    .maybeSingle();

  const website = data?.website?.trim();
  if (!website) return FALLBACK_WEBSITE;
  return website.startsWith("http") ? website : `https://${website}`;
}

async function loadCampaign(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  campaignId: string
) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CampaignRow | null) ?? null;
}

async function insertAttempt(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  input: {
    organization_id: string;
    campaign_id: string;
    connected_account_id: string | null;
    created_by_profile_id: string;
    publish_mode: CampaignPublishMode;
    status: "pending";
    request_payload: Json;
    response_payload: Json;
  }
) {
  const { data, error } = await supabase
    .from("meta_campaign_publication_attempts")
    .insert(input)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar a tentativa de publicacao.");
  }

  return data as CampaignPublicationAttemptRow;
}

async function updateAttempt(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  attemptId: string,
  values: {
    status: "pending" | "success" | "failed" | "skipped";
    response_payload: Json;
    error_message: string | null;
    meta_campaign_id?: string | null;
    meta_adset_id?: string | null;
    meta_ad_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("meta_campaign_publication_attempts")
    .update(values)
    .eq("id", attemptId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel atualizar a tentativa de publicacao.");
  }

  return data as CampaignPublicationAttemptRow;
}

async function updateCampaignAfterDraft(supabase: ReturnType<typeof createSupabaseAdminClient>, campaignId: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      publication_status: "draft_created",
      publication_message: "Rascunho mantido localmente. A publicacao na Meta nao foi executada.",
      last_publication_attempt_at: new Date().toISOString(),
      last_publication_error: null,
      prepared_at: new Date().toISOString()
    })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel atualizar o rascunho da campanha.");
  }

  return mapCampaignRowToHistoryItem(data as CampaignRow);
}

async function updateCampaignAfterPublication(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  campaignId: string,
  input: {
    metaCampaignId: string | null;
    metaAdSetId?: string | null;
    metaAdId?: string | null;
    geoSignature?: string | null;
    optimizationGoal?: string | null;
    reusedExisting?: boolean;
  }
) {
  const hasFullStack = Boolean(input.metaCampaignId && input.metaAdSetId && input.metaAdId);
  const reusedMessage = input.reusedExisting
    ? "Anuncio adicionado a uma campanha/conjunto ja existente para a mesma praca (reaproveitando o aprendizado)."
    : hasFullStack
      ? "Campanha completa (campanha + conjunto + anuncio) enviada para a Meta em modo pausado."
      : "Campanha enviada para a Meta em modo pausado. A ativacao continua manual ate a equipe liberar a veiculacao.";
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      publication_status: "paused",
      publication_message: reusedMessage,
      meta_campaign_id: input.metaCampaignId,
      meta_adset_id: input.metaAdSetId ?? null,
      meta_ad_id: input.metaAdId ?? null,
      meta_geo_signature: input.geoSignature ?? null,
      meta_optimization_goal: input.optimizationGoal ?? null,
      published_at: new Date().toISOString(),
      last_publication_attempt_at: new Date().toISOString(),
      last_publication_error: null,
      prepared_at: new Date().toISOString()
    })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel atualizar a campanha publicada.");
  }

  return mapCampaignRowToHistoryItem(data as CampaignRow);
}

async function updateCampaignAfterFailure(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  campaignId: string,
  message: string
) {
  const { error } = await supabase
    .from("campaigns")
    .update({
      publication_status: "failed",
      publication_message: "Falha ao publicar a campanha na Meta.",
      last_publication_attempt_at: new Date().toISOString(),
      last_publication_error: message
    })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function ensureMetaMarketingPermission(accessToken: string) {
  const response = await fetch(
    new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}/me/permissions`),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store"
    }
  );

  const payload = (await response.json().catch(() => null)) as {
    data?: MetaPermissionRow[];
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message
        ? `Falha ao validar permissao da Meta: ${payload.error.message}`
        : `Falha ao validar permissao da Meta: status ${response.status}.`
    );
  }

  const permissions = payload?.data ?? [];
  const hasMarketingPermission = permissions.some(
    (item) =>
      item.permission === REQUIRED_MARKETING_PERMISSION &&
      String(item.status ?? "").toLowerCase() === "granted"
  );

  if (!hasMarketingPermission) {
    throw new MetaMarketingPermissionError(
      "A conta Meta conectada nao possui a permissao ads_management para publicar campanhas."
    );
  }
}

async function createPausedMetaCampaign(input: {
  accessToken: string;
  adAccountId: string;
  campaignName: string;
  dailyBudgetCents: number;
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/campaigns`
  );

  const body = new URLSearchParams();
  body.set("name", input.campaignName);
  body.set("objective", "OUTCOME_LEADS");
  body.set("status", "PAUSED");
  body.set("special_ad_categories", JSON.stringify([META_SPECIAL_AD_CATEGORY]));
  // Orcamento no nivel da campanha (Advantage Campaign Budget): a Meta limita o
  // gasto diario da campanha inteira e distribui entre os conjuntos. Com isso o
  // conjunto NAO pode ter daily_budget proprio (ver createPausedAdSet).
  body.set("daily_budget", String(input.dailyBudgetCents));
  body.set("bid_strategy", "LOWEST_COST_WITHOUT_CAP");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as MetaCampaignCreateResponse | {
    error?: { message?: string; error_user_msg?: string; error_subcode?: number };
  } | null;

  if (!response.ok) {
    const metaError = (payload as { error?: { message?: string; error_user_msg?: string; error_subcode?: number } } | null)?.error;
    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    throw new Error(
      detail
        ? `Falha ao publicar campanha pausada na Meta: ${detail}${suffix}`
        : `Falha ao publicar campanha pausada na Meta: status ${response.status}.`
    );
  }

  return payload as MetaCampaignCreateResponse;
}

// Estrutura de geo_locations da Meta. Para Categoria Especial usamos cidades com
// raio (>= 25 km) e/ou regioes (estados); o fallback e o pais inteiro (Brasil).
type MetaGeoLocations = {
  countries?: string[];
  regions?: Array<{ key: string }>;
  cities?: Array<{ key: string; radius: number; distance_unit: "kilometer" }>;
};

const FALLBACK_GEO_LOCATIONS: MetaGeoLocations = { countries: ["BR"] };

// Resolve o texto livre de regiao da campanha (ex.: "Recife, Fortaleza") em
// geo_locations reais via Targeting Search API da Meta. Best-effort: qualquer
// falha cai no fallback de pais inteiro (Brasil), preservando o comportamento
// anterior em vez de quebrar a publicacao.
async function resolveGeoLocations(
  accessToken: string,
  regionText: string | null | undefined
): Promise<MetaGeoLocations> {
  const tokens = (regionText ?? "")
    .split(/[,\n;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (tokens.length === 0) {
    return FALLBACK_GEO_LOCATIONS;
  }

  const version = getMetaGraphApiVersion();
  const cities: MetaGeoLocations["cities"] = [];
  const regions: MetaGeoLocations["regions"] = [];
  const seenKeys = new Set<string>();

  for (const token of tokens) {
    try {
      const url = new URL(`https://graph.facebook.com/${version}/search`);
      url.searchParams.set("type", "adgeolocation");
      url.searchParams.set("location_types", JSON.stringify(["city", "region"]));
      url.searchParams.set("q", token);
      url.searchParams.set("limit", "10");
      url.searchParams.set("access_token", accessToken);

      const response = await fetch(url, { method: "GET", cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as {
        data?: Array<{ key?: string; type?: string; country_code?: string }>;
      } | null;

      if (!response.ok || !payload?.data?.length) continue;

      // Prioriza matches no Brasil; se nao houver, usa o primeiro retornado.
      const matches = payload.data;
      const match =
        matches.find((entry) => entry.country_code === "BR") ?? matches[0];

      if (!match?.key || seenKeys.has(match.key)) continue;
      seenKeys.add(match.key);

      if (match.type === "city") {
        cities.push({
          key: match.key,
          radius: SPECIAL_CATEGORY_MIN_RADIUS_KM,
          distance_unit: "kilometer"
        });
      } else if (match.type === "region") {
        regions.push({ key: match.key });
      }
    } catch {
      // Token nao resolvido: ignora e segue para os demais.
    }
  }

  if (cities.length === 0 && regions.length === 0) {
    return FALLBACK_GEO_LOCATIONS;
  }

  const geoLocations: MetaGeoLocations = {};
  if (cities.length > 0) geoLocations.cities = cities;
  if (regions.length > 0) geoLocations.regions = regions;
  return geoLocations;
}

// Assinatura normalizada da segmentacao geo: conjunto ordenado das keys de
// cities/regions/countries. Torna o casamento de praca deterministico (Mudanca 2/3),
// independente do texto livre digitado pelo corretor.
function buildGeoSignature(geo: MetaGeoLocations): string {
  const keys: string[] = [];
  for (const city of geo.cities ?? []) keys.push(`city:${city.key}`);
  for (const region of geo.regions ?? []) keys.push(`region:${region.key}`);
  for (const country of geo.countries ?? []) keys.push(`country:${country}`);
  return Array.from(new Set(keys)).sort().join("|");
}

// Ha interseccao de praca entre duas assinaturas (alguma key em comum)?
function geoSignaturesIntersect(a: string, b: string): boolean {
  if (!a || !b) return false;
  const setB = new Set(b.split("|").filter(Boolean));
  return a
    .split("|")
    .filter(Boolean)
    .some((key) => setB.has(key));
}

type ReusableCampaignRow = {
  id: string;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  campaign_name: string;
  meta_optimization_goal: string | null;
  meta_effective_status: string | null;
  publication_status: string | null;
};

// Statuses da Meta que indicam campanha efetivamente disputando o leilao. Quando o
// status ainda nao foi reconciliado (null), tratamos como NAO ativa para evitar
// bloqueios falsos (Mudanca 3).
const ACTIVE_EFFECTIVE_STATUSES = new Set([
  "ACTIVE",
  "IN_PROCESS",
  "LEARNING",
  "PENDING_REVIEW",
  "PENDING_BILLING_INFO"
]);

// Mudanca 2: campanha reaproveitavel = mesma organizacao, MESMA praca (assinatura
// identica), com campanha+conjunto ja criados na Meta e nao arquivada. Reutiliza a
// mais recente para nao zerar o aprendizado.
async function findReusableCampaign(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  geoSignature: string,
  excludeCampaignId: string
): Promise<{
  id: string;
  metaCampaignId: string;
  metaAdSetId: string;
  campaignName: string;
  optimizationGoal: string | null;
} | null> {
  if (!geoSignature) return null;

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, meta_campaign_id, meta_adset_id, campaign_name, meta_optimization_goal")
    .eq("organization_id", organizationId)
    .eq("meta_geo_signature", geoSignature)
    .eq("status", "generated")
    .neq("id", excludeCampaignId)
    .not("meta_campaign_id", "is", null)
    .not("meta_adset_id", "is", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = (data?.[0] as ReusableCampaignRow | undefined) ?? null;
  if (!row?.meta_campaign_id || !row.meta_adset_id) {
    return null;
  }

  return {
    id: row.id,
    metaCampaignId: row.meta_campaign_id,
    metaAdSetId: row.meta_adset_id,
    campaignName: row.campaign_name,
    optimizationGoal: row.meta_optimization_goal
  };
}

// Mudanca 3: campanhas concorrentes = mesma organizacao, ATIVAS na Meta, com
// interseccao de praca (mesmo objetivo — todas usam OUTCOME_LEADS). Idade/genero
// nao entram na chave porque a Categoria Especial nunca os envia.
async function findCompetingActiveCampaigns(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  geoSignature: string,
  excludeCampaignId: string
): Promise<CompetingCampaignSummary[]> {
  if (!geoSignature) return [];

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id, meta_campaign_id, meta_adset_id, campaign_name, meta_optimization_goal, meta_effective_status, meta_geo_signature"
    )
    .eq("organization_id", organizationId)
    .eq("status", "generated")
    .neq("id", excludeCampaignId)
    .not("meta_campaign_id", "is", null)
    .not("meta_geo_signature", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as Array<ReusableCampaignRow & { meta_geo_signature: string | null }>) ?? [];
  return rows
    .filter((row) => ACTIVE_EFFECTIVE_STATUSES.has(row.meta_effective_status ?? ""))
    .filter((row) => geoSignaturesIntersect(geoSignature, row.meta_geo_signature ?? ""))
    .map((row) => ({
      id: row.id,
      metaCampaignId: row.meta_campaign_id,
      metaAdSetId: row.meta_adset_id,
      campaignName: row.campaign_name,
      optimizationGoal: row.meta_optimization_goal
    }));
}

// Pausa um objeto da Meta (campanha) via POST /{id}. Inline para nao criar
// dependencia circular com campaign-controls.server (que importa deste modulo).
async function pauseMetaObject(accessToken: string, objectId: string): Promise<void> {
  const url = new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}/${objectId}`);
  const body = new URLSearchParams();
  body.set("status", "PAUSED");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string; error_user_msg?: string };
    } | null;
    const detail = payload?.error?.error_user_msg || payload?.error?.message;
    throw new Error(
      detail
        ? `Falha ao pausar a campanha concorrente na Meta: ${detail}`
        : `Falha ao pausar a campanha concorrente na Meta: status ${response.status}.`
    );
  }
}

// Reflete localmente que a campanha concorrente foi pausada (Mudanca 3, opcao
// "pausar a antiga").
async function markCampaignPausedLocally(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  campaignId: string
): Promise<void> {
  await supabase
    .from("campaigns")
    .update({
      meta_effective_status: "CAMPAIGN_PAUSED",
      publication_message:
        "Campanha pausada automaticamente ao publicar uma nova para a mesma praca (evita concorrencia no leilao).",
      updated_at: new Date().toISOString()
    })
    .eq("id", campaignId);
}

// Erros da Meta que indicam apenas incompatibilidade do optimization_goal com a
// estrutura do conjunto (ex.: LINK_CLICKS x formulario instantaneo ON_AD). Nesses
// casos vale tentar o proximo objetivo candidato; outros erros sao definitivos.
const OPTIMIZATION_GOAL_INCOMPATIBILITY_SUBCODES = new Set([1487870, 1487390, 2446404]);

function isOptimizationGoalIncompatibility(
  metaError: { message?: string; error_user_msg?: string; error_subcode?: number } | undefined
): boolean {
  if (!metaError) return false;
  if (metaError.error_subcode && OPTIMIZATION_GOAL_INCOMPATIBILITY_SUBCODES.has(metaError.error_subcode)) {
    return true;
  }
  const text = `${metaError.message ?? ""} ${metaError.error_user_msg ?? ""}`.toLowerCase();
  return text.includes("optimization") || text.includes("otimiza");
}

async function createPausedAdSet(input: {
  accessToken: string;
  adAccountId: string;
  campaignId: string;
  name: string;
  pageId: string;
  leadFormId: string;
  geoLocations: MetaGeoLocations;
  // Objetivos de otimizacao a tentar em ordem (Mudanca 1). O primeiro compativel
  // com a estrutura vence; a propria Meta arbitra via erro de incompatibilidade.
  optimizationGoalCandidates: readonly string[];
  // Mudanca 6: publico(s) personalizado(s) (Lookalike/Custom Audience) a incluir no
  // targeting. Vazio = targeting aberto (fallback).
  customAudienceIds?: readonly string[];
}): Promise<MetaCampaignCreateResponse & { optimizationGoal: string }> {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/adsets`
  );

  const candidates =
    input.optimizationGoalCandidates.length > 0
      ? input.optimizationGoalCandidates
      : ["LEAD_GENERATION"];

  let lastError: Error | null = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const optimizationGoal = candidates[index];
    const isLastCandidate = index === candidates.length - 1;

    const body = new URLSearchParams();
    body.set("campaign_id", input.campaignId);
    body.set("name", input.name);
    body.set("billing_event", "IMPRESSIONS");
    body.set("optimization_goal", optimizationGoal);
    // Orcamento e estrategia de lance ficam na CAMPANHA (CBO). O conjunto nao pode
    // ter daily_budget/bid_strategy proprios — a Meta rejeitaria com erro.
    body.set("status", "PAUSED");
    body.set("destination_type", "ON_AD");
    body.set("promoted_object", JSON.stringify({
      page_id: input.pageId
    }));
    // Categoria Especial (Credito/Seguros): proibido filtrar por idade/genero/CEP.
    // Por isso o targeting leva apenas a localizacao (cidades com raio >= 25 km
    // e/ou estados), sem age_min/genders. Mudanca 4: restringimos os
    // posicionamentos a Facebook + Instagram no nivel do conjunto (para todos os
    // tipos de criativo), tirando a Audience Network do Advantage+ padrao — que
    // costuma trazer trafego de baixa intencao (ex.: rewarded video) para B2B.
    const targeting: Record<string, unknown> = {
      geo_locations: input.geoLocations,
      publisher_platforms: ["facebook", "instagram"]
    };
    // Mudanca 6: usa o publico personalizado quando disponivel. Sob Categoria
    // Especial a Meta pode recusar — o chamador tem fallback para targeting aberto.
    if (input.customAudienceIds && input.customAudienceIds.length > 0) {
      targeting.custom_audiences = input.customAudienceIds.map((id) => ({ id }));
    }
    body.set("targeting", JSON.stringify(targeting));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
      cache: "no-store"
    });

    const payload = (await response.json().catch(() => null)) as MetaCampaignCreateResponse | {
      error?: { message?: string; error_user_msg?: string; error_subcode?: number };
    } | null;

    if (response.ok) {
      return { ...(payload as MetaCampaignCreateResponse), optimizationGoal };
    }

    const metaError = (payload as { error?: { message?: string; error_user_msg?: string; error_subcode?: number } } | null)?.error;
    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    lastError = new Error(
      detail
        ? `Falha ao criar conjunto de anuncios na Meta: ${detail}${suffix}`
        : `Falha ao criar conjunto de anuncios na Meta: status ${response.status}.`
    );

    // Se foi so incompatibilidade do objetivo e ainda ha candidatos, tenta o proximo.
    if (!isLastCandidate && isOptimizationGoalIncompatibility(metaError)) {
      continue;
    }

    throw lastError;
  }

  // Inalcancavel (o loop sempre retorna ou lanca), mas satisfaz o type-checker.
  throw lastError ?? new Error("Falha ao criar conjunto de anuncios na Meta.");
}

const FEED_ASSET_LABEL = "feed_asset";
const VERTICAL_ASSET_LABEL = "vertical_asset";

// Resolve a conta do Instagram que vai representar a empresa nos posicionamentos
// do Instagram (stories/reels/feed). Sem ela, a Meta recusa o criativo/anuncio
// com o subcode 1772103. Ordem: conta business conectada -> conta conectada
// legada -> conta lastreada pela Pagina (PBIA) existente -> cria uma PBIA nova.
//
// Importante: tanto listar quanto criar uma PBIA exigem um Page Access Token,
// nao o token do usuario/organizacao. Por isso buscamos o access_token da
// Pagina antes (campo so retorna quando o token tem permissao sobre a Pagina).
async function resolveInstagramUserId(input: {
  accessToken: string;
  pageId: string;
}): Promise<string | null> {
  const version = getMetaGraphApiVersion();
  let pageAccessToken = input.accessToken;

  try {
    const fieldsUrl = new URL(`https://graph.facebook.com/${version}/${input.pageId}`);
    fieldsUrl.searchParams.set(
      "fields",
      "access_token,instagram_business_account,connected_instagram_account"
    );

    const response = await fetch(fieldsUrl, {
      headers: { Authorization: `Bearer ${input.accessToken}` },
      cache: "no-store"
    });

    const data = (await response.json().catch(() => null)) as {
      access_token?: string;
      instagram_business_account?: { id?: string };
      connected_instagram_account?: { id?: string };
    } | null;

    if (response.ok && data) {
      if (data.access_token) {
        pageAccessToken = data.access_token;
      }

      const businessId = data.instagram_business_account?.id;
      if (businessId) return businessId;

      const connectedId = data.connected_instagram_account?.id;
      if (connectedId) return connectedId;
    }
  } catch {
    // segue para tentar a PBIA abaixo com o token disponivel
  }

  // Lista PBIAs existentes (precisa do Page Access Token).
  try {
    const listUrl = new URL(
      `https://graph.facebook.com/${version}/${input.pageId}/page_backed_instagram_accounts`
    );

    const response = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      cache: "no-store"
    });

    const data = (await response.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
    } | null;

    const pbiaId = response.ok ? data?.data?.[0]?.id : undefined;
    if (pbiaId) return pbiaId;
  } catch {
    // segue para criar uma PBIA nova
  }

  // Cria uma PBIA (precisa do Page Access Token).
  try {
    const createUrl = new URL(
      `https://graph.facebook.com/${version}/${input.pageId}/page_backed_instagram_accounts`
    );

    const response = await fetch(createUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      cache: "no-store"
    });

    const created = (await response.json().catch(() => null)) as {
      id?: string;
      error?: { message?: string; error_user_msg?: string };
    } | null;

    if (response.ok && created?.id) {
      return created.id;
    }

    console.error("[meta] falha ao criar PBIA", {
      pageId: input.pageId,
      status: response.status,
      error: created?.error?.error_user_msg || created?.error?.message
    });
  } catch (error) {
    console.error("[meta] erro ao criar PBIA", { pageId: input.pageId, error });
  }

  return null;
}

async function createAdCreative(input: {
  accessToken: string;
  adAccountId: string;
  name: string;
  pageId: string;
  leadFormId: string;
  link: string;
  feedImageHash: string | null;
  verticalImageHash: string | null;
  carouselImageHashes: string[] | null;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/adcreatives`
  );

  const ctaType = mapCallToActionType(input.callToAction);

  const instagramUserId = await resolveInstagramUserId({
    accessToken: input.accessToken,
    pageId: input.pageId
  });

  const body = new URLSearchParams();
  body.set("name", input.name);

  const hasCarousel = Boolean(input.carouselImageHashes && input.carouselImageHashes.length >= 2);
  const hasBothPlacements = Boolean(input.feedImageHash && input.verticalImageHash);

  if (hasCarousel) {
    // Carrossel: um cartao por imagem. O CTA com lead_gen_form_id fica no nivel
    // do link_data (vale para todos os cartoes do carrossel de Lead Ads).
    const childAttachments = (input.carouselImageHashes ?? []).map((hash) => ({
      image_hash: hash,
      link: input.link,
      name: input.headline,
      description: input.description
    }));

    const linkData: Record<string, unknown> = {
      link: input.link,
      message: input.primaryText,
      child_attachments: childAttachments,
      multi_share_optimized: true,
      call_to_action: {
        type: ctaType,
        value: { lead_gen_form_id: input.leadFormId }
      }
    };

    const storySpec: Record<string, unknown> = {
      page_id: input.pageId,
      link_data: linkData
    };
    if (instagramUserId) {
      storySpec.instagram_user_id = instagramUserId;
    }

    body.set("object_story_spec", JSON.stringify(storySpec));
  } else if (hasBothPlacements) {
    // Personalizacao por posicionamento: Feed (4:5) para feed/marketplace/explore
    // e Vertical (9:16) para stories/reels. A Meta exige object_story_spec apenas
    // com a page_id quando se usa asset_feed_spec.
    const assetFeedSpec = {
      images: [
        { hash: input.feedImageHash, adlabels: [{ name: FEED_ASSET_LABEL }] },
        { hash: input.verticalImageHash, adlabels: [{ name: VERTICAL_ASSET_LABEL }] }
      ],
      bodies: [{ text: input.primaryText }],
      titles: [{ text: input.headline }],
      descriptions: [{ text: input.description }],
      ad_formats: ["SINGLE_IMAGE"],
      link_urls: [{ website_url: input.link }],
      call_to_actions: [
        { type: ctaType, value: { lead_gen_form_id: input.leadFormId } }
      ],
      asset_customization_rules: [
        {
          priority: 1,
          image_label: { name: FEED_ASSET_LABEL },
          customization_spec: {
            publisher_platforms: ["facebook", "instagram"],
            facebook_positions: ["feed", "marketplace", "video_feeds", "search"],
            instagram_positions: ["stream", "explore", "explore_home"]
          }
        },
        {
          priority: 2,
          image_label: { name: VERTICAL_ASSET_LABEL },
          customization_spec: {
            publisher_platforms: ["facebook", "instagram"],
            facebook_positions: ["story", "facebook_reels"],
            instagram_positions: ["story", "reels"]
          }
        }
      ]
    };

    const storySpec: Record<string, unknown> = { page_id: input.pageId };
    if (instagramUserId) {
      storySpec.instagram_user_id = instagramUserId;
    }

    body.set("object_story_spec", JSON.stringify(storySpec));
    body.set("asset_feed_spec", JSON.stringify(assetFeedSpec));
  } else {
    const singleImageHash = input.feedImageHash ?? input.verticalImageHash;

    const linkData: Record<string, unknown> = {
      link: input.link,
      message: input.primaryText,
      name: input.headline,
      description: input.description,
      call_to_action: {
        type: ctaType,
        value: { lead_gen_form_id: input.leadFormId }
      }
    };

    if (singleImageHash) {
      linkData.image_hash = singleImageHash;
    }

    const storySpec: Record<string, unknown> = {
      page_id: input.pageId,
      link_data: linkData
    };
    if (instagramUserId) {
      storySpec.instagram_user_id = instagramUserId;
    }

    body.set("object_story_spec", JSON.stringify(storySpec));
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as MetaCampaignCreateResponse | {
    error?: { message?: string; error_user_msg?: string; error_subcode?: number };
  } | null;

  if (!response.ok) {
    const metaError = (payload as { error?: { message?: string; error_user_msg?: string; error_subcode?: number } } | null)?.error;
    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    throw new Error(
      detail
        ? `Falha ao criar criativo do anuncio na Meta: ${detail}${suffix}`
        : `Falha ao criar criativo do anuncio na Meta: status ${response.status}.`
    );
  }

  return payload as MetaCampaignCreateResponse;
}

// Resolve o pixel da conta de anuncios para mensuracao de site (best-effort).
// Sem pixel ou em caso de erro retorna null e o anuncio segue sem tracking_specs
// (a campanha de Leads nao depende de pixel).
async function resolveAdAccountPixel(
  accessToken: string,
  adAccountId: string
): Promise<string | null> {
  try {
    const url = new URL(
      `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(adAccountId)}/adspixels`
    );
    url.searchParams.set("fields", "id");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });

    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
    } | null;

    if (response.ok) {
      return payload?.data?.[0]?.id ?? null;
    }
  } catch {
    // Sem pixel acessivel: segue sem tracking_specs.
  }

  return null;
}

async function createPausedAd(input: {
  accessToken: string;
  adAccountId: string;
  adSetId: string;
  creativeId: string;
  name: string;
  pixelId: string | null;
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/ads`
  );

  const body = new URLSearchParams();
  body.set("name", input.name);
  body.set("adset_id", input.adSetId);
  body.set("creative", JSON.stringify({ creative_id: input.creativeId }));
  body.set("status", "PAUSED");

  if (input.pixelId) {
    body.set(
      "tracking_specs",
      JSON.stringify([{ "action.type": ["offsite_conversion"], fb_pixel: [input.pixelId] }])
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as MetaCampaignCreateResponse | {
    error?: { message?: string; error_user_msg?: string; error_subcode?: number };
  } | null;

  if (!response.ok) {
    const metaError = (payload as { error?: { message?: string; error_user_msg?: string; error_subcode?: number } } | null)?.error;
    const detail = metaError?.error_user_msg || metaError?.message;
    const suffix = metaError?.error_subcode ? ` (subcode: ${metaError.error_subcode})` : "";
    throw new Error(
      detail
        ? `Falha ao criar anuncio na Meta: ${detail}${suffix}`
        : `Falha ao criar anuncio na Meta: status ${response.status}.`
    );
  }

  return payload as MetaCampaignCreateResponse;
}

function mapCallToActionType(callToAction: string): string {
  const normalized = callToAction.toLowerCase().replace(/\s+/g, "_");
  const ctaMap: Record<string, string> = {
    saiba_mais: "LEARN_MORE",
    learn_more: "LEARN_MORE",
    solicitar_cotacao: "GET_QUOTE",
    get_quote: "GET_QUOTE",
    cadastre_se: "SIGN_UP",
    sign_up: "SIGN_UP",
    enviar_mensagem: "MESSAGE_PAGE",
    message_page: "MESSAGE_PAGE",
    fale_conosco: "CONTACT_US",
    contact_us: "CONTACT_US",
    solicitar: "APPLY_NOW",
    apply_now: "APPLY_NOW",
    enviar_whatsapp: "WHATSAPP_MESSAGE",
    whatsapp_message: "WHATSAPP_MESSAGE",
    // CTA fraco/desalinhado com captacao de lead — mapeado para o padrao forte.
    saiba_detalhes: "GET_QUOTE",
    see_details: "GET_QUOTE"
  };
  // Mudanca 5: para objetivo de lead, o CTA padrao passa a ser GET_QUOTE (alinhado
  // a "cotacao de plano empresarial"), em vez de LEARN_MORE.
  return ctaMap[normalized] ?? "GET_QUOTE";
}

function buildSanitizedRequestPayload(campaign: CampaignRow, publishMode: CampaignPublishMode): Json {
  return {
    campaignId: campaign.id,
    organizationId: campaign.organization_id,
    connectedAccountId: campaign.connected_account_id,
    metaPageId: campaign.meta_page_id,
    metaAdAccountId: campaign.meta_ad_account_id,
    metaLeadFormId: campaign.meta_lead_form_id,
    publishMode,
    targetStatus: publishMode === "draft" ? "draft" : "paused",
    campaignName: campaign.campaign_name
  } as Json;
}

function buildSanitizedResponsePayload(input: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(input)) as Json;
}

function sanitizeAdAccountId(value: string) {
  return value.replace(/^act_/i, "").trim();
}

function mapCampaignRowToHistoryItem(row: CampaignRow): CampaignHistoryItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdByProfileId: row.created_by_profile_id,
    status: row.status,
    product: row.product,
    connectedAccountId: row.connected_account_id,
    metaPageId: row.meta_page_id,
    metaAdAccountId: row.meta_ad_account_id,
    metaLeadFormId: row.meta_lead_form_id,
    publishMode: row.publish_mode,
    publicationStatus: row.publication_status,
    approvalStatus: row.approval_status,
    metaCampaignId: row.meta_campaign_id,
    metaAdSetId: row.meta_adset_id,
    metaAdId: row.meta_ad_id,
    campaignName: row.campaign_name,
    audience: row.audience,
    offer: row.offer,
    region: row.region,
    differentiator: row.differentiator,
    tone: row.tone,
    input: parseCampaignInput(row),
    result: parseCampaignResult(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseCampaignInput(row: CampaignRow) {
  return parseCampaignInputPayload(row);
}

function parseCampaignResult(row: CampaignRow) {
  return parseCampaignResultPayload(row);
}

function isMissingMarketingPermissionError(error: unknown) {
  return error instanceof MetaMarketingPermissionError;
}

const STORAGE_BUCKET = "campaign-creatives";
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
// Acima deste limiar de altura/largura tratamos a imagem como Vertical (9:16 ~ 1.78).
// 4:5 (1.25) e 1:1 (1.0) ficam abaixo e sao tratados como Feed.
const VERTICAL_ASPECT_THRESHOLD = 1.5;

type CampaignCreativeHashes = {
  feedHash: string | null;
  verticalHash: string | null;
  // Hashes (formato feed) para carrossel, na ordem dos arquivos. So preenchido
  // quando includeCarousel = true.
  carouselHashes: string[];
};

// Limite de cartoes de um carrossel na Meta.
const MAX_CAROUSEL_CARDS = 10;

async function classifyPlacementByAspect(buffer: Buffer): Promise<"feed" | "vertical"> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width > 0 && height > 0 && height / width >= VERTICAL_ASPECT_THRESHOLD) {
      return "vertical";
    }
  } catch {
    // Sem metadados confiaveis: trata como Feed (formato mais universal).
  }

  return "feed";
}

// Le as imagens da pasta da campanha, classifica cada uma por proporcao
// (Feed x Vertical) e envia para a biblioteca da Meta.
// - Imagem unica: so um dos hashes vem preenchido e a publicacao cai no
//   object_story_spec de imagem unica.
// - includeCarousel: coleta ate MAX_CAROUSEL_CARDS imagens de formato feed em
//   carouselHashes (na ordem dos arquivos) para montar o carrossel.
async function uploadCampaignCreativesToMeta(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  organizationId: string;
  campaignId: string;
  connectedAccountId: string | null;
  accessToken: string;
  adAccountId: string;
  includeCarousel: boolean;
}): Promise<CampaignCreativeHashes> {
  const result: CampaignCreativeHashes = {
    feedHash: null,
    verticalHash: null,
    carouselHashes: []
  };

  try {
    const folder = `${input.organizationId}/${input.campaignId}`;
    const { data: files } = await input.supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, { limit: 50 });

    if (!files || files.length === 0) return result;

    const imageFiles = files.filter((f) => {
      if (!f.name || f.name.startsWith(".")) return false;
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return IMAGE_EXTENSIONS.has(ext);
    });

    for (const imageFile of imageFiles) {
      // Imagem unica: para quando ja tem feed + vertical. Carrossel: para ao
      // atingir o limite de cartoes.
      if (input.includeCarousel) {
        if (result.carouselHashes.length >= MAX_CAROUSEL_CARDS) break;
      } else if (result.feedHash && result.verticalHash) {
        break;
      }

      const buffer = await downloadCampaignImage(input.supabase, `${folder}/${imageFile.name}`);
      if (!buffer) continue;

      const placement = await classifyPlacementByAspect(buffer);

      // Carrossel usa imagens de formato feed; verticais sao ignoradas aqui.
      if (input.includeCarousel && placement === "vertical") continue;
      if (!input.includeCarousel) {
        if (placement === "feed" && result.feedHash) continue;
        if (placement === "vertical" && result.verticalHash) continue;
      }

      const hash = await sendCampaignImageToMeta({
        supabase: input.supabase,
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        connectedAccountId: input.connectedAccountId,
        accessToken: input.accessToken,
        adAccountId: input.adAccountId,
        buffer,
        fileName: imageFile.name
      });

      if (!hash) continue;

      if (placement === "feed") {
        if (!result.feedHash) result.feedHash = hash;
        if (input.includeCarousel) result.carouselHashes.push(hash);
      } else {
        result.verticalHash = hash;
      }
    }

    return result;
  } catch {
    return result;
  }
}

async function downloadCampaignImage(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  filePath: string
): Promise<Buffer | null> {
  const { data: downloaded, error: downloadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(filePath);

  if (downloadError || !downloaded) return null;
  return Buffer.from(await downloaded.arrayBuffer());
}

async function sendCampaignImageToMeta(input: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  organizationId: string;
  campaignId: string;
  connectedAccountId: string | null;
  accessToken: string;
  adAccountId: string;
  buffer: Buffer;
  fileName: string;
}): Promise<string | null> {
  try {
    const bytes = input.buffer.toString("base64");
    const safeName = sanitizeCreativeRequestAttachmentName(
      input.fileName.replace(/^[a-f0-9-]+-/, "")
    );

    const formData = new FormData();
    formData.set("bytes", bytes);
    formData.set("access_token", input.accessToken);
    formData.set("name", safeName);

    const adAccountClean = input.adAccountId.replace(/^act_/i, "").trim();
    const response = await fetch(
      `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${adAccountClean}/adimages`,
      { method: "POST", body: formData }
    );

    if (!response.ok) return null;

    const payload = await response.json().catch(() => null);
    if (!payload) return null;

    const images = typeof payload.images === "object" && payload.images ? payload.images : {};
    const firstEntry = Object.values(images)[0] as Record<string, unknown> | undefined;
    const hash = typeof firstEntry?.hash === "string" ? firstEntry.hash : null;
    const metaUrl = typeof firstEntry?.url === "string" ? firstEntry.url : null;
    const metaId = typeof firstEntry?.id === "string" ? firstEntry.id : null;

    if (!hash) return null;

    if (input.connectedAccountId) {
      try {
        await input.supabase
          .from("meta_ad_image_uploads")
          .insert({
            organization_id: input.organizationId,
            connected_account_id: input.connectedAccountId,
            meta_ad_account_id: input.adAccountId,
            campaign_id: input.campaignId,
            source_filename: safeName,
            source_mime_type: "image/jpeg",
            source_size_bytes: input.buffer.length,
            local_status: "uploaded",
            uploaded_at: new Date().toISOString(),
            meta_image_hash: hash,
            meta_image_id: metaId,
            meta_image_url: metaUrl,
            meta_response: payload as Json
          });
      } catch {
        // Record-keeping failure should not block publication
      }
    }

    return hash;
  } catch {
    return null;
  }
}
