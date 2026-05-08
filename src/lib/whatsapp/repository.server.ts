import { leads as mockLeads, type Lead } from "@/data/mock";
import type { Database, Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  WhatsAppGenerationForm,
  WhatsAppHistoryItem,
  WhatsAppListState,
  WhatsAppSaveInput,
  WhatsAppStage
} from "./types";

type WhatsAppRow = Database["public"]["Tables"]["whatsapp_messages"]["Row"];
type WhatsAppInsert = Database["public"]["Tables"]["whatsapp_messages"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const DEFAULT_PRODUCT = "Plano de saude empresarial";
const DEFAULT_BROKERAGE_NAME = "Corretora Demo";

export async function getWhatsAppMessagesForCurrentUser(
  limit = 4
): Promise<WhatsAppListState> {
  const safeLimit = Math.max(1, Math.trunc(limit));

  if (!isSupabaseConfigured()) {
    return {
      messages: buildMockWhatsAppMessages(safeLimit),
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
      messages: [],
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
      messages: [],
      mode: "error",
      message: "Nao foi possivel carregar o historico de mensagens."
    };
  }

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    return {
      messages: [],
      mode: "error",
      message: "Nao foi possivel carregar o historico de mensagens."
    };
  }

  return {
    messages: (data ?? []).map((row) => mapWhatsAppRowToHistoryItem(row)),
    mode: "supabase"
  };
}

