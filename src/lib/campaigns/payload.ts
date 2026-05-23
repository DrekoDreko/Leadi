import type { Json } from "@/lib/supabase/database.types";
import type {
  CampaignGenerationForm,
  CampaignPublicationStatus,
  CampaignPublishMode,
  CampaignStoredInputPayload,
  CampaignStoredResultPayload,
  CampaignTextOutput
} from "./types";
import { CAMPAIGN_GENERATION_PAYLOAD_VERSION } from "./types";

const DEFAULT_PRODUCT = "Plano de saude empresarial";
const DEFAULT_BROKERAGE_NAME = "Corretora Demo";

type CampaignPayloadRow = {
  connected_account_id: string | null;
  meta_page_id: string | null;
  meta_ad_account_id: string | null;
  meta_lead_form_id: string | null;
  publish_mode: string | null;
  publication_status: string | null;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_ad_id: string | null;
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
};

export function buildCampaignInputPayload(form: CampaignGenerationForm): CampaignStoredInputPayload {
  return {
    version: CAMPAIGN_GENERATION_PAYLOAD_VERSION,
    context: {
      product: DEFAULT_PRODUCT,
      brokerageName: form.brokerageName,
      notes: form.notes
    },
    brief: {
      audience: form.audience,
      offer: form.offer,
      region: form.region,
      differentiator: form.differentiator,
      objections: form.objections,
      contractType: form.contractType,
      tone: form.tone
    },
    creative: {
      assetType: form.creativeAssetType,
      brief: form.creativeBrief,
      requestMode: form.creativeRequestMode,
      fileNames: form.creativeFileNames
    },
    integrations: {
      connectedAccountId: form.connectedAccountId,
      metaPageId: form.metaPageId,
      metaAdAccountId: form.metaAdAccountId,
      metaLeadFormId: form.metaLeadFormId
    },
    publication: {
      publishMode: form.publishMode,
      publicationStatus: form.publicationStatus,
      metaCampaignId: form.metaCampaignId,
      metaAdSetId: form.metaAdSetId,
      metaAdId: form.metaAdId
    }
  };
}

export function buildCampaignResultPayload(
  campaign: CampaignTextOutput
): CampaignStoredResultPayload {
  return {
    version: CAMPAIGN_GENERATION_PAYLOAD_VERSION,
    strategy: {
      campaignName: campaign.campaignName,
      suggestedAudience: campaign.suggestedAudience,
      callToAction: campaign.callToAction
    },
    copy: {
      primaryText: campaign.primaryText,
      headline: campaign.headline,
      description: campaign.description,
      variants: campaign.variants
    },
    compliance: {
      notes: campaign.complianceNotes
    }
  };
}

