import type { SystemTemplate } from "@/lib/templates/types";

export const systemTemplatesFallback: SystemTemplate[] = [
  // Campaigns
  {
    id: "tpl-campaign-mei",
    templateType: "campaign",
    category: "MEI",
    title: "Plano de Saúde para MEI - Vantagens Exclusivas",
    description: "Focado em microempreendedores que buscam reduzir custos e ter acesso à rede privada.",
    content: {
      audience: "Microempreendedores Individuais (MEI) e profissionais liberais",
      offer: "Consultoria gratuita para reduzir custos no plano de saúde MEI",
      region: "Brasil",
      differentiator: "Atendimento personalizado e comparativo entre as melhores operadoras para MEI",
      tone: "consultivo, direto e seguro",
      notes: "Destacar que o MEI tem desconto de até 35% em relação ao plano individual."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-pme",
    templateType: "campaign",
    category: "PME",
    title: "Saúde para Pequenas e Médias Empresas",
    description: "Focado em empresas de 2 a 99 vidas que querem valorizar a equipe.",
    content: {
      audience: "Donos e gestores de pequenas e médias empresas (PMEs)",
      offer: "Análise de benefícios para equipe com foco em retenção de talentos",
      region: "Região Metropolitana",
      differentiator: "Rede credenciada qualificada e gestão simplificada para o RH",
      tone: "profissional, objetivo e premium",
      notes: "Ênfase na valorização do colaborador e dedução fiscal para a empresa."
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tpl-campaign-cost",
    templateType: "campaign",
    category: "Redução de Custo",
    title: "Economize no Plano Empresarial Atual",
    description: "Focado em empresas que já possuem plano mas estão sofrendo com reajustes.",
    content: {
      audience: "Empresas que já possuem plano de saúde mas buscam economia",
      offer: "Estudo de viabilidade para reduzir custos sem perder qualidade na rede",
      region: "Brasil",
      differentiator: "Comparativo real de preços e análise técnica de reajustes",
      tone: "educativo, prático e confiável",
      notes: "Focar na economia de custos fixos sem sacrificar o atendimento aos sócios e equipe."
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
