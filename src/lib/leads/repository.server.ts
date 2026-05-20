import { leads as mockLeads, type Lead } from "@/data/mock";
import { getMetaConnectionForOrganization } from "@/lib/integrations/repository.server";
import { assertOrganizationResourceAccess } from "@/lib/billing/subscription-limits.server";
import type { LeadComment } from "@/lib/leads/comments";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  applyLeadUrlFilters,
  defaultLeadUrlFilters,
  getLeadPeriodStart,
  getSupabaseSourceValue,
  getSupabaseStageValue,
  normalizeLeadSearchTerm,
  type LeadUrlFilters
} from "./filters";
import {
  normalizeEmail,
  normalizeLeadSource,
  normalizeLeadStage,
  normalizePhone,
  stringOrNull
} from "./normalization";
import {
  buildLeadPaginationMeta,
  normalizeLeadPaginationOptions,
  paginateLeads,
  type LeadDataState,
  type LeadPaginationOptions
} from "./repository";

import { isWorkspaceManagerRole } from "@/lib/workspaces/permissions";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadCommentRow = Database["public"]["Tables"]["lead_comments"]["Row"];
type LeadCommentInsert = Database["public"]["Tables"]["lead_comments"]["Insert"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
export type LeadDuplicateReason = "meta_lead_id" | "phone_e164" | "email";

type LeadCreationResult = {
  lead: Lead;
  status: "created" | "duplicate";
  duplicateReason?: LeadDuplicateReason;
};

export type LeadCreateInput = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  city?: unknown;
  company_name?: unknown;
  lives_count?: unknown;
  stage?: unknown;
  source?: unknown;
  budget?: unknown;
  interest?: unknown;
  last_interaction?: unknown;
  notes?: unknown;
  source_campaign?: unknown;
  source_adset?: unknown;
  source_ad?: unknown;
  meta_lead_id?: unknown;
  meta_form_id?: unknown;
  meta_page_id?: unknown;
  meta_campaign_id?: unknown;
  meta_adset_id?: unknown;
  meta_ad_id?: unknown;
  meta_connected_account_id?: unknown;
  import_batch_id?: unknown;
  archived_at?: unknown;
  archive_reason?: unknown;
  duplicate_of_lead_id?: unknown;
  raw_payload?: unknown;
};

export type LeadWebhookCreateInput = LeadCreateInput & {
  organization_id?: unknown;
  organization_slug?: unknown;
  owner_profile_id?: unknown;
  owner_email?: unknown;
};

const stageLabels: Record<LeadRow["stage"], string> = {
  new: "Novo lead",
  qualification: "Qualificação",
  proposal: "Proposta",
  negotiation: "Negociação",
  won: "Venda",
  lost: "Perdido"
};

const sourceLabels: Record<LeadRow["source"], string> = {
  manual: "Cadastro manual",
  csv_import: "CSV importado",
  meta_lead_ads: "Meta Lead Form",
  make_zapier: "Make/Zapier",
  api: "API"
};

const safeWebhookLeadSources = new Set<LeadRow["source"]>(["make_zapier", "api"]);
const safeOfficialWebhookLeadSources = new Set<LeadRow["source"]>([
  "make_zapier",
  "api",
  "meta_lead_ads"
]);

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const mockLeadComments: LeadComment[] = mockLeads.slice(0, 3).map((lead, index) => {
  const createdAt = new Date(Date.now() - (index + 1) * 1000 * 60 * 90).toISOString();

  return {
    id: `mock-comment-${lead.id.toLowerCase()}`,
    leadId: lead.id,
    authorProfileId: "mock-profile",
    authorName: lead.owner,
    authorEmail: `${lead.owner.toLowerCase()}@demo.leadi.local`,
    body: lead.lastInteraction,
    createdAt,
    updatedAt: createdAt
  };
});

