"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadHealthBaseInstructions = void 0;
exports.buildCampaignTextPrompt = buildCampaignTextPrompt;
exports.buildComplianceQuestionsPrompt = buildComplianceQuestionsPrompt;
exports.buildWhatsAppMessagePrompt = buildWhatsAppMessagePrompt;
exports.buildComplianceReviewPrompt = buildComplianceReviewPrompt;
const templates_1 = require("../whatsapp/templates");
const market_examples_1 = require("./market-examples");
const sharedRoleContext = [
    "Voce escreve para corretoras e consultores que vendem plano de saude empresarial no Brasil.",
    "Seu texto deve soar como operacao comercial real: consultiva, objetiva, humana e centrada em proximo passo.",
    "A LeadHealth e apenas o software do corretor; textos para o cliente final nunca devem parecer enviados pela LeadHealth.",
    "Use portugues do Brasil natural e profissional, sem jargao vazio e sem cara de texto generico de IA."
];
const marketRealitySignals = [
    "Fale em empresa, RH, financeiro, socio, administrativo ou decisor comercial quando fizer sentido.",
    "Ancore a conversa em quantidade de vidas, cidade/regiao, prazo de implantacao, rede, faixa de investimento, atendimento e formato contratual.",
    "Se faltar contexto, prefira pedir ou sugerir apenas informacoes comerciais necessarias para avancar.",
    "Nao invente nome de operadora, tabela, link, desconto, cobertura ou carencia."
];
const styleGuardrails = [
    "Frases curtas e claras. Evite texto inflado, superlativo absoluto e sensacionalismo.",
    "Nao use urgencia artificial, escassez enganosa ou promessa agressiva.",
    "Se houver exemplos, absorva o padrao de abordagem e vocabulario, sem copiar literalmente.",
    "A resposta deve ajudar uma conversa comercial real a andar para a proxima etapa."
];
const complianceHardStops = [
    "Nao prometa aprovacao, cobertura garantida, economia garantida, sem carencia para todos ou resultado medico.",
    "Nao explore diagnostico, doenca, gravidez, deficiencia, idade sensivel, religiao, etnia, genero, orientacao sexual ou atributo protegido.",
    "Nao peca documentos pessoais, renda, CPF, data de nascimento ou outros dados sensiveis no primeiro contato.",
    "Nao assuma elegibilidade da empresa ou das vidas antes de analise comercial e da operadora."
];
exports.leadHealthBaseInstructions = joinSections([
    buildSection("Papel", sharedRoleContext),
    buildSection("Realismo comercial", marketRealitySignals),
    buildSection("Estilo", styleGuardrails),
    buildSection("Limites de compliance", complianceHardStops),
    "Responda apenas no JSON solicitado pelo schema."
]);
function buildCampaignTextPrompt(input) {
    return joinSections([
        "Crie textos de campanha para captacao de leads de plano de saude empresarial.",
        buildContextSection([
            `Nome comercial da corretora/representante: ${formatOptional(input.brokerageName)}`,
            `Publico principal: ${input.audience}`,
            `Produto: ${input.product}`,
            `Objetivo: ${formatOptional(input.objective, "gerar leads qualificados para cotacao consultiva")}`,
            `Oferta: ${formatOptional(input.offer)}`,
            `Regiao: ${formatOptional(input.region)}`,
            `Canal: ${formatOptional(input.channel, "meta_ads")}`,
            `Tom desejado: ${formatOptional(input.tone, "consultivo, humano e direto")}`,
            `Restricoes adicionais: ${formatList(input.constraints)}`
        ]),
        buildSection("O que deixa a copy mais parecida com a operacao real", [
            "Mostre valor em organizar comparacao, cotacao e proximo passo, sem soar como propaganda milagrosa.",
            "Fale com empresas e decisores, nao com pessoas por condicao de saude ou perfil pessoal.",
            "Quando mencionar atendimento, use o nome comercial informado da corretora ou representante.",
            "Sugira um publico permitido com base em empresa, regiao, porte, momento de contratacao e necessidade de avaliacao."
        ]),
        buildExamplesSection("Padroes de campanha aprovados como referencia", market_examples_1.campaignMarketExamples.map((example) => `${example.scenario}: ${example.safePattern} Motivo: ${example.rationale}`)),
        buildSection("Evite especialmente", [
            "Promessa de desconto, cobertura total, aprovacao garantida ou ausencia garantida de carencia.",
            "Chamadas sobre doencas, idade, gravidez, historico medico ou situacoes protegidas.",
            "CTA vaga como 'nao perca' ou 'ultima chance' sem regra comercial verificavel."
        ]),
        "A copy final deve parecer escrita por uma corretora que entende o mercado empresarial e quer abrir uma conversa segura."
    ]);
}
function buildComplianceQuestionsPrompt(input) {
    var _a;
    return joinSections([
        "Crie perguntas seguras de qualificacao comercial para formulario de captacao de plano de saude empresarial.",
        buildContextSection([
            `Publico principal: ${input.audience}`,
            `Produto: ${input.product}`,
            `Objetivo: ${formatOptional(input.objective, "qualificar o lead sem friccao excessiva")}`,
            `Quantidade maxima de perguntas: ${String((_a = input.maxQuestions) !== null && _a !== void 0 ? _a : 6)}`,
            `Topicos obrigatorios: ${formatList(input.requiredTopics)}`
        ]),
        buildSection("Topicos que costumam ajudar a operacao", [
            "Empresa ou CNPJ, quando apropriado para o momento.",
            "Quantidade aproximada de vidas ou faixa de vidas.",
            "Cidade ou regiao da empresa.",
            "Prazo para cotacao, renovacao ou implantacao.",
            "Prioridade principal: custo, rede, atendimento, suporte ou prazo.",
            "Melhor contato para retorno comercial."
        ]),
        buildExamplesSection("Padroes de pergunta segura", [
            "Qual a faixa de vidas que a empresa deseja avaliar nesta cotacao?",
            "Em qual cidade ou regiao a empresa precisa de atendimento principal?",
            "Qual ponto pesa mais hoje na analise: custo, rede, implantacao ou suporte?"
        ]),
        buildSection("Nao perguntar", [
            "Diagnosticos, tratamentos, cirurgias, gravidez, deficiencia ou historico de saude.",
            "Religiao, etnia, genero, idade sensivel, orientacao sexual ou renda pessoal.",
            "Dados excessivos para o primeiro passo, como CPF, RG e data de nascimento."
        ]),
        "Use reviewRequired true apenas quando a pergunta ainda exigir revisao manual por risco comercial, regulatorio ou de privacidade."
    ]);
}
function buildWhatsAppMessagePrompt(input) {
    var _a;
    const stage = (_a = input.stage) !== null && _a !== void 0 ? _a : "new";
    return joinSections([
        "Crie mensagens curtas para WhatsApp comercial de corretora de plano de saude empresarial.",
        buildContextSection([
            `Nome comercial da corretora/representante: ${formatOptional(input.brokerageName)}`,
            `Produto: ${input.product}`,
            `Nome do lead: ${formatOptional(input.leadName)}`,
            `Contexto do lead: ${formatOptional(input.leadContext)}`,
            `Etapa do funil: ${stage}`,
            `Objetivo da etapa: ${(0, templates_1.buildWhatsAppStageObjective)(stage)}`,
            `Diretriz da etapa: ${(0, templates_1.buildWhatsAppStagePrompt)(stage)}`,
            `Objetivo especifico desta mensagem: ${formatOptional(input.objective, "iniciar conversa, entender o cenario da empresa e combinar o proximo passo")}`,
            `Tom desejado: ${formatOptional(input.tone, "proximo, educado e objetivo")}`
        ]),
        buildSection("Como a mensagem deve soar", [
            "Pense como um corretor real falando com um decisor ou contato da empresa no WhatsApp.",
            "Use linguagem curta, natural e profissional, sem cara de copy publicitaria.",
            "A abertura deve falar em nome da corretora ou representante, nunca em nome da LeadHealth.",
            "Use o contexto do lead apenas para deixar a conversa mais aderente, sem inventar fatos."
        ]),
        buildExamplesSection("Padroes de abordagem aprovados", market_examples_1.whatsappMarketExamples.map((example) => `${example.scenario}: ${example.safePattern} Motivo: ${example.rationale}`)),
        buildExamplesSection("Padroes seguros para responder objecoes", market_examples_1.objectionMarketExamples.map((example) => `${example.objection}: ${example.safeReplyPattern} Motivo: ${example.rationale}`)),
        buildSection("Nao fazer", [
            "Nao incluir link ficticio, tabela inventada ou nome de operadora nao informado.",
            "Nao pedir informacoes sensiveis no primeiro contato.",
            "Nao usar emoji em excesso, voz robotica ou urgencia artificial."
        ]),
        "As tres mensagens devem ser claramente diferentes entre si e coerentes com a etapa informada."
    ]);
}
function buildComplianceReviewPrompt(input) {
    return joinSections([
        "Analise o texto abaixo como uma revisao de risco para campanha ou mensagem de plano de saude empresarial.",
        buildContextSection([
            `Canal: ${formatOptional(input.channel, "meta_ads")}`,
            `Publico: ${formatOptional(input.audience)}`,
            `Objetivo: ${formatOptional(input.objective, "captar leads qualificados")}`
        ]),
        buildSection("Texto para revisar", [input.text]),
        buildSection("Cheque especialmente", [
            "Linguagem sensivel ligada a saude, diagnostico ou atributo protegido.",
            "Promessas de aprovacao, cobertura, economia garantida, sem carencia ou urgencia agressiva.",
            "Coleta excessiva de dados pessoais no primeiro passo.",
            "Uso de tom pouco realista para a operacao comercial."
        ]),
        buildExamplesSection("Padroes de reescrita segura", market_examples_1.complianceRewriteExamples.map((example) => { var _a; return `${example.scenario}: ${example.safePattern} Evite: ${(_a = example.avoidPattern) !== null && _a !== void 0 ? _a : "n/a"}`; })),
        buildSection("Ao reescrever", [
            "Troque promessa por comparacao consultiva e proximo passo comercial.",
            "Troque segmentacao sensivel por criterios como empresa, regiao, momento e necessidade de cotacao.",
            "Mantenha o texto util para vendas sem relaxar as travas de compliance."
        ]),
        "Inclua sempre a ressalva de que a validacao nao substitui revisao juridica, regulatoria ou comercial."
    ]);
}
function buildContextSection(lines) {
    return buildSection("Contexto da solicitacao", lines);
}
function buildExamplesSection(title, examples) {
    return buildSection(title, examples);
}
function buildSection(title, lines) {
    return `${title}:\n${lines.map((line) => `- ${line}`).join("\n")}`;
}
function joinSections(sections) {
    return sections.filter(Boolean).join("\n\n");
}
function formatList(values) {
    return (values === null || values === void 0 ? void 0 : values.length) ? values.join("; ") : "nenhum informado";
}
function formatOptional(value, fallback = "nao informado") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
