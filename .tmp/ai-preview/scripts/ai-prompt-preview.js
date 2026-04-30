"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const prompt_playbooks_1 = require("../src/lib/openai/prompt-playbooks");
const compliance_guardrails_1 = require("../src/lib/openai/compliance-guardrails");
const templates_1 = require("../src/lib/whatsapp/templates");
function main() {
    const campaignPrompt = (0, prompt_playbooks_1.buildCampaignTextPrompt)({
        audience: "Empresas de 20 a 99 vidas na regiao de Campinas",
        product: "Plano de saude empresarial",
        brokerageName: "LeadHealth Consultoria em Beneficios",
        objective: "gerar pedidos de cotacao consultiva",
        offer: "Apoio para comparar rede, faixa de investimento e implantacao",
        region: "Campinas e regiao",
        channel: "meta_ads",
        tone: "consultivo, humano e direto",
        constraints: ["Evitar promessas de economia garantida."]
    });
    const whatsappPrompt = (0, prompt_playbooks_1.buildWhatsAppMessagePrompt)({
        product: "Plano de saude empresarial",
        brokerageName: "LeadHealth Beneficios",
        leadName: "Mariana",
        leadContext: "Pediu cotacao para empresa com operacao em Barueri e citou prioridade em rede e prazo.",
        stage: "qualification",
        objective: "confirmar faixa de vidas, cidade e prazo de implantacao",
        tone: "consultivo e objetivo"
    });
    const questionsPrompt = (0, prompt_playbooks_1.buildComplianceQuestionsPrompt)({
        audience: "Empresas em processo de renovacao",
        product: "Plano de saude empresarial",
        objective: "qualificar o lead sem travar a conversao",
        maxQuestions: 5,
        requiredTopics: ["cidade", "faixa de vidas", "prazo"]
    });
    const compliancePrompt = (0, prompt_playbooks_1.buildComplianceReviewPrompt)({
        channel: "meta_ads",
        audience: "Empresas de pequeno e medio porte",
        objective: "captar leads para cotacao",
        text: "Plano ideal para diabeticos com economia garantida e aprovacao sem burocracia."
    });
    strict_1.default.match(prompt_playbooks_1.leadHealthBaseInstructions, /LeadHealth/i);
    strict_1.default.match(campaignPrompt, /quantidade de vidas/i);
    strict_1.default.match(campaignPrompt, /rede/i);
    strict_1.default.match(whatsappPrompt, /objecoes/i);
    strict_1.default.match(whatsappPrompt, /Nao pedir informacoes sensiveis/i);
    strict_1.default.match(questionsPrompt, /faixa de vidas/i);
    strict_1.default.match(compliancePrompt, /economia garantida/i);
    const riskyReview = (0, compliance_guardrails_1.reviewTextLocally)("Plano ideal para diabeticos com aprovacao garantida, sem carencia e sem burocracia.");
    const safeReview = (0, compliance_guardrails_1.reviewTextLocally)("Compare alternativas de plano de saude empresarial conforme cidade, faixa de vidas e momento da empresa.");
    strict_1.default.equal((0, compliance_guardrails_1.containsSensitiveCompliancePattern)("Aprovacao garantida"), true);
    strict_1.default.equal(riskyReview.riskLevel, "high");
    strict_1.default.equal(safeReview.riskLevel, "low");
    const fallback = (0, templates_1.buildFallbackWhatsAppMessage)({
        brokerageName: "LeadHealth Beneficios",
        stage: "proposal",
        tone: "consultivo",
        lead: {
            name: "Mariana Souza",
            companyName: "Nova Fase Engenharia",
            city: "Barueri",
            interest: "plano de saude empresarial",
            livesCount: 42
        }
    });
    console.log("Prompt review checks: OK");
    console.log("");
    console.log("Campaign prompt preview:");
    console.log(campaignPrompt);
    console.log("");
    console.log("WhatsApp prompt preview:");
    console.log(whatsappPrompt);
    console.log("");
    console.log("Compliance questions prompt preview:");
    console.log(questionsPrompt);
    console.log("");
    console.log("Compliance review prompt preview:");
    console.log(compliancePrompt);
    console.log("");
    console.log("Local compliance review (risk text):");
    console.log(JSON.stringify(riskyReview, null, 2));
    console.log("");
    console.log("Fallback WhatsApp preview:");
    console.log(JSON.stringify(fallback, null, 2));
}
main();