export async function getLeadsForCurrentUser(
  filters: LeadUrlFilters = defaultLeadUrlFilters,
  paginationOptions?: LeadPaginationOptions
): Promise<LeadDataState> {
  const pagination = normalizeLeadPaginationOptions(paginationOptions);

  try {
    if (!isSupabaseConfigured()) {
      const filteredLeads = mockLeads.filter((lead) => {
        const matchesFilters = applyLeadUrlFilters(lead, filters);
        const matchesArchived = filters.archived ? lead.archivedAt !== null : lead.archivedAt === null;
        return matchesFilters && matchesArchived;
      });
      const paginatedLeads = paginateLeads(filteredLeads, pagination);

      return {
        leads: paginatedLeads,
        mode: "not-configured",
        canDeleteLeads: true,
        canCreateMetaAdsLeads: true,
        pagination: buildLeadPaginationMeta(
          pagination,
          filteredLeads.length,
          paginatedLeads.length
        ),
        message: "Supabase ainda nao configurado. Exibindo dados mockados."
      };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        leads: [],
        mode: "unauthenticated",
        canDeleteLeads: false,
        canCreateMetaAdsLeads: false,
        pagination: buildLeadPaginationMeta(pagination, 0, 0),
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
        leads: [],
        mode: "error",
        canDeleteLeads: false,
        canCreateMetaAdsLeads: false,
        pagination: buildLeadPaginationMeta(pagination, 0, 0),
        message: "Nao foi possivel carregar os leads"
      };
    }

    const hasMetaConnection = Boolean(
      await getMetaConnectionForOrganization(profile.organization_id)
    );

    let { data, error, count } = await runLeadListQuery({
      supabase,
      profile,
      filters,
      pagination,
      includeArchivedFilter: true
    });

    if (error && isMissingArchivedAtColumnError(error)) {
      console.warn(
        "[getLeadsForCurrentUser] archived_at column missing, retrying without archived filter."
      );

      ({ data, error, count } = await runLeadListQuery({
        supabase,
        profile,
        filters,
        pagination,
        includeArchivedFilter: false
      }));
    }

    if (error) {
      console.error("[getLeadsForCurrentUser] Supabase query error:", error);
      return {
        leads: [],
        mode: "error",
        canDeleteLeads: false,
        canCreateMetaAdsLeads: hasMetaConnection,
        pagination: buildLeadPaginationMeta(pagination, 0, 0),
        message: "Nao foi possivel carregar os leads"
      };
    }

    const leads = ((data ?? []) as LeadRow[]).map((lead) =>
      mapLeadRowToLead(lead, profile, hasMetaConnection)
    );
    const total = pagination.limit === null ? leads.length : count ?? pagination.offset + leads.length;

    return {
      leads,
      mode: "supabase",
      canDeleteLeads: canDeleteOrganizationLeads(profile),
      canCreateMetaAdsLeads: hasMetaConnection,
      pagination: buildLeadPaginationMeta(pagination, total, leads.length)
    };
  } catch (err) {
    console.error("[getLeadsForCurrentUser] Unexpected error:", err);
    return {
      leads: [],
      mode: "error",
      canDeleteLeads: false,
      canCreateMetaAdsLeads: false,
      pagination: buildLeadPaginationMeta(pagination, 0, 0),
      message: "Nao foi possivel carregar os leads"
    };
  }
}

export async function getLeadExportRowsForCurrentUser(
  filters: LeadUrlFilters = defaultLeadUrlFilters,
  sellerProfileId: string | null = null
): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    return mockLeads.filter((lead) => applyLeadUrlFilters(lead, filters));
  }

  const profile = await getCurrentProfile();
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const supabase = await createSupabaseServerClient();
  const exportProfiles = await loadLeadExportProfiles(supabase, profile.organization_id);
  const query = buildLeadQuery(
    supabase.from("leads").select("*").eq("organization_id", profile.organization_id),
    profile,
    filters,
    sellerProfileId
  ).order("received_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as LeadRow[]).map((lead) =>
    mapLeadRowToExportLead(lead, profile, exportProfiles, hasMetaConnection)
  );
}

export async function getLeadsCountForCurrentUser(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return mockLeads.length;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return 0;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id);

  if (profile.role === "seller") {
    query = query.eq("owner_profile_id", profile.id);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Erro ao contar leads:", error);
    return 0;
  }

  return count ?? 0;
}

export async function createLeadForCurrentUser(input: LeadCreateInput): Promise<LeadCreationResult> {
  if (!isSupabaseConfigured()) {
    return { lead: createMockLead(input), status: "created" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Perfil nao encontrado.");
  }

  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );

  await assertOrganizationResourceAccess(profile.organization_id, "lead_creation");

  const payload = buildLeadInsert(profile, input);
  assertCanCreateLead(profile, payload, hasMetaConnection);

  const duplicate = await findDuplicateLead(supabase, profile.organization_id, payload);

  if (duplicate) {
    assertCanManageLead(profile, duplicate.lead, "editar", hasMetaConnection);
    const updatePayload = { ...payload };
    delete updatePayload.import_batch_id;

    const { data, error } = await supabase
      .from("leads")
      .update({
        ...updatePayload,
        organization_id: profile.organization_id,
        owner_profile_id: duplicate.lead.owner_profile_id ?? profile.id
      })
      .eq("id", duplicate.lead.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      lead: mapLeadRowToLead(data, profile),
      status: "duplicate",
      duplicateReason: duplicate.reason
    };
  }

  const { data, error } = await insertLeadWithSchemaFallback(supabase, payload);

  if (error) {
    throw new Error(error.message);
  }

  return { lead: mapLeadRowToLead(data, profile), status: "created" };
}

