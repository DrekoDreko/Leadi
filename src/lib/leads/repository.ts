import { leads as mockLeads, type Lead } from "@/data/mock";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  normalizeEmail,
  normalizeLeadSource,
  normalizeLeadStage,
  normalizePhone,
  normalizeScore,
  stringOrNull
} from "./normalization";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type LeadDataMode = "supabase" | "mock" | "not-configured" | "unauthenticated" | "error";

export type LeadDataState = {
  leads: Lead[];
  mode: LeadDataMode;
  canDeleteLeads: boolean;
  message?: string;
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
  raw_payload?: unknown;
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

export async function getLeadsForCurrentUser(): Promise<LeadDataState> {
  if (!isSupabaseConfigured()) {
    return {
      leads: mockLeads,
      mode: "not-configured",
      canDeleteLeads: true,
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
      message: "Nao foi possivel carregar os leads."
    };
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("received_at", { ascending: false });

  if (error) {
    return {
      leads: [],
      mode: "error",
      canDeleteLeads: false,
      message: "Nao foi possivel carregar os leads."
    };
  }

  return {
    leads: data.map((lead) => mapLeadRowToLead(lead, profile)),
    mode: "supabase",
    canDeleteLeads: canDeleteOrganizationLeads(profile)
  };
}

export async function createLeadForCurrentUser(input: LeadCreateInput) {
  if (!isSupabaseConfigured()) {
    return createMockLead(input);
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

  const payload = buildLeadInsert(profile, input);
  const duplicate = await findDuplicateLead(profile.organization_id, payload);

  if (duplicate) {
    const { data, error } = await supabase
      .from("leads")
      .update({
        ...payload,
        organization_id: profile.organization_id,
        owner_profile_id: duplicate.owner_profile_id ?? profile.id
      })
      .eq("id", duplicate.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapLeadRowToLead(data, profile);
  }

  const { data, error } = await supabase.from("leads").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return mapLeadRowToLead(data, profile);
}

export async function updateLeadForCurrentUser(id: string, input: LeadCreateInput) {
  if (!isSupabaseConfigured()) {
    return updateMockLead(id, input);
  }

  const profile = await getCurrentProfile();
  const payload = buildLeadUpdate(input);

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

  if (profile.role !== "supervisor") {
    throw new Error("Apenas supervisores podem excluir leads.");
  }

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

async function findDuplicateLead(organizationId: string, payload: LeadInsert) {
  const supabase = await createSupabaseServerClient();

  if (payload.meta_lead_id) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("meta_lead_id", payload.meta_lead_id)
      .maybeSingle();

    if (data) {
      return data;
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
      return data;
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
      return data;
    }
  }

  return null;
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

function canDeleteOrganizationLeads(profile: ProfileRow) {
  return profile.role === "supervisor";
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
    score: normalizeScore(input.score),
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
    raw_payload: rawPayload ?? {}
  };
}

function createMockLead(input: LeadCreateInput): Lead {
  const name = getRequiredLeadName(input.name);
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const stage = normalizeLeadStage(input.stage);
  const source = normalizeLeadSource(input.source);
  const nextContactAt = stringOrNull(input.next_contact_at);
  const now = new Date();

  return {
    id: `mock-${now.getTime()}`,
    name,
    owner: "Demo",
    stage: stageLabels[stage],
    nextContact: formatNextContact(nextContactAt),
    nextContactAt,
    score: normalizeScore(input.score),
    source: sourceLabels[source],
    phone: phone.display ?? "Sem telefone",
    email: email ?? "Sem email",
    city: stringOrNull(input.city),
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
  const now = new Date();

  return {
    id,
    name:
      input.name === undefined
        ? existingLead?.name ?? "Lead sem nome"
        : getRequiredLeadName(input.name),
    owner: existingLead?.owner ?? "Demo",
    stage: stage ? stageLabels[stage] : existingLead?.stage ?? "Novo lead",
    nextContact:
      input.next_contact_at === undefined
        ? existingLead?.nextContact ?? "A definir"
        : formatNextContact(input.next_contact_at),
    nextContactAt,
    score: input.score === undefined ? existingLead?.score ?? 50 : normalizeScore(input.score),
    source: source ? sourceLabels[source] : existingLead?.source ?? "Cadastro manual",
    phone:
      input.phone === undefined
        ? existingLead?.phone ?? "Sem telefone"
        : phone?.display ?? "Sem telefone",
    email: input.email === undefined ? existingLead?.email ?? "Sem email" : email ?? "Sem email",
    city: input.city === undefined ? existingLead?.city ?? null : stringOrNull(input.city),
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
    receivedAt: existingLead?.receivedAt ?? now.toISOString()
  };
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

function buildLeadUpdate(input: LeadCreateInput): Database["public"]["Tables"]["leads"]["Update"] {
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
    score: input.score === undefined ? undefined : normalizeScore(input.score),
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
    raw_payload: rawPayload ?? undefined
  });
}

function mapLeadRowToLead(row: LeadRow, profile?: ProfileRow): Lead {
  return {
    id: row.id,
    name: row.name,
    owner: profile?.full_name ?? "Equipe",
    stage: stageLabels[row.stage],
    nextContact: row.next_contact_at ? contactFormatter.format(new Date(row.next_contact_at)) : "A definir",
    nextContactAt: row.next_contact_at,
    score: row.score,
    source: sourceLabels[row.source],
    phone: row.phone ?? "Sem telefone",
    email: row.email ?? "Sem email",
    city: row.city,
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
    receivedAt: row.received_at
  };
}

function normalizeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : null;
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
