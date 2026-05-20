import type { SystemTemplate } from "@/lib/templates/types";

export const systemTemplatesFallback: SystemTemplate[] = [
  // Campaigns
  {
    id: "tpl-campaign-migration-business-plan",
    templateType: "campaign",
    category: "Plano empresarial",
    title: "Migração para plano empresarial",
    description: "Para pessoas com CNPJ que desejam avaliar alternativas de plano de saúde empresarial.",
    content: {
      audience: "Pessoas com CNPJ, MEI, ME ou LTDA que desejam avaliar alternativas de plano de saúde empresarial.",
      offer: "Análise consultiva para comparar possibilidades de contratação empresarial conforme perfil da empresa.",
      region: "São Paulo, SP",
      differentiator: "Atendimento consultivo, explicação clara das opções e apoio no entendimento das regras de contratação.",
      tone: "Consultivo e direto",
      notes: "Evitar promessa de economia garantida. Usar linguagem educativa e profissional."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-mei-safe",
    templateType: "campaign",
    category: "MEI",
    title: "Plano de saúde para MEI",
    description: "Orientação clara para microempreendedores que querem entender opções com CNPJ.",
    content: {
      audience: "Microempreendedores individuais que buscam entender opções de plano de saúde com CNPJ.",
      offer: "Orientação sobre possibilidades de contratação para MEI, respeitando critérios das operadoras.",
      region: "São Paulo, ABC Paulista",
      differentiator: "Explicação simples sobre documentação, carências, elegibilidade e alternativas disponíveis.",
      tone: "Humano e claro",
      notes: "Não afirmar aprovação garantida. Não prometer valores específicos."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-small-business",
    templateType: "campaign",
    category: "Pequenas empresas",
    title: "Plano empresarial para pequenas empresas",
    description: "Cotação orientada para sócios, equipe ou familiares elegíveis.",
    content: {
      audience: "Donos de pequenas empresas que querem organizar benefício de saúde para sócios, equipe ou familiares elegíveis.",
      offer: "Cotação orientada de planos empresariais conforme quantidade de vidas e perfil da empresa.",
      region: "Campinas, Jundiaí, Sorocaba",
      differentiator: "Comparação entre operadoras, rede credenciada e formatos de contratação.",
      tone: "Consultivo e direto",
      notes: "Evitar linguagem de urgência exagerada. Focar em clareza e orientação."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-operator-comparison",
    templateType: "campaign",
    category: "Comparativo",
    title: "Comparativo entre operadoras",
    description: "Apoio organizado para comparar rede, abrangência e possibilidades.",
    content: {
      audience: "Empresas que desejam comparar opções entre operadoras como Bradesco, SulAmérica, Amil e outras disponíveis.",
      offer: "Apoio para comparar rede, abrangência, perfil de uso e possibilidades de contratação.",
      region: "São Paulo, Guarulhos, Osasco",
      differentiator: "Comparativo organizado para ajudar o cliente a tomar decisão com mais segurança.",
      tone: "Profissional e objetivo",
      notes: "Não depreciar operadoras. Não prometer melhor preço absoluto."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-partners-team",
    templateType: "campaign",
    category: "Elegibilidade",
    title: "Inclusão de sócios e equipe",
    description: "Análise de elegibilidade para titulares, colaboradores e dependentes.",
    content: {
      audience: "Empresas LTDA, ME e pequenos negócios que precisam entender quem pode entrar como titular ou dependente.",
      offer: "Análise das possibilidades de inclusão de sócios, colaboradores e dependentes conforme regras da operadora.",
      region: "Grande São Paulo",
      differentiator: "Orientação sobre documentação, elegibilidade e composição de vidas.",
      tone: "Humano e claro",
      notes: "Não prometer aceitação automática. Focar em análise de viabilidade."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-contract-review",
    templateType: "campaign",
    category: "Revisão",
    title: "Revisão de contrato atual",
    description: "Diagnóstico consultivo para revisar rede, condições e alternativas.",
    content: {
      audience: "Empresas que já possuem plano de saúde e querem revisar opções, rede e condições disponíveis.",
      offer: "Revisão consultiva do cenário atual e apresentação de alternativas quando fizer sentido.",
      region: "São Paulo, Santos, Interior de SP",
      differentiator: "Diagnóstico organizado antes de sugerir qualquer mudança.",
      tone: "Consultivo e direto",
      notes: "Evitar “você está pagando caro”. Usar “avaliar alternativas” ou “revisar possibilidades”."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // WhatsApp Messages
  {
    id: "tpl-wa-new",
    templateType: "whatsapp",
    category: "Funil - Novo Lead",
    title: "Primeira Abordagem (Boas-vindas)",
    description: "Mensagem para o primeiro contato logo após a captação do lead.",
    content: {
      openingMessage: "Olá [Nome do Lead], aqui é o [Seu Nome] da [Empresa]. Recebi seu interesse em um plano de saúde empresarial e gostaria de te dar as boas-vindas!",
      followUpMessage: "Para eu te enviar uma simulação bem assertiva, você teria 2 minutinhos para me confirmar quantas pessoas seriam incluídas no plano?",
      objectionReply: "Entendo perfeitamente. Muita gente acha que o processo é burocrático, mas minha ideia aqui é justamente simplificar isso para você. Podemos seguir com apenas 3 perguntas rápidas?"
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-wa-qualify",
    templateType: "whatsapp",
    category: "Funil - Qualificação",
    title: "Entendendo Necessidades",
    description: "Mensagem para identificar rede credenciada e orçamento.",
    content: {
      openingMessage: "Obrigado pelas informações, [Nome do Lead]. Agora, para eu selecionar as melhores operadoras: existe algum hospital ou região que seja prioridade para você?",
      followUpMessage: "Pergunto isso porque às vezes conseguimos um custo muito melhor focando na rede regional, sem perder a qualidade que você busca.",
      objectionReply: "Com certeza, custo é fundamental. Vou buscar opções que equilibrem uma boa rede com o melhor custo-benefício para o seu CNPJ."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-wa-proposal",
    templateType: "whatsapp",
    category: "Funil - Proposta",
    title: "Apresentação do Estudo",
    description: "Mensagem para enviar o comparativo ou proposta oficial.",
    content: {
      openingMessage: "[Nome do Lead], acabei de finalizar o estudo comparativo para sua empresa. Consegui 3 opções que se encaixam no que conversamos.",
      followUpMessage: "Estou te enviando o PDF anexo. O destaque é a opção [X], que oferece a rede que você queria com uma economia de [Y]% em relação ao mercado.",
      objectionReply: "Entendo a dúvida entre as operadoras. A principal diferença é que a [Opção A] tem reembolso maior, enquanto a [Opção B] foca em rede própria. Qual delas faz mais sentido para o seu momento?"
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-wa-negotiation",
    templateType: "whatsapp",
    category: "Funil - Negociação",
    title: "Fechamento e Próximos Passos",
    description: "Mensagem para contornar dúvidas finais e pedir a documentação.",
    content: {
      openingMessage: "Olá [Nome do Lead], conseguimos avançar com a proposta que te enviei? Os valores são válidos até o dia [Data].",
      followUpMessage: "Se precisar de qualquer ajuste na grade de vidas ou cobertura, me avisa que altero agora mesmo para você.",
      objectionReply: "Sobre o prazo de implantação, se enviarmos o contrato até amanhã, conseguimos garantir o início para o dia 01 do próximo mês. Vamos garantir essa data?"
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