export async function createLeadFromWebhook(
  input: LeadWebhookCreateInput
): Promise<LeadCreationResult> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const supabase = createSupabaseAdminClient();
  const profile = await resolveWebhookLeadProfile(supabase, input);
  await assertOrganizationResourceAccess(profile.organization_id, "lead_creation");
  const payload = buildLeadInsert(profile, {
    ...input,
    source: normalizeWebhookLeadSource(input.source, { allowOfficialMetaSource: true }),
    raw_payload: input.raw_payload ?? input
  });
  const duplicate = await findDuplicateLead(supabase, profile.organization_id, payload);

  if (duplicate) {
    if (shouldTreatMetaReplayAsNoop(payload, duplicate.reason)) {
      return returnExistingDuplicateLead(profile, duplicate.lead, duplicate.reason);
    }

    return updateDuplicateWebhookLead({
      supabase,
      profile,
      payload,
      duplicate: duplicate.lead,
      reason: duplicate.reason
    });
  }

  const { data, error } = await insertLeadWithSchemaFallback(supabase, payload);

  if (error) {
    if (payload.meta_lead_id && isMetaLeadUniqueViolation(error)) {
      const duplicatedLead = await findLeadByMetaLeadId(
        supabase,
        profile.organization_id,
        payload.meta_lead_id
      );

      if (duplicatedLead) {
        console.info(
          `Lead Meta duplicado detectado e reaproveitado: meta_lead_id=${payload.meta_lead_id}`
        );

        return returnExistingDuplicateLead(profile, duplicatedLead, "meta_lead_id");
      }
    }

    throw new Error(error.message);
  }

  return { lead: mapLeadRowToLead(data, profile), status: "created" };
}

export async function createLeadFromManualMetaImport(input: {
  profile: ProfileRow;
  lead: LeadCreateInput;
}): Promise<LeadCreationResult & { archived: boolean; duplicateLeadId?: string }> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const supabase = createSupabaseAdminClient();
  await assertOrganizationResourceAccess(input.profile.organization_id, "lead_creation");

  const payload = buildLeadInsert(input.profile, {
    ...input.lead,
    source: "meta_lead_ads"
  });
  const duplicate = await findDuplicateLead(supabase, input.profile.organization_id, payload);

  if (duplicate) {
    if (shouldTreatMetaReplayAsNoop(payload, duplicate.reason)) {
      return {
        ...returnExistingDuplicateLead(input.profile, duplicate.lead, duplicate.reason),
        archived: false,
        duplicateLeadId: duplicate.lead.id
      };
    }

    const archivedPayload: LeadInsert = {
      ...payload,
      archived_at: new Date().toISOString(),
      archive_reason: "Lead duplicado",
      duplicate_of_lead_id: duplicate.lead.id
    };
    const { data, error } = await insertLeadWithSchemaFallback(supabase, archivedPayload);

    if (error) {
      throw new Error(error.message);
    }

    return {
      lead: mapLeadRowToLead(data, input.profile),
      status: "duplicate",
      duplicateReason: duplicate.reason,
      archived: true,
      duplicateLeadId: duplicate.lead.id
    };
  }

  const { data, error } = await insertLeadWithSchemaFallback(supabase, payload);

  if (error) {
    if (payload.meta_lead_id && isMetaLeadUniqueViolation(error)) {
      const duplicatedLead = await findLeadByMetaLeadId(
        supabase,
        input.profile.organization_id,
        payload.meta_lead_id
      );

      if (duplicatedLead) {
        return {
          ...returnExistingDuplicateLead(input.profile, duplicatedLead, "meta_lead_id"),
          archived: false,
          duplicateLeadId: duplicatedLead.id
        };
      }
    }

    throw new Error(error.message);
  }

  return {
    lead: mapLeadRowToLead(data, input.profile),
    status: "created",
    archived: false
  };
}

export async function updateLeadForCurrentUser(id: string, input: LeadCreateInput) {
  if (!isSupabaseConfigured()) {
    return updateMockLead(id, input);
  }

  const profile = await getCurrentProfile();
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const existingLead = await getLeadForMutation(id, profile.organization_id);
  const payload = buildLeadUpdate(existingLead, input);

  assertCanManageLead(profile, existingLead, "editar", hasMetaConnection);
  assertCanApplyLeadUpdate(profile, payload, hasMetaConnection);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapLeadRowToLead(data, profile);
}

export async function archiveLeadForCurrentUser(id: string) {
  if (!isSupabaseConfigured()) {
    const lead = mockLeads.find(l => l.id === id);
    if (lead) {
      lead.archivedAt = new Date().toISOString();
    }
    return;
  }

  const profile = await getCurrentProfile();
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const existingLead = await getLeadForMutation(id, profile.organization_id);

  assertCanManageLead(profile, existingLead, "arquivar", hasMetaConnection);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lead nao encontrado.");
  }
}

export const deleteLeadForCurrentUser = archiveLeadForCurrentUser;

