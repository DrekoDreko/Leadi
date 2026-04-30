import assert from "node:assert/strict";
import {
  buildCampaignTextPrompt,
  buildComplianceQuestionsPrompt,
  buildComplianceReviewPrompt,
  buildWhatsAppMessagePrompt,
  leadHealthBaseInstructions
} from "../src/lib/openai/prompt-playbooks";
import {
  containsSensitiveCompliancePattern,
  reviewTextLocally
} from "../src/lib/openai/compliance-guardrails";
import { buildFallbackWhatsAppMessage } from "../src/lib/whatsapp/templates";

function main() {
  const campaignPrompt = buildCampaignTextPrompt({
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

  const whatsappPrompt = buildWhatsAppMessagePrompt({
    product: "Plano de saude empresarial",
    brokerageName: "LeadHealth Beneficios",
    leadName: "Mariana",
    leadContext: "Pediu cotacao para empresa com operacao em Barueri e citou prioridade em rede e prazo.",
    stage: "qualification",
    objective: "confirmar faixa de vidas, cidade e prazo de implantacao",
    tone: "consultivo e objetivo"
  });

  const questionsPrompt = buildComplianceQuestionsPrompt({
    audience: "Empresas em processo de renovacao",
    product: "Plano de saude empresarial",
    objective: "qualificar o lead sem travar a conversao",
    maxQuestions: 5,
    requiredTopics: ["cidade", "faixa de vidas", "prazo"]
  });

  const compliancePrompt = buildComplianceReviewPrompt({
    channel: "meta_ads",
    audience: "Empresas de pequeno e medio porte",
    objective: "captar leads para cotacao",
    text: "Plano ideal para diabeticos com economia garantida e aprovacao sem burocracia."
  });

  assert.match(leadHealthBaseInstructions, /LeadHealth/i);
  assert.match(campaignPrompt, /quantidade de vidas/i);
  assert.match(campaignPrompt, /rede/i);
  assert.match(whatsappPrompt, /objecoes/i);
  assert.match(whatsappPrompt, /Nao pedir informacoes sensiveis/i);
  assert.match(questionsPrompt, /faixa de vidas/i);
  assert.match(compliancePrompt, /economia garantida/i);

  const riskyReview = reviewTextLocally(
    "Plano ideal para diabeticos com aprovacao garantida, sem carencia e sem burocracia."
  );
  const safeReview = reviewTextLocally(
    "Compare alternativas de plano de saude empresarial conforme cidade, faixa de vidas e momento da empresa."
  );

  assert.equal(containsSensitiveCompliancePattern("Aprovacao garantida"), true);
  assert.equal(riskyReview.riskLevel, "high");
  assert.equal(safeReview.riskLevel, "low");

  const fallback = buildFallbackWhatsAppMessage({
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
