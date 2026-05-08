import type { WhatsAppStage } from "./types";

export type WhatsAppToneValue =
  | "consultivo"
  | "profissional"
  | "empatico"
  | "otimista"
  | "direto_firme"
  | "reengajamento"
  | "urgente_equilibrado";

export type WhatsAppLeadContext = {
  name: string;
  companyName?: string | null;
  city?: string | null;
  interest?: string | null;
  livesCount?: number | null;
};

export type WhatsAppMessageTemplate = {
  openingMessage: string;
  followUpMessage: string;
  objectionReply: string;
  complianceNotes: string[];
};

export const whatsappToneOptions = [
  {
    value: "consultivo",
    label: "Consultivo",
    prompt: "consultivo, seguro e orientado ao proximo passo"
  },
  {
    value: "profissional",
    label: "Profissional",
    prompt: "profissional, claro e orientado ao contexto comercial"
  },
  {
    value: "empatico",
    label: "Empatico",
    prompt: "empatico, humano e profissional"
  },
  {
    value: "otimista",
    label: "Otimista",
    prompt: "otimista, seguro e comercial sem exagero"
  },
  {
    value: "direto_firme",
    label: "Direto/Firme",
    prompt: "direto, firme e objetivo sem agressividade"
  },
  {
    value: "reengajamento",
    label: "Reengajamento",
    prompt: "reengajamento, respeitoso e focado em retomar a conversa"
  },
  {
    value: "urgente_equilibrado",
    label: "Urgente sem ser agressivo",
    prompt: "urgente, claro e consultivo sem pressao artificial"
  }
] as const satisfies ReadonlyArray<{
  value: WhatsAppToneValue;
  label: string;
  prompt: string;
}>;

export const whatsappStageStrategies = {
  new: {
    label: "Novo lead",
    objective: "abrir a conversa, confirmar interesse e propor um proximo passo simples",
    guidance:
      "Primeiro contato: seja breve, cite o interesse do lead e faca uma pergunta comercial leve para confirmar se faz sentido avancar."
  },
  qualification: {
    label: "Qualificacao",
    objective: "qualificar empresa, quantidade de vidas, regiao e prioridade comercial",
    guidance:
      "Qualificacao: pergunte apenas dados comerciais como quantidade de vidas, cidade, prazo e prioridade. Nao peca dados de saude."
  },
  proposal: {
    label: "Proposta",
    objective: "retomar a proposta enviada e facilitar a decisao com um resumo objetivo",
    guidance:
      "Proposta: reforce que a pessoa pode revisar pontos comerciais, rede, prazo e custo sem prometer aprovacao ou economia garantida."
  },
  negotiation: {
    label: "Negociacao",
    objective: "destravar objeções comerciais e combinar o proximo passo de decisao",
    guidance:
      "Negociacao: responda a objeções de custo, rede ou prazo com linguagem segura, sem criar urgencia artificial."
  },
  won: {
    label: "Fechado",
    objective: "confirmar fechamento, alinhar proximos passos e pedir documentos comerciais necessarios",
    guidance:
      "Fechado: agradeca, confirme proximos passos operacionais e peca somente documentos comerciais necessarios."
  },
  lost: {
    label: "Perdido",
    objective: "fazer follow-up respeitoso e deixar porta aberta para uma nova avaliacao futura",
    guidance:
      "Perdido: seja respeitoso, reconheca a decisao e deixe um caminho simples para reabrir a conversa no futuro."
  },
  new_lead: {
    label: "Novo lead",
    objective: "acolher o novo lead e abrir uma conversa comercial simples",
    guidance:
      "Novo lead: apresente-se com clareza, mostre contexto comercial e convide o lead para responder sem friccao."
  },
  first_contact: {
    label: "Primeiro contato",
    objective: "fazer o primeiro contato e entender o cenario da empresa",
    guidance:
      "Primeiro contato: seja breve, confirme o interesse e peca apenas informacoes comerciais como cidade, faixa de vidas e prazo."
  },
  awaiting_response: {
    label: "Aguardando resposta",
    objective: "retomar a conversa sem pressao e incentivar uma resposta simples",
    guidance:
      "Aguardando resposta: relembre o contexto, facilite a resposta com uma pergunta objetiva e mantenha o tom respeitoso."
  },
  closing: {
    label: "Fechamento",
    objective: "organizar os ultimos passos para a decisao e fechamento comercial",
    guidance:
      "Fechamento: reforce proximos passos, documentos comerciais e alinhamentos finais sem prometer resultado garantido."
  },
  post_service: {
    label: "Pos-atendimento",
    objective: "manter o relacionamento ativo apos o atendimento ou fechamento",
    guidance:
      "Pos-atendimento: acompanhe com gentileza, confirme se esta tudo claro e deixe caminho aberto para novas necessidades."
  }
} as const satisfies Record<
  WhatsAppStage,
  {
    label: string;
    objective: string;
    guidance: string;
  }