export async function listLeadCommentsForCurrentUser(id: string): Promise<LeadComment[]> {
  if (!isSupabaseConfigured()) {
    return mockLeadComments
      .filter((comment) => comment.leadId === id)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  const profile = await getCurrentProfile();
  const lead = await getLeadForMutation(id, profile.organization_id);

  assertCanAccessLead(profile, lead, "visualizar");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_comments")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapLeadCommentRowToItem);
}

export async function createLeadCommentForCurrentUser(
  id: string,
  input: { body?: unknown }
): Promise<{ comment: LeadComment; lead: Lead }> {
  const body = normalizeLeadCommentBody(input.body);

  if (!isSupabaseConfigured()) {
    const comment: LeadComment = {
      id: `mock-comment-${Date.now()}`,
      leadId: id,
      authorProfileId: "mock-profile",
      authorName: "Equipe demo",
      authorEmail: "demo@leadi.local",
      body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockLeadComments.push(comment);

    return {
      comment,
      lead: updateMockLeadCommentLead(id, body)
    };
  }

  const profile = await getCurrentProfile();
  const lead = await getLeadForMutation(id, profile.organization_id);

  assertCanAccessLead(profile, lead, "comentar");

  const supabase = await createSupabaseServerClient();
  const updatedInteraction = buildLeadInteractionSummary(body);
  const { data: updatedLeadRow, error: updateError } = await supabase
    .from("leads")
    .update({
      last_interaction: updatedInteraction
    })
    .eq("id", lead.id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data, error } = await supabase
    .from("lead_comments")
    .insert(buildLeadCommentInsert(updatedLeadRow, profile, body))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    comment: mapLeadCommentRowToItem(data),
    lead: mapLeadRowToLead(updatedLeadRow, profile)
  };
}

async function findDuplicateLead(
  supabase: ServerClient | AdminClient,
  organizationId: string,
  payload: LeadInsert
) {
  if (payload.meta_lead_id) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("meta_lead_id", payload.meta_lead_id)
      .maybeSingle();

    if (data) {
      return { lead: data, reason: "meta_lead_id" as const };
    }
  }

  if (payload.phone_e164) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("phone_e164", payload.phone_e164)
      .maybeSingle();

    if (data) {
      return { lead: data, reason: "phone_e164" as const };
    }
  }

  if (payload.email) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("email", payload.email)
      .maybeSingle();

    if (data) {
      return { lead: data, reason: "email" as const };
    }
  }

  return null;
}

async function findLeadByMetaLeadId(
  supabase: ServerClient | AdminClient,
  organizationId: string,
  metaLeadId: string
) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("meta_lead_id", metaLeadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateDuplicateWebhookLead(input: {
  supabase: AdminClient;
  profile: ProfileRow;
  payload: LeadInsert;
  duplicate: LeadRow;
  reason: LeadDuplicateReason;
}): Promise<LeadCreationResult> {
  const updatePayload = { ...input.payload };
  delete updatePayload.import_batch_id;

  const { data, error } = await input.supabase
    .from("leads")
    .update({
      ...updatePayload,
      organization_id: input.profile.organization_id,
      owner_profile_id: input.duplicate.owner_profile_id ?? input.profile.id
    })
    .eq("id", input.duplicate.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    lead: mapLeadRowToLead(data, input.profile),
    status: "duplicate",
    duplicateReason: input.reason
  };
}

function returnExistingDuplicateLead(
  profile: ProfileRow,
  duplicate: LeadRow,
  reason: LeadDuplicateReason
): LeadCreationResult {
  return {
    lead: mapLeadRowToLead(duplicate, profile),
    status: "duplicate",
    duplicateReason: reason
  };
}

function shouldTreatMetaReplayAsNoop(
  payload: LeadInsert,
  duplicateReason: LeadDuplicateReason
) {
  return payload.source === "meta_lead_ads" && Boolean(payload.meta_lead_id) && duplicateReason === "meta_lead_id";
}

function buildLeadCommentInsert(
  lead: LeadRow,
  profile: ProfileRow,
  body: string
): LeadCommentInsert {
  return {
    organization_id: lead.organization_id,
    lead_id: lead.id,
    author_profile_id: profile.id,
    author_name: profile.full_name?.trim() || profile.email.split("@")[0] || "Usuario",
    author_email: profile.email,
    body
  };
}

function mapLeadCommentRowToItem(row: LeadCommentRow): LeadComment {
  return {
    id: row.id,
    leadId: row.lead_id,
    authorProfileId: row.author_profile_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getLeadForMutation(id: string, organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lead nao encontrado.");
  }

  return data;
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

function buildLeadQuery(
  query: ReturnType<ServerClient["from"]>,
  profile: ProfileRow,
  filters: LeadUrlFilters,
  sellerProfileId: string | null = null
) {
  const ownerProfileId = resolveLeadOwnerProfileId(profile, sellerProfileId);

  if (ownerProfileId && !isWorkspaceManagerRole(profile.role)) {
    query = query.eq("owner_profile_id", ownerProfileId);
  }

  const stageValue = getSupabaseStageValue(filters.stage);
  if (stageValue) {
    query = query.eq("stage", stageValue);
  }

  const sourceValue = getSupabaseSourceValue(filters.source);
  if (sourceValue) {
    query = query.eq("source", sourceValue);
  }

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  const periodStart = getLeadPeriodStart(filters.period);
  if (periodStart) {
    query = query.gte("received_at", periodStart.toISOString());
  }

  const searchPattern = getSupabaseLeadSearchPattern(filters.search);
  if (searchPattern) {
    query = query.or(
      [
        `name.ilike.${searchPattern}`,
        `email.ilike.${searchPattern}`,
        `phone.ilike.${searchPattern}`,
        `phone_e164.ilike.${searchPattern}`,
        `city.ilike.${searchPattern}`,
        `company_name.ilike.${searchPattern}`
      ].join(",")
    );
  }

  return query;
}

async function runLeadListQuery(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  profile: ProfileRow;
  filters: LeadUrlFilters;
  pagination: ReturnType<typeof normalizeLeadPaginationOptions>;
  includeArchivedFilter: boolean;
}) {
  let query = buildLeadQuery(
    input.supabase.from("leads").select("*", { count: "exact" }).eq("organization_id", input.profile.organization_id),
    input.profile,
    input.filters
  );

  if (input.includeArchivedFilter) {
    query = applyArchivedLeadFilter(query, input.filters.archived);
  }

  query = query.order("received_at", { ascending: false });

  if (input.pagination.limit === null) {
    query = buildLeadQuery(
      input.supabase.from("leads").select("*").eq("organization_id", input.profile.organization_id),
      input.profile,
      input.filters
    );

    if (input.includeArchivedFilter) {
      query = applyArchivedLeadFilter(query, input.filters.archived);
    }

    query = query.order("received_at", { ascending: false });
  }

  if (input.pagination.limit !== null) {
    query = query.range(input.pagination.offset, input.pagination.offset + input.pagination.limit - 1);
  }

  return query;
}

function applyArchivedLeadFilter(
  query: ReturnType<ServerClient["from"]>,
  archived: boolean
) {
  return archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
}

function isMissingArchivedAtColumnError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return error.code === "42703" && message.includes("archived_at");
}

function resolveLeadOwnerProfileId(profile: ProfileRow, sellerProfileId: string | null) {
  if (profile.role === "seller") {
    return profile.id;
  }

  if (!sellerProfileId || sellerProfileId === "all") {
    return null;
  }

  return sellerProfileId;
}

async function loadLeadExportProfiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, organization_id")
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin", "seller"]);

  if (error || !data) {
    return new Map<string, ProfileRow>();
  }

  return new Map<string, ProfileRow>(
    (data as ProfileRow[]).map((profile) => [profile.id, profile])
  );
}