export async function saveWhatsAppMessageForCurrentUser(
  input: WhatsAppSaveInput
): Promise<WhatsAppHistoryItem> {
  if (!isSupabaseConfigured()) {
    return createMockWhatsAppHistoryItemFromForm(input.form, input.message, new Date());
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const payload = buildWhatsAppInsert(profile, input);

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWhatsAppRowToHistoryItem(data);
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

function buildWhatsAppInsert(
  profile: ProfileRow,
  input: WhatsAppSaveInput
): WhatsAppInsert {
  return {
    organization_id: profile.organization_id,
    created_by_profile_id: profile.id,
    lead_id: input.form.leadId ?? null,
    lead_name: input.form.leadName,
    lead_context: input.form.leadContext ?? "",
    stage: normalizePersistedWhatsAppStage(input.form.stage),
    objective: input.form.objective,
    tone: input.form.tone,
    product: input.form.product || DEFAULT_PRODUCT,
    opening_message: input.message.openingMessage,
    follow_up_message: input.message.followUpMessage,
    objection_reply: input.message.objectionReply,
    compliance_notes: toJson(input.message.complianceNotes) ?? [],
    input_payload: toJson(input.form) ?? {},
    result_payload: toJson(input.message) ?? {}
  };
}

function mapWhatsAppRowToHistoryItem(row: WhatsAppRow): WhatsAppHistoryItem {
  const input = parseWhatsAppInput(row);
  const result = parseWhatsAppResult(row);

  return {
    id: row.id,
    organizationId: row.organization_id,
    createdByProfileId: row.created_by_profile_id,
    leadId: row.lead_id,
    leadName: row.lead_name,
    leadContext: row.lead_context,
    stage: normalizeWhatsAppStage(row.stage),
    objective: row.objective,
    tone: row.tone,
    product: row.product || DEFAULT_PRODUCT,
    input,
    result,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseWhatsAppInput(row: WhatsAppRow): WhatsAppGenerationForm {
  const payload = isRecord(row.input_payload) ? row.input_payload : null;
  const product = stringFromPayload(payload?.product) ?? row.product ?? DEFAULT_PRODUCT;

  return {
    leadId: stringFromPayload(payload?.leadId) ?? row.lead_id,
    leadName: stringFromPayload(payload?.leadName) ?? row.lead_name,
    brokerageName: stringFromPayload(payload?.brokerageName) ?? DEFAULT_BROKERAGE_NAME,
    leadContext: stringFromPayload(payload?.leadContext) ?? row.lead_context ?? "",
    stage: normalizeWhatsAppStage(
      stringFromPayload(payload?.stage) ?? row.stage
    ),
    objective: stringFromPayload(payload?.objective) ?? row.objective,
    tone: stringFromPayload(payload?.tone) ?? row.tone,
    product
  };
}

function parseWhatsAppResult(row: WhatsAppRow) {
  const payload = isRecord(row.result_payload) ? row.result_payload : null;

  return {
    openingMessage: stringFromPayload(payload?.openingMessage) ?? row.opening_message,
    followUpMessage: stringFromPayload(payload?.followUpMessage) ?? row.follow_up_message,
    objectionReply: stringFromPayload(payload?.objectionReply) ?? row.objection_reply,
    complianceNotes: arrayFromPayload(payload?.complianceNotes, row.compliance_notes)
  };
}

function buildMockWhatsAppMessages(limit: number): WhatsAppHistoryItem[] {
  const now = new Date();

  return Array.from({ length: limit }, (_, index) =>
    createMockWhatsAppHistoryItem(
      getMockLead(index),
      new Date(now.getTime() - index * 1000 * 60 * 20)
    )
  );
}

function getMockLead(index: number): Lead {
  const lead = mockLeads[index % mockLeads.length] ?? mockLeads[0];

  if (!lead) {
    throw new Error("Nenhum lead mockado disponivel.");
  }

  return lead;
}

function createMockWhatsAppHistoryItem(
  lead: Lead,
  date = new Date()
): WhatsAppHistoryItem {
  const timestamp = date.toISOString();
  const firstName = lead.name.split(" ")[0] ?? "Olá";
  const form: WhatsAppGenerationForm = {
    leadId: lead.id,
    leadName: lead.name,
    leadContext: buildLeadContext(lead),
    stage: mapLeadStage(lead.stage),
    objective: "iniciar conversa comercial e confirmar interesse",
    tone: "proximo, educado e objetivo",
    brokerageName: DEFAULT_BROKERAGE_NAME,
    product: DEFAULT_PRODUCT
  };
  const result = {
    openingMessage: `Olá, ${firstName}! Aqui é o time da ${DEFAULT_BROKERAGE_NAME}. Vi seu interesse em ${lead.interest?.toLowerCase() ?? "uma análise consultiva"} e preparei um próximo passo objetivo para facilitar sua avaliação.`,
    followUpMessage:
      "Se fizer sentido, posso te enviar um comparativo simples para avançarmos com a simulação e com o atendimento comercial.",
    objectionReply:
      "Se a prioridade for custo, cobertura ou prazo, eu posso adaptar a mensagem para esse foco sem exageros ou promessas fora do combinado.",
    complianceNotes: ["Mantenha o contato focado em critérios comerciais e no próximo passo."]
  };

  return {
    id: `mock-whatsapp-${date.getTime()}`,
    organizationId: "mock-organization",
    createdByProfileId: "mock-profile",
    leadId: lead.id,
    leadName: lead.name,
    leadContext: form.leadContext,
    stage: form.stage,
    objective: form.objective,
    tone: form.tone,
    product: DEFAULT_PRODUCT,
    input: form,
    result,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createMockWhatsAppHistoryItemFromForm(
  form: WhatsAppGenerationForm,
  message: WhatsAppSaveInput["message"],
  date = new Date()
): WhatsAppHistoryItem {
  const timestamp = date.toISOString();

  return {
    id: `mock-whatsapp-${date.getTime()}`,
    organizationId: "mock-organization",
    createdByProfileId: "mock-profile",
    leadId: form.leadId ?? null,
    leadName: form.leadName,
    leadContext: form.leadContext,
    stage: form.stage,
    objective: form.objective,
    tone: form.tone,
    product: form.product || DEFAULT_PRODUCT,
    input: form,
    result: message,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function buildLeadContext(lead: Lead) {
  return [
    lead.companyName ? `Empresa: ${lead.companyName}` : "",
    lead.city ? `Cidade: ${lead.city}` : "",
    lead.phone ? `Telefone: ${lead.phone}` : "",
    lead.email ? `Email: ${lead.email}` : "",
    lead.interest ? `Interesse: ${lead.interest}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

function mapLeadStage(stage: Lead["stage"]): WhatsAppStage {
  switch (stage) {
    case "Novo lead":
      return "new";
    case "Qualificação":
      return "qualification";
    case "Proposta":
      return "proposal";
    case "Negociação":
      return "negotiation";
    case "Venda":
      return "won";
    case "Perdido":
      return "lost";
    default:
      return "new";
  }
}

function normalizeWhatsAppStage(value: string | null): WhatsAppStage {
  if (
    value === "new" ||
    value === "qualification" ||
    value === "proposal" ||
    value === "negotiation" ||
    value === "won" ||
    value === "lost" ||
    value === "new_lead" ||
    value === "first_contact" ||
    value === "awaiting_response" ||
    value === "closing" ||
    value === "post_service"
  ) {
    return value;
  }

  return "new";
}

function normalizePersistedWhatsAppStage(stage: WhatsAppStage) {
  switch (stage) {
    case "new_lead":
      return "new";
    case "first_contact":
      return "qualification";
    case "awaiting_response":
      return "proposal";
    case "closing":
      return "negotiation";
    case "post_service":
      return "won";
    default:
      return stage;
  }
}

function arrayFromPayload(value: Json | null | undefined, fallback: Json | null | undefined) {
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
