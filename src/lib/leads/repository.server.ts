import { leads as mockLeads, type Lead } from "@/data/mock";
import { getMetaConnectionForOrganization } from "@/lib/integrations/repository.server";
import { assertOrganizationResourceAccess } from "@/lib/billing/subscription-limits.server";
import type { LeadFollowUpEvent } from "@/lib/leads/follow-up-events";
import type { LeadComment } from "@/lib/leads/comments";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  applyLeadUrlFilters,
  defaultLeadUrlFilters,
  getLeadPeriodStart,
  getLeadScoreRange,
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
import { calculateLeadScore, type LeadScoringInput } from "./scoring";
import {
  buildEmptyLeadAgendaMetrics,
  buildLeadPaginationMeta,
  normalizeLeadPaginationOptions,
  paginateLeads,
  type LeadAgendaMetrics,
  type LeadDataState,
  type LeadPaginationOptions
} from "./repository";
import { getLeadStageValue } from "./stages";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadCommentRow = Database["public"]["Tables"]["lead_comments"]["Row"];
type LeadCommentInsert = Database["public"]["Tables"]["lead_comments"]["Insert"];
type LeadFollowUpEventRow = Database["public"]["Tables"]["lead_follow_up_events"]["Row"];
type LeadFollowUpEventInsert = Database["public"]["Tables"]["lead_follow_up_events"]["Insert"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type LeadAgendaRow = Pick<LeadRow, "stage" | "next_contact_at">;
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type LeadDuplicateReason = "meta_lead_id" | "phone_e164" | "email";

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
  score?: unknown;
  next_contact_at?: unknown;
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

const contactFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const leadAgendaTimeZone = "America/Sao_Paulo";

const mockLeadComments: LeadComment[] = mockLeads.slice(0, 3).map((lead, index) => {
  const createdAt = new Date(Date.now() - (index + 1) * 1000 * 60 * 90).toISOString();

  return {
    id: `mock-comment-${lead.id.toLowerCase()}`,
    leadId: lead.id,
    authorProfileId: "mock-profile",
    authorName: lead.owner,
    authorEmail: `${lead.owner.toLowerCase()}@demo.leadhealth.local`,
    body: lead.lastInteraction,
    createdAt,
    updatedAt: createdAt
  };
});

const mockLeadFollowUpEvents: LeadFollowUpEvent[] = mockLeads.slice(0, 4).map((lead, index) => {
  const createdAt = new Date(Date.now() - (index + 1) * 1000 * 60 * 45).toISOString();
  const eventType: LeadFollowUpEvent["eventType"] =
    index === 0 ? "completed" : index === 1 ? "rescheduled" : index === 2 ? "not_completed" : "cancelled";
  const previousNextContactAt = new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 6).toISOString();
  const nextContactAt =
    eventType === "rescheduled"
      ? new Date(Date.now() + 1000 * 60 * 60 * 24 * (index + 1)).toISOString()
      : null;

  return {
    id: `mock-follow-up-${lead.id.toLowerCase()}`,
    leadId: lead.id,
    organizationId: "mock-organization",
    authorProfileId: "mock-profile",
    authorName: lead.owner,
    authorEmail: `${lead.owner.toLowerCase()}@demo.leadhealth.local`,
    eventType,
    previousNextContactAt,
    nextContactAt,
    note:
      eventType === "completed"
        ? "Compromisso executado com sucesso."
        : eventType === "rescheduled"
          ? "Reagendado para acompanhar a resposta do decisor."
          : eventType === "not_completed"
            ? "Contato nao realizado no horario previsto."
            : "Compromisso cancelado pela equipe.",
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
      const filteredLeads = mockLeads.filter((lead) => applyLeadUrlFilters(lead, filters));
      const paginatedLeads = paginateLeads(filteredLeads, pagination);
      const agendaMetrics = buildLeadAgendaMetricsFromMockLeads(mockLeads);

      return {
        leads: paginatedLeads,
        mode: "not-configured",
        canDeleteLeads: true,
        canCreateMetaAdsLeads: true,
        agendaMetrics,
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
        agendaMetrics: buildEmptyLeadAgendaMetrics(),
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
        agendaMetrics: buildEmptyLeadAgendaMetrics(),
        pagination: buildLeadPaginationMeta(pagination, 0, 0),
        message: "Nao foi possivel carregar os leads."
      };
    }

    const hasMetaConnection = Boolean(
      await getMetaConnectionForOrganization(profile.organization_id)
    );
    const agendaMetricsPromise = getLeadAgendaMetricsForProfile(supabase, profile).catch(() =>
      buildLeadAgendaMetricsFallback(profile)
    );

    let query = buildLeadQuery(
      supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("organization_id", profile.organization_id),
      profile,
      filters
    ).order("received_at", { ascending: false });

    if (pagination.limit === null) {
      query = buildLeadQuery(
        supabase.from("leads").select("*").eq("organization_id", profile.organization_id),
        profile,
        filters
      ).order("received_at", { ascending: false });
    }

    if (pagination.limit !== null) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
    }

    const [agendaMetrics, { data, error, count }] = await Promise.all([agendaMetricsPromise, query]);

    if (error) {
      return {
        leads: [],
        mode: "error",
        canDeleteLeads: false,
        canCreateMetaAdsLeads: hasMetaConnection,
        agendaMetrics,
        pagination: buildLeadPaginationMeta(pagination, 0, 0),
        message: "Nao foi possivel carregar os leads."
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
      agendaMetrics,
      pagination: buildLeadPaginationMeta(pagination, total, leads.length)
    };
  } catch {
    return {
      leads: [],
      mode: "error",
      canDeleteLeads: false,
      canCreateMetaAdsLeads: false,
      agendaMetrics: buildEmptyLeadAgendaMetrics(),
      pagination: buildLeadPaginationMeta(pagination, 0, 0),
      message: "Nao foi possivel carregar os leads."
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

export async function deleteLeadForCurrentUser(id: string) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const profile = await getCurrentProfile();
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const existingLead = await getLeadForMutation(id, profile.organization_id);

  assertCanManageLead(profile, existingLead, "excluir", hasMetaConnection);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .delete()
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
      authorEmail: "demo@leadhealth.local",
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
  const updatedInteraction = buildLeadInteractionSummary("comment", body);
  const { data: updatedLeadRow, error: updateError } = await supabase
    .from("leads")
    .update({
      last_interaction: updatedInteraction,
      score: calculateLeadScore(
        buildLeadScoreInput({
          ...lead,
          last_interaction: updatedInteraction
        })
      ).score
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

export async function listLeadFollowUpEventsForCurrentUser(id: string): Promise<LeadFollowUpEvent[]> {
  if (!isSupabaseConfigured()) {
    return mockLeadFollowUpEvents
      .filter((event) => event.leadId === id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const profile = await getCurrentProfile();
  const lead = await getLeadForMutation(id, profile.organization_id);

  assertCanAccessLead(profile, lead, "visualizar");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_follow_up_events")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapLeadFollowUpEventRowToItem);
}

export async function createLeadFollowUpEventForCurrentUser(
  id: string,
  input: { action?: unknown; next_contact_at?: unknown; note?: unknown }
): Promise<{ lead: Lead; event: LeadFollowUpEvent }> {
  const eventType = normalizeLeadFollowUpEventType(input.action);
  const note = normalizeLeadFollowUpNote(input.note);

  if (!isSupabaseConfigured()) {
    const event = createMockLeadFollowUpEvent(id, eventType, input.next_contact_at, note);
    const lead = updateMockLeadFollowUpLead(id, event.nextContactAt, eventType, note);

    mockLeadFollowUpEvents.unshift(event);

    return { lead, event };
  }

  const profile = await getCurrentProfile();
  const hasMetaConnection = Boolean(
    await getMetaConnectionForOrganization(profile.organization_id)
  );
  const lead = await getLeadForMutation(id, profile.organization_id);

  assertCanAccessLead(profile, lead, "comentar");

  const previousNextContactAt = lead.next_contact_at;
  const nextContactAt =
    eventType === "rescheduled" ? normalizeFollowUpDate(input.next_contact_at) : null;

  if (eventType === "rescheduled" && !nextContactAt) {
    throw new Error("Data de reagendamento obrigatoria.");
  }

  const supabase = await createSupabaseServerClient();
  const followUpSummary = buildLeadInteractionSummary(
    eventType,
    note,
    nextContactAt ?? previousNextContactAt
  );
  const { data: updatedLeadRow, error: updateError } = await supabase
    .from("leads")
    .update({
      next_contact_at: eventType === "rescheduled" ? nextContactAt : null,
      last_interaction: followUpSummary,
      score: calculateLeadScore(
        buildLeadScoreInput({
          ...lead,
          next_contact_at: eventType === "rescheduled" ? nextContactAt : null,
          last_interaction: followUpSummary
        })
      ).score
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: eventRow, error: insertError } = await supabase
    .from("lead_follow_up_events")
    .insert(
      buildLeadFollowUpEventInsert(
        updatedLeadRow,
        profile,
        eventType,
        previousNextContactAt,
        nextContactAt,
        note
      )
    )
    .select("*")
    .single();

  if (insertError) {
    await supabase
      .from("leads")
      .update({
        next_contact_at: previousNextContactAt
      })
      .eq("id", id)
      .eq("organization_id", profile.organization_id);

    throw new Error(insertError.message);
  }

  return {
    lead: mapLeadRowToLead(updatedLeadRow, profile, hasMetaConnection),
    event: mapLeadFollowUpEventRowToItem(eventRow)
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

function buildLeadFollowUpEventInsert(
  lead: LeadRow,
  profile: ProfileRow,
  eventType: LeadFollowUpEvent["eventType"],
  previousNextContactAt: string | null,
  nextContactAt: string | null,
  note: string | null
): LeadFollowUpEventInsert {
  return {
    organization_id: lead.organization_id,
    lead_id: lead.id,
    author_profile_id: profile.id,
    author_name: profile.full_name?.trim() || profile.email.split("@")[0] || "Usuario",
    author_email: profile.email,
    event_type: eventType,
    previous_next_contact_at: previousNextContactAt,
    next_contact_at: nextContactAt,
    note
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

function mapLeadFollowUpEventRowToItem(row: LeadFollowUpEventRow): LeadFollowUpEvent {
  return {
    id: row.id,
    leadId: row.lead_id,
    organizationId: row.organization_id,
    authorProfileId: row.author_profile_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    eventType: row.event_type,
    previousNextContactAt: row.previous_next_contact_at,
    nextContactAt: row.next_contact_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeLeadFollowUpEventType(value: unknown): LeadFollowUpEvent["eventType"] {
  const action = stringOrNull(value)?.trim().toLowerCase();

  if (
    action === "completed" ||
    action === "rescheduled" ||
    action === "cancelled" ||
    action === "not_completed"
  ) {
    return action;
  }

  throw new Error("Ação de follow-up inválida.");
}

function normalizeLeadFollowUpNote(value: unknown) {
  const note = stringOrNull(value)?.trim();

  if (!note) {
    return null;
  }

  if (note.length > 2000) {
    throw new Error("Observacao muito longa. Use ate 2000 caracteres.");
  }

  return note;
}

function normalizeFollowUpDate(value: unknown) {
  const nextContact = stringOrNull(value)?.trim();

  if (!nextContact) {
    return null;
  }

  const date = new Date(nextContact);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de reagendamento invalida.");
  }

  return date.toISOString();
}

function createMockLeadFollowUpEvent(
  id: string,
  eventType: LeadFollowUpEvent["eventType"],
  nextContactAt: unknown,
  note: string | null
): LeadFollowUpEvent {
  const createdAt = new Date().toISOString();
  const normalizedNextContactAt =
    eventType === "rescheduled" ? normalizeFollowUpDate(nextContactAt) : null;
  const authorName = "Equipe demo";

  return {
    id: `mock-follow-up-${Date.now()}`,
    leadId: id,
    organizationId: "mock-organization",
    authorProfileId: "mock-profile",
    authorName,
    authorEmail: "demo@leadhealth.local",
    eventType,
    previousNextContactAt: null,
    nextContactAt: normalizedNextContactAt,
    note:
      note ??
      (eventType === "completed"
        ? "Compromisso executado com sucesso."
        : eventType === "rescheduled"
          ? "Compromisso reagendado."
          : eventType === "not_completed"
            ? "Compromisso nao realizado."
            : "Compromisso cancelado."),
    createdAt,
    updatedAt: createdAt
  };
}

function updateMockLeadFollowUpLead(
  id: string,
  nextContactAt: string | null,
  eventType: LeadFollowUpEvent["eventType"],
  note: string | null
): Lead {
  return updateMockLead(id, {
    next_contact_at: nextContactAt,
    last_interaction: buildLeadInteractionSummary(eventType, note, nextContactAt)
  });
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

  if (ownerProfileId) {
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

  const scoreRange = getLeadScoreRange(filters.score);
  if (scoreRange) {
    query = query.gte("score", scoreRange.min).lte("score", scoreRange.max);
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
  let result = await supabase.from("leads").insert(payload).select("*").single();

  if (!result.error || !isMissingImportBatchIdColumnError(result.error.message)) {
    return result;
  }

  const payloadWithoutImportBatchId = { ...payload };
  delete payloadWithoutImportBatchId.import_batch_id;
  result = await supabase
    .from("leads")
    .insert(payloadWithoutImportBatchId)
    .select("*")
    .single();

  return result;
}

function isMissingImportBatchIdColumnError(message: string) {
  return message.includes("Could not find the 'import_batch_id' column of 'leads'");
}

function isMetaLeadUniqueViolation(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "23505" &&
    (message.includes("leads_meta_lead_unique_idx") || message.includes("meta_lead_id"))
  );
}

function canDeleteOrganizationLeads(profile: ProfileRow) {
  return profile.role === "owner" || profile.role === "admin";
}

function canManageLead(
  profile: ProfileRow,
  lead: LeadRow,
  hasMetaConnection = false
) {
  return (
    profile.role === "owner" ||
    profile.role === "admin" ||
    (lead.owner_profile_id === profile.id &&
      (lead.source !== "meta_lead_ads" || hasMetaConnection))
  );
}

function assertCanCreateLead(
  profile: ProfileRow,
  payload: LeadInsert,
  hasMetaConnection: boolean
) {
  if (profile.role === "owner" || profile.role === "admin") {
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
  action: "editar" | "excluir",
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
  if (profile.role === "owner" || profile.role === "admin") {
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
  const scoreInput = buildLeadScoreInput({
    stage: normalizeLeadStage(input.stage),
    source: normalizeLeadSource(input.source),
    email: normalizeEmail(input.email),
    phone: phone.e164 ?? phone.display,
    city: stringOrNull(input.city),
    companyName: stringOrNull(input.company_name),
    livesCount: normalizeInteger(input.lives_count),
    budget: stringOrNull(input.budget),
    interest: stringOrNull(input.interest),
    lastInteraction: stringOrNull(input.last_interaction),
    notes: stringOrNull(input.notes),
    nextContactAt: stringOrNull(input.next_contact_at)
  });

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
    score: calculateLeadScore(scoreInput).score,
    next_contact_at: stringOrNull(input.next_contact_at),
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
  const nextContactAt = stringOrNull(input.next_contact_at);
  const now = new Date();
  const scoreInput = buildLeadScoreInput({
    stage,
    source,
    email,
    phone: phone.e164 ?? phone.display,
    city: stringOrNull(input.city),
    companyName: stringOrNull(input.company_name),
    livesCount: normalizeInteger(input.lives_count),
    budget: stringOrNull(input.budget),
    interest: stringOrNull(input.interest),
    lastInteraction: stringOrNull(input.last_interaction),
    notes: stringOrNull(input.notes),
    nextContactAt,
    receivedAt: now.toISOString()
  });

  return {
    id: `mock-${now.getTime()}`,
    name,
    owner: "Demo",
    canEdit: true,
    canDelete: true,
    stage: stageLabels[stage],
    nextContact: formatNextContact(nextContactAt),
    nextContactAt,
    score: calculateLeadScore(scoreInput).score,
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
  const nextContactAt =
    input.next_contact_at === undefined ? existingLead?.nextContactAt : stringOrNull(input.next_contact_at);
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
    nextContact:
      input.next_contact_at === undefined
        ? existingLead?.nextContact ?? "A definir"
        : formatNextContact(input.next_contact_at),
    nextContactAt,
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
  const scoreInput = buildLeadScoreInput({
    stage: stage ? stage : existingLead?.stage,
    source: source ? source : existingLead?.source,
    email: updatedLeadBase.email === "Sem email" ? null : updatedLeadBase.email,
    phone: updatedLeadBase.phone === "Sem telefone" ? null : updatedLeadBase.phone,
    city: updatedLeadBase.city,
    companyName: updatedLeadBase.companyName,
    livesCount: updatedLeadBase.livesCount,
    budget: updatedLeadBase.budget === "A qualificar" ? null : updatedLeadBase.budget,
    interest:
      updatedLeadBase.interest === "Interesse ainda nao qualificado"
        ? null
        : updatedLeadBase.interest,
    lastInteraction:
      updatedLeadBase.lastInteraction === "Lead atualizado no modo demonstracao."
        ? null
        : updatedLeadBase.lastInteraction,
    notes: updatedLeadBase.notes === "Sem observacoes registradas." ? null : updatedLeadBase.notes,
    nextContactAt: updatedLeadBase.nextContactAt,
    receivedAt: updatedLeadBase.receivedAt
  });
  const updatedLead = {
    ...updatedLeadBase,
    score: calculateLeadScore(scoreInput).score
  };
  return updatedLead;
}

function getRequiredLeadName(value: unknown) {
  const name = stringOrNull(value);

  if (!name) {
    throw new Error("Nome do lead e obrigatorio.");
  }

  return name;
}

function formatNextContact(value: unknown) {
  const nextContact = stringOrNull(value);

  if (!nextContact) {
    return "A definir";
  }

  const date = new Date(nextContact);
  return Number.isNaN(date.getTime()) ? nextContact : contactFormatter.format(date);
}

function buildLeadUpdate(existingLead: LeadRow, input: LeadCreateInput): Database["public"]["Tables"]["leads"]["Update"] {
  const phone = normalizePhone(input.phone);
  const rawPayload = toJson(input.raw_payload);
  const mergedScoreInput = buildLeadScoreInput({
    stage: input.stage === undefined ? existingLead.stage : normalizeLeadStage(input.stage),
    source: input.source === undefined ? existingLead.source : normalizeLeadSource(input.source),
    email:
      input.email === undefined ? existingLead.email : normalizeEmail(input.email),
    phone:
      input.phone === undefined
        ? existingLead.phone_e164 ?? existingLead.phone
        : phone.e164 ?? phone.display,
    city: input.city === undefined ? existingLead.city : stringOrNull(input.city),
    companyName:
      input.company_name === undefined ? existingLead.company_name : stringOrNull(input.company_name),
    livesCount:
      input.lives_count === undefined ? existingLead.lives_count : normalizeInteger(input.lives_count),
    budget: input.budget === undefined ? existingLead.budget : stringOrNull(input.budget),
    interest: input.interest === undefined ? existingLead.interest : stringOrNull(input.interest),
    lastInteraction:
      input.last_interaction === undefined ? existingLead.last_interaction : stringOrNull(input.last_interaction),
    notes: input.notes === undefined ? existingLead.notes : stringOrNull(input.notes),
    nextContactAt:
      input.next_contact_at === undefined ? existingLead.next_contact_at : stringOrNull(input.next_contact_at),
    receivedAt: existingLead.received_at
  });

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
    score: calculateLeadScore(mergedScoreInput).score,
    next_contact_at:
      input.next_contact_at === undefined ? undefined : stringOrNull(input.next_contact_at),
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
    nextContact: row.next_contact_at ? contactFormatter.format(new Date(row.next_contact_at)) : "A definir",
    nextContactAt: row.next_contact_at,
    score: row.score,
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
    receivedAt: row.received_at
  };
}

function buildLeadScoreInput(input: {
  stage?: string | null;
  source?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  companyName?: string | null;
  company_name?: string | null;
  livesCount?: number | null;
  lives_count?: number | null;
  budget?: string | null;
  interest?: string | null;
  lastInteraction?: string | null;
  last_interaction?: string | null;
  notes?: string | null;
  nextContactAt?: string | null;
  next_contact_at?: string | null;
  receivedAt?: string | null;
  received_at?: string | null;
}): LeadScoringInput {
  return {
    stage: input.stage ?? null,
    source: input.source ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    city: input.city ?? null,
    companyName: input.companyName ?? input.company_name ?? null,
    livesCount: input.livesCount ?? input.lives_count ?? null,
    budget: input.budget ?? null,
    interest: input.interest ?? null,
    lastInteraction: input.lastInteraction ?? input.last_interaction ?? null,
    notes: input.notes ?? null,
    nextContactAt: input.nextContactAt ?? input.next_contact_at ?? null,
    receivedAt: input.receivedAt ?? input.received_at ?? null
  };
}

function updateMockLeadCommentLead(id: string, commentBody: string) {
  return updateMockLead(id, {
    last_interaction: buildLeadInteractionSummary("comment", commentBody)
  });
}

function buildLeadInteractionSummary(
  type: "comment" | LeadFollowUpEvent["eventType"],
  body?: string | null,
  nextContactAt?: string | null
) {
  if (type === "comment") {
    return body ? `Comentário: ${body.slice(0, 120)}` : "Comentário registrado.";
  }

  if (type === "rescheduled") {
    return nextContactAt
      ? `Follow-up reagendado para ${formatNextContact(nextContactAt)}`
      : "Follow-up reagendado.";
  }

  if (type === "completed") {
    return body ? `Follow-up concluído. ${body.slice(0, 120)}` : "Follow-up concluído.";
  }

  if (type === "cancelled") {
    return body ? `Follow-up cancelado. ${body.slice(0, 120)}` : "Follow-up cancelado.";
  }

  return body ? `Follow-up não realizado. ${body.slice(0, 120)}` : "Follow-up não realizado.";
}

async function getLeadAgendaMetricsForProfile(
  supabase: ServerClient,
  profile: ProfileRow
): Promise<LeadAgendaMetrics> {
  let query = supabase
    .from("leads")
    .select("stage,next_contact_at")
    .eq("organization_id", profile.organization_id);

  if (profile.role === "seller") {
    query = query.eq("owner_profile_id", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return buildLeadAgendaMetricsFromLeadRows(data ?? [], profile);
}

function buildLeadAgendaMetricsFromLeadRows(
  rows: LeadAgendaRow[],
  profile: ProfileRow
): LeadAgendaMetrics {
  const activeRows = rows.filter((row) => isOperationalAgendaStage(row.stage));
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  let noAgenda = 0;
  let overdueFollowUps = 0;
  let todayCommitments = 0;

  for (const row of activeRows) {
    if (!row.next_contact_at) {
      noAgenda += 1;
      continue;
    }

    const nextContact = new Date(row.next_contact_at);

    if (Number.isNaN(nextContact.getTime())) {
      noAgenda += 1;
      continue;
    }

    if (nextContact.getTime() < now.getTime()) {
      overdueFollowUps += 1;
      continue;
    }

    if (getLocalDateKey(nextContact) === todayKey) {
      todayCommitments += 1;
    }
  }

  return {
    scopeLabel: getLeadAgendaScopeLabel(profile),
    scopeDescription: getLeadAgendaScopeDescription(profile),
    noAgenda,
    overdueFollowUps,
    todayCommitments
  };
}

function buildLeadAgendaMetricsFromMockLeads(leads: Lead[]): LeadAgendaMetrics {
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  let noAgenda = 0;
  let overdueFollowUps = 0;
  let todayCommitments = 0;

  for (const lead of leads) {
    if (!isOperationalAgendaStage(lead.stage)) {
      continue;
    }

    if (!lead.nextContactAt) {
      noAgenda += 1;
      continue;
    }

    const nextContact = new Date(lead.nextContactAt);

    if (Number.isNaN(nextContact.getTime())) {
      noAgenda += 1;
      continue;
    }

    if (nextContact.getTime() < now.getTime()) {
      overdueFollowUps += 1;
      continue;
    }

    if (getLocalDateKey(nextContact) === todayKey) {
      todayCommitments += 1;
    }
  }

  return {
    scopeLabel: "Demo",
    scopeDescription: "Indicadores simulados enquanto o Supabase nao esta conectado.",
    noAgenda,
    overdueFollowUps,
    todayCommitments
  };
}

function buildLeadAgendaMetricsFallback(profile?: ProfileRow): LeadAgendaMetrics {
  if (!profile) {
    return buildEmptyLeadAgendaMetrics();
  }

  return buildEmptyLeadAgendaMetrics({
    scopeLabel: getLeadAgendaScopeLabel(profile),
    scopeDescription: getLeadAgendaScopeDescription(profile)
  });
}

function getLeadAgendaScopeLabel(profile: ProfileRow) {
  return profile.role === "seller" ? "Escopo: minha carteira" : "Escopo: equipe";
}

function getLeadAgendaScopeDescription(profile: ProfileRow) {
  return profile.role === "seller"
    ? "Indicadores apenas da sua carteira comercial."
    : "Indicadores da equipe inteira na organizacao.";
}

function isOperationalAgendaStage(stage: string) {
  const normalizedStage = getLeadStageValue(stage) ?? stage;

  return (
    normalizedStage === "new" ||
    normalizedStage === "qualification" ||
    normalizedStage === "proposal" ||
    normalizedStage === "negotiation"
  );
}

function getLocalDateKey(value: Date) {
  return value.toLocaleDateString("sv-SE", {
    timeZone: leadAgendaTimeZone
  });
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