async function resolveWebhookLeadProfile(
  supabase: AdminClient,
  input: LeadWebhookCreateInput
) {
  const organization = await getWebhookOrganization(supabase, input);
  const ownerProfileId = stringOrNull(input.owner_profile_id);
  const ownerEmail = normalizeEmail(input.owner_email);

  if (ownerProfileId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", ownerProfileId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Perfil informado nao pertence a organizacao.");
    }

    return data;
  }

  if (ownerEmail) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("email", ownerEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Nao encontramos o owner_email informado na organizacao.");
    }

    return data;
  }

  if (organization.owner_profile_id) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("id", organization.owner_profile_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const fallbackProfile = [...(data ?? [])].sort(
    (left, right) => getProfileWebhookPriority(left.role) - getProfileWebhookPriority(right.role)
  )[0];

  if (!fallbackProfile) {
    throw new Error("Organizacao sem perfis disponiveis para receber leads.");
  }

  return fallbackProfile;
}

async function getWebhookOrganization(supabase: AdminClient, input: LeadWebhookCreateInput) {
  const organizationId = stringOrNull(input.organization_id);
  const organizationSlug = stringOrNull(input.organization_slug);

  if (!organizationId && !organizationSlug) {
    throw new Error("Informe organization_id ou organization_slug no webhook.");
  }

  const query = supabase.from("organizations").select("*");
  const { data, error } = organizationId
    ? await query.eq("id", organizationId).maybeSingle()
    : await query.eq("slug", organizationSlug ?? "").maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Organizacao nao encontrada.");
  }

  return data as OrganizationRow;
}

async function insertLeadWithSchemaFallback(
  supabase: ServerClient | AdminClient,
  payload: LeadInsert
) {
  const fallbackPayload = { ...payload };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await supabase.from("leads").insert(fallbackPayload).select("*").single();

    if (!result.error) {
      return result;
    }

    const missingColumn = getMissingLeadColumnName(result.error.message);
    if (!missingColumn) {
      return result;
    }

    delete fallbackPayload[missingColumn];
  }

  return supabase.from("leads").insert(fallbackPayload).select("*").single();
}

function getMissingLeadColumnName(message: string) {
  const fallbackColumns = [
    "import_batch_id",
    "archive_reason",
    "duplicate_of_lead_id"
  ] as const;

  return fallbackColumns.find((column) =>
    message.includes(`Could not find the '${column}' column of 'leads'`)
  );
}

function isMetaLeadUniqueViolation(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "23505" &&
    (message.includes("leads_meta_lead_unique_idx") || message.includes("meta_lead_id"))
  );
}

function canDeleteOrganizationLeads(profile: ProfileRow) {
  return isWorkspaceManagerRole(profile.role);
}

function canManageLead(
  profile: ProfileRow,
  lead: LeadRow,
  hasMetaConnection = false
) {
  return (
    isWorkspaceManagerRole(profile.role) ||
    (lead.owner_profile_id === profile.id &&
      (lead.source !== "meta_lead_ads" || hasMetaConnection))
  );
}

function assertCanCreateLead(
  profile: ProfileRow,
  payload: LeadInsert,
  hasMetaConnection: boolean
) {
  if (isWorkspaceManagerRole(profile.role)) {
    return;
  }

  if (payload.source === "meta_lead_ads" && !hasMetaConnection) {
    throw new Error("Conecte uma conta Meta ativa para cadastrar leads dessa origem.");
  }

  if (payload.owner_profile_id !== profile.id) {
    throw new Error("Sem permissao para criar lead para outro usuario.");
  }
}

