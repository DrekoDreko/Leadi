export type MarketExampleStatus = "baseline" | "pending_user_review";

export type MarketCopyExample = {
  id: string;
  channel: "campaign" | "whatsapp" | "compliance";
  scenario: string;
  safePattern: string;
  avoidPattern?: string;
  rationale: string;
  status: MarketExampleStatus;
};

export type MarketObjectionExample = {
  id: string;
  objection: string;
  safeReplyPattern: string;
  rationale: string;
  status: MarketExampleStatus;
};

export const campaignMarketExamples: MarketCopyExample[] = [
  {
    id: "campaign-reavaliacao-beneficio",
    channel: "campaign",
    scenario: "Empresa reavaliando o beneficio atual",
    safePattern:
      "Sua empresa esta revisando o plano de saude empresarial? Organize uma cotacao consultiva com foco em rede, faixa de investimento e prazo de implantacao.",
    avoidPattern: "Economize muito com aprovacao garantida e sem burocracia.",
    rationale:
      "Fala com a empresa e com o decisor comercial sem prometer resultado, cobertura ou economia garantida.",
    status: "baseline"
  },
  {
    id: "campaign-expansao-time",
    channel: "campaign",
    scenario: "Empresa crescendo e precisando reavaliar o beneficio",
    safePattern:
      "Se a equipe cresceu, vale comparar opcoes de plano empresarial conforme cidade, quantidade de vidas e momento da contratacao.",
    rationale:
      "Usa um gatilho operacional comum do mercado e ancora a conversa em criterios comerciais verificaveis.",
    status: "baseline"
  },
  {
    id: "campaign-renovacao-contrato",
    channel: "campaign",
    scenario: "Renovacao ou troca de operadora",
    safePattern:
      "Na renovacao do beneficio, uma analise consultiva ajuda a comparar rede, atendimento e formato contratual antes da decisao.",
    rationale:
      "Mantem o texto util e realista para RH, financeiro ou socio responsavel pela contratacao.",
    status: "baseline"
  }
];

export const whatsappMarketExamples: MarketCopyExample[] = [
  {
    id: "whatsapp-novo-lead",
    channel: "whatsapp",
    scenario: "Primeiro contato apos pedido de cotacao",
    safePattern:
      "Vi seu pedido de cotacao para plano de saude empresarial e posso te ajudar a comparar as opcoes da empresa com mais clareza.",
    rationale:
      "Reconhece a origem do contato e abre a conversa como um corretor consultivo, sem parecer robo nem pressionar.",
    status: "baseline"
  },
  {
    id: "whatsapp-qualificacao",
    channel: "whatsapp",
    scenario: "Qualificacao comercial",
    safePattern:
      "Para te passar algo mais aderente, me ajuda com a faixa de vidas, cidade da empresa e prazo desejado para implantacao?",
    rationale:
      "Pede so dados comerciais e usa vocabulario de operacao real.",
    status: "baseline"
  },
  {
    id: "whatsapp-proposta",
    channel: "whatsapp",
    scenario: "Retomada de proposta enviada",
    safePattern:
      "Se quiser, eu resumo a proposta em tres pontos: faixa de investimento, rede de atendimento e proximos passos da implantacao.",
    rationale:
      "Ajuda a destravar a decisao com linguagem objetiva e sem prometer condicoes que dependem da operadora.",
    status: "baseline"
  },
  {
    id: "whatsapp-perdido",
    channel: "whatsapp",
    scenario: "Lead que nao fechou no momento",
    safePattern:
      "Se agora nao for o melhor momento, posso deixar a comparacao registrada e retomar quando a empresa quiser revisar o tema.",
    rationale:
      "Mantem follow-up respeitoso e abre porta para retomada futura sem insistencia excessiva.",
    status: "baseline"
  }
];

export const complianceRewriteExamples: MarketCopyExample[] = [
  {
    id: "compliance-rewrite-economia",
    channel: "compliance",
    scenario: "Troca de promessa forte por abordagem consultiva",
    safePattern:
      "Compare alternativas de plano de saude empresarial conforme rede, faixa de investimento e necessidade da empresa.",
    avoidPattern: "Garanta economia e cobertura completa para toda a equipe.",
    rationale:
      "Substitui garantia por comparacao consultiva baseada em criterios comerciais.",
    status: "baseline"
  },
  {
    id: "compliance-rewrite-segmentacao",
    channel: "compliance",
    scenario: "Troca de segmentacao sensivel por publico comercial",
    safePattern:
      "Atendimento para empresas que querem organizar cotacao de beneficio de saude por cidade, porte e momento da contratacao.",
    avoidPattern: "Plano ideal para diabeticos, idosos ou gestantes.",
    rationale:
      "Mantem o foco em empresa, regiao e contratacao, sem explorar atributos pessoais ou de saude.",
    status: "baseline"
  }
];

export const objectionMarketExamples: MarketObjectionExample[] = [
  {
    id: "objection-custo",
    objection: "Custo acima do esperado",
    safeReplyPattern:
      "Se o custo for o ponto principal agora, eu reorganizo a analise por faixa de investimento e mostro o que muda em rede, operacao e formato contratual.",
    rationale:
      "Trata custo como criterio de decisao sem prometer desconto, economia garantida ou condicao inexistente.",
    status: "baseline"
  },
  {
    id: "objection-rede",
    objection: "Duvida sobre rede e atendimento",
    safeReplyPattern:
      "Se a rede for prioridade, eu separo as alternativas pelo que faz mais sentido para a regiao e para o tipo de uso da empresa.",
    rationale:
      "Mantem o foco em adequacao comercial e regional, sem garantir cobertura ou credenciamento futuro.",
    status: "baseline"
  },
  {
    id: "objection-prazo",
    objection: "Prazo apertado para decisao ou implantacao",
    safeReplyPattern:
      "Se o prazo estiver curto, eu priorizo os pontos operacionais e os documentos necessarios para voce avaliar o que e viavel agora.",
    rationale:
      "Ajuda na proxima acao concreta sem criar urgencia artificial.",
    status: "baseline"
  },
  {
    id: "objection-vidas-indefinidas",
    objection: "Empresa ainda nao fechou a quantidade exata de vidas",
    safeReplyPattern:
      "Se a quantidade final de vidas ainda nao fechou, podemos comecar com uma faixa estimada e ajustar quando o cenario estiver consolidado.",
    rationale:
      "Reflete um caso real de operacao e reduz atrito sem inventar premissas comerciais.",
    status: "baseline"
  }
];
