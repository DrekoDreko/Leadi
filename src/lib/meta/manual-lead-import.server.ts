import "server-only";

import { leads as mockLeads, type Lead } from "@/data/mock";
import {
  createLeadFromManualMetaImport,
  type LeadCreateInput
} from "@/lib/leads/repository.server";
import { normalizeEmail, normalizePhone } from "@/lib/leads/normalization";
import {
  getConnectedAccountsForCurrentUser,
  resolveCurrentIdentity,
  resolveMetaAccessTokenForOrganization
} from "@/lib/integrations/repository.server";
import { getMetaGraphApiVersion } from "@/lib/meta/config";
import { mapMetaLeadToLeadPayload, type MetaLeadRecord } from "@/lib/meta/lead-retrieval.server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import { logger } from "@/lib/logger";
import type {
  MetaLeadImportItem,
  MetaLeadImportResponse,
  MetaLeadImportSource,
  MetaLeadImportSourceStatus,
  MetaLeadImportSourceType,
  MetaLeadImportSourcesState,
  MetaLeadImportSummary
} from "./manual-lead-import.types";

type MetaFormRow = Database["public"]["Tables"]["meta_forms"]["Row"];
type MetaAdAccountRow = Database["public"]["Tables"]["meta_ad_accounts"]["Row"];

type MetaCampaignResponse = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  updated_time?: string;
};

type MetaAdResponse = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  updated_time?: string;
  campaign_id?: string;
  campaign?: {
    id?: string;
    name?: string;
  };
};

const META_LEAD_FIELDS = [
  "id",
  "created_time",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "form_id",
  "is_organic",
  "platform",
  "field_data"
].join(",");

const EMPTY_SUMMARY: MetaLeadImportSummary = {
  totalFound: 0,
  imported: 0,
  duplicates: 0,
  archived: 0,
  errors: 0
};

export async function listMetaLeadImportSourcesForCurrentUser(): Promise<MetaLeadImportSourcesState> {
  if (!isSupabaseConfigured()) {
    return {
      mode: "not-configured",
      hasConnection: true,
      canImport: true,
      sources: getMockMetaLeadImportSources(),
      message: "Supabase ainda nao configurado. Exibindo fontes Meta mockadas."
    };
  }

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return {
      mode: "unauthenticated",
      hasConnection: false,
      canImport: false,
      sources: [],
      message: "Usuario nao autenticado."
    };
  }

  const connectedState = await getConnectedAccountsForCurrentUser();
  const hasConnection = connectedState.metaConnection?.status === "connected";
  if (!hasConnection) {
    return {
      mode: "supabase",
      hasConnection: false,
      canImport: false,
      sources: [],
      message: "Conecte sua conta Meta para importar leads."
    };
  }

  const localSources = [
    ...connectedState.metaLeadForms.map(mapFormToSource),
    ...connectedState.metaAdAccounts.map(mapAdAccountToSourcePlaceholder)
  ];

  const accessToken = await resolveMetaAccessTokenForOrganization(identity.organization.id);
  if (!accessToken) {
    return {
      mode: "supabase",
      hasConnection: true,
      canImport: false,
      sources: localSources.filter((source) => source.type === "form"),
      message: "Nao foi possivel validar o token Meta da organizacao para listar campanhas e anuncios."
    };
  }

  const graphSources = await listGraphCampaignAndAdSources({
    accessToken,
    adAccounts: connectedState.metaAdAccounts.map((account) => ({
      meta_ad_account_id: account.metaAdAccountId,
      name: account.name
    }))
  });

  return {
    mode: "supabase",
    hasConnection: true,
    canImport: true,
    sources: mergeImportSources(localSources, graphSources)
  };
}

