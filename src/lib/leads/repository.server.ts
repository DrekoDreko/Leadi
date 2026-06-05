import { leads as mockLeads, mockLeadOwnerOptions, type Lead } from "@/data/mock";
import { getMetaConnectionForOrganization } from "@/lib/integrations/repository.server";
import { assertOrganizationResourceAccess } from "@/lib/billing/subscription-limits.server";
import type { LeadComment } from "@/lib/leads/comments";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  createLeadAccessScope,
  type LeadAccessScope
} from "./access";
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
  normalizeLeadQuality,
  normalizeLeadSource,
  normalizeLeadStage,
  normalizePhone,
  stringOrNull
} from "./normalization";
import { getLeadStageLabel, getLeadStageValue } from "./stages";
import {
  buildLeadPaginationMeta,
  normalizeLeadPaginationOptions,
  paginateLeads,
  type LeadDataState,
  type LeadPaginationOptions
} from "./repository";

import { recordAuditLogForCurrentUser } from "@/lib/audit/audit-log.server";

import { isWorkspaceManagerRole, can } from "@/lib/workspaces/permissions";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadCommentRow = Database["public"]["Tables"]["lead_comments"]["Row"];
type LeadCommentInsert = Database["public"]["Tables"]["lead_comments"]["Insert"];
type LeadTaskRow = Database["public"]["Tables"]["lead_tasks"]["Row"];
type LeadTaskInsert = Database["public"]["Tables"]["lead_tasks"]["Insert"];
type LeadTaskUpdate = Database["public"]["Tables"]["lead_tasks"]["Update"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type LeadDataClient = ServerClient | AdminClient;
type LeadAccessProfile = Pick<ProfileRow, "id" | "organization_id" | "role">;
export type LeadDuplicateReason = "meta_lead_id" | "phone_e164" | "email";
export type LeadTaskStatusValue = Database["public"]["Enums"]["lead_task_status"];
export type LeadTaskPriorityValue = Database["public"]["Enums"]["lead_task_priority"];

const NO_RESULTS_FILTER_ID = "00000000-0000-0000-0000-000000000000";

export type LeadTaskItem = {
  id: string;
  organizationId: string;
  leadId: string;
  createdByProfileId: string;
  assignedToProfileId: string | null;
  title: string;
  description: string | null;
  status: LeadTaskStatusValue;
  priority: LeadTaskPriorityValue;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadOwnerOption = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "seller";
};

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
  quality?: unknown;
  budget?: unknown;
  interest?: unknown;
  last_interaction?: unknown;
  notes?: unknown;
  loss_reason?: unknown;
  cpf?: unknown;
  birth_date?: unknown;
  profession?: unknown;
  health_plan_type?: unknown;
  current_health_plan?: unknown;
  dependents_count?: unknown;
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
  owner_profile_id?: unknown;
};

export type LeadWebhookCreateInput = LeadCreateInput & {
  organization_id?: unknown;
  organization_slug?: unknown;
  owner_profile_id?: unknown;
  owner_email?: unknown;
};

export type LeadTaskCreateInput = {
  title?: unknown;
  description?: unknown;
  due_at?: unknown;
  assigned_to_profile_id?: unknown;
  priority?: unknown;
};

export type LeadTaskUpdateInput = {
  title?: unknown;
  description?: unknown;
  due_at?: unknown;
  assigned_to_profile_id?: unknown;
  priority?: unknown;
  status?: unknown;
};

export type LeadBulkAssignInput = {
  leadIds: string[];
  ownerProfileId: string;
};

export type LeadDistributeEquallyInput = {
  leadIds: string[];
  targetProfileIds: string[];
};

export type LeadBulkAssignResult = {
  leads: Lead[];
  updatedCount: number;
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
    type: index < 2 ? "contact" : "comment",
    createdAt,
    updatedAt: createdAt
  };
});

const mockLeadTasks = getMockLeadTaskStore();