export function parseCampaignInputPayload(row: CampaignPayloadRow): CampaignGenerationForm {
  const payload = isRecord(row.input_payload) ? row.input_payload : null;
  const context = getNestedRecord(payload, "context");
  const brief = getNestedRecord(payload, "brief");
  const creative = getNestedRecord(payload, "creative");
  const integrations = getNestedRecord(payload, "integrations");
  const publication = getNestedRecord(payload, "publication");

  return {
    brokerageName:
      stringFromPayload(context?.brokerageName) ??
      stringFromPayload(payload?.brokerageName) ??
      DEFAULT_BROKERAGE_NAME,
    audience: stringFromPayload(brief?.audience) ?? stringFromPayload(payload?.audience) ?? row.audience,
    offer: stringFromPayload(brief?.offer) ?? stringFromPayload(payload?.offer) ?? row.offer,
    region: stringFromPayload(brief?.region) ?? stringFromPayload(payload?.region) ?? row.region,
    differentiator:
      stringFromPayload(brief?.differentiator) ??
      stringFromPayload(payload?.differentiator) ??
      row.differentiator,
    objections:
      stringFromPayload(brief?.objections) ?? stringFromPayload(payload?.objections) ?? null,
    contractType:
      stringFromPayload(brief?.contractType) ?? stringFromPayload(payload?.contractType) ?? null,
    notes: stringFromPayload(context?.notes) ?? stringFromPayload(payload?.notes) ?? "",
    tone: stringFromPayload(brief?.tone) ?? stringFromPayload(payload?.tone) ?? row.tone,
    creativeAssetType:
      stringFromPayload(creative?.assetType) ?? stringFromPayload(payload?.creativeAssetType) ?? null,
    creativeBrief: stringFromPayload(creative?.brief) ?? stringFromPayload(payload?.creativeBrief) ?? null,
    creativeRequestMode:
      stringFromPayload(creative?.requestMode) ??
      stringFromPayload(payload?.creativeRequestMode) ??
      null,
    creativeFileNames: arrayFromPayload(creative?.fileNames, payload?.creativeFileNames),
    connectedAccountId:
      stringFromPayload(integrations?.connectedAccountId) ??
      stringFromPayload(payload?.connectedAccountId) ??
      row.connected_account_id ??
      null,
    metaPageId:
      stringFromPayload(integrations?.metaPageId) ??
      stringFromPayload(payload?.metaPageId) ??
      row.meta_page_id ??
      null,
    metaAdAccountId:
      stringFromPayload(integrations?.metaAdAccountId) ??
      stringFromPayload(payload?.metaAdAccountId) ??
      row.meta_ad_account_id ??
      null,
    metaLeadFormId:
      stringFromPayload(integrations?.metaLeadFormId) ??
      stringFromPayload(payload?.metaLeadFormId) ??
      row.meta_lead_form_id ??
      null,
    publishMode: normalizeCampaignPublishMode(
      stringFromPayload(publication?.publishMode) ??
        stringFromPayload(payload?.publishMode) ??
        row.publish_mode
    ),
    publicationStatus: normalizeCampaignPublicationStatus(
      stringFromPayload(publication?.publicationStatus) ??
        stringFromPayload(payload?.publicationStatus) ??
        row.publication_status
    ),
    metaCampaignId:
      stringFromPayload(publication?.metaCampaignId) ??
      stringFromPayload(payload?.metaCampaignId) ??
      row.meta_campaign_id ??
      null,
    metaAdSetId:
      stringFromPayload(publication?.metaAdSetId) ??
      stringFromPayload(payload?.metaAdSetId) ??
      row.meta_adset_id ??
      null,
    metaAdId:
      stringFromPayload(publication?.metaAdId) ??
      stringFromPayload(payload?.metaAdId) ??
      row.meta_ad_id ??
      null
  };
}

export function parseCampaignResultPayload(row: CampaignPayloadRow): CampaignTextOutput {
  const payload = isRecord(row.result_payload) ? row.result_payload : null;
  const strategy = getNestedRecord(payload, "strategy");
  const copy = getNestedRecord(payload, "copy");
  const compliance = getNestedRecord(payload, "compliance");

  return {
    campaignName:
      stringFromPayload(strategy?.campaignName) ??
      stringFromPayload(payload?.campaignName) ??
      row.campaign_name,
    primaryText:
      stringFromPayload(copy?.primaryText) ??
      stringFromPayload(payload?.primaryText) ??
      row.primary_text,
    headline:
      stringFromPayload(copy?.headline) ?? stringFromPayload(payload?.headline) ?? row.headline,
    description:
      stringFromPayload(copy?.description) ??
      stringFromPayload(payload?.description) ??
      row.description,
    callToAction:
      stringFromPayload(strategy?.callToAction) ??
      stringFromPayload(payload?.callToAction) ??
      row.call_to_action,
    suggestedAudience:
      stringFromPayload(strategy?.suggestedAudience) ??
      stringFromPayload(payload?.suggestedAudience) ??
      row.suggested_audience,
    variants: arrayFromPayload(copy?.variants, payload?.variants, row.variants),
    complianceNotes: arrayFromPayload(
      compliance?.notes,
      payload?.complianceNotes,
      row.compliance_notes
    )
  };
}

export function normalizeCampaignPublishMode(value: string | null | undefined): CampaignPublishMode {
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

export function normalizeCampaignPublicationStatus(
  value: string | null | undefined
): CampaignPublicationStatus {
  if (
    value === "not_connected" ||
    value === "ready_to_prepare" ||
    value === "draft_created" ||
    value === "pending_review" ||
    value === "published" ||
    value === "paused" ||
    value === "failed"
  ) {
    return value;
  }

  return "not_connected";
}

function arrayFromPayload(
  ...values: Array<Json | null | undefined>
): string[] {
  for (const value of values) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      return value as string[];
    }
  }

  return [];
}

function stringFromPayload(value: Json | null | undefined) {
  return typeof value === "string" ? value : null;
}

function getNestedRecord(
  payload: Record<string, Json> | null,
  key: string
): Record<string, Json> | null {
  if (!payload) {
    return null;
  }

  const value = payload[key];
  return isRecord(value) ? value : null;
}

function isRecord(value: Json | null | undefined): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