function assertCanApplyLeadUpdate(
  profile: ProfileRow,
  payload: Database["public"]["Tables"]["leads"]["Update"],
  hasMetaConnection: boolean
) {
  if (profile.role === "seller" && payload.source === "meta_lead_ads" && !hasMetaConnection) {
    throw new Error("Conecte uma conta Meta ativa para usar essa origem.");
  }
}

function assertCanManageLead(
  profile: ProfileRow,
  lead: LeadRow,
  action: "editar" | "excluir" | "arquivar",
  hasMetaConnection: boolean
) {
  if (canManageLead(profile, lead, hasMetaConnection)) {
    return;
  }

  if (lead.source === "meta_lead_ads" && !hasMetaConnection) {
    throw new Error(`Conecte uma conta Meta ativa para ${action} leads dessa origem.`);
  }

  throw new Error(`Sem permissao para ${action} este lead.`);
}

function assertCanAccessLead(profile: ProfileRow, lead: LeadRow, action: "visualizar" | "comentar") {
  if (isWorkspaceManagerRole(profile.role)) {
    return;
  }

  if (lead.owner_profile_id === profile.id) {
    return;
  }

  throw new Error(`Sem permissao para ${action} este lead.`);
}

function normalizeWebhookLeadSource(
  value: unknown,
  options?: { allowOfficialMetaSource?: boolean }
): LeadRow["source"] {
  const source = normalizeLeadSource(value);
  const allowedSources = options?.allowOfficialMetaSource
    ? safeOfficialWebhookLeadSources
    : safeWebhookLeadSources;

  return allowedSources.has(source) ? source : "make_zapier";
}

function normalizeLeadCommentBody(value: unknown) {
  const body = stringOrNull(value)?.trim();

  if (!body) {
    throw new Error("Comentario vazio.");
  }

  if (body.length > 2000) {
    throw new Error("Comentario muito longo. Use ate 2000 caracteres.");
  }

  return body;
}

function buildLeadInsert(profile: ProfileRow, input: LeadCreateInput): LeadInsert {
  const name = getRequiredLeadName(input.name);
  const phone = normalizePhone(input.phone);
  const rawPayload = toJson(input.raw_payload);

  return {
    organization_id: profile.organization_id,
    owner_profile_id: profile.id,
    name,
    phone: phone.display,
    phone_e164: phone.e164,
    email: normalizeEmail(input.email),
    city: stringOrNull(input.city),
    company_name: stringOrNull(input.company_name),
    lives_count: normalizeInteger(input.lives_count),
    stage: normalizeLeadStage(input.stage),
    source: normalizeLeadSource(input.source),
    budget: stringOrNull(input.budget),
    interest: stringOrNull(input.interest),
    last_interaction: stringOrNull(input.last_interaction),
    notes: stringOrNull(input.notes),
    source_campaign: stringOrNull(input.source_campaign),
    source_adset: stringOrNull(input.source_adset),
    source_ad: stringOrNull(input.source_ad),
    meta_lead_id: stringOrNull(input.meta_lead_id),
    meta_form_id: stringOrNull(input.meta_form_id),
    meta_page_id: stringOrNull(input.meta_page_id),
    meta_campaign_id: stringOrNull(input.meta_campaign_id),
    meta_adset_id: stringOrNull(input.meta_adset_id),
    meta_ad_id: stringOrNull(input.meta_ad_id),
    meta_connected_account_id: stringOrNull(input.meta_connected_account_id),
    import_batch_id: stringOrNull(input.import_batch_id),
    archived_at: stringOrNull(input.archived_at),
    archive_reason: stringOrNull(input.archive_reason),
    duplicate_of_lead_id: stringOrNull(input.duplicate_of_lead_id),
    raw_payload: rawPayload ?? {}
  };
}

export async function undoCsvImportBatchForCurrentUser(importBatchId: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("undo_csv_import_batch", {
    batch_id: importBatchId
  });

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === "number" ? data : Number(data ?? 0);
}

function createMockLead(input: LeadCreateInput): Lead {
  const name = getRequiredLeadName(input.name);
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const stage = normalizeLeadStage(input.stage);
  const source = normalizeLeadSource(input.source);
  const now = new Date();

  return {
    id: `mock-${now.getTime()}`,
    name,
    owner: "Demo",
    canEdit: true,
    canDelete: true,
    stage: stageLabels[stage],
    source: sourceLabels[source],
    phone: phone.display ?? "Sem telefone",
    email: email ?? "Sem email",
    city: stringOrNull(input.city),
    companyName: stringOrNull(input.company_name),
    livesCount: normalizeInteger(input.lives_count),
    createdAt: dateFormatter.format(now),
    budget: stringOrNull(input.budget) ?? "A qualificar",
    interest: stringOrNull(input.interest) ?? "Interesse ainda nao qualificado",
    lastInteraction:
      stringOrNull(input.last_interaction) ?? "Lead cadastrado manualmente no modo demonstracao.",
    notes: stringOrNull(input.notes) ?? "Sem observacoes registradas.",
    sourceCampaign: stringOrNull(input.source_campaign),
    sourceAdset: stringOrNull(input.source_adset),
    sourceAd: stringOrNull(input.source_ad),
    metaLeadId: stringOrNull(input.meta_lead_id),
    metaFormId: stringOrNull(input.meta_form_id),
    metaPageId: stringOrNull(input.meta_page_id),
    metaConnectedAccountId: stringOrNull(input.meta_connected_account_id),
    receivedAt: now.toISOString()
  };
}