export async function importMetaLeadsForCurrentUser(input: {
  sourceType: MetaLeadImportSourceType;
  sourceId: string;
  organizationId?: string | null;
}): Promise<MetaLeadImportResponse> {
  if (!isValidSourceType(input.sourceType) || !input.sourceId.trim()) {
    throw new MetaLeadImportError("Fonte Meta invalida para importacao.", 400);
  }

  if (!isSupabaseConfigured()) {
    return importMockMetaLeads(input);
  }

  if (!hasSupabaseServiceRole()) {
    throw new MetaLeadImportError("SUPABASE_SERVICE_ROLE_KEY nao configurada.", 500);
  }

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    throw new MetaLeadImportError("Usuario nao autenticado.", 401);
  }

  if (input.organizationId && input.organizationId !== identity.organization.id) {
    throw new MetaLeadImportError("Organizacao invalida para esta importacao.", 403);
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(identity.organization.id);
  if (!accessToken) {
    throw new MetaLeadImportError("Conecte sua conta Meta para importar leads.", 409);
  }

  const forms = await loadOrganizationMetaForms(identity.organization.id);
  const selectedForms =
    input.sourceType === "form"
      ? forms.filter((form) => form.form_id === input.sourceId)
      : forms;

  if (selectedForms.length === 0) {
    throw new MetaLeadImportError("Nenhum formulario Meta elegivel encontrado para importacao.", 404);
  }

  const rawLeads = await fetchLeadsForSource({
    accessToken,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    forms: selectedForms
  });
  const summary = { ...EMPTY_SUMMARY, totalFound: rawLeads.length };
  const items: MetaLeadImportItem[] = [];

  for (const metaLead of rawLeads) {
    try {
      const mappedLead = mapMetaLeadToLeadPayload(metaLead);
      const form = forms.find((entry) => entry.form_id === (mappedLead.meta_form_id ?? metaLead.form_id));
      const result = await createLeadFromManualMetaImport({
        profile: identity.profile,
        lead: buildLeadInputFromMetaLead(mappedLead, metaLead, form)
      });

      if (result.status === "duplicate") {
        summary.duplicates += 1;
        summary.archived += result.archived ? 1 : 0;
        items.push({
          externalLeadId: mappedLead.meta_lead_id,
          leadId: result.lead.id,
          duplicateOfLeadId: result.duplicateLeadId ?? null,
          status: result.archived ? "archived" : "duplicate",
          duplicateReason: result.duplicateReason ?? null,
          message: result.archived
            ? "Lead duplicado arquivado automaticamente."
            : "Lead ja importado anteriormente."
        });
      } else {
        summary.imported += 1;
        items.push({
          externalLeadId: mappedLead.meta_lead_id,
          leadId: result.lead.id,
          status: "imported"
        });
      }
    } catch (error) {
      summary.errors += 1;
      items.push({
        externalLeadId: metaLead.id,
        status: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel importar este lead."
      });
      logger.error(
        {
          route: "/api/meta/leads/import",
          operation: "IMPORT_META_LEAD_ITEM",
          message: "Falha ao importar lead Meta individual.",
          data: {
            sourceType: input.sourceType,
            sourceId: input.sourceId,
            metaLeadId: metaLead.id,
            organizationId: identity.organization.id
          }
        },
        error
      );
    }
  }

  return {
    success: summary.errors === 0,
    summary,
    items,
    mode: "supabase"
  };
}

export class MetaLeadImportError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MetaLeadImportError";
    this.status = status;
  }
}

