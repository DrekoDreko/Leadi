import type { SystemTemplate, WhatsAppTemplateContent } from "@/lib/templates/types";
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

export type WhatsAppTemplateObjective =
  | "boas_vindas"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "reengajamento"
  | "reativacao"
  | "pos_atendimento";

export type WhatsAppLibraryTemplate = {
  id: string;
  stage: WhatsAppStage;
  objective: WhatsAppTemplateObjective;
  tone: WhatsAppToneValue;
  category: string;
  title: string;
  description: string;
  content: WhatsAppMessageTemplate;
  isActive: boolean;
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
    objective: "acolher o novo lead, referenciar seu interesse ou contexto, e abrir uma conversa comercial simples e direta",
    guidance:
      "Novo lead: apresente-se com clareza usando o nome do lead e contexto fornecido. Mostre como pode ajudar e convide-o a responder com baixo atrito."
  },
  first_contact: {
    label: "Primeiro contato",
    objective: "fazer o primeiro contato personalizado e entender o cenario comercial da empresa",
    guidance:
      "Primeiro contato: seja breve, mencione o nome e contexto (empresa/interesse) do lead. Confirme a demanda e peca informacoes comerciais basicas (cidade, faixa de vidas)."
  },
  awaiting_response: {
    label: "Follow-up sem resposta",
    objective: "retomar o contato sem pressao, lembrar o contexto anterior e facilitar uma resposta simples",
    guidance:
      "Follow-up sem resposta: reconheca que o lead ainda nao respondeu, relembre o contexto anterior, ofereca uma resposta de baixo atrito e mantenha o tom respeitoso."
  },
  reactivation: {
    label: "Reativacao de lead",
    objective: "retomar um lead antigo ou parado com contexto comercial e um convite leve para atualizar o momento da empresa",
    guidance:
      "Reativacao: reconheca que ja faz algum tempo desde o ultimo contato, retome o contexto com delicadeza e convide o lead a dizer se ainda faz sentido revisar opcoes, prazo ou prioridade."
  },
  closing: {
    label: "Fechamento",
    objective: "organizar os ultimos passos para a decisao e fechamento comercial",
    guidance:
      "Fechamento: reforce proximos passos, documentos comerciais e alinhamentos finais sem prometer resultado garantido."
  },
  objection_follow_up: {
    label: "Follow-up de objecao",
    objective: "contornar a objecao apresentada pelo lead de forma consultiva e manter o interesse",
    guidance:
      "Objecao: responda diretamente a objecao com empatia, argumentos do mercado de saude e sugira um novo angulo sem forcar a barra."
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

export const whatsappTemplateLibrary = [
  {
    id: "tpl-wa-new",
    stage: "new_lead",
    objective: "boas_vindas",
    tone: "consultivo",
    category: "Funil - Novo Lead",
    title: "Primeira Abordagem (Boas-vindas)",
    description: "Mensagem para o primeiro contato logo apos a captacao do lead.",
    content: {
      openingMessage:
        "Ola [Nome do Lead], aqui e o [Seu Nome] da [Empresa]. Recebi seu interesse em um plano de saude empresarial e gostaria de te dar as boas-vindas!",
      followUpMessage:
        "Para eu te enviar uma simulacao bem assertiva, voce teria 2 minutinhos para me confirmar quantas pessoas seriam incluidas no plano?",
      objectionReply:
        "Entendo perfeitamente. Muita gente acha que o processo e burocratico, mas minha ideia aqui e justamente simplificar isso para voce. Podemos seguir com apenas 3 perguntas rapidas?",
      complianceNotes: [
        "Primeiro contato deve pedir apenas contexto comercial inicial e evitar qualquer dado sensivel."
      ]
    },
    isActive: true
  },
  {
    id: "tpl-wa-qualify",
    stage: "qualification",
    objective: "qualificacao",
    tone: "consultivo",
    category: "Funil - Qualificacao",
    title: "Entendendo Necessidades",
    description: "Mensagem para identificar rede credenciada, momento comercial e faixa de investimento.",
    content: {
      openingMessage:
        "Obrigado pelas informacoes, [Nome do Lead]. Agora, para eu selecionar as melhores operadoras: existe algum hospital ou regiao que seja prioridade para voce?",
      followUpMessage:
        "Pergunto isso porque as vezes conseguimos um custo muito melhor focando na rede regional, sem perder a qualidade que voce busca.",
      objectionReply:
        "Com certeza, custo e fundamental. Vou buscar opcoes que equilibrem uma boa rede com o melhor custo-beneficio para o seu CNPJ.",
      complianceNotes: [
        "Manter a qualificacao em dados comerciais como rede, cidade, prazo e faixa de investimento."
      ]
    },
    isActive: true
  },
  {
    id: "tpl-wa-proposal",
    stage: "proposal",
    objective: "proposta",
    tone: "profissional",
    category: "Funil - Proposta",
    title: "Apresentacao do Estudo",
    description: "Mensagem para enviar o comparativo ou proposta oficial com leitura comercial rapida.",
    content: {
      openingMessage:
        "[Nome do Lead], acabei de finalizar o estudo comparativo para sua empresa. Consegui 3 opcoes que se encaixam no que conversamos.",
      followUpMessage:
        "Estou te enviando o PDF anexo. O destaque e a opcao [X], que oferece a rede que voce queria com uma economia de [Y]% em relacao ao mercado.",
      objectionReply:
        "Entendo a duvida entre as operadoras. A principal diferenca e que a [Opcao A] tem reembolso maior, enquanto a [Opcao B] foca em rede propria. Qual delas faz mais sentido para o seu momento?",
      complianceNotes: [
        "A proposta pode resumir comparativos, mas nao deve prometer economia ou aprovacao garantida."
      ]
    },
    isActive: true
  },
  {
    id: "tpl-wa-negotiation",
    stage: "negotiation",
    objective: "negociacao",
    tone: "direto_firme",
    category: "Funil - Negociacao",
    title: "Fechamento e Proximos Passos",
    description: "Mensagem para contornar duvidas finais e alinhar documentacao comercial.",
    content: {
      openingMessage:
        "Ola [Nome do Lead], conseguimos avancar com a proposta que te enviei? Os valores sao validos ate o dia [Data].",
      followUpMessage:
        "Se precisar de qualquer ajuste na grade de vidas ou cobertura, me avisa que altero agora mesmo para voce.",
      objectionReply:
        "Sobre o prazo de implantacao, se enviarmos o contrato ate amanha, conseguimos garantir o inicio para o dia 01 do proximo mes. Vamos garantir essa data?",
      complianceNotes: [
        "Negociacao deve reforcar proximos passos reais sem pressao artificial ou promessas fora da alcada comercial."
      ]
    },
    isActive: true
  },
  {
    id: "tpl-wa-reengage",
    stage: "awaiting_response",
    objective: "reengajamento",
    tone: "reengajamento",
    category: "Funil - Reengajamento",
    title: "Retomar Conversa Sem Pressao",
    description: "Mensagem curta para reabrir contato quando o lead esfriou apos a primeira troca.",
    content: {
      openingMessage:
        "Ola [Nome do Lead], passando para retomar nosso contato sobre o plano empresarial da sua empresa e te deixar um caminho simples para seguir.",
      followUpMessage:
        "Se ficar mais facil, pode me responder so com a cidade, a faixa de vidas e o prazo ideal, ou me dizer se prefere retomar isso em outro momento.",
      objectionReply:
        "Se agora nao for o melhor momento, sem problema. Posso deixar isso organizado e retomar quando fizer mais sentido para voce, sem compromisso.",
      complianceNotes: [
        "Follow-up sem resposta deve reduzir atrito, respeitar o tempo do lead e evitar insistencia excessiva."
      ]
    },
    isActive: true
  },
  {
    id: "tpl-wa-reactivation",
    stage: "reactivation",
    objective: "reativacao",
    tone: "reengajamento",
    category: "Funil - Reativacao",
    title: "Retomar Lead Antigo com Contexto",
    description: "Mensagem para reabrir a conversa com leads antigos ou parados sem soar invasivo.",
    content: {
      openingMessage:
        "Ola [Nome do Lead], passando para retomar nossa conversa sobre o plano empresarial da sua empresa. Como ja faz um tempo desde nosso ultimo contato, quis te deixar um caminho simples para revisar isso quando fizer sentido.",
      followUpMessage:
        "Se o cenario da empresa mudou, posso atualizar a analise com base em cidade, faixa de vidas, rede desejada ou prazo atual sem complicar seu lado.",
      objectionReply:
        "Se agora nao for prioridade, tudo bem. Posso deixar essa comparacao em aberto e retomar em outro momento com uma abordagem mais aderente ao momento da empresa.",
      complianceNotes: [
        "Reativacao deve reconhecer o tempo parado, evitar insistencia e convidar o lead a atualizar apenas criterios comerciais necessarios."
      ]
    },
    isActive: true
  },
  {
    id: "tpl-wa-post-service",
    stage: "post_service",
    objective: "pos_atendimento",
    tone: "empatico",
    category: "Pos-atendimento",
    title: "Acompanhamento Relacional",
    description: "Mensagem de acompanhamento para manter a relacao comercial ativa apos atendimento ou fechamento.",
    content: {
      openingMessage:
        "Ola [Nome do Lead], passando para saber se ficou tudo certo com as orientacoes do plano empresarial.",
      followUpMessage:
        "Se surgir qualquer ajuste, nova inclusao ou duvida sobre proximos passos, posso organizar isso com voce por aqui.",
      objectionReply:
        "Sem problema. Quando quiser revisar cobertura, vidas ou suporte da operacao, eu retomo com voce de forma bem objetiva.",
      complianceNotes: [
        "Pos-atendimento deve reforcar suporte e relacionamento, nao fazer pressao comercial."
      ]
    },
    isActive: true
  }
] as const satisfies ReadonlyArray<WhatsAppLibraryTemplate>;

export function getWhatsAppTemplateLibrary(stage?: WhatsAppStage) {
  const templates = stage
    ? whatsappTemplateLibrary.filter((template) => template.stage === stage)
    : whatsappTemplateLibrary;

  return [...templates];
}

export function getWhatsAppTemplatesByObjective(objective: WhatsAppTemplateObjective) {
  return whatsappTemplateLibrary.filter((template) => template.objective === objective);
}

export function getWhatsAppSystemTemplatesFallback(): SystemTemplate[] {
  const timestamp = new Date().toISOString();

  return whatsappTemplateLibrary.map((template) => ({
    id: template.id,
    templateType: "whatsapp",
    category: template.category,
    title: template.title,
    description: template.description,
    content: {
      openingMessage: template.content.openingMessage,
      followUpMessage: template.content.followUpMessage,
      objectionReply: template.content.objectionReply
    } satisfies WhatsAppTemplateContent,
    isActive: template.isActive,
    createdAt: timestamp,
    updatedAt: timestamp
  }));
}

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

export function getWhatsAppStageLabel(stage: WhatsAppStage) {
  return whatsappStageStrategies[stage]?.label ?? whatsappStageStrategies.new.label;
}

export function getSuggestedWhatsAppTone(stage: WhatsAppStage): WhatsAppToneValue {
  if (stage === "awaiting_response" || stage === "reactivation") {
    return "reengajamento";
  }

  return "consultivo";
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
        openingMessage: `Ola, ${firstName}! Passando para retomar nosso contato sobre ${interest}${company} e facilitar esse proximo passo para voce.`,
        followUpMessage:
          "Se ficar mais facil, pode me responder so com a cidade da empresa, a faixa de vidas e o melhor prazo para seguir, ou me dizer se prefere retomar isso depois.",
        objectionReply:
          "Se agora nao for o melhor momento, sem problema. Posso retomar quando fizer mais sentido para voce, sem insistir.",
        complianceNotes: [
          "Retome a conversa sem insistencia excessiva, sem criar urgencia artificial e com uma resposta simples de baixo atrito."
        ]
      };
    case "reactivation":
      return {
        openingMessage: `Ola, ${firstName}! Passando para retomar nossa conversa sobre ${interest}${company}, ja que faz um tempo desde o ultimo contato.`,
        followUpMessage:
          "Se o momento da empresa mudou, posso atualizar a analise considerando cidade, faixa de vidas, prioridade de rede ou prazo atual sem complicar seu lado.",
        objectionReply:
          "Se agora nao for prioridade, tudo bem. Posso deixar isso em aberto e retomar mais para frente com base no que fizer sentido para voce.",
        complianceNotes: [
          "Reative leads antigos com contexto comercial e convite leve de retomada, sem parecer cobranca ou insistencia."
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
    case "objection_follow_up":
      return {
        openingMessage: `Ola, ${firstName}! Entendo perfeitamente o ponto que voce trouxe sobre ${interest}${company}.`,
        followUpMessage:
          "Muitas empresas passam por isso. O que acha de analisarmos uma alternativa que contorne exatamente essa questao, sem compromisso?",
        objectionReply:
          "Se nao fizer sentido agora, sem problemas. Fico a disposicao para retomar a conversa quando o cenario estiver mais favoravel.",
        complianceNotes: [
          "Responda a objecao de forma consultiva, sem forcar a venda e oferecendo novas opcoes validas."
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
