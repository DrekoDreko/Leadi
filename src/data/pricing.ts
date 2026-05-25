import { buildPlanSignupPath, type PublicPlanSlug } from "@/lib/billing/checkout-flow";

export type PricingPlan = {
  slug: PublicPlanSlug;
  name: string;
  label: string;
  description: string;
  price: string;
  implantation?: string;
  cta: string;
  href: string;
  highlight?: boolean;
  features: string[];
};

export type FounderOffer = {
  eyebrow: string;
  title: string;
  price: string;
  description: string;
  details: string[];
  cta: string;
  href: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    slug: "essencial",
    name: "Essencial",
    label: "Para corretores individuais",
    description: "Organização comercial básica para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.",
    price: "R$ 297/mês",
    implantation: "Implantação: R$ 297",
    cta: "Contratar",
    href: buildPlanSignupPath("essencial"),
    highlight: false,
    features: [
      "CRM de leads",
      "Funil de oportunidades",
      "Mensagens com IA",
      "Importação de leads",
      "Histórico de atendimento"
    ]
  },
  {
    slug: "profissional",
    name: "Profissional",
    label: "Para pequenas equipes",
    description: "O plano principal para equipes que precisam conectar captação, campanhas e distribuição em um fluxo único.",
    price: "R$ 797/mês",
    implantation: "Implantação: R$ 997",
    cta: "Contratar",
    href: buildPlanSignupPath("profissional"),
    highlight: true,
    features: [
      "Tudo do plano Inicial",
      "Integração Meta Lead Ads",
      "Campanhas com IA",
      "Distribuição de leads",
      "Painel de métricas",
      "Checklist de compliance"
    ]
  },
  {
    slug: "operacao",
    name: "Operação",
    label: "Para corretoras com equipe comercial",
    description: "Estrutura para operações com múltiplas equipes, gestão de propostas e mais acompanhamento da rotina comercial.",
    price: "A partir de R$ 1.997/mês",
    implantation: "Implantação: sob análise, a partir de R$ 2.500",
    cta: "Contratar",
    href: buildPlanSignupPath("operacao"),
    highlight: false,
    features: [
      "Tudo do plano Profissional",
      "Múltiplas equipes",
      "Gestão de propostas",
      "Agenda e lembretes",
      "Prioridade de suporte",
      "Onboarding assistido"
    ]
  }
];

export const founderOffer: FounderOffer = {
  eyebrow: "Plano Fundador",
  title: "Entre como cliente fundador",
  price: "R$ 297/mês por 90 dias",
  description:
    "Para os primeiros clientes que querem testar a plataforma com acompanhamento próximo, implantação gratuita e prioridade nas melhorias iniciais.",
  details: [
    "Oferta limitada para clientes piloto",
    "Sem taxa de implantação durante o período fundador",
    "Após os 90 dias, a conta migra para um dos planos oficiais"
  ],
  cta: "Quero entrar como fundador",
  href: "/login"
};

export const pricingNotice =
  "A mensalidade não inclui verba de anúncios, criação de artes, vídeos ou gestão de tráfego. Esses serviços podem ser contratados separadamente.";

export const aiCreditsInfo = {
  title: "Como funcionam os créditos de IA?",
  description: "Os recursos de Inteligência Artificial (Mensagens e Campanhas) utilizam um sistema de créditos. Cada plano inclui uma franquia mensal de créditos para sua operação.",
  details: "Caso você precise de um volume maior de processamento, é possível adquirir pacotes de créditos adicionais diretamente no painel a qualquer momento."
};

/**
 * ==========================================
 * TIPOS E ESTRUTURAS DO SIMULADOR DE PLANOS DE SAÚDE
 * (Funcionalidade Futura para Corretores - TASK-074)
 * ==========================================
 */

export type HealthPlanAccommodation = "Enfermaria" | "Apartamento";
export type HealthPlanCoparticipation = "Com Coparticipação" | "Sem Coparticipação";

export type BeneficiaryRange =
  | "0-18"
  | "19-23"
  | "24-28"
  | "29-33"
  | "34-38"
  | "39-43"
  | "44-48"
  | "49-53"
  | "54-58"
  | "59+";

export type BeneficiaryInput = {
  range: BeneficiaryRange;
  count: number;
};

export type HealthPlanSimulatorInput = {
  organizationId: string;
  leadId?: string; // Opcional, associado a um lead existente no CRM
  cnpjType?: "MEI" | "PME" | "Adesão" | "Física"; // Mínimo de vidas varia por operadora
  region: string; // Ex: São Paulo - Capital, Rio de Janeiro - Baixada Fluminense, etc.
  accommodation: HealthPlanAccommodation;
  coparticipation: HealthPlanCoparticipation;
  beneficiaries: BeneficiaryInput[];
  selectedOperators: string[]; // Ex: ["Amil", "Bradesco", "NotreDame Intermédica"]
};

export type OperatorQuote = {
  operatorName: string;
  planName: string;
  pricePerRange: { [key in BeneficiaryRange]?: number };
  totalPrice: number;
  accommodation: HealthPlanAccommodation;
  coparticipation: HealthPlanCoparticipation;
  hasCnpjDiscount: boolean;
};

export type HealthPlanSimulatorOutput = {
  simulatorInput: HealthPlanSimulatorInput;
  createdAt: string;
  quotes: OperatorQuote[];
  cheapestOption?: OperatorQuote;
  bestValueOption?: OperatorQuote;
};

export type HealthPlanSimulationRow = {
  id: string; // UUID Primary Key
  organizationId: string; // UUID Foreign Key (multi-tenant isolation)
  leadId: string | null; // UUID Foreign Key to CRM Leads (optional)
  createdBy: string; // UUID Foreign Key to Profiles (auditing)
  inputParameters: HealthPlanSimulatorInput; // JSONB mapping in Postgres
  resultsPayload: HealthPlanSimulatorOutput; // JSONB mapping in Postgres
  createdAt: string; // DateTime ISO
};