function getMockLeadTaskStore() {
  const globalScope = globalThis as typeof globalThis & {
    __leadHealthLeadTasksMock?: LeadTaskItem[];
  };

  if (!globalScope.__leadHealthLeadTasksMock) {
    globalScope.__leadHealthLeadTasksMock = [];
  }

  return globalScope.__leadHealthLeadTasksMock;
}

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
      const recordedContactLeadIds = getRecordedContactLeadIdsFromComments(
        mockLeadComments,
        filteredLeads.map((lead) => lead.id)
      );
      const recordedContactLeadIdSet = new Set(recordedContactLeadIds);
      const decoratedLeads = filteredLeads.map((lead) => ({
        ...lead,
        hasRecordedContact: recordedContactLeadIdSet.has(lead.id)
      }));
      const paginatedLeads = paginateLeads(decoratedLeads, pagination);

      return {
        leads: paginatedLeads,
        mode: "not-configured",
        canDeleteLeads: true,
        canCreateMetaAdsLeads: true,
        pagination: buildLeadPaginationMeta(
          pagination,
          decoratedLeads.length,
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
    const ownerProfiles = await loadLeadOwnerProfiles(supabase, profile.organization_id);
    const accessScope = await resolveLeadAccessScope(supabase, profile);

    let { data, error, count } = await runLeadListQuery({
      supabase,
      profile,
      accessScope,
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
        accessScope,
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

    const leadRows = (data ?? []) as LeadRow[];
    const recordedContactLeadIdSet = await listRecordedContactLeadIdSetForOrganization(
      supabase,
      profile.organization_id,
      leadRows.map((lead) => lead.id)
    );
    const leads = leadRows.map((lead) =>
      mapLeadRowToLead(
        lead,
        profile,
        hasMetaConnection,
        ownerProfiles,
        recordedContactLeadIdSet.has(lead.id)
      )
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

export async function listLeadOwnerOptionsForCurrentUser(): Promise<LeadOwnerOption[]> {
  if (!isSupabaseConfigured()) {
    return mockLeadOwnerOptions;
  }

  const profile = await getCurrentProfile();
  const ownerProfiles = await loadLeadOwnerProfiles(
    await createSupabaseServerClient(),
    profile.organization_id
  );

  return mapLeadOwnerOptions(ownerProfiles);
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
  const accessScope = await resolveLeadAccessScope(supabase, profile);
  const exportProfiles = await loadLeadOwnerProfiles(supabase, profile.organization_id);
  const ownerProfileIdsFilter = await resolveOwnerProfileIdsFilter(
    supabase,
    profile.organization_id,
    filters.owner
  );
  
  const query = buildLeadQuery(
    supabase.from("leads").select("*").eq("organization_id", profile.organization_id),
    accessScope,
    filters,
    sellerProfileId,
    ownerProfileIdsFilter
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

  const accessScope = await resolveLeadAccessScope(supabase, profile);
  const query = applyLeadAccessScopeToQuery(
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id),
    accessScope
  );

  const { count, error } = await query;

  if (error) {
    console.error("Erro ao contar leads:", error);
    return 0;
  }

  return count ?? 0;
}

export async function listLeadIdsWithRecordedContactForCurrentUser(
  leadIds?: string[]
): Promise<string[]> {
  const scopedLeadIds = leadIds ? [...new Set(leadIds.filter(Boolean))] : undefined;

  if (scopedLeadIds && scopedLeadIds.length === 0) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return getRecordedContactLeadIdsFromComments(mockLeadComments, scopedLeadIds);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("lead_comments")
    .select("lead_id")
    .eq("organization_id", profile.organization_id)
    .like("body", "[CONTACT_LOG] %");

  if (scopedLeadIds) {
    query = query.in("lead_id", scopedLeadIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => row.lead_id))];
}

export type OverdueLeadTaskItem = {
  id: string;
  title: string;
  dueAt: string;
  leadId: string;
  leadName: string;
  leadStage: string;
};

export async function listOverdueLeadTasksForCurrentUser(): Promise<OverdueLeadTaskItem[]> {
  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    return mockLeadTasks
      .filter((task) => task.status !== "completed" && task.status !== "cancelled" && task.dueAt && task.dueAt < now)
      .map(task => {
        const lead = mockLeads.find(l => l.id === task.leadId);
        return {
          id: task.id,
          title: task.title,
          dueAt: task.dueAt as string,
          leadId: task.leadId,
          leadName: lead?.name ?? "Lead desconhecido",
          leadStage: lead?.stage ?? "Sem etapa"
        };
      })
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("lead_tasks")
    .select(`
      id,
      title,
      due_at,
      lead_id,
      leads (
        name,
        stage
      )
    `)
    .eq("organization_id", profile.organization_id)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .lt("due_at", now)
    .order("due_at", { ascending: true });

  if (error) {
    console.error("[listOverdueLeadTasksForCurrentUser] Erro ao buscar tarefas atrasadas:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const task = row as unknown as {
      id: string;
      title: string;
      due_at: string;
      lead_id: string;
      leads: { name: string; stage: string } | null;
    };
    return {
      id: task.id,
      title: task.title,
      dueAt: task.due_at,
      leadId: task.lead_id,
      leadName: task.leads?.name ?? "Lead desconhecido",
      leadStage: task.leads?.stage ?? "Sem etapa"
    };
  });
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
    const duplicateOwnerProfileId = duplicate.lead.owner_profile_id ?? profile.id;
    const duplicateOwnerTeamId = await resolveLeadTeamIdForProfile(
      supabase,
      profile.organization_id,
      duplicateOwnerProfileId
    );

    const { data, error } = await supabase
      .from("leads")
      .update({
        ...updatePayload,
        organization_id: profile.organization_id,
        owner_profile_id: duplicateOwnerProfileId,
        team_id: duplicateOwnerTeamId
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
  const supabase = await createSupabaseServerClient();
  const accessScope = await resolveLeadAccessScope(supabase, profile);
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const existingLead = await getLeadForMutation(id, profile, accessScope, supabase);
  const payload = buildLeadUpdate(existingLead, input);

  assertCanManageLead(profile, existingLead, "editar", hasMetaConnection);
  await assertCanAssignLeadOwner(supabase, accessScope, profile, existingLead, payload);
  assertCanApplyLeadUpdate(profile, payload, hasMetaConnection);

  const ownerProfiles = await loadLeadOwnerProfiles(supabase, profile.organization_id);
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

  if (payload.stage && payload.stage !== existingLead.stage) {
    const { error: historyError } = await supabase.from("lead_stage_history").insert({
      organization_id: profile.organization_id,
      lead_id: id,
      changed_by_profile_id: profile.id,
      old_stage: existingLead.stage,
      new_stage: payload.stage
    });

    if (historyError) {
      console.error("[updateLeadForCurrentUser] Falha ao registrar historico de etapa:", historyError);
    }
  }

  const recordedContactLeadIdSet = await listRecordedContactLeadIdSetForOrganization(
    supabase,
    profile.organization_id,
    [id]
  );

  return mapLeadRowToLead(
    data,
    profile,
    hasMetaConnection,
    ownerProfiles,
    recordedContactLeadIdSet.has(id)
  );
}

export async function assignLeadOwnersInBulkForCurrentUser(
  input: LeadBulkAssignInput
): Promise<LeadBulkAssignResult> {
  const leadIds = [...new Set(input.leadIds.map((value) => value.trim()).filter(Boolean))];

  if (leadIds.length === 0) {
    throw new Error("Selecione ao menos um lead valido para distribuir.");
  }

  if (!isSupabaseConfigured()) {
    return updateMockLeadOwnersInBulk(leadIds, input.ownerProfileId);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const accessScope = await resolveLeadAccessScope(supabase, profile);

  if (!isWorkspaceManagerRole(profile.role)) {
    throw new Error("Somente owner ou admin podem distribuir leads em lote.");
  }

  const nextOwnerProfile = await resolveBulkLeadOwnerProfile(
    supabase,
    profile.organization_id,
    input.ownerProfileId,
    accessScope
  );
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const { data: existingLeads, error: existingLeadsError } = await applyArchivedLeadFilter(
    applyLeadAccessScopeToQuery(
      supabase
        .from("leads")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .in("id", leadIds),
      accessScope
    ),
    false
  );

  if (existingLeadsError) {
    throw new Error(existingLeadsError.message);
  }

  const scopedLeads = (existingLeads ?? []) as LeadRow[];

  if (scopedLeads.length !== leadIds.length) {
    throw new Error("Um ou mais leads nao foram encontrados para distribuicao.");
  }

  for (const lead of scopedLeads) {
    assertCanManageLead(profile, lead, "editar", hasMetaConnection);
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("leads")
    .update({
      owner_profile_id: nextOwnerProfile.profile.id,
      team_id: nextOwnerProfile.primaryTeamId
    })
    .eq("organization_id", profile.organization_id)
    .is("archived_at", null)
    .in("id", leadIds)
    .select("*");

  if (updateError) {
    throw new Error(updateError.message);
  }

  const assignmentsToInsert = scopedLeads.map(lead => ({
    organization_id: profile.organization_id,
    team_id: nextOwnerProfile.primaryTeamId!,
    lead_id: lead.id,
    assigned_to_profile_id: nextOwnerProfile.profile.id,
    assigned_by_profile_id: profile.id,
    previous_owner_profile_id: lead.owner_profile_id,
    reason: "Atribuicao em lote"
  }));

  if (assignmentsToInsert.length > 0) {
    const { error: assignmentError } = await supabase
      .from("lead_assignments")
      .insert(assignmentsToInsert);

    if (assignmentError) {
      console.error("[assignLeadOwnersInBulkForCurrentUser] Falha ao registrar atribuicoes:", assignmentError);
    }
  }

  await recordAuditLogForCurrentUser({
    action: "Distribuicao de leads",
    targetType: "leads",
    teamId: nextOwnerProfile.primaryTeamId,
    metadata: {
      count: scopedLeads.length,
      assignedToProfileId: nextOwnerProfile.profile.id,
      assignedToTeamId: nextOwnerProfile.primaryTeamId
    }
  });

  const ownerProfiles = await loadLeadOwnerProfiles(supabase, profile.organization_id);
  const updatedLeadRows = (updatedRows ?? []) as LeadRow[];
  const recordedContactLeadIdSet = await listRecordedContactLeadIdSetForOrganization(
    supabase,
    profile.organization_id,
    updatedLeadRows.map((lead) => lead.id)
  );
  const leads = updatedLeadRows.map((lead) =>
    mapLeadRowToLead(
      lead,
      profile,
      hasMetaConnection,
      ownerProfiles,
      recordedContactLeadIdSet.has(lead.id)
    )
  );

  return {
    leads,
    updatedCount: leads.length
  };
}

export async function distributeLeadsEquallyForCurrentUser(
  input: LeadDistributeEquallyInput
): Promise<LeadBulkAssignResult> {
  const leadIds = [...new Set(input.leadIds.map((value) => value.trim()).filter(Boolean))];
  const targetProfileIds = [
    ...new Set(input.targetProfileIds.map((value) => value.trim()).filter(Boolean))
  ];

  if (leadIds.length === 0) {
    throw new Error("Selecione ao menos um lead valido para distribuir.");
  }

  if (targetProfileIds.length === 0) {
    throw new Error("Selecione ao menos um destinatario para dividir os leads.");
  }

  if (!isSupabaseConfigured()) {
    return distributeMockLeadsEqually(leadIds, targetProfileIds);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const accessScope = await resolveLeadAccessScope(supabase, profile);

  if (!isWorkspaceManagerRole(profile.role)) {
    throw new Error("Somente owner ou admin podem distribuir leads em lote.");
  }

  // Resolve e valida cada destinatario com as mesmas regras do assign manual.
  const targets = await Promise.all(
    targetProfileIds.map((targetProfileId) =>
      resolveBulkLeadOwnerProfile(supabase, profile.organization_id, targetProfileId, accessScope)
    )
  );

  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const { data: existingLeads, error: existingLeadsError } = await applyArchivedLeadFilter(
    applyLeadAccessScopeToQuery(
      supabase
        .from("leads")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .in("id", leadIds),
      accessScope
    ),
    false
  );

  if (existingLeadsError) {
    throw new Error(existingLeadsError.message);
  }

  const scopedLeads = (existingLeads ?? []) as LeadRow[];

  if (scopedLeads.length !== leadIds.length) {
    throw new Error("Um ou mais leads nao foram encontrados para distribuicao.");
  }

  for (const lead of scopedLeads) {
    assertCanManageLead(profile, lead, "editar", hasMetaConnection);
  }

  // Round-robin: distribui os leads de forma igualitaria entre os destinatarios.
  const leadById = new Map(scopedLeads.map((lead) => [lead.id, lead]));
  const assignmentsToInsert: Database["public"]["Tables"]["lead_assignments"]["Insert"][] = [];

  for (let index = 0; index < leadIds.length; index += 1) {
    const target = targets[index % targets.length];
    const leadId = leadIds[index];
    const lead = leadById.get(leadId);

    if (!lead) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        owner_profile_id: target.profile.id,
        team_id: target.primaryTeamId
      })
      .eq("organization_id", profile.organization_id)
      .is("archived_at", null)
      .eq("id", leadId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    assignmentsToInsert.push({
      organization_id: profile.organization_id,
      team_id: target.primaryTeamId!,
      lead_id: leadId,
      assigned_to_profile_id: target.profile.id,
      assigned_by_profile_id: profile.id,
      previous_owner_profile_id: lead.owner_profile_id,
      reason: "Distribuicao igualitaria"
    });
  }

  if (assignmentsToInsert.length > 0) {
    const { error: assignmentError } = await supabase
      .from("lead_assignments")
      .insert(assignmentsToInsert);

    if (assignmentError) {
      console.error(
        "[distributeLeadsEquallyForCurrentUser] Falha ao registrar atribuicoes:",
        assignmentError
      );
    }
  }

  await recordAuditLogForCurrentUser({
    action: "Distribuicao igualitaria de leads",
    targetType: "leads",
    metadata: {
      count: scopedLeads.length,
      targetProfileIds: targets.map((target) => target.profile.id)
    }
  });

  const { data: updatedRows, error: refetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .in("id", leadIds);

  if (refetchError) {
    throw new Error(refetchError.message);
  }

  const ownerProfiles = await loadLeadOwnerProfiles(supabase, profile.organization_id);
  const updatedLeadRows = (updatedRows ?? []) as LeadRow[];
  const recordedContactLeadIdSet = await listRecordedContactLeadIdSetForOrganization(
    supabase,
    profile.organization_id,
    updatedLeadRows.map((lead) => lead.id)
  );
  const leads = updatedLeadRows.map((lead) =>
    mapLeadRowToLead(
      lead,
      profile,
      hasMetaConnection,
      ownerProfiles,
      recordedContactLeadIdSet.has(lead.id)
    )
  );

  return {
    leads,
    updatedCount: leads.length
  };
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
  const supabase = await createSupabaseServerClient();
  const accessScope = await resolveLeadAccessScope(supabase, profile);
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const existingLead = await getLeadForMutation(id, profile, accessScope, supabase);

  assertCanManageLead(profile, existingLead, "arquivar", hasMetaConnection);

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

export async function unarchiveLeadForCurrentUser(id: string) {
  if (!isSupabaseConfigured()) {
    const lead = mockLeads.find(l => l.id === id);
    if (lead) {
      lead.archivedAt = null;
      lead.archiveReason = null;
    }
    return;
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const accessScope = await resolveLeadAccessScope(supabase, profile);
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const existingLead = await getLeadForMutation(id, profile, accessScope, supabase);

  assertCanManageLead(profile, existingLead, "desarquivar", hasMetaConnection);

  const { data, error } = await supabase
    .from("leads")
    .update({ archived_at: null, archive_reason: null })
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
  const lead = await getLeadForMutation(id, profile);

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
  input: { body?: unknown; type?: "comment" | "contact" }
): Promise<{ comment: LeadComment; lead: Lead }> {
  const rawBody = normalizeLeadCommentBody(input.body);
  const isContact = input.type === "contact";
  const bodyToSave = isContact ? `[CONTACT_LOG] ${rawBody}` : rawBody;

  if (!isSupabaseConfigured()) {
    const comment: LeadComment = {
      id: `mock-comment-${Date.now()}`,
      leadId: id,
      authorProfileId: "mock-profile",
      authorName: "Equipe demo",
      authorEmail: "demo@leadi.local",
      body: rawBody,
      type: isContact ? "contact" : "comment",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockLeadComments.push(comment);
    const updatedLead = updateMockLeadCommentLead(id, rawBody);

    return {
      comment,
      lead: {
        ...updatedLead,
        hasRecordedContact: isContact || updatedLead.hasRecordedContact
      }
    };
  }

  const profile = await getCurrentProfile();
  const lead = await getLeadForMutation(id, profile);

  assertCanAccessLead(profile, lead, "comentar");

  const supabase = await createSupabaseServerClient();
  const updatedInteraction = buildLeadInteractionSummary(rawBody);
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
    .insert(buildLeadCommentInsert(updatedLeadRow, profile, bodyToSave))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const recordedContactLeadIdSet = await listRecordedContactLeadIdSetForOrganization(
    supabase,
    profile.organization_id,
    [lead.id]
  );
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );

  return {
    comment: mapLeadCommentRowToItem(data),
    lead: mapLeadRowToLead(
      updatedLeadRow,
      profile,
      hasMetaConnection,
      undefined,
      isContact || recordedContactLeadIdSet.has(lead.id)
    )
  };
}

export async function listLeadTasksForCurrentUser(leadId: string): Promise<LeadTaskItem[]> {
  if (!isSupabaseConfigured()) {
    return mockLeadTasks
      .filter((task) => task.leadId === leadId)
      .sort(compareLeadTasks);
  }

  const profile = await getCurrentProfile();
  const lead = await getLeadForMutation(leadId, profile);

  assertCanAccessLead(profile, lead, "visualizar");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_tasks")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("lead_id", lead.id)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      throw new Error("A tabela de tarefas por lead ainda nao foi criada no banco de dados.");
    }

    throw new Error(error.message);
  }

  return (data ?? []).map(mapLeadTaskRowToItem);
}

export async function createLeadTaskForCurrentUser(
  leadId: string,
  input: LeadTaskCreateInput
): Promise<LeadTaskItem> {
  const resolvedInput = resolveLeadTaskCreateInput(input);

  if (!isSupabaseConfigured()) {
    return createMockLeadTask(leadId, resolvedInput);
  }

  const profile = await getCurrentProfile();
  const lead = await getLeadForMutation(leadId, profile);

  assertCanAccessLead(profile, lead, "criar tarefas para");

  const assignedProfile = await resolveLeadTaskAssigneeProfile(
    profile.organization_id,
    resolvedInput.assignedToProfileId ?? profile.id
  );

  if (!isWorkspaceManagerRole(profile.role) && assignedProfile.id !== profile.id) {
    throw new Error("Sem permissao para atribuir tarefas a outro usuario.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_tasks")
    .insert(buildLeadTaskInsert(lead, profile, assignedProfile.id, resolvedInput))
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      throw new Error("A tabela de tarefas por lead ainda nao foi criada no banco de dados.");
    }

    throw new Error(error.message);
  }

  return mapLeadTaskRowToItem(data);
}

export async function updateLeadTaskForCurrentUser(
  taskId: string,
  input: LeadTaskUpdateInput
): Promise<LeadTaskItem> {
  const resolvedInput = resolveLeadTaskUpdateInput(input);

  if (!isSupabaseConfigured()) {
    return updateMockLeadTask(taskId, resolvedInput);
  }

  const profile = await getCurrentProfile();
  const task = await getLeadTaskForMutation(taskId, profile.organization_id);
  const lead = await getLeadForMutation(task.lead_id, profile);

  assertCanAccessLead(profile, lead, "gerenciar tarefas de");
  assertCanMutateLeadTask(profile, task);

  const assignedProfile =
    resolvedInput.assignedToProfileId === undefined
      ? undefined
      : await resolveLeadTaskAssigneeProfile(
          profile.organization_id,
          resolvedInput.assignedToProfileId
        );

  if (!isWorkspaceManagerRole(profile.role) && assignedProfile && assignedProfile.id !== profile.id) {
    throw new Error("Sem permissao para reatribuir tarefas para outro usuario.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_tasks")
    .update(buildLeadTaskUpdate(task, resolvedInput, assignedProfile?.id))
    .eq("id", task.id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      throw new Error("A tabela de tarefas por lead ainda nao foi criada no banco de dados.");
    }

    throw new Error(error.message);
  }

  return mapLeadTaskRowToItem(data);
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
  const duplicateOwnerProfileId = input.duplicate.owner_profile_id ?? input.profile.id;
  const duplicateOwnerTeamId = await resolveLeadTeamIdForProfile(
    input.supabase,
    input.profile.organization_id,
    duplicateOwnerProfileId
  );

  const { data, error } = await input.supabase
    .from("leads")
    .update({
      ...updatePayload,
      organization_id: input.profile.organization_id,
      owner_profile_id: duplicateOwnerProfileId,
      team_id: duplicateOwnerTeamId
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

function buildLeadTaskInsert(
  lead: LeadRow,
  profile: ProfileRow,
  assignedToProfileId: string,
  input: ReturnType<typeof resolveLeadTaskCreateInput>
): LeadTaskInsert {
  return {
    organization_id: lead.organization_id,
    lead_id: lead.id,
    created_by_profile_id: profile.id,
    assigned_to_profile_id: assignedToProfileId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    due_at: input.dueAt
  };
}

function buildLeadTaskUpdate(
  task: LeadTaskRow,
  input: ReturnType<typeof resolveLeadTaskUpdateInput>,
  assignedToProfileId?: string
): LeadTaskUpdate {
  const nextStatus = input.status ?? task.status;

  return removeUndefinedValues({
    title: input.title,
    description: input.description,
    assigned_to_profile_id: assignedToProfileId,
    due_at: input.dueAt,
    priority: input.priority,
    status: input.status,
    completed_at:
      input.status === undefined
        ? undefined
        : nextStatus === "completed"
          ? task.completed_at ?? new Date().toISOString()
          : null
  });
}

function mapLeadCommentRowToItem(row: LeadCommentRow): LeadComment {
  const isContact = row.body.startsWith("[CONTACT_LOG] ");
  const body = isContact ? row.body.replace("[CONTACT_LOG] ", "") : row.body;

  return {
    id: row.id,
    leadId: row.lead_id,
    authorProfileId: row.author_profile_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body,
    type: isContact ? "contact" : "comment",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapLeadTaskRowToItem(row: LeadTaskRow): LeadTaskItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    leadId: row.lead_id,
    createdByProfileId: row.created_by_profile_id,
    assignedToProfileId: row.assigned_to_profile_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getLeadForMutation(
  id: string,
  profile: LeadAccessProfile,
  accessScope?: LeadAccessScope,
  supabaseClient?: ServerClient
) {
  const supabase = supabaseClient ?? await createSupabaseServerClient();
  const scopedAccess = accessScope ?? await resolveLeadAccessScope(supabase, profile);
  const { data, error } = await applyLeadAccessScopeToQuery(
    supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id),
    scopedAccess
  ).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lead nao encontrado.");
  }

  return data;
}

async function getLeadTaskForMutation(id: string, organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_tasks")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      throw new Error("A tabela de tarefas por lead ainda nao foi criada no banco de dados.");
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Tarefa do lead nao encontrada.");
  }

  return data;
}

async function resolveLeadTaskAssigneeProfile(organizationId: string, profileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Responsavel da tarefa nao encontrado nesta organizacao.");
  }

  return data;
}

async function listActiveTeamIdsForProfile(
  supabase: LeadDataClient,
  organizationId: string,
  profileId: string
) {
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return [
    ...new Set(
      ((data ?? []) as Pick<TeamMemberRow, "team_id">[])
        .map((row) => row.team_id)
        .filter(Boolean)
    )
  ];
}

async function resolveLeadAccessScope(
  supabase: LeadDataClient,
  profile: LeadAccessProfile
): Promise<LeadAccessScope> {
  if (profile.role === "owner" || profile.role === "seller") {
    return createLeadAccessScope({
      role: profile.role,
      profileId: profile.id
    });
  }

  return createLeadAccessScope({
    role: profile.role,
    profileId: profile.id,
    teamIds: await listActiveTeamIdsForProfile(supabase, profile.organization_id, profile.id)
  });
}

async function resolveLeadTeamIdForProfile(
  supabase: LeadDataClient,
  organizationId: string,
  profileId: string
) {
  const teamIds = await listActiveTeamIdsForProfile(supabase, organizationId, profileId);
  return teamIds[0] ?? null;
}

async function resolveLeadOwnerProfileWithTeamContext(
  supabase: LeadDataClient,
  organizationId: string,
  profileId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin", "seller"])
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Responsavel do lead nao encontrado nesta organizacao.");
  }

  const teamIds = await listActiveTeamIdsForProfile(supabase, organizationId, data.id);

  return {
    profile: data,
    teamIds,
    primaryTeamId: teamIds[0] ?? null
  };
}

async function resolveBulkLeadOwnerProfile(
  supabase: ServerClient,
  organizationId: string,
  profileId: string,
  accessScope: LeadAccessScope
) {
  const resolution = await resolveLeadOwnerProfileWithTeamContext(
    supabase,
    organizationId,
    profileId
  );

  if (!resolution.primaryTeamId) {
    throw new Error("Selecione um destinatario valido para receber os leads.");
  }

  // Owner (gestor) pode distribuir para supervisores (admin) ou consultores (seller).
  // Supervisor (admin) so pode distribuir para consultores (seller) da propria equipe.
  if (accessScope.role === "owner") {
    if (resolution.profile.role !== "admin" && resolution.profile.role !== "seller") {
      throw new Error("Selecione um supervisor ou consultor valido para receber os leads.");
    }
  } else if (accessScope.role === "admin") {
    if (resolution.profile.role !== "seller") {
      throw new Error("Selecione um consultor valido para receber os leads.");
    }
    if (!accessScope.teamIds.includes(resolution.primaryTeamId)) {
      throw new Error("Selecione um consultor valido da sua equipe para receber os leads.");
    }
  } else {
    throw new Error("Somente owner ou admin podem distribuir leads.");
  }

  return resolution;
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

async function resolveOwnerProfileIdsFilter(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  ownerName?: string
) {
  if (!ownerName) return null;
  if (ownerName.toLowerCase() === "unassigned") return ["UNASSIGNED_FILTER_ID"];
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("full_name", `%${ownerName}%`);
  
  if (data && data.length > 0) {
    return data.map((profile) => profile.id);
  }
  return [NO_RESULTS_FILTER_ID];
}

function applyLeadAccessScopeToQuery(
  query: ReturnType<ServerClient["from"]>,
  accessScope: LeadAccessScope,
  sellerProfileId: string | null = null
) {
  if (accessScope.role === "admin") {
    query = query.in(
      "team_id",
      accessScope.teamIds.length > 0 ? accessScope.teamIds : [NO_RESULTS_FILTER_ID]
    );
  }

  const ownerProfileId = resolveLeadOwnerProfileId(accessScope, sellerProfileId);

  if (ownerProfileId) {
    query = query.eq("owner_profile_id", ownerProfileId);
  }

  return query;
}

function buildLeadQuery(
  query: ReturnType<ServerClient["from"]>,
  accessScope: LeadAccessScope,
  filters: LeadUrlFilters,
  sellerProfileId: string | null = null,
  ownerProfileIdsFilter: string[] | null = null
) {
  query = applyLeadAccessScopeToQuery(query, accessScope, sellerProfileId);

  if (filters.view === "unassigned") {
    query = query.is("owner_profile_id", null);
  } else if (filters.view === "distributed") {
    query = query.not("owner_profile_id", "is", null);
  } else if (ownerProfileIdsFilter) {
    if (ownerProfileIdsFilter.includes("UNASSIGNED_FILTER_ID")) {
      query = query.is("owner_profile_id", null);
    } else {
      query = query.in("owner_profile_id", ownerProfileIdsFilter);
    }
  }

  if (filters.campaign) {
    query = query.ilike("source_campaign", `%${filters.campaign}%`);
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
  accessScope: LeadAccessScope;
  filters: LeadUrlFilters;
  pagination: ReturnType<typeof normalizeLeadPaginationOptions>;
  includeArchivedFilter: boolean;
}) {
  const ownerProfileIdsFilter = await resolveOwnerProfileIdsFilter(
    input.supabase,
    input.profile.organization_id,
    input.filters.owner
  );

  let query = buildLeadQuery(
    input.supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("organization_id", input.profile.organization_id),
    input.accessScope,
    input.filters,
    null,
    ownerProfileIdsFilter
  );

  if (input.includeArchivedFilter) {
    query = applyArchivedLeadFilter(query, input.filters.archived);
  }

  query = query.order("received_at", { ascending: false });

  if (input.pagination.limit === null) {
    query = buildLeadQuery(
      input.supabase.from("leads").select("*").eq("organization_id", input.profile.organization_id),
      input.accessScope,
      input.filters,
      null,
      ownerProfileIdsFilter
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

function resolveLeadOwnerProfileId(accessScope: LeadAccessScope, sellerProfileId: string | null) {
  if (accessScope.role === "seller") {
    return accessScope.profileId;
  }

  if (!sellerProfileId || sellerProfileId === "all") {
    return null;
  }

  return sellerProfileId;
}

async function loadLeadOwnerProfiles(
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

function mapLeadOwnerOptions(ownerProfiles: Map<string, ProfileRow>): LeadOwnerOption[] {
  return Array.from(ownerProfiles.values())
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name?.trim() || profile.email.split("@")[0] || "Usuario",
      email: profile.email,
      role: profile.role
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
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

  // Regra simples de distribuicao (Round Robin deterministico)
  // Busca todos os perfis aptos da organizacao para balanceamento
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", organization.id)
    .in("role", ["owner", "admin", "seller"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const eligibleProfiles = data ?? [];

  if (eligibleProfiles.length === 0) {
    throw new Error("Organizacao sem perfis disponiveis para receber leads.");
  }

  // Conta os leads atuais para determinar a posicao na fila (modulo)
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  const leadCount = totalLeads ?? 0;
  
  // Atribui ao proximo perfil na fila
  const assignedIndex = leadCount % eligibleProfiles.length;
  return eligibleProfiles[assignedIndex];
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
    "duplicate_of_lead_id",
    "loss_reason"
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
  return can(profile.role, "delete_archive_leads");
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

async function assertCanAssignLeadOwner(
  supabase: ServerClient,
  accessScope: LeadAccessScope,
  profile: ProfileRow,
  existingLead: LeadRow,
  payload: Database["public"]["Tables"]["leads"]["Update"]
) {
  if (payload.owner_profile_id === undefined) {
    return;
  }

  if (payload.owner_profile_id === existingLead.owner_profile_id) {
    return;
  }

  if (!isWorkspaceManagerRole(profile.role)) {
    throw new Error("Somente owner ou admin podem alterar o responsavel do lead.");
  }

  if (!payload.owner_profile_id) {
    throw new Error("Selecione um responsavel valido para este lead.");
  }

  const nextOwnerProfile = await resolveLeadOwnerProfileWithTeamContext(
    supabase,
    profile.organization_id,
    payload.owner_profile_id
  );

  if (
    accessScope.role === "admin" &&
    (!nextOwnerProfile.primaryTeamId ||
      !accessScope.teamIds.includes(nextOwnerProfile.primaryTeamId))
  ) {
    throw new Error("Selecione um responsavel valido para este lead.");
  }

  payload.owner_profile_id = nextOwnerProfile.profile.id;
  payload.team_id = nextOwnerProfile.primaryTeamId;
}

function assertCanManageLead(
  profile: ProfileRow,
  lead: LeadRow,
  action: "editar" | "excluir" | "arquivar" | "desarquivar",
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

function assertCanAccessLead(profile: ProfileRow, lead: LeadRow, action: string) {
  if (isWorkspaceManagerRole(profile.role)) {
    return;
  }

  if (lead.owner_profile_id === profile.id) {
    return;
  }

  throw new Error(`Sem permissao para ${action} este lead.`);
}

function assertCanMutateLeadTask(profile: ProfileRow, task: LeadTaskRow) {
  if (isWorkspaceManagerRole(profile.role)) {
    return;
  }

  if (task.created_by_profile_id === profile.id || task.assigned_to_profile_id === profile.id) {
    return;
  }

  throw new Error("Sem permissao para alterar esta tarefa do lead.");
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

function resolveLeadTaskCreateInput(input: LeadTaskCreateInput) {
  return {
    title: normalizeLeadTaskTitle(input.title),
    description: normalizeLeadTaskDescription(input.description),
    dueAt: normalizeLeadTaskDueAt(input.due_at),
    assignedToProfileId: normalizeOptionalLeadTaskProfileId(input.assigned_to_profile_id),
    priority: normalizeLeadTaskPriority(input.priority)
  };
}

function resolveLeadTaskUpdateInput(input: LeadTaskUpdateInput) {
  return {
    title: input.title === undefined ? undefined : normalizeLeadTaskTitle(input.title),
    description:
      input.description === undefined
        ? undefined
        : normalizeLeadTaskDescription(input.description),
    dueAt: input.due_at === undefined ? undefined : normalizeLeadTaskDueAt(input.due_at),
    assignedToProfileId:
      input.assigned_to_profile_id === undefined
        ? undefined
        : normalizeRequiredLeadTaskProfileId(input.assigned_to_profile_id),
    priority:
      input.priority === undefined ? undefined : normalizeLeadTaskPriority(input.priority),
    status: input.status === undefined ? undefined : normalizeLeadTaskStatus(input.status)
  };
}

function buildLeadInsert(profile: ProfileRow, input: LeadCreateInput): LeadInsert {
  const name = getRequiredLeadName(input.name);
  const phone = normalizePhone(input.phone);
  const rawPayload = toJson(input.raw_payload);
  const stage = normalizeLeadStage(input.stage);
  const lossReason = stage === "lost" ? stringOrNull(input.loss_reason) : null;

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
    stage,
    source: normalizeLeadSource(input.source),
    budget: stringOrNull(input.budget),
    interest: stringOrNull(input.interest),
    last_interaction: stringOrNull(input.last_interaction),
    notes: stringOrNull(input.notes),
    loss_reason: lossReason,
    quality: normalizeLeadQuality(input.quality),
    cpf: stringOrNull(input.cpf),
    birth_date: stringOrNull(input.birth_date),
    profession: stringOrNull(input.profession),
    health_plan_type: stringOrNull(input.health_plan_type),
    current_health_plan: stringOrNull(input.current_health_plan),
    dependents_count: normalizeInteger(input.dependents_count),
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
  const lossReason = stage === "lost" ? stringOrNull(input.loss_reason) : null;
  const now = new Date();
  const selectedOwner =
    mockLeadOwnerOptions.find((option) => option.id === stringOrNull(input.owner_profile_id)) ??
    mockLeadOwnerOptions[0];

  return {
    id: `mock-${now.getTime()}`,
    name,
    owner: selectedOwner.name,
    ownerProfileId: selectedOwner.id,
    hasRecordedContact: false,
    canEdit: true,
    canDelete: true,
    stage: getLeadStageLabel(stage),
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
    lossReason,
    quality: normalizeLeadQuality(input.quality),
    sourceCampaign: stringOrNull(input.source_campaign),
    sourceAdset: stringOrNull(input.source_adset),
    sourceAd: stringOrNull(input.source_ad),
    metaLeadId: stringOrNull(input.meta_lead_id),
    metaFormId: stringOrNull(input.meta_form_id),
    metaPageId: stringOrNull(input.meta_page_id),
    metaCampaignId: stringOrNull(input.meta_campaign_id),
    metaAdsetId: stringOrNull(input.meta_adset_id),
    metaAdId: stringOrNull(input.meta_ad_id),
    metaConnectedAccountId: stringOrNull(input.meta_connected_account_id),
    receivedAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

function updateMockLead(id: string, input: LeadCreateInput): Lead {
  const existingLead = mockLeads.find((lead) => lead.id === id);
  const phone = input.phone === undefined ? null : normalizePhone(input.phone);
  const email = input.email === undefined ? undefined : normalizeEmail(input.email);
  const stage = input.stage === undefined ? undefined : normalizeLeadStage(input.stage);
  const effectiveStage = stage ?? getLeadStageValueForMock(existingLead?.stage);
  const source = input.source === undefined ? undefined : normalizeLeadSource(input.source);
  const livesCount =
    input.lives_count === undefined ? existingLead?.livesCount : normalizeInteger(input.lives_count);
  const quality =
    input.quality === undefined
      ? existingLead?.quality ?? null
      : normalizeLeadQuality(input.quality);
  const now = new Date();
  const selectedOwner =
    input.owner_profile_id === undefined
      ? null
      : mockLeadOwnerOptions.find((option) => option.id === stringOrNull(input.owner_profile_id)) ?? null;
  const updatedLeadBase = {
    id,
    name:
      input.name === undefined
        ? existingLead?.name ?? "Lead sem nome"
        : getRequiredLeadName(input.name),
    owner: selectedOwner?.name ?? existingLead?.owner ?? mockLeadOwnerOptions[0].name,
    ownerProfileId:
      selectedOwner?.id ?? existingLead?.ownerProfileId ?? mockLeadOwnerOptions[0].id,
    hasRecordedContact: existingLead?.hasRecordedContact ?? false,
    canEdit: true,
    canDelete: true,
    stage: stage ? getLeadStageLabel(stage) : existingLead?.stage ?? getLeadStageLabel("new"),
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
    lossReason: resolveLeadLossReason({
      currentStage: effectiveStage,
      currentValue: existingLead?.lossReason ?? null,
      nextStageProvided: input.stage !== undefined,
      nextValue: input.loss_reason
    }),
    quality,
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
    metaCampaignId:
      input.meta_campaign_id === undefined
        ? existingLead?.metaCampaignId ?? null
        : stringOrNull(input.meta_campaign_id),
    metaAdsetId:
      input.meta_adset_id === undefined
        ? existingLead?.metaAdsetId ?? null
        : stringOrNull(input.meta_adset_id),
    metaAdId:
      input.meta_ad_id === undefined
        ? existingLead?.metaAdId ?? null
        : stringOrNull(input.meta_ad_id),
    metaConnectedAccountId:
      input.meta_connected_account_id === undefined
        ? existingLead?.metaConnectedAccountId ?? null
        : stringOrNull(input.meta_connected_account_id),
    receivedAt: existingLead?.receivedAt ?? now.toISOString(),
    updatedAt: now.toISOString()
  };
  return updatedLeadBase;
}

function updateMockLeadOwnersInBulk(
  leadIds: string[],
  ownerProfileId: string
): LeadBulkAssignResult {
  const ownerOption =
    mockLeadOwnerOptions.find((option) => option.id === ownerProfileId && option.role === "seller") ??
    null;

  if (!ownerOption) {
    throw new Error("Selecione um consultor valido para receber os leads.");
  }

  const selectedLeadIds = new Set(leadIds);
  const leads = mockLeads
    .filter((lead) => selectedLeadIds.has(lead.id))
    .map((lead) => updateMockLead(lead.id, { owner_profile_id: ownerOption.id }));

  if (leads.length !== leadIds.length) {
    throw new Error("Um ou mais leads nao foram encontrados para distribuicao.");
  }

  return {
    leads,
    updatedCount: leads.length
  };
}

function distributeMockLeadsEqually(
  leadIds: string[],
  targetProfileIds: string[]
): LeadBulkAssignResult {
  const targets = targetProfileIds
    .map((id) =>
      mockLeadOwnerOptions.find(
        (option) => option.id === id && (option.role === "admin" || option.role === "seller")
      )
    )
    .filter((option): option is NonNullable<typeof option> => Boolean(option));

  if (targets.length === 0) {
    throw new Error("Selecione destinatarios validos para dividir os leads.");
  }

  const selectedLeadIds = new Set(leadIds);
  const orderedLeads = mockLeads.filter((lead) => selectedLeadIds.has(lead.id));

  if (orderedLeads.length !== leadIds.length) {
    throw new Error("Um ou mais leads nao foram encontrados para distribuicao.");
  }

  const leads = orderedLeads.map((lead, index) =>
    updateMockLead(lead.id, { owner_profile_id: targets[index % targets.length].id })
  );

  return {
    leads,
    updatedCount: leads.length
  };
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
  const effectiveStage = input.stage === undefined ? existingLead.stage : normalizeLeadStage(input.stage);
  const nextLossReason = resolveLeadLossReason({
    currentStage: effectiveStage,
    currentValue: existingLead.loss_reason,
    nextStageProvided: input.stage !== undefined,
    nextValue: input.loss_reason
  });

  return removeUndefinedValues({
    name: stringOrNull(input.name) ?? undefined,
    owner_profile_id:
      input.owner_profile_id === undefined ? undefined : stringOrNull(input.owner_profile_id),
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
    loss_reason: nextLossReason,
    quality: input.quality === undefined ? undefined : normalizeLeadQuality(input.quality),
    cpf: input.cpf === undefined ? undefined : stringOrNull(input.cpf),
    birth_date: input.birth_date === undefined ? undefined : stringOrNull(input.birth_date),
    profession: input.profession === undefined ? undefined : stringOrNull(input.profession),
    health_plan_type: input.health_plan_type === undefined ? undefined : stringOrNull(input.health_plan_type),
    current_health_plan: input.current_health_plan === undefined ? undefined : stringOrNull(input.current_health_plan),
    dependents_count: input.dependents_count === undefined ? undefined : normalizeInteger(input.dependents_count),
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
  hasMetaConnection = false,
  ownerProfiles?: Map<string, ProfileRow>,
  hasRecordedContact = false
): Lead {
  const canManage = profile ? canManageLead(profile, row, hasMetaConnection) : false;

  return {
    id: row.id,
    name: row.name,
    owner: getLeadOwnerLabel(row, profile, ownerProfiles),
    ownerProfileId: row.owner_profile_id,
    hasRecordedContact,
    canEdit: canManage,
    canDelete: canManage && (profile ? canDeleteOrganizationLeads(profile) : true),
    stage: getLeadStageLabel(row.stage),
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
    lossReason: row.loss_reason,
    quality: normalizeLeadQuality(row.quality),
    sourceCampaign: row.source_campaign,
    sourceAdset: row.source_adset,
    sourceAd: row.source_ad,
    metaLeadId: row.meta_lead_id,
    metaFormId: row.meta_form_id,
    metaPageId: row.meta_page_id,
    metaCampaignId: row.meta_campaign_id,
    metaAdsetId: row.meta_adset_id,
    metaAdId: row.meta_ad_id,
    metaConnectedAccountId: row.meta_connected_account_id,
    receivedAt: row.received_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    archiveReason: row.archive_reason,
    duplicateOfLeadId: row.duplicate_of_lead_id
  };
}

function getLeadStageValueForMock(stage: string | undefined) {
  return getLeadStageValue(stage ?? "") ?? "new";
}

function resolveLeadLossReason(input: {
  currentStage: LeadRow["stage"];
  currentValue: string | null;
  nextStageProvided: boolean;
  nextValue: unknown;
}) {
  if (input.currentStage !== "lost") {
    return input.nextStageProvided || input.nextValue !== undefined ? null : undefined;
  }

  if (input.nextValue === undefined) {
    return undefined;
  }

  return stringOrNull(input.nextValue);
}

function updateMockLeadCommentLead(id: string, commentBody: string) {
  return updateMockLead(id, {
    last_interaction: buildLeadInteractionSummary(commentBody)
  });
}

function buildLeadInteractionSummary(body?: string | null) {
  return body ? `Comentário: ${body.slice(0, 120)}` : "Comentário registrado.";
}

function getRecordedContactLeadIdsFromComments(
  comments: LeadComment[],
  scopedLeadIds?: string[]
) {
  const scopedLeadIdSet = scopedLeadIds ? new Set(scopedLeadIds) : null;

  return [
    ...new Set(
      comments
        .filter((comment) => comment.type === "contact")
        .filter((comment) => (scopedLeadIdSet ? scopedLeadIdSet.has(comment.leadId) : true))
        .map((comment) => comment.leadId)
    )
  ];
}

async function listRecordedContactLeadIdSetForOrganization(
  supabase: ServerClient,
  organizationId: string,
  leadIds: string[]
) {
  const scopedLeadIds = [...new Set(leadIds.filter(Boolean))];

  if (scopedLeadIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("lead_comments")
    .select("lead_id")
    .eq("organization_id", organizationId)
    .in("lead_id", scopedLeadIds)
    .like("body", "[CONTACT_LOG] %");

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.lead_id));
}

function getSupabaseLeadSearchPattern(value: string) {
  const searchTerm = normalizeLeadSearchTerm(value);

  if (!searchTerm) {
    return null;
  }

  return `*${searchTerm.split(" ").join("*")}*`;
}

function getLeadOwnerLabel(
  row: LeadRow,
  profile?: ProfileRow,
  ownerProfiles?: Map<string, ProfileRow>
) {
  if (!row.owner_profile_id) {
    return "Sem responsavel";
  }

  const ownerProfile = ownerProfiles?.get(row.owner_profile_id);

  if (ownerProfile?.full_name?.trim()) {
    return ownerProfile.full_name.trim();
  }

  if (ownerProfile?.email?.trim()) {
    return ownerProfile.email.trim();
  }

  if (profile && row.owner_profile_id === profile.id) {
    return profile.full_name?.trim() || profile.email?.trim() || "Voce";
  }

  return "Equipe";
}

function mapLeadRowToExportLead(
  row: LeadRow,
  currentProfile: ProfileRow,
  exportProfiles: Map<string, ProfileRow>,
  hasMetaConnection = false
): Lead {
  return mapLeadRowToLead(row, currentProfile, hasMetaConnection, exportProfiles);
}

function normalizeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : null;
}

function normalizeLeadTaskTitle(value: unknown) {
  const title = stringOrNull(value)?.trim();

  if (!title) {
    throw new Error("Titulo da tarefa e obrigatorio.");
  }

  if (title.length > 160) {
    throw new Error("Titulo da tarefa muito longo. Use ate 160 caracteres.");
  }

  return title;
}

function normalizeLeadTaskDescription(value: unknown) {
  const description = stringOrNull(value)?.trim() ?? null;

  if (description && description.length > 4000) {
    throw new Error("Descricao da tarefa muito longa. Use ate 4000 caracteres.");
  }

  return description;
}

function normalizeLeadTaskDueAt(value: unknown) {
  const rawValue = stringOrNull(value);

  if (!rawValue) {
    return null;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Prazo da tarefa invalido.");
  }

  return parsedDate.toISOString();
}

function normalizeOptionalLeadTaskProfileId(value: unknown) {
  const profileId = stringOrNull(value);
  return profileId?.trim() || null;
}

function normalizeRequiredLeadTaskProfileId(value: unknown) {
  const profileId = stringOrNull(value)?.trim();

  if (!profileId) {
    throw new Error("Responsavel da tarefa invalido.");
  }

  return profileId;
}

function normalizeLeadTaskPriority(value: unknown): LeadTaskPriorityValue {
  if (value === null || value === undefined || value === "") {
    return "medium";
  }

  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  throw new Error("Prioridade da tarefa invalida.");
}

function normalizeLeadTaskStatus(value: unknown): LeadTaskStatusValue {
  if (value === "open" || value === "in_progress" || value === "completed" || value === "cancelled") {
    return value;
  }

  throw new Error("Status da tarefa invalido.");
}

function createMockLeadTask(
  leadId: string,
  input: ReturnType<typeof resolveLeadTaskCreateInput>
): LeadTaskItem {
  const now = new Date().toISOString();
  const task: LeadTaskItem = {
    id: `mock-lead-task-${crypto.randomUUID()}`,
    organizationId: "mock-organization",
    leadId,
    createdByProfileId: "mock-profile",
    assignedToProfileId: input.assignedToProfileId ?? "mock-profile",
    title: input.title,
    description: input.description,
    status: "open",
    priority: input.priority,
    dueAt: input.dueAt,
    completedAt: null,
    createdAt: now,
    updatedAt: now
  };

  mockLeadTasks.unshift(task);

  return task;
}

function updateMockLeadTask(
  taskId: string,
  input: ReturnType<typeof resolveLeadTaskUpdateInput>
): LeadTaskItem {
  const existingTask = mockLeadTasks.find((task) => task.id === taskId);

  if (!existingTask) {
    throw new Error("Tarefa do lead nao encontrada.");
  }

  const nextStatus = input.status ?? existingTask.status;
  const updatedTask: LeadTaskItem = {
    ...existingTask,
    title: input.title ?? existingTask.title,
    description: input.description === undefined ? existingTask.description : input.description,
    assignedToProfileId:
      input.assignedToProfileId === undefined
        ? existingTask.assignedToProfileId
        : input.assignedToProfileId,
    dueAt: input.dueAt === undefined ? existingTask.dueAt : input.dueAt,
    priority: input.priority ?? existingTask.priority,
    status: nextStatus,
    completedAt:
      input.status === undefined
        ? existingTask.completedAt
        : nextStatus === "completed"
          ? existingTask.completedAt ?? new Date().toISOString()
          : null,
    updatedAt: new Date().toISOString()
  };

  const taskIndex = mockLeadTasks.findIndex((task) => task.id === taskId);
  mockLeadTasks[taskIndex] = updatedTask;

  return updatedTask;
}

function compareLeadTasks(left: LeadTaskItem, right: LeadTaskItem) {
  const leftDueAt = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
  const rightDueAt = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftDueAt !== rightDueAt) {
    return leftDueAt - rightDueAt;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
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