>;

export function getWhatsAppTonePrompt(tone: WhatsAppToneValue) {
  return (
    whatsappToneOptions.find((option) => option.value === tone)?.prompt ??
    whatsappToneOptions[0].prompt
  );
}

export function getWhatsAppToneLabel(tone: WhatsAppToneValue) {
  return (
    whatsappToneOptions.find((option) => option.value === tone)?.label ??
    whatsappToneOptions[0].label
  );
}

export function buildWhatsAppStageObjective(stage: WhatsAppStage) {
  return whatsappStageStrategies[stage]?.objective ?? whatsappStageStrategies.new.objective;
}

export function buildWhatsAppStagePrompt(stage: WhatsAppStage) {
  const strategy = whatsappStageStrategies[stage] ?? whatsappStageStrategies.new;

  return strategy.guidance;
}

export function buildFallbackWhatsAppMessage({
  brokerageName = "Corretora Demo",
  lead,
  stage,
  tone
}: {
  brokerageName?: string;
  lead: WhatsAppLeadContext | null;
  stage: WhatsAppStage;
  tone: WhatsAppToneValue;
}): WhatsAppMessageTemplate {
  const firstName = lead?.name.split(" ")[0] || "ola";
  const interest = lead?.interest?.toLowerCase() || "plano de saude empresarial";
  const company = lead?.companyName ? ` para ${lead.companyName}` : "";
  const toneNote = getWhatsAppToneLabel(tone).toLowerCase();

  switch (stage) {
    case "first_contact":
    case "qualification":
      return {
        openingMessage: `Ola, ${firstName}! Para te orientar melhor sobre ${interest}${company}, posso confirmar algumas informacoes comerciais bem objetivas?`,
        followUpMessage:
          "Faixa de vidas, cidade da operacao e prazo desejado para implantacao ja ajudam a montar uma analise mais aderente.",
        objectionReply:
          "Se ainda nao tiver tudo fechado, sem problema. Podemos comecar pelo cenario atual da empresa e ajustar a comparacao depois.",
        complianceNotes: [
          "Qualifique apenas informacoes comerciais, sem perguntar dados de saude, diagnosticos ou perfil sensivel."
        ]
      };
    case "awaiting_response":
      return {
        openingMessage: `Ola, ${firstName}! Passando para retomar nosso contato sobre ${interest}${company}.`,
        followUpMessage:
          "Se ficar mais facil, pode me responder so com a cidade da empresa, a faixa de vidas e o melhor prazo para seguir.",
        objectionReply:
          "Se agora nao for o melhor momento, sem problema. Posso retomar quando fizer mais sentido para voce.",
        complianceNotes: [
          "Retome a conversa sem insistencia excessiva e sem criar urgencia artificial."
        ]
      };
    case "proposal":
      return {
        openingMessage: `Ola, ${firstName}! Passando para retomar a proposta de ${interest}${company} e deixar sua avaliacao mais simples.`,
        followUpMessage:
          "Se fizer sentido, eu posso resumir em tres pontos: faixa de investimento, rede e proximos passos da implantacao.",
        objectionReply:
          "Se algum ponto nao encaixou, me diga o que pesa mais agora na decisao: custo, rede, prazo ou formato do contrato.",
        complianceNotes: [
          "Evite prometer aprovacao, cobertura especifica ou economia garantida; mantenha a conversa nos criterios comerciais."
        ]
      };
    case "closing":
      return {
        openingMessage: `Ola, ${firstName}! Estamos nos ajustes finais de ${interest}${company}.`,
        followUpMessage:
          "Posso organizar os ultimos pontos comerciais e te mostrar o que falta para seguirmos com clareza?",
        objectionReply:
          "Se houver alguma duvida sobre custo, rede ou prazo, eu separo os cenarios finais para facilitar a aprovacao.",
        complianceNotes: [
          "Trate o fechamento como alinhamento comercial final, sem prometer aprovacao ou economia garantida."
        ]
      };
    case "negotiation":
      return {
        openingMessage: `Ola, ${firstName}! Vi que estamos ajustando a proposta de ${interest}${company}.`,
        followUpMessage:
          "Posso organizar os pontos que ainda precisam de decisao e te mostrar as alternativas com mais clareza?",
        objectionReply:
          "Se a duvida principal for custo, rede ou prazo, eu separo os cenarios possiveis para voce avaliar com calma.",
        complianceNotes: [
          "Trate objeções comerciais sem urgencia artificial e sem garantir condicoes que dependem da operadora."
        ]
      };
    case "post_service":
      return {
        openingMessage: `Ola, ${firstName}! Passando para acompanhar como ficou ${interest}${company}.`,
        followUpMessage:
          "Se surgir qualquer ajuste ou nova necessidade da empresa, posso te ajudar a organizar os proximos passos.",
        objectionReply:
          "Se fizer sentido, tambem podemos revisar outros pontos comerciais no futuro sem pressa.",
        complianceNotes: [
          "Use o pos-atendimento para relacionamento e suporte comercial, sem abordagem agressiva."
        ]
      };
    case "won":
      return {
        openingMessage: `Ola, ${firstName}! Que bom que avancamos com ${interest}${company}.`,
        followUpMessage:
          "Vou alinhar os proximos passos comerciais e te aviso quais documentos e confirmacoes da empresa vamos precisar para seguir.",
        objectionReply:
          "Se surgir alguma duvida nesta etapa, me chama por aqui que eu organizo o ponto e encaminho com clareza.",
        complianceNotes: [
          "Solicite apenas dados e documentos necessarios ao processo comercial e operacional."
        ]
      };
    case "lost":
      return {
        openingMessage: `Ola, ${firstName}! Obrigado por avaliar a proposta de ${interest}${company}.`,
        followUpMessage:
          "Se o momento nao for ideal agora, posso deixar a comparacao registrada e retomar numa data melhor para uma nova avaliacao.",
        objectionReply:
          "Se o motivo tiver sido custo, rede ou prazo, consigo revisar alternativas no futuro sem pressa e sem compromisso.",
        complianceNotes: [
          "Mantenha o follow-up respeitoso, sem insistencia excessiva ou promessa comercial."
        ]
      };
    case "new_lead":
    case "new":
    default:
      return {
        openingMessage: `Ola, ${firstName}! Aqui e a equipe da ${brokerageName}. Vi seu interesse em ${interest}${company} e posso te ajudar a comparar as opcoes da empresa com mais clareza.`,
        followUpMessage:
          "Se fizer sentido, me passa faixa de vidas, cidade e prazo desejado que eu organizo o proximo passo comercial.",
        objectionReply:
          "Se a prioridade for custo, rede ou prazo, eu adapto a analise para esse foco sem exageros nem promessas fora do combinado.",
        complianceNotes: [
          `Mensagem em tom ${toneNote}, focada em criterios comerciais e no proximo passo.`
        ]
      };
  }
}
