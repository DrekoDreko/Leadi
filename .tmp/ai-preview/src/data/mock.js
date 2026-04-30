"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledTasks = exports.campaignDraft = exports.kanbanColumns = exports.leads = exports.navItems = void 0;
const lucide_react_1 = require("lucide-react");
exports.navItems = [
    { label: "Dashboard", href: "/dashboard", icon: lucide_react_1.LayoutDashboard },
    { label: "Leads", href: "/dashboard/leads", icon: lucide_react_1.UsersRound },
    { label: "Funil", href: "/dashboard/funil", icon: lucide_react_1.Kanban },
    { label: "Campanhas", href: "/dashboard/campanhas", icon: lucide_react_1.Sparkles },
    { label: "Compliance", href: "/dashboard/compliance", icon: lucide_react_1.ShieldCheck },
    { label: "WhatsApp", href: "/dashboard/whatsapp", icon: lucide_react_1.MessageCircle },
    { label: "Relatórios", href: "/dashboard/relatorios", icon: lucide_react_1.BarChart3 },
    { label: "Planos", href: "/pricing", icon: lucide_react_1.WalletCards }
];
exports.leads = [
    {
        id: "LH-1042",
        name: "Marina Azevedo",
        owner: "Lucas",
        stage: "Novo lead",
        nextContact: "Hoje, 15:30",
        score: 86,
        source: "Meta Lead Form",
        phone: "(19) 98842-1042",
        email: "marina@azevedoclinica.com.br",
        city: "Campinas",
        companyName: "Azevedo Clinica",
        livesCount: 48,
        createdAt: "27 abr 2026",
        receivedAt: "2026-04-27T15:30:00-03:00",
        budget: "R$ 18k/mês",
        interest: "Plano empresarial com coparticipação",
        lastInteraction: "Solicitou comparação entre duas operadoras e pediu retorno no fim da tarde.",
        notes: "Lead em expansão, decisora direta e com urgência para fechar ainda este mês."
    },
    {
        id: "LH-1039",
        name: "Renato Carvalho",
        owner: "Bia",
        stage: "Qualificação",
        nextContact: "Amanhã, 10:00",
        score: 74,
        source: "CSV importado",
        phone: "(11) 97620-1039",
        email: "renato@rcengenharia.com.br",
        city: "Sao Paulo",
        companyName: "RC Engenharia",
        livesCount: 32,
        createdAt: "26 abr 2026",
        receivedAt: "2026-04-26T10:00:00-03:00",
        budget: "R$ 6k/mês",
        interest: "Redução de custo do plano atual",
        lastInteraction: "Respondeu ao WhatsApp com faixa de vidas e pediu simulação sem odontológico.",
        notes: "Lead sensível a preço. Vale abrir com economia estimada antes de falar de rede."
    },
    {
        id: "LH-1031",
        name: "Paula Mendes",
        owner: "Lucas",
        stage: "Proposta",
        nextContact: "Qui, 09:15",
        score: 68,
        source: "Cadastro manual",
        phone: "(13) 99110-1031",
        email: "paula@mendesstudio.com.br",
        city: "Santos",
        companyName: "Mendes Studio",
        livesCount: 11,
        createdAt: "24 abr 2026",
        receivedAt: "2026-04-24T09:15:00-03:00",
        budget: "R$ 2.8k/mês",
        interest: "Primeiro plano empresarial para equipe pequena",
        lastInteraction: "Recebeu a proposta inicial e quer entender carência para novas vidas.",
        notes: "Precisa de orientação simples. Enviar resumo visual com coberturas e próximos passos."
    },
    {
        id: "LH-1028",
        name: "Fábio Lins",
        owner: "Nina",
        stage: "Negociação",
        nextContact: "Sex, 16:00",
        score: 91,
        source: "Meta Lead Form",
        phone: "(15) 98132-1028",
        email: "fabio@linslogistica.com.br",
        city: "Sorocaba",
        companyName: "Lins Logistica",
        livesCount: 126,
        createdAt: "23 abr 2026",
        receivedAt: "2026-04-23T16:00:00-03:00",
        budget: "R$ 42k/mês",
        interest: "Migração de contrato com maior rede hospitalar",
        lastInteraction: "Comparou proposta final com contrato atual e pediu ajuste para diretoria.",
        notes: "Alto potencial. Preparar argumento de rede credenciada e risco de reajuste."
    }
];
exports.kanbanColumns = [
    {
        title: "Novo lead",
        total: 18,
        color: "bg-cobalt text-white",
        cards: [exports.leads[0]]
    },
    {
        title: "Qualificação",
        total: 11,
        color: "bg-lagoon text-white",
        cards: [exports.leads[1]]
    },
    {
        title: "Proposta",
        total: 7,
        color: "bg-signal text-ink",
        cards: [exports.leads[2]]
    },
    {
        title: "Negociação",
        total: 5,
        color: "bg-ink text-white",
        cards: [exports.leads[3]]
    }
];
exports.campaignDraft = {
    title: "Análise consultiva para plano empresarial",
    copy: "Avalie alternativas de plano empresarial para MEI, ME ou LTDA com uma análise consultiva feita por especialistas.",
    formFields: [
        "Nome completo",
        "Telefone",
        "Email",
        "ME"
    ]
};
exports.scheduledTasks = [
    { day: "27", label: "Revisar CSV", type: "blue" },
    { day: "28", label: "Ligar Marina", type: "yellow" },
    { day: "29", label: "Enviar proposta", type: "teal" },
    { day: "30", label: "Briefing criativo", type: "dark" }
];
