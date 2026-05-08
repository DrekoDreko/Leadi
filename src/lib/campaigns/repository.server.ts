import { campaignDraft } from "@/data/mock";
import type { Database, Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CampaignGenerationForm,
  CampaignHistoryItem,
  CampaignListState,
  CampaignSaveInput,
  CampaignStatus,
  CampaignTextOutput
} from "./types";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const DEFAULT_PRODUCT = "Plano de saude empresarial";
const DEFAULT_BROKERAGE_NAME = "Corretora Demo";

export async function getCampaignsForCurrentUser(limit = 4): Promise<CampaignListState> {
  const safeLimit = Math.max(1, Math.trunc(limit));

  if (!isSupabaseConfigured()) {
    return {
      campaigns: buildMockCampaigns(safeLimit),
      mode: "not-configured",
      message: "Supabase ainda nao configurado. Exibindo historico de demonstracao."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      campaigns: [],
      mode: "unauthenticated",
      message: "Usuario nao autenticado."
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      campaigns: [],
      mode: "error",
      message: "Nao foi possivel carregar o historico de campanhas."
    };
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    return {
      campaigns: [],
      mode: "error",
      message: "Nao foi possivel carregar o historico de campanhas."
    };
  }

  return {
    campaigns: (data ?? []).map((row) => mapCampaignRowToHistoryItem(row)),
    mode: "supabase"
  };
}

export async function saveCampaignForCurrentUser(
  input: CampaignSaveInput
): Promise<CampaignHistoryItem> {
  if (!isSupabaseConfigured()) {
    return createMockCampaignHistoryItem(input.form, input.campaign, input.status ?? "generated");
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const payload = buildCampaignInsert(profile, input);

  const { data, error } = await supabase.from("campaigns").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return mapCampaignRowToHistoryItem(data);
}

async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile) {
    throw new Error(error?.message ?? "Perfil nao encontrado.");
  }

  return profile;
}

function buildCampaignInsert(profile: ProfileRow, input: CampaignSaveInput): CampaignInsert {
  return {
    organization_id: profile.organization_id,
    created_by_profile_id: profile.id,
    status: input.status ?? "generated",
    product: DEFAULT_PRODUCT,
    connected_account_id: input.form.connectedAccountId,
    meta_page_id: input.form.metaPageId,
    meta_ad_account_id: input.form.metaAdAccountId,
    meta_lead_form_id: input.form.metaLeadFormId,
    publish_mode: input.form.publishMode,
    publication_status: input.form.publicationStatus,
    meta_campaign_id: input.form.metaCampaignId,
    meta_adset_id: input.form.metaAdSetId,
    meta_ad_id: input.form.metaAdId,
    audience: input.form.audience,
    offer: input.form.offer,
    region: input.form.region,
    differentiator: input.form.differentiator,
    tone: input.form.tone,
    campaign_name: input.campaign.campaignName,
    primary_text: input.campaign.primaryText,
    headline: input.campaign.headline,
    description: input.campaign.description,
    call_to_action: input.campaign.callToAction,
    suggested_audience: input.campaign.suggestedAudience,
    variants: toJson(input.campaign.variants) ?? [],
    compliance_notes: toJson(input.campaign.complianceNotes) ?? [],
    input_payload: toJson(input.form) ?? {},
    result_payload: toJson(input.campaign) ?? {}
  };
}

