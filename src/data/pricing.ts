import {
  type BillingCycle,
  type PublicPlanSlug
} from "@/lib/billing/checkout-flow";

export type PricingPlan = {
  slug: PublicPlanSlug;
  name: string;
  badge?: string;
  label: string;
  description: string;
  highlight?: boolean;
  cta: string;
  includedCredits: number;
  includedUsers: number;
  extraUserPriceCents?: number;
  prices: Record<BillingCycle, PricingPlanPrice>;
  features: string[];
  isTeam?: boolean;
  detailsUrl?: string;
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

export type PricingCycle = BillingCycle;
export type MarketingPlanSlug = "essencial" | "profissional" | "equipe";
export type ComparisonPlanSlug = MarketingPlanSlug;
export type PricingComparisonValue = boolean | string;

export type PricingPlanPrice = {
  amount: string;
  suffix: string;
  note: string;
  checkoutAmountCents: number;
  available: boolean;
  unavailableMessage?: string;
};

export type MarketingPricingPlan = PricingPlan;

export type PricingComparisonCategory = {
  title: string;
  rows: Array<{
    label: string;
    values: Record<ComparisonPlanSlug, PricingComparisonValue>;
  }>;
};

export type PricingAddon = {
  title: string;
  price: string;
  description: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    slug: "essencial",
    name: "Essencial",
    label: "Para consultores individuais",
    badge: undefined,
    description:
      "Organização comercial simples para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.",
    cta: "Contratar",
    highlight: false,
    includedCredits: 0,
    includedUsers: 1,
    prices: {
      monthly: {
        amount: "R$ 59",
        suffix: "/mês",
        note: "ou R$ 49/mês no plano anual",
        checkoutAmountCents: 5900,
        available: true
      },
      annual: {
        amount: "R$ 49",
        suffix: "/mês",
        note: "Cobrança anual será liberada assim que o plano anual estiver disponível no checkout.",
        checkoutAmountCents: 4900,
        available: false,
        unavailableMessage:
          "O plano anual do Essencial ainda não está disponível no checkout. Escolha o mensal por enquanto."
      }
    },
    features: [
      "CRM de leads",
      "Funil de oportunidades",
      "Histórico de atendimento",
      "Importação manual ou CSV",
      "Lembretes e calendário",
      "Organização comercial sem recursos de IA"
    ]
  },
  {
    slug: "profissional",
    name: "Profissional",
    badge: "Mais escolhido",
    label: "Para consultores que captam leads com frequência",
    description:
      "O plano principal para quem precisa criar campanhas, organizar leads e acompanhar oportunidades em um fluxo mais produtivo.",
    cta: "Contratar",
    highlight: true,
    includedCredits: 75,
    includedUsers: 1,
    prices: {
      monthly: {
        amount: "R$ 119",
        suffix: "/mês",
        note: "ou R$ 89/mês no plano anual",
        checkoutAmountCents: 11900,
        available: true
      },
      annual: {
        amount: "R$ 89",
        suffix: "/mês",
        note: "Cobrança anual será liberada assim que o plano anual estiver disponível no checkout.",
        checkoutAmountCents: 8900,
        available: false,
        unavailableMessage:
          "O plano anual do Profissional ainda não está disponível no checkout. Escolha o mensal por enquanto."
      }
    },
    features: [
      "Tudo do Essencial",
      "Integração Meta Lead Ads",
      "75 créditos de IA por mês",
      "Campanhas completas com IA",
      "Validador de anúncio/compliance",
      "Biblioteca de campanhas",
      "Relatórios de origem dos leads",
      "Mensagens com IA ampliadas"
    ]
  },
  {
    slug: "equipe",
    name: "Equipe",
    label: "Para pequenas equipes comerciais",
    description:
      "Estrutura para distribuir leads, acompanhar responsáveis e organizar a rotina comercial da equipe.",
    cta: "Conhecer Plano Equipe",
    highlight: false,
    isTeam: true,
    detailsUrl: "/pricing/equipe",
    badge: "Novo",
    includedCredits: 150,
    includedUsers: 3,
    extraUserPriceCents: 5900,
    prices: {
      monthly: {
        amount: "R$ 249",
        suffix: "/mês",
        note: "ou R$ 199/mês no plano anual",
        checkoutAmountCents: 24900,
        available: true
      },
      annual: {
        amount: "R$ 199",
        suffix: "/mês",
        note: "Cobrança anual será liberada assim que o plano anual estiver disponível no checkout.",
        checkoutAmountCents: 19900,
        available: false,
        unavailableMessage:
          "O plano anual do Equipe ainda não está disponível no checkout. Escolha o mensal por enquanto."
      }
    },
    features: [
      "Tudo do Profissional",
      "Até 3 usuários inclusos",
      "150 créditos de IA por mês",
      "Distribuição de leads",
      "Painel de equipe",
      "Relatórios por responsável",
      "Funis compartilhados",
      "A partir do 4º usuário: R$ 59/mês cada"
    ]
  }
];