function updateMockLead(id: string, input: LeadCreateInput): Lead {
  const existingLead = mockLeads.find((lead) => lead.id === id);
  const phone = input.phone === undefined ? null : normalizePhone(input.phone);
  const email = input.email === undefined ? undefined : normalizeEmail(input.email);
  const stage = input.stage === undefined ? undefined : normalizeLeadStage(input.stage);
  const source = input.source === undefined ? undefined : normalizeLeadSource(input.source);
  const livesCount =
    input.lives_count === undefined ? existingLead?.livesCount : normalizeInteger(input.lives_count);
  const now = new Date();
  const updatedLeadBase = {
    id,
    name:
      input.name === undefined
        ? existingLead?.name ?? "Lead sem nome"
        : getRequiredLeadName(input.name),
    owner: existingLead?.owner ?? "Demo",
    canEdit: true,
    canDelete: true,
    stage: stage ? stageLabels[stage] : existingLead?.stage ?? "Novo lead",
    source: source ? sourceLabels[source] : existingLead?.source ?? "Cadastro manual",
    phone:
      input.phone === undefined
        ? existingLead?.phone ?? "Sem telefone"
        : phone?.display ?? "Sem telefone",
    email: input.email === undefined ? existingLead?.email ?? "Sem email" : email ?? "Sem email",
    city: input.city === undefined ? existingLead?.city ?? null : stringOrNull(input.city),
    companyName:
      input.company_name === undefined
        ? existingLead?.companyName ?? null
        : stringOrNull(input.company_name),
    livesCount,
    createdAt: existingLead?.createdAt ?? dateFormatter.format(now),
    budget:
      input.budget === undefined
        ? existingLead?.budget ?? "A qualificar"
        : stringOrNull(input.budget) ?? "A qualificar",
    interest:
      input.interest === undefined
        ? existingLead?.interest ?? "Interesse ainda nao qualificado"
        : stringOrNull(input.interest) ?? "Interesse ainda nao qualificado",
    lastInteraction:
      input.last_interaction === undefined
        ? existingLead?.lastInteraction ?? "Lead atualizado no modo demonstracao."
        : stringOrNull(input.last_interaction) ?? "Lead atualizado no modo demonstracao.",
    notes:
      input.notes === undefined
        ? existingLead?.notes ?? "Sem observacoes registradas."
        : stringOrNull(input.notes) ?? "Sem observacoes registradas.",
    sourceCampaign:
      input.source_campaign === undefined
        ? existingLead?.sourceCampaign ?? null
        : stringOrNull(input.source_campaign),
    sourceAdset:
      input.source_adset === undefined
        ? existingLead?.sourceAdset ?? null
        : stringOrNull(input.source_adset),
    sourceAd:
      input.source_ad === undefined ? existingLead?.sourceAd ?? null : stringOrNull(input.source_ad),
    metaLeadId:
      input.meta_lead_id === undefined
        ? existingLead?.metaLeadId ?? null
        : stringOrNull(input.meta_lead_id),
    metaFormId:
      input.meta_form_id === undefined
        ? existingLead?.metaFormId ?? null
        : stringOrNull(input.meta_form_id),
    metaPageId:
      input.meta_page_id === undefined
        ? existingLead?.metaPageId ?? null
        : stringOrNull(input.meta_page_id),
    metaConnectedAccountId:
      input.meta_connected_account_id === undefined
        ? existingLead?.metaConnectedAccountId ?? null
        : stringOrNull(input.meta_connected_account_id),
    receivedAt: existingLead?.receivedAt ?? now.toISOString()
  };
  return updatedLeadBase;
}

function getRequiredLeadName(value: unknown) {
  const name = stringOrNull(value);

  if (!name) {
    throw new Error("Nome do lead e obrigatorio.");
  }

  return name;
}