function mapCampaignRowToHistoryItem(row: CampaignRow): CampaignHistoryItem {
  const input = parseCampaignInput(row);
  const result = parseCampaignTextOutput(row);

  return {
    id: row.id,
    organizationId: row.organization_id,
    createdByProfileId: row.created_by_profile_id,
    status: normalizeCampaignStatus(row.status),
    product: row.product ?? DEFAULT_PRODUCT,
    connectedAccountId: row.connected_account_id ?? input.connectedAccountId,
    metaPageId: row.meta_page_id ?? input.metaPageId,
    metaAdAccountId: row.meta_ad_account_id ?? input.metaAdAccountId,
    metaLeadFormId: row.meta_lead_form_id ?? input.metaLeadFormId,
    publishMode: normalizeCampaignPublishMode(row.publish_mode ?? input.publishMode),
    publicationStatus: normalizeCampaignPublicationStatus(
      row.publication_status ?? input.publicationStatus
    ),
    metaCampaignId: row.meta_campaign_id ?? input.metaCampaignId,
    metaAdSetId: row.meta_adset_id ?? input.metaAdSetId,
    metaAdId: row.meta_ad_id ?? input.metaAdId,
    campaignName: row.campaign_name,
    audience: row.audience,
    offer: row.offer,
    region: row.region,
    differentiator: row.differentiator,
    tone: row.tone,
    input,
    result,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseCampaignInput(row: CampaignRow): CampaignGenerationForm {
  const payload = isRecord(row.input_payload) ? row.input_payload : null;

  return {
    brokerageName: stringFromPayload(payload?.brokerageName) ?? DEFAULT_BROKERAGE_NAME,
    audience: stringFromPayload(payload?.audience) ?? row.audience,
    offer: stringFromPayload(payload?.offer) ?? row.offer,
    region: stringFromPayload(payload?.region) ?? row.region,
    differentiator: stringFromPayload(payload?.differentiator) ?? row.differentiator,
    notes: stringFromPayload(payload?.notes) ?? "",
    tone: stringFromPayload(payload?.tone) ?? row.tone,
    creativeAssetType: stringFromPayload(payload?.creativeAssetType) ?? null,
    creativeBrief: stringFromPayload(payload?.creativeBrief) ?? null,
    creativeRequestMode: stringFromPayload(payload?.creativeRequestMode) ?? null,
    creativeFileNames: arrayFromPayload(payload?.creativeFileNames, []),
    connectedAccountId:
      stringFromPayload(payload?.connectedAccountId) ?? row.connected_account_id ?? null,
    metaPageId: stringFromPayload(payload?.metaPageId) ?? row.meta_page_id ?? null,
    metaAdAccountId:
      stringFromPayload(payload?.metaAdAccountId) ?? row.meta_ad_account_id ?? null,
    metaLeadFormId:
      stringFromPayload(payload?.metaLeadFormId) ?? row.meta_lead_form_id ?? null,
    publishMode: normalizeCampaignPublishMode(
      stringFromPayload(payload?.publishMode) ?? row.publish_mode
    ),
    publicationStatus: normalizeCampaignPublicationStatus(
      stringFromPayload(payload?.publicationStatus) ?? row.publication_status
    ),
    metaCampaignId: stringFromPayload(payload?.metaCampaignId) ?? row.meta_campaign_id ?? null,
    metaAdSetId: stringFromPayload(payload?.metaAdSetId) ?? row.meta_adset_id ?? null,
    metaAdId: stringFromPayload(payload?.metaAdId) ?? row.meta_ad_id ?? null
  };
}

function parseCampaignTextOutput(row: CampaignRow): CampaignTextOutput {
  const payload = isRecord(row.result_payload) ? row.result_payload : null;

  return {
    campaignName: stringFromPayload(payload?.campaignName) ?? row.campaign_name,
    primaryText: stringFromPayload(payload?.primaryText) ?? row.primary_text,
    headline: stringFromPayload(payload?.headline) ?? row.headline,
    description: stringFromPayload(payload?.description) ?? row.description,
    callToAction: stringFromPayload(payload?.callToAction) ?? row.call_to_action,
    suggestedAudience:
      stringFromPayload(payload?.suggestedAudience) ?? row.suggested_audience,
    variants: arrayFromPayload(payload?.variants, row.variants),
    complianceNotes: arrayFromPayload(payload?.complianceNotes, row.compliance_notes)
  };
}

function buildMockCampaigns(limit: number): CampaignHistoryItem[] {
  const now = new Date();
  const fallbackCampaign = createMockCampaignHistoryItem(
          {
            brokerageName: DEFAULT_BROKERAGE_NAME,
            audience: "Donos e gestores de ME, LTDA e empresas de 2 a 49 vidas",
            offer: "Analise consultiva para comparar plano empresarial",
            region: "Campinas e regiao",
            differentiator: "Atendimento rapido com comparativo objetivo entre operadoras",
            notes: "",
            tone: "consultivo, direto e seguro",
            creativeAssetType: "imagem",
            creativeBrief: "",
            creativeRequestMode: "enviar_arquivo",
            creativeFileNames: [],
            connectedAccountId: null,
            metaPageId: null,
            metaAdAccountId: null,
            metaLeadFormId: null,
            publishMode: "manual_review",
            publicationStatus: "not_connected",
            metaCampaignId: null,
            metaAdSetId: null,
            metaAdId: null
          },
    {
      campaignName: campaignDraft.title,
      primaryText: campaignDraft.copy,
      headline: "Plano empresarial com analise consultiva",
      description: "Compare opcoes para a sua empresa com apoio comercial especializado.",
      callToAction: "Solicitar cotacao",
      suggestedAudience: "Donos e gestores de ME, LTDA e empresas de 2 a 49 vidas",
      variants: [
        "Compare alternativas de plano empresarial com uma abordagem consultiva.",
        "Receba uma analise objetiva para escolher o melhor caminho para sua empresa."
      ],
      complianceNotes: [
        "Modelo inicial: revise oferta, publico e regras comerciais antes de publicar."
      ]
    },
    "generated",
    now
  );

  return Array.from({ length: limit }, (_, index) =>
    index === 0
      ? fallbackCampaign
      : createMockCampaignHistoryItem(
          {
            brokerageName: DEFAULT_BROKERAGE_NAME,
            audience: "Empresas que precisam revisar o plano atual",
            offer: "Comparativo rapido com foco comercial",
            region: "Interior de Sao Paulo",
            differentiator: "Atendimento consultivo e sem promessa sensivel",
            notes: "",
            tone: "profissional e objetivo",
            creativeAssetType: "imagem",
            creativeBrief: "",
            creativeRequestMode: "enviar_arquivo",
            creativeFileNames: [],
            connectedAccountId: null,
            metaPageId: null,
            metaAdAccountId: null,
            metaLeadFormId: null,
            publishMode: "manual_review",
            publicationStatus: "not_connected",
            metaCampaignId: null,
            metaAdSetId: null,
            metaAdId: null
          },
          {
            campaignName: `Campanha demonstrativa ${index + 1}`,
            primaryText:
              "Texto demonstrativo para validar o fluxo de persistencia do historico de campanhas.",
            headline: "Comparativo comercial para empresa",
            description: "Rascunho de demostracao para o dashboard.",
            callToAction: "Solicitar cotacao",
            suggestedAudience: "Empresas que buscam um comparativo rapido",
            variants: [
              "Mensagem de demonstracao para o historico.",
              "Outra variacao de teste para o dashboard."
            ],
            complianceNotes: ["Historico demonstrativo exibido enquanto o Supabase nao esta conectado."]
          },
          "generated",
          new Date(now.getTime() - index * 1000 * 60 * 15)
        )
  );
}

function createMockCampaignHistoryItem(
  form: CampaignGenerationForm,
  campaign: CampaignTextOutput,
  status: CampaignStatus,
  date = new Date()
): CampaignHistoryItem {
  const timestamp = date.toISOString();

  return {
    id: `mock-campaign-${date.getTime()}`,
    organizationId: "mock-organization",
    createdByProfileId: "mock-profile",
    status,
    product: DEFAULT_PRODUCT,
    connectedAccountId: form.connectedAccountId,
    metaPageId: form.metaPageId,
    metaAdAccountId: form.metaAdAccountId,
    metaLeadFormId: form.metaLeadFormId,
    publishMode: form.publishMode,
    publicationStatus: form.publicationStatus,
    metaCampaignId: form.metaCampaignId,
    metaAdSetId: form.metaAdSetId,
    metaAdId: form.metaAdId,
    campaignName: campaign.campaignName,
    audience: form.audience,
    offer: form.offer,
    region: form.region,
    differentiator: form.differentiator,
    tone: form.tone,
    input: form,
    result: campaign,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function normalizeCampaignStatus(value: string | null): CampaignStatus {
  return value === "archived" ? "archived" : "generated";
}

function normalizeCampaignPublishMode(value: string | null | undefined) {
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

function normalizeCampaignPublicationStatus(value: string | null | undefined) {
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

function arrayFromPayload(value: Json | null | undefined, fallback: Json | null | undefined): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value as string[];
  }

  if (Array.isArray(fallback) && fallback.every((item) => typeof item === "string")) {
    return fallback as string[];
  }

  return [];
}

function stringFromPayload(value: Json | null | undefined) {
  return typeof value === "string" ? value : null;
}

function isRecord(value: Json | null | undefined): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toJson(value: unknown): Json | null {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}
