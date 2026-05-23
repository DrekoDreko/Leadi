import type { SystemTemplate } from "@/lib/templates/types";
import { getWhatsAppSystemTemplatesFallback } from "@/lib/whatsapp/templates";

const campaignTemplatesFallback: SystemTemplate[] = [
  // Campaigns
  {
    id: "tpl-campaign-migration-business-plan",
    templateType: "campaign",
    category: "MEI consultivo",
    title: "Plano PME para MEI com até 4 vidas",
    description: "Abordagem consultiva para MEIs e pequenos CNPJs que precisam validar elegibilidade antes de cotar.",
    content: {
      audience: "MEIs e pequenos CNPJs com 2 a 4 vidas que querem entender se já podem contratar um plano empresarial.",
      offer: "Análise consultiva para validar elegibilidade, documentação e caminhos de contratação conforme o perfil da empresa.",
      region: "São Paulo, ABC Paulista",
      differentiator: "Explica com clareza o que muda entre opções empresariais, documentos exigidos e próximos passos da cotação.",
      tone: "Humano e claro",
      notes: "Evitar prometer aprovação imediata ou economia garantida. Convidar o lead para uma análise do perfil."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-mei-safe",
    templateType: "campaign",
    category: "Reajuste",
    title: "Revisão de reajuste do plano atual",
    description: "Para empresas que já possuem plano e querem revisar reajuste, rede e formato do contrato.",
    content: {
      audience: "Empresas que já têm plano de saúde e querem reavaliar custo, rede credenciada e regras de contratação.",
      offer: "Revisão consultiva do cenário atual com comparação entre alternativas empresariais aderentes ao perfil da empresa.",
      region: "São Paulo, Santos, Interior de SP",
      differentiator: "Organiza a análise por rede, coparticipação, carências e uso esperado antes de sugerir qualquer troca.",
      tone: "Consultivo e direto",
      notes: "Não usar promessa de redução garantida. Preferir linguagem de revisão, comparação e tomada de decisão orientada."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-small-business",
    templateType: "campaign",
    category: "Rede hospitalar",
    title: "Comparativo por rede e hospital de preferência",
    description: "Campanha para leads que começam a conversa pela rede credenciada e hospitais prioritários.",
    content: {
      audience: "Empresas e famílias empresariais que priorizam hospitais, laboratórios e região de atendimento antes do preço.",
      offer: "Comparativo consultivo partindo da rede desejada, da abrangência e do perfil de uso da empresa.",
      region: "São Paulo, Guarulhos, Osasco",
      differentiator: "Ajuda o lead a enxergar diferenças reais entre rede, cobertura e aderência ao perfil sem excesso de tecnicismo.",
      tone: "Profissional e objetivo",
      notes: "Não depreciar operadoras nem afirmar melhor opção universal. Focar em aderência ao cenário do cliente."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-operator-comparison",
    templateType: "campaign",
    category: "Pequena equipe",
    title: "Benefício de saúde para equipes pequenas",
    description: "Para negócios de 2 a 29 vidas que querem estruturar benefício de forma viável e organizada.",
    content: {
      audience: "Donos e gestores de pequenas empresas que querem oferecer plano para sócios, equipe e dependentes elegíveis.",
      offer: "Estruturação consultiva de benefício empresarial conforme número de vidas, região de uso e orçamento disponível.",
      region: "Campinas, Jundiaí, Sorocaba",
      differentiator: "Ajuda a equilibrar composição de vidas, tipo de cobertura e expectativa financeira sem perder clareza comercial.",
      tone: "Consultivo e direto",
      notes: "Evitar urgência artificial ou promessa de menor preço. Falar em planejamento, cenário e viabilidade."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-partners-team",
    templateType: "campaign",
    category: "Elegibilidade",
    title: "Inclusão de sócios, dependentes e pró-labore",
    description: "Esclarece quem pode entrar no contrato e quais vínculos precisam ser revisados antes da cotação.",
    content: {
      audience: "Empresas LTDA, ME e CNPJs familiares que precisam entender quem pode entrar como titular, dependente ou colaborador.",
      offer: "Análise de elegibilidade para sócios, dependentes, funcionários e pró-labore quando aplicável.",
      region: "Grande São Paulo",
      differentiator: "Explica documentação, vínculo e composição mínima antes de avançar para a cotação com a operadora.",
      tone: "Humano e claro",
      notes: "Não prometer aceitação automática. Indicar análise conforme regras da operadora e perfil cadastral."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-contract-review",
    templateType: "campaign",
    category: "Primeira contratação",
    title: "Primeiro plano empresarial para CNPJ em crescimento",
    description: "Para empresas que nunca contrataram plano e precisam entender por onde começar.",
    content: {
      audience: "Empresas em crescimento que vão contratar plano empresarial pela primeira vez e ainda precisam organizar os critérios da decisão.",
      offer: "Orientação inicial para definir número de vidas, região de uso e critérios de escolha da operadora antes da proposta.",
      region: "São Paulo, Barueri, Alphaville",
      differentiator: "Traduz o processo comercial em próximos passos simples, sem linguagem técnica excessiva.",
      tone: "Educativo e simples",
      notes: "Evitar prometer implantação sem análise documental. Focar em orientação e preparo para a cotação."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

export const systemTemplatesFallback: SystemTemplate[] = [
  ...campaignTemplatesFallback,
  ...getWhatsAppSystemTemplatesFallback()
];