function buildLeadInputFromMetaLead(
  mappedLead: ReturnType<typeof mapMetaLeadToLeadPayload>,
  metaLead: MetaLeadRecord,
  form?: MetaFormRow
): LeadCreateInput {
  return {
    name: mappedLead.name,
    phone: mappedLead.phone,
    email: mappedLead.email,
    city: mappedLead.city,
    company_name: mappedLead.company_name,
    lives_count: mappedLead.lives_count,
    budget: mappedLead.budget,
    interest: mappedLead.interest,
    notes: mappedLead.notes,
    source_campaign: mappedLead.source_campaign,
    source_adset: mappedLead.source_adset,
    source_ad: mappedLead.source_ad,
    meta_lead_id: mappedLead.meta_lead_id,
    meta_form_id: mappedLead.meta_form_id ?? metaLead.form_id ?? form?.form_id,
    meta_page_id: form?.page_id,
    meta_campaign_id: mappedLead.meta_campaign_id,
    meta_adset_id: mappedLead.meta_adset_id,
    meta_ad_id: mappedLead.meta_ad_id,
    meta_connected_account_id: form?.connected_account_id,
    source: "meta_lead_ads",
    raw_payload: {
      source: "manual_meta_import",
      meta_lead_payload: mappedLead.raw_payload,
      meta_import_context: {
        form_id: form?.form_id ?? metaLead.form_id,
        page_id: form?.page_id ?? null,
        page_name: form?.page_name ?? null
      }
    }
  };
}

async function fetchLeadsForSource(input: {
  accessToken: string;
  sourceType: MetaLeadImportSourceType;
  sourceId: string;
  forms: MetaFormRow[];
}) {
  const leadGroups = await Promise.all(
    input.forms.map((form) => fetchMetaLeadsForForm(form.form_id, input.accessToken))
  );
  const leads = leadGroups.flat();

  if (input.sourceType === "campaign") {
    return leads.filter((lead) => lead.campaign_id === input.sourceId);
  }

  if (input.sourceType === "ad") {
    return leads.filter((lead) => lead.ad_id === input.sourceId);
  }

  return leads;
}

async function fetchMetaLeadsForForm(formId: string, accessToken: string): Promise<MetaLeadRecord[]> {
  const leads: MetaLeadRecord[] = [];
  let url: URL | null = buildGraphUrl(`/${formId}/leads`);
  url.searchParams.set("fields", META_LEAD_FIELDS);
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", accessToken);

  for (let page = 0; page < 10 && url; page += 1) {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as {
      data?: unknown[];
      paging?: { next?: string };
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      throw new MetaLeadImportError(
        payload?.error?.message
          ? `Falha ao buscar leads na Meta: ${payload.error.message}`
          : `Falha ao buscar leads na Meta: status ${response.status}.`,
        response.status
      );
    }

    leads.push(...(payload?.data ?? []).flatMap(parseMetaLeadRecordForImport));
    const nextUrl = payload?.paging?.next;
    url = nextUrl ? new URL(nextUrl) : null;
  }

  return leads;
}

async function listGraphCampaignAndAdSources(input: {
  accessToken: string;
  adAccounts: Array<Pick<MetaAdAccountRow, "meta_ad_account_id" | "name">>;
}) {
  const sourceGroups = await Promise.all(
    input.adAccounts.map(async (account) => {
      const [campaigns, ads] = await Promise.all([
        fetchMetaCampaignSources(account, input.accessToken),
        fetchMetaAdSources(account, input.accessToken)
      ]);

      return [...campaigns, ...ads];
    })
  );

  return sourceGroups.flat();
}

async function fetchMetaCampaignSources(
  account: Pick<MetaAdAccountRow, "meta_ad_account_id" | "name">,
  accessToken: string
): Promise<MetaLeadImportSource[]> {
  try {
    const response = await fetchMetaGraphList<MetaCampaignResponse>(
      `/${normalizeAdAccountPath(account.meta_ad_account_id)}/campaigns`,
      {
        accessToken,
        fields: "id,name,status,effective_status,updated_time",
        limit: "50"
      }
    );

    return response.flatMap((campaign) => {
      const id = normalizeOptionalString(campaign.id);
      if (!id) {
        return [];
      }

      return [
        {
          id,
          type: "campaign" as const,
          name: normalizeOptionalString(campaign.name) ?? "Campanha Meta",
          status: mapMetaDeliveryStatus(campaign.effective_status ?? campaign.status),
          adAccountId: account.meta_ad_account_id,
          adAccountName: account.name,
          availableLeadCount: null,
          hasAvailableLeads: null,
          lastCollectedAt: normalizeOptionalString(campaign.updated_time)
        }
      ];
    });
  } catch (error) {
    logger.error(
      {
        route: "/api/meta/leads/sources",
        operation: "LIST_META_CAMPAIGNS",
        message: "Falha ao listar campanhas Meta.",
        data: { adAccountId: account.meta_ad_account_id }
      },
      error
    );
    return [];
  }
}

