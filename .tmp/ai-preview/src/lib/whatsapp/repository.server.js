"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWhatsAppMessagesForCurrentUser = getWhatsAppMessagesForCurrentUser;
exports.saveWhatsAppMessageForCurrentUser = saveWhatsAppMessageForCurrentUser;
const mock_1 = require("@/data/mock");
const config_1 = require("@/lib/supabase/config");
const server_1 = require("@/lib/supabase/server");
const DEFAULT_PRODUCT = "Plano de saude empresarial";
const DEFAULT_BROKERAGE_NAME = "Corretora Demo";
async function getWhatsAppMessagesForCurrentUser(limit = 4) {
    const safeLimit = Math.max(1, Math.trunc(limit));
    if (!(0, config_1.isSupabaseConfigured)()) {
        return {
            messages: buildMockWhatsAppMessages(safeLimit),
            mode: "not-configured",
            message: "Supabase ainda nao configurado. Exibindo historico de demonstracao."
        };
    }
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
        messages: (data !== null && data !== void 0 ? data : []).map((row) => mapWhatsAppRowToHistoryItem(row)),
        mode: "supabase"
    };
}
async function saveWhatsAppMessageForCurrentUser(input) {
    if (!(0, config_1.isSupabaseConfigured)()) {
        return createMockWhatsAppHistoryItemFromForm(input.form, input.message, new Date());
    }
    const profile = await getCurrentProfile();
    const supabase = await (0, server_1.createSupabaseServerClient)();
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
    var _a;
    const supabase = await (0, server_1.createSupabaseServerClient)();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Usuario nao autenticado.");
    }
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
    if (error || !profile) {
        throw new Error((_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "Perfil nao encontrado.");
    }
    return profile;
}
function buildWhatsAppInsert(profile, input) {
    var _a, _b, _c, _d, _e;
    return {
        organization_id: profile.organization_id,
        created_by_profile_id: profile.id,
        lead_id: (_a = input.form.leadId) !== null && _a !== void 0 ? _a : null,
        lead_name: input.form.leadName,
        lead_context: (_b = input.form.leadContext) !== null && _b !== void 0 ? _b : "",
        stage: input.form.stage,
        objective: input.form.objective,
        tone: input.form.tone,
        product: input.form.product || DEFAULT_PRODUCT,
        opening_message: input.message.openingMessage,
        follow_up_message: input.message.followUpMessage,
        objection_reply: input.message.objectionReply,
        compliance_notes: (_c = toJson(input.message.complianceNotes)) !== null && _c !== void 0 ? _c : [],
        input_payload: (_d = toJson(input.form)) !== null && _d !== void 0 ? _d : {},
        result_payload: (_e = toJson(input.message)) !== null && _e !== void 0 ? _e : {}
    };
}
function mapWhatsAppRowToHistoryItem(row) {
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
function parseWhatsAppInput(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const payload = isRecord(row.input_payload) ? row.input_payload : null;
    const product = (_b = (_a = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.product)) !== null && _a !== void 0 ? _a : row.product) !== null && _b !== void 0 ? _b : DEFAULT_PRODUCT;
    return {
        leadId: (_c = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.leadId)) !== null && _c !== void 0 ? _c : row.lead_id,
        leadName: (_d = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.leadName)) !== null && _d !== void 0 ? _d : row.lead_name,
        brokerageName: (_e = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.brokerageName)) !== null && _e !== void 0 ? _e : DEFAULT_BROKERAGE_NAME,
        leadContext: (_g = (_f = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.leadContext)) !== null && _f !== void 0 ? _f : row.lead_context) !== null && _g !== void 0 ? _g : "",
        stage: normalizeWhatsAppStage((_h = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.stage)) !== null && _h !== void 0 ? _h : row.stage),
        objective: (_j = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.objective)) !== null && _j !== void 0 ? _j : row.objective,
        tone: (_k = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.tone)) !== null && _k !== void 0 ? _k : row.tone,
        product
    };
}
function parseWhatsAppResult(row) {
    var _a, _b, _c;
    const payload = isRecord(row.result_payload) ? row.result_payload : null;
    return {
        openingMessage: (_a = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.openingMessage)) !== null && _a !== void 0 ? _a : row.opening_message,
        followUpMessage: (_b = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.followUpMessage)) !== null && _b !== void 0 ? _b : row.follow_up_message,
        objectionReply: (_c = stringFromPayload(payload === null || payload === void 0 ? void 0 : payload.objectionReply)) !== null && _c !== void 0 ? _c : row.objection_reply,
        complianceNotes: arrayFromPayload(payload === null || payload === void 0 ? void 0 : payload.complianceNotes, row.compliance_notes)
    };
}
function buildMockWhatsAppMessages(limit) {
    const now = new Date();
    return Array.from({ length: limit }, (_, index) => createMockWhatsAppHistoryItem(getMockLead(index), new Date(now.getTime() - index * 1000 * 60 * 20)));
}
function getMockLead(index) {
    var _a;
    const lead = (_a = mock_1.leads[index % mock_1.leads.length]) !== null && _a !== void 0 ? _a : mock_1.leads[0];
    if (!lead) {
        throw new Error("Nenhum lead mockado disponivel.");
    }
    return lead;
}
function createMockWhatsAppHistoryItem(lead, date = new Date()) {
    var _a, _b, _c;
    const timestamp = date.toISOString();
    const firstName = (_a = lead.name.split(" ")[0]) !== null && _a !== void 0 ? _a : "Olá";
    const form = {
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
        openingMessage: `Olá, ${firstName}! Aqui é o time da ${DEFAULT_BROKERAGE_NAME}. Vi seu interesse em ${(_c = (_b = lead.interest) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== null && _c !== void 0 ? _c : "uma análise consultiva"} e preparei um próximo passo objetivo para facilitar sua avaliação.`,
        followUpMessage: "Se fizer sentido, posso te enviar um comparativo simples para avançarmos com a simulação e com o atendimento comercial.",
        objectionReply: "Se a prioridade for custo, cobertura ou prazo, eu posso adaptar a mensagem para esse foco sem exageros ou promessas fora do combinado.",
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
function createMockWhatsAppHistoryItemFromForm(form, message, date = new Date()) {
    var _a;
    const timestamp = date.toISOString();
    return {
        id: `mock-whatsapp-${date.getTime()}`,
        organizationId: "mock-organization",
        createdByProfileId: "mock-profile",
        leadId: (_a = form.leadId) !== null && _a !== void 0 ? _a : null,
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
function buildLeadContext(lead) {
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
function mapLeadStage(stage) {
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
function normalizeWhatsAppStage(value) {
    if (value === "new" ||
        value === "qualification" ||
        value === "proposal" ||
        value === "negotiation" ||
        value === "won" ||
        value === "lost") {
        return value;
    }
    return "new";
}
function arrayFromPayload(value, fallback) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        return value;
    }
    if (Array.isArray(fallback) && fallback.every((item) => typeof item === "string")) {
        return fallback;
    }
    return [];
}
function stringFromPayload(value) {
    return typeof value === "string" ? value : null;
}
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function toJson(value) {
    if (value === null || value === undefined) {
        return null;
    }
    return JSON.parse(JSON.stringify(value));
}
