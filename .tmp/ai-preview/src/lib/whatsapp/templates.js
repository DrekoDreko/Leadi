"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappStageStrategies = exports.whatsappToneOptions = void 0;
exports.getWhatsAppTonePrompt = getWhatsAppTonePrompt;
exports.getWhatsAppToneLabel = getWhatsAppToneLabel;
exports.buildWhatsAppStageObjective = buildWhatsAppStageObjective;
exports.buildWhatsAppStagePrompt = buildWhatsAppStagePrompt;
exports.buildFallbackWhatsAppMessage = buildFallbackWhatsAppMessage;
exports.whatsappToneOptions = [
    {
        value: "consultivo",
        label: "Consultivo",
        prompt: "consultivo, seguro e orientado ao proximo passo"
    },
    {
        value: "direto",
        label: "Direto",
        prompt: "direto, objetivo e comercial sem pressao"
    },
    {
        value: "acolhedor",
        label: "Acolhedor",
        prompt: "acolhedor, humano e profissional"
    }
];
exports.whatsappStageStrategies = {
    new: {
        label: "Novo lead",
        objective: "abrir a conversa, confirmar interesse e propor um proximo passo simples",
        guidance: "Primeiro contato: seja breve, cite o interesse do lead e faca uma pergunta comercial leve para confirmar se faz sentido avancar."
    },
    qualification: {
        label: "Qualificacao",
        objective: "qualificar empresa, quantidade de vidas, regiao e prioridade comercial",
        guidance: "Qualificacao: pergunte apenas dados comerciais como quantidade de vidas, cidade, prazo e prioridade. Nao peca dados de saude."
    },
    proposal: {
        label: "Proposta",
        objective: "retomar a proposta enviada e facilitar a decisao com um resumo objetivo",
        guidance: "Proposta: reforce que a pessoa pode revisar pontos comerciais, rede, prazo e custo sem prometer aprovacao ou economia garantida."
    },
    negotiation: {
        label: "Negociacao",
        objective: "destravar objeções comerciais e combinar o proximo passo de decisao",
        guidance: "Negociacao: responda a objeções de custo, rede ou prazo com linguagem segura, sem criar urgencia artificial."
    },
    won: {
        label: "Fechado",
        objective: "confirmar fechamento, alinhar proximos passos e pedir documentos comerciais necessarios",
        guidance: "Fechado: agradeca, confirme proximos passos operacionais e peca somente documentos comerciais necessarios."
    },
    lost: {
        label: "Perdido",
        objective: "fazer follow-up respeitoso e deixar porta aberta para uma nova avaliacao futura",
        guidance: "Perdido: seja respeitoso, reconheca a decisao e deixe um caminho simples para reabrir a conversa no futuro."
    }
};
function getWhatsAppTonePrompt(tone) {
    var _a, _b;
    return ((_b = (_a = exports.whatsappToneOptions.find((option) => option.value === tone)) === null || _a === void 0 ? void 0 : _a.prompt) !== null && _b !== void 0 ? _b : exports.whatsappToneOptions[0].prompt);
}
function getWhatsAppToneLabel(tone) {
    var _a, _b;
    return ((_b = (_a = exports.whatsappToneOptions.find((option) => option.value === tone)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : exports.whatsappToneOptions[0].label);
}
function buildWhatsAppStageObjective(stage) {
    var _a, _b;
    return (_b = (_a = exports.whatsappStageStrategies[stage]) === null || _a === void 0 ? void 0 : _a.objective) !== null && _b !== void 0 ? _b : exports.whatsappStageStrategies.new.objective;
}
function buildWhatsAppStagePrompt(stage) {
    var _a;
    const strategy = (_a = exports.whatsappStageStrategies[stage]) !== null && _a !== void 0 ? _a : exports.whatsappStageStrategies.new;
    return strategy.guidance;
}
function buildFallbackWhatsAppMessage({ brokerageName = "Corretora Demo", lead, stage, tone }) {
    var _a;
    const firstName = (lead === null || lead === void 0 ? void 0 : lead.name.split(" ")[0]) || "ola";
    const interest = ((_a = lead === null || lead === void 0 ? void 0 : lead.interest) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "plano de saude empresarial";
    const company = (lead === null || lead === void 0 ? void 0 : lead.companyName) ? ` para ${lead.companyName}` : "";
    const toneNote = getWhatsAppToneLabel(tone).toLowerCase();
    switch (stage) {
        case "qualification":
            return {
                openingMessage: `Ola, ${firstName}! Para te orientar melhor sobre ${interest}${company}, posso confirmar algumas informacoes comerciais bem objetivas?`,
                followUpMessage: "Faixa de vidas, cidade da operacao e prazo desejado para implantacao ja ajudam a montar uma analise mais aderente.",
                objectionReply: "Se ainda nao tiver tudo fechado, sem problema. Podemos comecar pelo cenario atual da empresa e ajustar a comparacao depois.",
                complianceNotes: [
                    "Qualifique apenas informacoes comerciais, sem perguntar dados de saude, diagnosticos ou perfil sensivel."
                ]
            };
        case "proposal":
            return {
                openingMessage: `Ola, ${firstName}! Passando para retomar a proposta de ${interest}${company} e deixar sua avaliacao mais simples.`,
                followUpMessage: "Se fizer sentido, eu posso resumir em tres pontos: faixa de investimento, rede e proximos passos da implantacao.",
                objectionReply: "Se algum ponto nao encaixou, me diga o que pesa mais agora na decisao: custo, rede, prazo ou formato do contrato.",
                complianceNotes: [
                    "Evite prometer aprovacao, cobertura especifica ou economia garantida; mantenha a conversa nos criterios comerciais."
                ]
            };
        case "negotiation":
            return {
                openingMessage: `Ola, ${firstName}! Vi que estamos ajustando a proposta de ${interest}${company}.`,
                followUpMessage: "Posso organizar os pontos que ainda precisam de decisao e te mostrar as alternativas com mais clareza?",
                objectionReply: "Se a duvida principal for custo, rede ou prazo, eu separo os cenarios possiveis para voce avaliar com calma.",
                complianceNotes: [
                    "Trate objeções comerciais sem urgencia artificial e sem garantir condicoes que dependem da operadora."
                ]
            };
        case "won":
            return {
                openingMessage: `Ola, ${firstName}! Que bom que avancamos com ${interest}${company}.`,
                followUpMessage: "Vou alinhar os proximos passos comerciais e te aviso quais documentos e confirmacoes da empresa vamos precisar para seguir.",
                objectionReply: "Se surgir alguma duvida nesta etapa, me chama por aqui que eu organizo o ponto e encaminho com clareza.",
                complianceNotes: [
                    "Solicite apenas dados e documentos necessarios ao processo comercial e operacional."
                ]
            };
        case "lost":
            return {
                openingMessage: `Ola, ${firstName}! Obrigado por avaliar a proposta de ${interest}${company}.`,
                followUpMessage: "Se o momento nao for ideal agora, posso deixar a comparacao registrada e retomar numa data melhor para uma nova avaliacao.",
                objectionReply: "Se o motivo tiver sido custo, rede ou prazo, consigo revisar alternativas no futuro sem pressa e sem compromisso.",
                complianceNotes: [
                    "Mantenha o follow-up respeitoso, sem insistencia excessiva ou promessa comercial."
                ]
            };
        case "new":
        default:
            return {
                openingMessage: `Ola, ${firstName}! Aqui e a equipe da ${brokerageName}. Vi seu interesse em ${interest}${company} e posso te ajudar a comparar as opcoes da empresa com mais clareza.`,
                followUpMessage: "Se fizer sentido, me passa faixa de vidas, cidade e prazo desejado que eu organizo o proximo passo comercial.",
                objectionReply: "Se a prioridade for custo, rede ou prazo, eu adapto a analise para esse foco sem exageros nem promessas fora do combinado.",
                complianceNotes: [
                    `Mensagem em tom ${toneNote}, focada em criterios comerciais e no proximo passo.`
                ]
            };
    }
}
