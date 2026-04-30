"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadHealthOpenAIError = void 0;
exports.generateCampaignText = generateCampaignText;
exports.generateComplianceQuestions = generateComplianceQuestions;
exports.generateWhatsAppMessage = generateWhatsAppMessage;
exports.reviewComplianceText = reviewComplianceText;
require("server-only");
const prompt_playbooks_1 = require("@/lib/openai/prompt-playbooks");
class LeadHealthOpenAIError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "LeadHealthOpenAIError";
    }
}
exports.LeadHealthOpenAIError = LeadHealthOpenAIError;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4o-mini";
async function generateCampaignText(input) {
    return generateStructuredOutput({
        schemaName: "leadhealth_campaign_text",
        schema: campaignTextSchema,
        maxOutputTokens: 900,
        userPrompt: (0, prompt_playbooks_1.buildCampaignTextPrompt)(input)
    });
}
async function generateComplianceQuestions(input) {
    var _a;
    const maxQuestions = clampInteger((_a = input.maxQuestions) !== null && _a !== void 0 ? _a : 6, 3, 10);
    return generateStructuredOutput({
        schemaName: "leadhealth_compliance_questions",
        schema: complianceQuestionsSchema,
        maxOutputTokens: 900,
        userPrompt: (0, prompt_playbooks_1.buildComplianceQuestionsPrompt)(Object.assign(Object.assign({}, input), { maxQuestions }))
    });
}
async function generateWhatsAppMessage(input) {
    var _a;
    const stage = (_a = input.stage) !== null && _a !== void 0 ? _a : "new";
    return generateStructuredOutput({
        schemaName: "leadhealth_whatsapp_message",
        schema: whatsAppMessageSchema,
        maxOutputTokens: 700,
        userPrompt: (0, prompt_playbooks_1.buildWhatsAppMessagePrompt)(Object.assign(Object.assign({}, input), { stage }))
    });
}
async function reviewComplianceText(input) {
    return generateStructuredOutput({
        schemaName: "leadhealth_compliance_review",
        schema: complianceReviewSchema,
        maxOutputTokens: 900,
        userPrompt: (0, prompt_playbooks_1.buildComplianceReviewPrompt)(input)
    });
}
async function generateStructuredOutput({ maxOutputTokens, schema, schemaName, userPrompt }) {
    const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getOpenAIApiKey()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: getOpenAIModel(),
            instructions: prompt_playbooks_1.leadHealthBaseInstructions,
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: userPrompt
                        }
                    ]
                }
            ],
            max_output_tokens: maxOutputTokens,
            text: {
                format: {
                    type: "json_schema",
                    name: schemaName,
                    schema,
                    strict: true
                },
                verbosity: "medium"
            }
        })
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        throw new LeadHealthOpenAIError(getRequestErrorMessage(response.status, payload), "request_failed");
    }
    const outputText = extractOutputText(payload);
    try {
        return JSON.parse(outputText);
    }
    catch (_a) {
        throw new LeadHealthOpenAIError("A IA respondeu em um formato inesperado. Tente novamente em instantes.", "invalid_response");
    }
}
function getOpenAIApiKey() {
    var _a;
    const apiKey = (_a = process.env.OPENAI_API_KEY) === null || _a === void 0 ? void 0 : _a.trim();
    if (!apiKey) {
        throw new LeadHealthOpenAIError("OPENAI_API_KEY nao configurada. Configure a chave no ambiente do servidor para usar a IA.", "missing_api_key");
    }
    return apiKey;
}
function getOpenAIModel() {
    var _a;
    return ((_a = process.env.OPENAI_MODEL) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_MODEL;
}
function extractOutputText(payload) {
    var _a;
    if (typeof (payload === null || payload === void 0 ? void 0 : payload.output_text) === "string" && payload.output_text.trim()) {
        return payload.output_text;
    }
    const text = (_a = payload === null || payload === void 0 ? void 0 : payload.output) === null || _a === void 0 ? void 0 : _a.flatMap((item) => { var _a; return (_a = item.content) !== null && _a !== void 0 ? _a : []; }).map((content) => {
        var _a;
        if (content.refusal) {
            throw new LeadHealthOpenAIError("A IA recusou a solicitacao. Ajuste o contexto e tente novamente.", "empty_response");
        }
        return (_a = content.text) !== null && _a !== void 0 ? _a : "";
    }).join("").trim();
    if (!text) {
        throw new LeadHealthOpenAIError("A IA nao retornou conteudo. Tente novamente em instantes.", "empty_response");
    }
    return text;
}
function getRequestErrorMessage(status, payload) {
    var _a, _b, _c, _d;
    if (status === 401) {
        return "A chave da OpenAI parece invalida ou sem permissao. Verifique OPENAI_API_KEY no servidor.";
    }
    if (status === 429) {
        const errorMessage = (_c = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.error) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== null && _c !== void 0 ? _c : "";
        if (errorMessage.includes("quota") || errorMessage.includes("billing") || errorMessage.includes("credit")) {
            return "A conta atingiu a cota mensal ou ficou sem credito. Verifique Billing e Usage Limits na OpenAI.";
        }
        return "A OpenAI limitou temporariamente as chamadas. Aguarde alguns instantes e tente novamente.";
    }
    if (status >= 500) {
        return "A OpenAI esta temporariamente indisponivel. Tente novamente em instantes.";
    }
    return ((_d = payload === null || payload === void 0 ? void 0 : payload.error) === null || _d === void 0 ? void 0 : _d.message)
        ? `Nao foi possivel gerar o texto com IA: ${payload.error.message}`
        : "Nao foi possivel gerar o texto com IA. Revise os dados e tente novamente.";
}
function clampInteger(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(Math.max(Math.trunc(value), min), max);
}
const campaignTextSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        campaignName: { type: "string" },
        primaryText: { type: "string" },
        headline: { type: "string" },
        description: { type: "string" },
        callToAction: { type: "string" },
        suggestedAudience: { type: "string" },
        variants: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: { type: "string" }
        },
        complianceNotes: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string" }
        }
    },
    required: [
        "campaignName",
        "primaryText",
        "headline",
        "description",
        "callToAction",
        "suggestedAudience",
        "variants",
        "complianceNotes"
    ]
};
const complianceQuestionsSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        questions: {
            type: "array",
            minItems: 3,
            maxItems: 10,
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    question: { type: "string" },
                    reason: { type: "string" },
                    answerType: {
                        type: "string",
                        enum: ["short_text", "single_choice", "multiple_choice", "number"]
                    },
                    reviewRequired: { type: "boolean" },
                    reviewReason: { type: "string" }
                },
                required: ["question", "reason", "answerType", "reviewRequired", "reviewReason"]
            }
        },
        complianceNotes: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string" }
        }
    },
    required: ["questions", "complianceNotes"]
};
const whatsAppMessageSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        openingMessage: { type: "string" },
        followUpMessage: { type: "string" },
        objectionReply: { type: "string" },
        complianceNotes: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string" }
        }
    },
    required: ["openingMessage", "followUpMessage", "objectionReply", "complianceNotes"]
};
const complianceReviewSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        riskLevel: {
            type: "string",
            enum: ["low", "medium", "high"]
        },
        reasons: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    title: { type: "string" },
                    detail: { type: "string" },
                    severity: {
                        type: "string",
                        enum: ["low", "medium", "high"]
                    }
                },
                required: ["title", "detail", "severity"]
            }
        },
        suggestions: {
            type: "array",
            minItems: 1,
            maxItems: 6,
            items: { type: "string" }
        },
        rewrittenText: { type: "string" },
        disclaimer: { type: "string" }
    },
    required: ["riskLevel", "reasons", "suggestions", "rewrittenText", "disclaimer"]
};