async function fetchMetaAdSources(
  account: Pick<MetaAdAccountRow, "meta_ad_account_id" | "name">,
  accessToken: string
): Promise<MetaLeadImportSource[]> {
  try {
    const response = await fetchMetaGraphList<MetaAdResponse>(
      `/${normalizeAdAccountPath(account.meta_ad_account_id)}/ads`,
      {
        accessToken,
        fields: "id,name,status,effective_status,updated_time,campaign_id,campaign{id,name}",
        limit: "50"
      }
    );

    return response.flatMap((ad) => {
      const id = normalizeOptionalString(ad.id);
      if (!id) {
        return [];
      }

      return [
        {
          id,
          type: "ad" as const,
          name: normalizeOptionalString(ad.name) ?? "Anuncio Meta",
          status: mapMetaDeliveryStatus(ad.effective_status ?? ad.status),
          parentName: normalizeOptionalString(ad.campaign?.name) ?? null,
          campaignId: normalizeOptionalString(ad.campaign_id ?? ad.campaign?.id),
          campaignName: normalizeOptionalString(ad.campaign?.name),
          adAccountId: account.meta_ad_account_id,
          adAccountName: account.name,
          availableLeadCount: null,
          hasAvailableLeads: null,
          lastCollectedAt: normalizeOptionalString(ad.updated_time)
        }
      ];
    });
  } catch (error) {
    logger.error(
      {
        route: "/api/meta/leads/sources",
        operation: "LIST_META_ADS",
        message: "Falha ao listar anuncios Meta.",
        data: { adAccountId: account.meta_ad_account_id }
      },
      error
    );
    return [];
  }
}