function buildLeadUpdate(existingLead: LeadRow, input: LeadCreateInput): Database["public"]["Tables"]["leads"]["Update"] {
  const phone = normalizePhone(input.phone);
  const rawPayload = toJson(input.raw_payload);

  return removeUndefinedValues({
    name: stringOrNull(input.name) ?? undefined,
    phone: input.phone === undefined ? undefined : phone.display,
    phone_e164: input.phone === undefined ? undefined : phone.e164,
    email: input.email === undefined ? undefined : normalizeEmail(input.email),
    city: input.city === undefined ? undefined : stringOrNull(input.city),
    company_name: input.company_name === undefined ? undefined : stringOrNull(input.company_name),
    lives_count: input.lives_count === undefined ? undefined : normalizeInteger(input.lives_count),
    stage: input.stage === undefined ? undefined : normalizeLeadStage(input.stage),
    source: input.source === undefined ? undefined : normalizeLeadSource(input.source),
    budget: input.budget === undefined ? undefined : stringOrNull(input.budget),
    interest: input.interest === undefined ? undefined : stringOrNull(input.interest),
    last_interaction:
      input.last_interaction === undefined ? undefined : stringOrNull(input.last_interaction),
    notes: input.notes === undefined ? undefined : stringOrNull(input.notes),
    source_campaign:
      input.source_campaign === undefined ? undefined : stringOrNull(input.source_campaign),
    source_adset: input.source_adset === undefined ? undefined : stringOrNull(input.source_adset),
    source_ad: input.source_ad === undefined ? undefined : stringOrNull(input.source_ad),
    meta_lead_id: input.meta_lead_id === undefined ? undefined : stringOrNull(input.meta_lead_id),
    meta_form_id: input.meta_form_id === undefined ? undefined : stringOrNull(input.meta_form_id),
    meta_page_id: input.meta_page_id === undefined ? undefined : stringOrNull(input.meta_page_id),
    meta_campaign_id:
      input.meta_campaign_id === undefined ? undefined : stringOrNull(input.meta_campaign_id),
    meta_adset_id: input.meta_adset_id === undefined ? undefined : stringOrNull(input.meta_adset_id),
    meta_ad_id: input.meta_ad_id === undefined ? undefined : stringOrNull(input.meta_ad_id),
    meta_connected_account_id:
      input.meta_connected_account_id === undefined
        ? undefined
        : stringOrNull(input.meta_connected_account_id),
    archived_at: input.archived_at === undefined ? undefined : stringOrNull(input.archived_at),
    archive_reason:
      input.archive_reason === undefined ? undefined : stringOrNull(input.archive_reason),
    duplicate_of_lead_id:
      input.duplicate_of_lead_id === undefined
        ? undefined
        : stringOrNull(input.duplicate_of_lead_id),
    raw_payload: rawPayload ?? undefined
  });
}

function mapLeadRowToLead(
  row: LeadRow,
  profile?: ProfileRow,
  hasMetaConnection = false
): Lead {
  const canManage = profile ? canManageLead(profile, row, hasMetaConnection) : false;

  return {
    id: row.id,
    name: row.name,
    owner: getLeadOwnerLabel(row, profile),
    ownerProfileId: row.owner_profile_id,
    canEdit: canManage,
    canDelete: canManage,
    stage: stageLabels[row.stage],
    source: sourceLabels[row.source],
    phone: row.phone ?? "Sem telefone",
    email: row.email ?? "Sem email",
    city: row.city,
    companyName: row.company_name,
    livesCount: row.lives_count,
    createdAt: dateFormatter.format(new Date(row.created_at)),
    budget: row.budget ?? "A qualificar",
    interest: row.interest ?? "Interesse ainda nao qualificado",
    lastInteraction: row.last_interaction ?? "Lead recebido no CRM.",
    notes: row.notes ?? "Sem observacoes registradas.",
    sourceCampaign: row.source_campaign,
    sourceAdset: row.source_adset,
    sourceAd: row.source_ad,
    metaLeadId: row.meta_lead_id,
    metaFormId: row.meta_form_id,
    metaPageId: row.meta_page_id,
    metaConnectedAccountId: row.meta_connected_account_id,
    receivedAt: row.received_at,
    archivedAt: row.archived_at,
    archiveReason: row.archive_reason,
    duplicateOfLeadId: row.duplicate_of_lead_id
  };
}

function updateMockLeadCommentLead(id: string, commentBody: string) {
  return updateMockLead(id, {
    last_interaction: buildLeadInteractionSummary(commentBody)
  });
}

function buildLeadInteractionSummary(body?: string | null) {
  return body ? `Comentário: ${body.slice(0, 120)}` : "Comentário registrado.";
}

function getSupabaseLeadSearchPattern(value: string) {
  const searchTerm = normalizeLeadSearchTerm(value);

  if (!searchTerm) {
    return null;
  }

  return `*${searchTerm.split(" ").join("*")}*`;
}

function getLeadOwnerLabel(row: LeadRow, profile?: ProfileRow) {
  if (!profile) {
    return "Equipe";
  }

  if (row.owner_profile_id === profile.id) {
    return profile.full_name ?? "Voce";
  }

  return "Equipe";
}

function mapLeadRowToExportLead(
  row: LeadRow,
  currentProfile: ProfileRow,
  exportProfiles: Map<string, ProfileRow>,
  hasMetaConnection = false
): Lead {
  const lead = mapLeadRowToLead(row, currentProfile, hasMetaConnection);
  const ownerProfile = row.owner_profile_id ? exportProfiles.get(row.owner_profile_id) : null;

  return {
    ...lead,
    owner:
      ownerProfile?.full_name?.trim() ||
      ownerProfile?.email?.trim() ||
      (row.owner_profile_id === currentProfile.id ? currentProfile.full_name ?? "Voce" : "Equipe")
  };
}

function normalizeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : null;
}

function getProfileWebhookPriority(role: ProfileRow["role"]) {
  switch (role) {
    case "owner":
      return 0;
    case "admin":
      return 1;
    default:
      return 2;
  }
}

function toJson(value: unknown): Json | null {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}

function removeUndefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as T;
}
