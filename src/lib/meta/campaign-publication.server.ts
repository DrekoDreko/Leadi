import "server-only";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import {
  getMetaGraphApiVersion
} from "@/lib/meta/config";
import {
  getMetaConnectionForOrganization,
  resolveMetaAccessTokenForOrganization
} from "@/lib/integrations/repository.server";
import {
  parseCampaignInputPayload,
  parseCampaignResultPayload
} from "@/lib/campaigns/payload";
import { isCampaignCopyBlocked, reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
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
  publishMode?: CampaignPublishMode;
  dailyBudget?: number;
};

type MetaMarketingPublicationResult = {
  campaign: CampaignHistoryItem;
  attempt: CampaignPublicationAttemptRow;
};

const REQUIRED_MARKETING_PERMISSION = "ads_management";

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

    const connection = await getMetaConnectionForOrganization(input.organizationId);
    if (!connection) {
      throw new Error("Conexao Meta nao encontrada para esta organizacao.");
    }

    const accessToken = await resolveMetaAccessTokenForOrganization(input.organizationId);
    if (!accessToken) {
      throw new Error("A conexao Meta nao possui um access token valido.");
    }

    await ensureMetaMarketingPermission(accessToken);

    if (!campaign.meta_ad_account_id) {
      throw new Error("Selecione uma conta de anuncio antes de publicar a campanha.");
    }

    const metaCampaign = await createPausedMetaCampaign({
      accessToken,
      adAccountId: campaign.meta_ad_account_id,
      campaignName: campaign.campaign_name
    });

    if (!metaCampaign.id) {
      throw new Error("A Meta nao retornou o ID da campanha criada.");
    }

    let metaAdSetId: string | null = null;
    let metaAdCreativeId: string | null = null;
    let metaAdId: string | null = null;

    const dailyBudgetCents = input.dailyBudget
      ? Math.round(input.dailyBudget * 100)
      : 2000;

    if (campaign.meta_page_id && campaign.meta_lead_form_id) {
      const adSet = await createPausedAdSet({
        accessToken,
        adAccountId: campaign.meta_ad_account_id,
        campaignId: metaCampaign.id,
        name: `${campaign.campaign_name} - Conjunto`,
        dailyBudgetCents,
        pageId: campaign.meta_page_id,
        leadFormId: campaign.meta_lead_form_id
      });
      metaAdSetId = adSet.id ?? null;

      if (metaAdSetId) {
        const adCreative = await createAdCreative({
          accessToken,
          adAccountId: campaign.meta_ad_account_id,
          name: `${campaign.campaign_name} - Criativo`,
          pageId: campaign.meta_page_id,
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
            name: `${campaign.campaign_name} - Anuncio`
          });
          metaAdId = ad.id ?? null;
        }
      }
    }

    const updatedCampaign = await updateCampaignAfterPublication(supabase, campaign.id, {
      metaCampaignId: metaCampaign.id,
      metaAdSetId,
      metaAdId,
    });

    const updatedAttempt = await updateAttempt(supabase, attempt.id, {
      status: "success",
      response_payload: buildSanitizedResponsePayload({
        metaCampaignId: metaCampaign.id,
        metaAdSetId,
        metaAdCreativeId,
        metaAdId,
        success: true,
        status: "PAUSED"
      }),
      error_message: null,
      meta_campaign_id: metaCampaign.id,
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
  }
) {
  const hasFullStack = Boolean(input.metaCampaignId && input.metaAdSetId && input.metaAdId);
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      publication_status: "paused",
      publication_message: hasFullStack
        ? "Campanha completa (campanha + conjunto + anuncio) enviada para a Meta em modo pausado."
        : "Campanha enviada para a Meta em modo pausado. A ativacao continua manual ate a equipe liberar a veiculacao.",
      meta_campaign_id: input.metaCampaignId,
      meta_adset_id: input.metaAdSetId ?? null,
      meta_ad_id: input.metaAdId ?? null,
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

async function ensureMetaMarketingPermission(accessToken: string) {
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
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/campaigns`
  );

  const body = new URLSearchParams();
  body.set("name", input.campaignName);
  body.set("objective", "OUTCOME_LEADS");
  body.set("status", "PAUSED");
  body.set("special_ad_categories", JSON.stringify([]));
  body.set("is_adset_budget_sharing_enabled", "false");

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

async function createPausedAdSet(input: {
  accessToken: string;
  adAccountId: string;
  campaignId: string;
  name: string;
  dailyBudgetCents: number;
  pageId: string;
  leadFormId: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/adsets`
  );

  const body = new URLSearchParams();
  body.set("campaign_id", input.campaignId);
  body.set("name", input.name);
  body.set("billing_event", "IMPRESSIONS");
  body.set("optimization_goal", "LEAD_GENERATION");
  body.set("daily_budget", String(input.dailyBudgetCents));
  body.set("status", "PAUSED");
  body.set("promoted_object", JSON.stringify({
    page_id: input.pageId,
    leadgen_form_id: input.leadFormId
  }));
  body.set("targeting", JSON.stringify({
    geo_locations: { countries: ["BR"] },
    age_min: 18
  }));

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
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    const errorMessage = (payload as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(
      errorMessage
        ? `Falha ao criar conjunto de anuncios na Meta: ${errorMessage}`
        : `Falha ao criar conjunto de anuncios na Meta: status ${response.status}.`
    );
  }

  return payload as MetaCampaignCreateResponse;
}

async function createAdCreative(input: {
  accessToken: string;
  adAccountId: string;
  name: string;
  pageId: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/adcreatives`
  );

  const ctaType = mapCallToActionType(input.callToAction);

  const body = new URLSearchParams();
  body.set("name", input.name);
  body.set("object_story_spec", JSON.stringify({
    page_id: input.pageId,
    link_data: {
      message: input.primaryText,
      name: input.headline,
      description: input.description,
      call_to_action: { type: ctaType }
    }
  }));

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
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    const errorMessage = (payload as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(
      errorMessage
        ? `Falha ao criar criativo do anuncio na Meta: ${errorMessage}`
        : `Falha ao criar criativo do anuncio na Meta: status ${response.status}.`
    );
  }

  return payload as MetaCampaignCreateResponse;
}

async function createPausedAd(input: {
  accessToken: string;
  adAccountId: string;
  adSetId: string;
  creativeId: string;
  name: string;
}) {
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(input.adAccountId)}/ads`
  );

  const body = new URLSearchParams();
  body.set("name", input.name);
  body.set("adset_id", input.adSetId);
  body.set("creative", JSON.stringify({ creative_id: input.creativeId }));
  body.set("status", "PAUSED");

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
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    const errorMessage = (payload as { error?: { message?: string } } | null)?.error?.message;
    throw new Error(
      errorMessage
        ? `Falha ao criar anuncio na Meta: ${errorMessage}`
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
    whatsapp_message: "WHATSAPP_MESSAGE"
  };
  return ctaMap[normalized] ?? "LEARN_MORE";
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