async function fetchMetaGraphList<T>(
  path: string,
  input: { accessToken: string; fields: string; limit: string }
): Promise<T[]> {
  const url = buildGraphUrl(path);
  url.searchParams.set("fields", input.fields);
  url.searchParams.set("limit", input.limit);
  url.searchParams.set("access_token", input.accessToken);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    data?: T[];
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Meta Graph API status ${response.status}.`);
  }

  return payload?.data ?? [];
}

async function loadOrganizationMetaForms(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_forms")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new MetaLeadImportError("Nao foi possivel carregar formularios Meta da organizacao.", 500);
  }

  return data ?? [];
}

function mapFormToSource(form: {
  metaFormId: string;
  name: string;
  status: string;
  pageId: string;
  pageName: string;
  lastLeadSyncAt?: string | null;
  lastSyncAt?: string | null;
}): MetaLeadImportSource {
  return {
    id: form.metaFormId,
    type: "form",
    name: form.name,
    status: mapConnectionStatusToImportStatus(form.status),
    parentName: form.pageName,
    pageId: form.pageId,
    pageName: form.pageName,
    availableLeadCount: null,
    hasAvailableLeads: null,
    lastCollectedAt: form.lastLeadSyncAt ?? form.lastSyncAt ?? null
  };
}

function mapAdAccountToSourcePlaceholder(account: {
  metaAdAccountId: string;
  name: string;
}): MetaLeadImportSource {
  return {
    id: account.metaAdAccountId,
    type: "campaign",
    name: `Campanhas em ${account.name}`,
    status: "unknown",
    adAccountId: account.metaAdAccountId,
    adAccountName: account.name,
    availableLeadCount: null,
    hasAvailableLeads: null,
    lastCollectedAt: null
  };
}

function mergeImportSources(
  localSources: MetaLeadImportSource[],
  graphSources: MetaLeadImportSource[]
) {
  const graphSourceKeys = new Set(graphSources.map((source) => `${source.type}:${source.id}`));
  return [
    ...graphSources,
    ...localSources.filter((source) => !graphSourceKeys.has(`${source.type}:${source.id}`))
  ];
}

function getMockMetaLeadImportSources(): MetaLeadImportSource[] {
  return [
    {
      id: "demo-campaign-health-pme",
      type: "campaign",
      name: "PME plano empresarial - Maio",
      status: "active",
      adAccountName: "Conta Demo Principal",
      availableLeadCount: 2,
      hasAvailableLeads: true,
      lastCollectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: "demo-ad-health-pme-01",
      type: "ad",
      name: "Criativo cotacao consultiva",
      status: "active",
      parentName: "PME plano empresarial - Maio",
      campaignId: "demo-campaign-health-pme",
      campaignName: "PME plano empresarial - Maio",
      availableLeadCount: 1,
      hasAvailableLeads: true,
      lastCollectedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    },
    {
      id: "form_445566",
      type: "form",
      name: "Cotacao empresarial - principal",
      status: "active",
      pageId: "page_123456",
      pageName: "Corretora Demo Empresarial",
      availableLeadCount: 2,
      hasAvailableLeads: true,
      lastCollectedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    }
  ];
}

function importMockMetaLeads(input: {
  sourceType: MetaLeadImportSourceType;
  sourceId: string;
}): MetaLeadImportResponse {
  const now = new Date().toISOString();
  const candidates: Lead[] = [
    {
      id: `mock-meta-import-${Date.now()}`,
      name: "Carolina Prado",
      owner: "Demo",
      canEdit: true,
      canDelete: true,
      stage: "Novo lead",
      source: "Meta Lead Form",
      phone: "(11) 98888-4545",
      email: "carolina.prado@demoimport.com.br",
      city: "Sao Paulo",
      companyName: "Prado Administracao",
      livesCount: 24,
      createdAt: "15 mai 2026",
      budget: "A qualificar",
      interest: "Cotacao de plano empresarial",
      lastInteraction: "Lead importado manualmente da Meta.",
      notes: "Mock de importacao Meta. TODO: substituir pela Meta Graph API em producao.",
      sourceCampaign: input.sourceType === "campaign" ? input.sourceId : "Campanha Meta Demo",
      sourceAd: input.sourceType === "ad" ? input.sourceId : null,
      metaLeadId: `demo-import-${Date.now()}`,
      metaFormId: input.sourceType === "form" ? input.sourceId : "form_445566",
      metaPageId: "page_123456",
      metaConnectedAccountId: "demo-meta-connection",
      receivedAt: now,
      archivedAt: null
    },
    {
      id: `mock-meta-import-duplicate-${Date.now()}`,
      name: "Marina Azevedo",
      owner: "Demo",
      canEdit: true,
      canDelete: true,
      stage: "Novo lead",
      source: "Meta Lead Form",
      phone: "(19) 98842-1042",
      email: "marina@azevedoclinica.com.br",
      city: "Campinas",
      companyName: "Azevedo Clinica",
      livesCount: 48,
      createdAt: "15 mai 2026",
      budget: "A qualificar",
      interest: "Cotacao de plano empresarial",
      lastInteraction: "Lead duplicado encontrado na importacao Meta.",
      notes: "Mock de lead duplicado arquivado automaticamente.",
      sourceCampaign: "Campanha Meta Demo",
      metaLeadId: `demo-import-duplicate-${Date.now()}`,
      metaFormId: "form_445566",
      metaPageId: "page_123456",
      metaConnectedAccountId: "demo-meta-connection",
      receivedAt: now,
      archivedAt: now,
      archiveReason: "Lead duplicado",
      duplicateOfLeadId: "LE-1042"
    }
  ];

  const existingEmails = new Set(mockLeads.map((lead) => normalizeEmail(lead.email)).filter(Boolean));
  const existingPhones = new Set(
    mockLeads.map((lead) => normalizePhone(lead.phone).e164).filter(Boolean)
  );
  const items: MetaLeadImportItem[] = [];
  let imported = 0;
  let duplicates = 0;
  let archived = 0;

  for (const candidate of candidates) {
    const isDuplicate =
      existingEmails.has(normalizeEmail(candidate.email)) ||
      existingPhones.has(normalizePhone(candidate.phone).e164);

    if (isDuplicate) {
      duplicates += 1;
      archived += 1;
      mockLeads.push({ ...candidate, archivedAt: now, archiveReason: "Lead duplicado" });
      items.push({
        externalLeadId: candidate.metaLeadId,
        leadId: candidate.id,
        duplicateOfLeadId: candidate.duplicateOfLeadId ?? null,
        status: "archived",
        duplicateReason: "email",
        message: "Lead duplicado arquivado automaticamente no modo demonstracao."
      });
    } else {
      imported += 1;
      mockLeads.unshift(candidate);
      items.push({
        externalLeadId: candidate.metaLeadId,
        leadId: candidate.id,
        status: "imported"
      });
    }
  }

  return {
    success: true,
    mode: "not-configured",
    summary: {
      totalFound: candidates.length,
      imported,
      duplicates,
      archived,
      errors: 0
    },
    items,
    message: "Importacao Meta executada com dados mockados."
  };
}

function parseMetaLeadRecordForImport(value: unknown): MetaLeadRecord[] {
  if (!isRecord(value) || typeof value.id !== "string") {
    return [];
  }

  const fieldData = Array.isArray(value.field_data) ? value.field_data : [];

  return [
    {
      id: value.id,
      created_time: normalizeOptionalString(value.created_time),
      ad_id: normalizeOptionalString(value.ad_id),
      ad_name: normalizeOptionalString(value.ad_name),
      adset_id: normalizeOptionalString(value.adset_id),
      adset_name: normalizeOptionalString(value.adset_name),
      campaign_id: normalizeOptionalString(value.campaign_id),
      campaign_name: normalizeOptionalString(value.campaign_name),
      form_id: normalizeOptionalString(value.form_id),
      is_organic: typeof value.is_organic === "boolean" ? value.is_organic : null,
      platform: normalizeOptionalString(value.platform),
      field_data: fieldData.flatMap((field) => {
        if (!isRecord(field) || typeof field.name !== "string") {
          return [];
        }

        const values = Array.isArray(field.values)
          ? field.values.map((item) => String(item).trim()).filter(Boolean)
          : [];

        return [{ name: field.name, values }];
      })
    }
  ];
}

function mapConnectionStatusToImportStatus(status: string): MetaLeadImportSourceStatus {
  switch (status) {
    case "connected":
    case "active":
      return "active";
    case "disconnected":
    case "inactive":
    case "revoked":
      return "ended";
    case "expired":
    case "error":
      return "paused";
    case "pending":
    default:
      return "unknown";
  }
}

function mapMetaDeliveryStatus(status?: string | null): MetaLeadImportSourceStatus {
  const normalized = status?.trim().toUpperCase();

  if (!normalized) {
    return "unknown";
  }

  if (["ACTIVE", "IN_PROCESS", "WITH_ISSUES"].includes(normalized)) {
    return "active";
  }

  if (["PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED"].includes(normalized)) {
    return "paused";
  }

  if (["DELETED", "ARCHIVED", "DISAPPROVED", "COMPLETED"].includes(normalized)) {
    return "ended";
  }

  return "unknown";
}

function normalizeAdAccountPath(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed.replace(/\D/g, "")}`;
}

function buildGraphUrl(path: string) {
  return new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}${path}`);
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isValidSourceType(value: string): value is MetaLeadImportSourceType {
  return value === "campaign" || value === "ad" || value === "form";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