export const marketingPricingPlans: MarketingPricingPlan[] = pricingPlans;

export const pricingComparisonCategories: PricingComparisonCategory[] = [
  {
    title: "CRM e Organização",
    rows: [
      {
        label: "CRM de leads",
        values: { essencial: true, profissional: true, equipe: true }
      },
      {
        label: "Funil de oportunidades",
        values: { essencial: true, profissional: true, equipe: true }
      },
      {
        label: "Histórico de atendimento",
        values: { essencial: true, profissional: true, equipe: true }
      },
      {
        label: "Importação manual/CSV",
        values: { essencial: true, profissional: true, equipe: true }
      },
      {
        label: "Lembretes e calendário",
        values: { essencial: true, profissional: true, equipe: true }
      }
    ]
  },
  {
    title: "IA e Campanhas",
    rows: [
      {
        label: "Créditos de IA inclusos",
        values: {
          essencial: "Não incluso",
          profissional: "75 créditos/mês",
          equipe: "150 créditos/mês"
        }
      },
      {
        label: "Mensagens com IA",
        values: { essencial: false, profissional: true, equipe: true }
      },
      {
        label: "Textos de anúncio com IA",
        values: { essencial: false, profissional: true, equipe: true }
      },
      {
        label: "Campanhas completas com IA",
        values: { essencial: false, profissional: true, equipe: true }
      },
      {
        label: "Validador de anúncio/compliance",
        values: { essencial: false, profissional: true, equipe: true }
      },
      {
        label: "Biblioteca de campanhas",
        values: { essencial: false, profissional: true, equipe: true }
      }
    ]
  },
  {
    title: "Meta e Equipe",
    rows: [
      {
        label: "Integração Meta Lead Ads",
        values: { essencial: false, profissional: true, equipe: true }
      },
      {
        label: "Relatórios de origem dos leads",
        values: { essencial: false, profissional: true, equipe: true }
      },
      {
        label: "Usuários inclusos",
        values: { essencial: "1", profissional: "1", equipe: "3" }
      },
      {
        label: "Usuário extra",
        values: {
          essencial: "Não disponível",
          profissional: "Não disponível",
          equipe: "R$ 59/mês"
        }
      },
      {
        label: "Distribuição de leads",
        values: { essencial: false, profissional: false, equipe: true }
      },
      {
        label: "Painel por responsável",
        values: { essencial: false, profissional: false, equipe: true }
      },
      {
        label: "Funis compartilhados",
        values: { essencial: false, profissional: false, equipe: true }
      }
    ]
  }
];

export const pricingAddons: PricingAddon[] = [
  {
    title: "100 créditos",
    price: "R$ 30,00",
    description: "Créditos extras para continuar usando a IA quando a franquia mensal acabar."
  },
  {
    title: "300 créditos",
    price: "R$ 70,00",
    description: "Boa opção para rotinas recorrentes com mensagens, textos e campanhas."
  },
  {
    title: "1000 créditos",
    price: "R$ 150,00",
    description: "Maior volume com melhor custo por crédito para uso adicional no mês."
  }
];

export const pricingNotice =
  "Os créditos inclusos são renovados a cada ciclo da assinatura e o sistema sempre consome primeiro a franquia do plano antes dos créditos extras comprados.";

export const aiCreditsInfo = {
  title: "Como funcionam os créditos de IA?",
  description:
    "Cada assinatura inclui uma pequena franquia mensal para testar a IA dentro do fluxo comercial.",
  details:
    "Se a sua operação precisar de mais volume, você compra créditos extras separadamente e eles entram como saldo adicional da organização."
};

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
  leadId?: string;
  cnpjType?: "MEI" | "PME" | "Adesão" | "Física";
  region: string;
  accommodation: HealthPlanAccommodation;
  coparticipation: HealthPlanCoparticipation;
  beneficiaries: BeneficiaryInput[];
  selectedOperators: string[];
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
  id: string;
  organizationId: string;
  leadId: string | null;
  createdBy: string;
  inputParameters: HealthPlanSimulatorInput;
  resultsPayload: HealthPlanSimulatorOutput;
  createdAt: string;
};
