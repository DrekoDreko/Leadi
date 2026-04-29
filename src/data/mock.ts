import {
  BarChart3,
  FilePlus2,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
  { label: "Campanhas", href: "/dashboard/campanhas", icon: Sparkles },
  { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
  { label: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
  { label: "Pedidos", href: "/dashboard/pedidos", icon: FilePlus2 },
  { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { label: "Planos", href: "/pricing", icon: WalletCards }
];

export type Lead = {
  id: string;
  name: string;
  owner: string;
  stage: string;
  nextContact: string;
  score: number;
  source: string;
  phone: string;
  email: string;
  city?: string | null;
  createdAt: string;
  budget: string;
  interest: string;
  lastInteraction: string;
  notes: string;
  sourceCampaign?: string | null;
  sourceAdset?: string | null;
  sourceAd?: string | null;
  metaLeadId?: string | null;
  metaFormId?: string | null;
  metaPageId?: string | null;
  receivedAt?: string | null;
  nextContactAt?: string | null;
};

export const leads: Lead[] = [
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
    createdAt: "27 abr 2026",
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
    createdAt: "26 abr 2026",
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
    createdAt: "24 abr 2026",
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
    createdAt: "23 abr 2026",
    budget: "R$ 42k/mês",
    interest: "Migração de contrato com maior rede hospitalar",
    lastInteraction: "Comparou proposta final com contrato atual e pediu ajuste para diretoria.",
    notes: "Alto potencial. Preparar argumento de rede credenciada e risco de reajuste."
  }
];

export const kanbanColumns = [
  {
    title: "Novo lead",
    total: 18,
    color: "bg-cobalt text-white",
    cards: [leads[0]]
  },
  {
    title: "Qualificação",
    total: 11,
    color: "bg-lagoon text-white",
    cards: [leads[1]]
  },
  {
    title: "Proposta",
    total: 7,
    color: "bg-signal text-ink",
    cards: [leads[2]]
  },
  {
    title: "Negociação",
    total: 5,
    color: "bg-ink text-white",
    cards: [leads[3]]
  }
];

export const campaignDraft = {
  title: "Análise consultiva para plano empresarial",
  copy:
    "Avalie alternativas de plano empresarial para MEI, ME ou LTDA com uma análise consultiva feita por especialistas.",
  formFields: [
    "Nome completo",
    "Telefone",
    "Email",
    "ME"
  ]
};

export const scheduledTasks = [
  { day: "27", label: "Revisar CSV", type: "blue" },
  { day: "28", label: "Ligar Marina", type: "yellow" },
  { day: "29", label: "Enviar proposta", type: "teal" },
  { day: "30", label: "Briefing criativo", type: "dark" }
];
