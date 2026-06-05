import { campaignDraft } from "@/data/mock";
import type { Database, Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildCampaignInputPayload,
  buildCampaignResultPayload,
  normalizeCampaignPublicationStatus,
  normalizeCampaignPublishMode,
  normalizeCampaignApprovalStatus,
  parseCampaignInputPayload,
  parseCampaignResultPayload
} from "./payload";
import type {
  CampaignActivitySummary,
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
type CampaignOperationalRow = Pick<
  CampaignRow,
  "id" | "campaign_name" | "publication_status" | "approval_status" | "publish_mode" | "updated_at"
>;

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

export async function getCampaignsCountForCurrentUser(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 1;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return 0;

  const { count, error } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Erro ao contar campanhas:", error);
    return 0;
  }

  return count ?? 0;
}

export async function getPublishedCampaignsCountForCurrentUser(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return 0;

  const { count, error } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)
    .eq("publication_status", "published");

  if (error) {
    console.error("Erro ao contar campanhas publicadas:", error);
    return 0;
  }

  return count ?? 0;
}

export async function getCampaignActivitySummaryForCurrentUser(
  limit = 3
): Promise<CampaignActivitySummary> {
  const safeLimit = Math.max(1, Math.trunc(limit));

  if (!isSupabaseConfigured()) {
    return {
      ...buildCampaignActivitySummary(buildMockCampaigns(6), safeLimit),
      mode: "not-configured",
      message: "Supabase ainda nao configurado. Exibindo resumo demonstrativo."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      activeCount: 0,
      readyCount: 0,
      pausedCount: 0,
      campaigns: [],
      mode: "unauthenticated",
      message: "Usuario nao autenticado."
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      activeCount: 0,
      readyCount: 0,
      pausedCount: 0,
      campaigns: [],
      mode: "error",
      message: "Nao foi possivel carregar o resumo operacional das campanhas."
    };
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, campaign_name, publication_status, approval_status, publish_mode, updated_at")
    .eq("organization_id", profile.organization_id)
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      activeCount: 0,
      readyCount: 0,
      pausedCount: 0,
      campaigns: [],
      mode: "error",
      message: "Nao foi possivel carregar o resumo operacional das campanhas."
    };
  }

  return {
    ...buildCampaignActivitySummary(data ?? [], safeLimit),
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

export async function getPendingCampaignsForCurrentUser(): Promise<CampaignListState> {
  if (!isSupabaseConfigured()) {
    return {
      campaigns: [],
      mode: "not-configured",
      message: "Supabase ainda nao configurado. Funcionalidade indisponivel."
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
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      campaigns: [],
      mode: "error",
      message: "Nao foi possivel carregar as campanhas pendentes."
    };
  }

  return {
    campaigns: (data ?? []).map((row) => mapCampaignRowToHistoryItem(row)),
    mode: "supabase"
  };
}

export async function updateCampaignApprovalStatus(
  campaignId: string,
  approvalStatus: CampaignSaveInput["form"]["approvalStatus"]
): Promise<CampaignHistoryItem> {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("campaigns")
    .update({ approval_status: approvalStatus })
    .eq("id", campaignId)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();
    
  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao atualizar o status de aprovacao da campanha.");
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
    input_payload: toJson(buildCampaignInputPayload(input.form)) ?? {},
    result_payload: toJson(buildCampaignResultPayload(input.campaign)) ?? {}
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
    approvalStatus: normalizeCampaignApprovalStatus(
      row.approval_status ?? input.approvalStatus
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
  return parseCampaignInputPayload(row);
}

function parseCampaignTextOutput(row: CampaignRow): CampaignTextOutput {
  return parseCampaignResultPayload(row);
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
            objections: "Receio com carencias e reajustes em uma troca de operadora.",
            contractType: "Empresarial (MEI/PME)",
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
            approvalStatus: "not_required",
            metaCampaignId: null,
            metaAdSetId: null,
            metaAdId: null,
            dailyBudget: null
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
            objections: "Medo de perder rede credenciada ou pagar mais na transicao.",
            contractType: "Empresarial (PME)",
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
            approvalStatus: "not_required",
            metaCampaignId: null,
            metaAdSetId: null,
            metaAdId: null,
            dailyBudget: null
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
    approvalStatus: form.approvalStatus,
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

function buildCampaignActivitySummary(
  campaigns: Array<CampaignOperationalRow | CampaignHistoryItem>,
  limit: number
) {
  const safeLimit = Math.max(1, Math.trunc(limit));
  const operationalCampaigns = campaigns.map((campaign) => ({
    id: campaign.id,
    campaignName: "campaign_name" in campaign ? campaign.campaign_name : campaign.campaignName,
    publicationStatus:
      "publication_status" in campaign ? (campaign.publication_status as CampaignHistoryItem["publicationStatus"]) : campaign.publicationStatus,
    approvalStatus:
      "approval_status" in campaign ? (campaign.approval_status as CampaignHistoryItem["approvalStatus"]) : campaign.approvalStatus,
    publishMode: "publish_mode" in campaign ? (campaign.publish_mode as CampaignHistoryItem["publishMode"]) : campaign.publishMode,
    updatedAt: "updated_at" in campaign ? campaign.updated_at : campaign.updatedAt
  }));
  const visibleCampaigns = operationalCampaigns.filter(
    (campaign) =>
      isCampaignOperationallyActive(campaign.publicationStatus, campaign.publishMode) ||
      isCampaignOperationallyReady(campaign.publicationStatus, campaign.publishMode)
  );

  return {
    activeCount: operationalCampaigns.filter((campaign) =>
      isCampaignOperationallyActive(campaign.publicationStatus, campaign.publishMode)
    ).length,
    readyCount: operationalCampaigns.filter((campaign) =>
      isCampaignOperationallyReady(campaign.publicationStatus, campaign.publishMode)
    ).length,
    pausedCount: operationalCampaigns.filter((campaign) =>
      isCampaignOperationallyPaused(campaign.publicationStatus, campaign.publishMode)
    ).length,
    campaigns: visibleCampaigns
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
      .slice(0, safeLimit)
      .map(({ id, campaignName, publicationStatus, approvalStatus, publishMode }) => ({
        id,
        campaignName,
        publicationStatus,
        approvalStatus,
        publishMode
      }))
  };
}

function isCampaignOperationallyActive(
  publicationStatus: CampaignHistoryItem["publicationStatus"],
  publishMode: CampaignHistoryItem["publishMode"]
) {
  return publicationStatus === "published" && publishMode !== "paused";
}

function isCampaignOperationallyReady(
  publicationStatus: CampaignHistoryItem["publicationStatus"],
  publishMode: CampaignHistoryItem["publishMode"]
) {
  return (
    publishMode !== "paused" &&
    (publicationStatus === "ready_to_prepare" ||
      publicationStatus === "draft_created" ||
      publicationStatus === "pending_review")
  );
}

function isCampaignOperationallyPaused(
  publicationStatus: CampaignHistoryItem["publicationStatus"],
  publishMode: CampaignHistoryItem["publishMode"]
) {
  return publicationStatus === "paused" || publishMode === "paused";
}

function normalizeCampaignStatus(value: string | null): CampaignStatus {
  return value === "archived" ? "archived" : "generated";
}

function toJson(value: unknown): Json | null {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}
