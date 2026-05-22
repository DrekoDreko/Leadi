import {
  BarChart3,
  Kanban,
  LayoutDashboard,
  Sparkles,
  UsersRound,
  UserPlus,
  WalletCards
} from "lucide-react";
import type { LeadQualityValue } from "@/lib/leads/quality";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/dashboard/leads", icon: UsersRound },
  { label: "Funil", href: "/dashboard/funil", icon: Kanban },
  { label: "Importar Leads", href: "/dashboard/importar", icon: BarChart3 },
  { label: "Criar Equipe", href: "/dashboard/criar-equipe", icon: UserPlus },
  { label: "Criações", href: "/dashboard/criacoes", icon: Sparkles },
  { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { label: "Planos", href: "/pricing", icon: WalletCards }
];

export type Lead = {
  id: string;
  name: string;
  owner: string;
  ownerProfileId?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  stage: string;
  source: string;
  phone: string;
  email: string;
  city?: string | null;
  companyName?: string | null;
  livesCount?: number | null;
  createdAt: string;
  budget: string;
  interest: string;
  lastInteraction: string;
  notes: string;
  lossReason?: string | null;
  quality?: LeadQualityValue | null;
  sourceCampaign?: string | null;
  sourceAdset?: string | null;
  sourceAd?: string | null;
  metaLeadId?: string | null;
  metaFormId?: string | null;
  metaPageId?: string | null;
  metaCampaignId?: string | null;
  metaAdsetId?: string | null;
  metaAdId?: string | null;
  metaConnectedAccountId?: string | null;
  receivedAt?: string | null;
  updatedAt?: string | null;
  archivedAt?: string | null;
  archiveReason?: string | null;
  duplicateOfLeadId?: string | null;
};

export const leads: Lead[] = [
  {
    id: "LE-1042",
    name: "Marina Azevedo",
    owner: "Gabriel",
    stage: "Novo lead",
    source: "Meta Lead Form",
    phone: "(19) 98842-1042",
    email: "marina@azevedoclinica.com.br",
    city: "Campinas",
    companyName: "Azevedo Clinica",
    livesCount: 48,
    quality: "high",
    createdAt: "27 abr 2026",
    receivedAt: "2026-04-27T15:30:00-03:00",
    updatedAt: "2026-05-20T17:00:00-03:00",
    budget: "R$ 18k/mês",
    interest: "Plano empresarial com coparticipação",
    sourceCampaign: "Campanha PME conectada",
    sourceAdset: "Conjunto decisores Campinas",
    sourceAd: "Anuncio rede premium",
    metaLeadId: "demo-meta-lead-1042",
    metaFormId: "form_445566",
    metaPageId: "page_123456",
    metaCampaignId: "cmp_445566",
    metaAdsetId: "adset_112233",
    metaAdId: "ad_998877",
    metaConnectedAccountId: "demo-meta-connection",
    lastInteraction: "Solicitou comparação entre duas operadoras e pediu retorno no fim da tarde.",
    notes: "Lead em expansão, decisora direta e com urgência para fechar ainda este mês."
  },
  {
    id: "LE-1039",
    name: "Renato Carvalho",
    owner: "Beatriz",
    stage: "Qualificação",
    source: "CSV importado",
    phone: "(11) 97620-1039",
    email: "renato@rcengenharia.com.br",
    city: "Sao Paulo",
    companyName: "RC Engenharia",
    livesCount: 32,
    quality: "medium",
    createdAt: "26 abr 2026",
    receivedAt: "2026-04-26T10:00:00-03:00",
    updatedAt: "2026-05-11T09:15:00-03:00",
    budget: "R$ 6k/mês",
    interest: "Revisão de alternativas para o plano atual",
    lastInteraction: "Respondeu ao WhatsApp com faixa de vidas e pediu simulação objetiva sem odontológico.",
    notes: "Lead sensível a investimento. Vale abrir comparando faixa, rede e próximos passos."
  },
  {
    id: "LE-1031",
    name: "Paula Mendes",
    owner: "Gabriel",
    stage: "Proposta",
    source: "Cadastro manual",
    phone: "(13) 99110-1031",
    email: "paula@mendesstudio.com.br",
    city: "Santos",
    companyName: "Mendes Studio",
    livesCount: 11,
    quality: "medium",
    createdAt: "24 abr 2026",
    receivedAt: "2026-04-24T09:15:00-03:00",
    updatedAt: "2026-05-06T14:00:00-03:00",
    budget: "R$ 2.8k/mês",
    interest: "Primeiro plano empresarial para equipe pequena",
    lastInteraction: "Recebeu a proposta inicial e quer entender carência para novas vidas.",
    notes: "Precisa de orientação simples. Enviar resumo visual com coberturas e próximos passos."
  },
  {
    id: "LE-1028",
    name: "Fábio Lins",
    owner: "Fernanda",
    stage: "Negociação",
    source: "Meta Lead Form",
    phone: "(15) 98132-1028",
    email: "fabio@linslogistica.com.br",
    city: "Sorocaba",
    companyName: "Lins Logistica",
    livesCount: 126,
    quality: "high",
    createdAt: "23 abr 2026",
    receivedAt: "2026-04-23T16:00:00-03:00",
    updatedAt: "2026-05-18T11:20:00-03:00",
    budget: "R$ 42k/mês",
    interest: "Migração de contrato com maior rede hospitalar",
    sourceCampaign: "Campanha empresarial conectada",
    sourceAdset: "Conjunto empresas Sorocaba",
    sourceAd: "Anuncio migracao executiva",
    metaLeadId: "demo-meta-lead-1028",
    metaFormId: "form_778899",
    metaPageId: "page_789012",
    metaCampaignId: "cmp_778899",
    metaAdsetId: "adset_445566",
    metaAdId: "ad_221100",
    metaConnectedAccountId: "demo-meta-connection",
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
    color: "bg-signal text-ink dark:text-cloud",
    cards: [leads[2]]
  },
  {
    title: "Negociação",
    total: 5,
    color: "bg-ink text-cloud",
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
