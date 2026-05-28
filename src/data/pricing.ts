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

export type PricingCycle = "monthly" | "annual";
export type MarketingPlanSlug = "essencial" | "profissional" | "equipe";
export type ComparisonPlanSlug = MarketingPlanSlug | "operacao";
export type PricingComparisonValue = boolean | string;

export type MarketingPrice = {
  amount: string;
  suffix: string;
  note: string;
};

export type MarketingPricingPlan = {
  slug: MarketingPlanSlug;
  name: string;
  badge?: string;
  label: string;
  description: string;
  cta: string;
  href: string;
  highlight?: boolean;
  prices: Record<PricingCycle, MarketingPrice>;
  features: string[];
};

export type PricingComparisonCategory = {
  title: string;
  rows: Array<{
    label: string;
    values: Record<ComparisonPlanSlug, PricingComparisonValue>;
  }>;
};

export type PricingOperationCta = {
  slug: "operacao";
  name: string;
  price: string;
  label: string;
  description: string;
  cta: string;
  href: string;
  features: string[];
};

export type PricingAddon = {
  title: string;
  price: string;
};

function buildPreparedSignupPath(planSlug: string) {
  const searchParams = new URLSearchParams({
    mode: "signup",
    plan: planSlug,
  });

  return `/login?${searchParams.toString()}`;
}

// Checkout continues consuming this catalog directly.
export const pricingPlans: PricingPlan[] = [
  {
    slug: "essencial",
    name: "Essencial",
    label: "Para consultores individuais",
    description:
      "Organização comercial simples para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.",
    price: "R$ 59/mês",
    cta: "Contratar",
    href: buildPlanSignupPath("essencial"),
    highlight: false,
    features: [
      "CRM de leads",
      "Funil de oportunidades",
      "Histórico de atendimento",
      "Importação manual ou CSV",
      "Lembretes e calendário",
    ],
  },
  {
    slug: "profissional",
    name: "Profissional",
    label: "Para consultores que captam leads com frequência",
    description:
      "O plano principal para quem precisa criar campanhas, organizar leads e acompanhar oportunidades em um fluxo mais produtivo.",
    price: "R$ 99/mês",
    cta: "Contratar",
    href: buildPlanSignupPath("profissional"),
    highlight: true,
    features: [
      "Tudo do Essencial",
      "Integração Meta Lead Ads",
      "20 campanhas com IA por mês",
      "Validador de anúncio/compliance",
      "Biblioteca de campanhas",
      "Relatórios de origem dos leads",
    ],
  },
  {
    slug: "operacao",
    name: "Operação",
    label: "Para operações maiores",
    description:
      "Estrutura para equipes maiores que precisam de onboarding assistido, governança comercial e relatórios avançados.",
    price: "R$ 349/mês",
    cta: "Contratar",
    href: buildPlanSignupPath("operacao"),
    highlight: false,
    features: [
      "Até 8 usuários",
      "Múltiplas equipes",
      "Relatórios avançados",
      "Permissões por perfil",
      "Suporte prioritário",
      "Onboarding assistido",
    ],
  },
];

export const marketingPricingPlans: MarketingPricingPlan[] = [
  {
    slug: "essencial",
    name: "Essencial",
    label: "Para consultores individuais",
    description:
      "Organização comercial simples para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.",
    cta: "Contratar",
    href: buildPlanSignupPath("essencial"),
    prices: {
      monthly: {
        amount: "R$ 59",
        suffix: "/mês",
        note: "ou R$ 49/mês no plano anual",
      },
      annual: {
        amount: "R$ 49",
        suffix: "/mês",
        note: "cobrado com desconto no plano anual",
      },
    },
    features: [
      "CRM de leads",
      "Funil de oportunidades",
      "Histórico de atendimento",
      "Importação manual ou CSV",
      "Lembretes e calendário",
      "5 campanhas com IA por mês",
      "20 mensagens com IA por mês",
    ],
  },
  {
    slug: "profissional",
    name: "Profissional",
    badge: "Mais escolhido",
    label: "Para consultores que captam leads com frequência",
    description:
      "O plano principal para quem precisa criar campanhas, organizar leads e acompanhar oportunidades em um fluxo mais produtivo.",
    cta: "Contratar",
    href: buildPlanSignupPath("profissional"),
    highlight: true,
    prices: {
      monthly: {
        amount: "R$ 99",
        suffix: "/mês",
        note: "ou R$ 79/mês no plano anual",
      },
      annual: {
        amount: "R$ 79",
        suffix: "/mês",
        note: "cobrado com desconto no plano anual",
      },
    },
    features: [
      "Tudo do Essencial",
      "Integração Meta Lead Ads",
      "20 campanhas com IA por mês",
      "Validador de anúncio/compliance",
      "Biblioteca de campanhas",
      "Relatórios de origem dos leads",
      "Mensagens com IA ampliadas",
    ],
  },
  {
    slug: "equipe",
    name: "Equipe",
    label: "Para pequenas equipes comerciais",
    description:
      "Estrutura para distribuir leads, acompanhar responsáveis e organizar a rotina comercial da equipe.",
    cta: "Contratar",
    href: buildPreparedSignupPath("equipe"),
    prices: {
      monthly: {
        amount: "R$ 189",
        suffix: "/mês",
        note: "ou R$ 149/mês no plano anual",
      },
      annual: {
        amount: "R$ 149",
        suffix: "/mês",
        note: "cobrado com desconto no plano anual",
      },
    },
    features: [
      "Tudo do Profissional",
      "Até 3 usuários",
      "Distribuição de leads",
      "Painel de equipe",
      "Relatórios por responsável",
      "Funis compartilhados",
      "Usuário extra por R$ 39/mês",
    ],
  },
];

export const pricingComparisonCategories: PricingComparisonCategory[] = [
  {
    title: "CRM e Organização",
    rows: [
      {
        label: "CRM de leads",
        values: { essencial: true, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Funil de oportunidades",
        values: { essencial: true, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Histórico de atendimento",
        values: { essencial: true, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Lembretes e calendário",
        values: { essencial: true, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Importação manual/CSV",
        values: { essencial: true, profissional: true, equipe: true, operacao: true },
      },
    ],
  },
  {
    title: "IA",
    rows: [
      {
        label: "Campanhas com IA",
        values: {
          essencial: "5/mês",
          profissional: "20/mês",
          equipe: "50/mês",
          operacao: "150/mês",
        },
      },
      {
        label: "Mensagens com IA",
        values: {
          essencial: "20/mês",
          profissional: "100/mês",
          equipe: "300/mês",
          operacao: "1.000/mês",
        },
      },
      {
        label: "Biblioteca de campanhas",
        values: {
          essencial: "Básica",
          profissional: true,
          equipe: true,
          operacao: true,
        },
      },
      {
        label: "Validador de anúncio/compliance",
        values: { essencial: false, profissional: true, equipe: true, operacao: true },
      },
    ],
  },
  {
    title: "Meta e Leads",
    rows: [
      {
        label: "Integração Meta Lead Ads",
        values: { essencial: false, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Importação automática de leads",
        values: { essencial: false, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Relatório de origem dos leads",
        values: { essencial: false, profissional: true, equipe: true, operacao: true },
      },
      {
        label: "Custo por lead",
        values: {
          essencial: false,
          profissional: true,
          equipe: true,
          operacao: "Avançado",
        },
      },
    ],
  },
  {
    title: "Equipe",
    rows: [
      {
        label: "Usuários inclusos",
        values: { essencial: "1", profissional: "1", equipe: "3", operacao: "8" },
      },
      {
        label: "Usuário extra",
        values: {
          essencial: "Não disponível",
          profissional: "R$ 39/mês",
          equipe: "R$ 39/mês",
          operacao: "R$ 39/mês",
        },
      },
      {
        label: "Distribuição de leads",
        values: { essencial: false, profissional: false, equipe: true, operacao: true },
      },
      {
        label: "Painel por responsável",
        values: { essencial: false, profissional: false, equipe: true, operacao: true },
      },
      {
        label: "Permissões por perfil",
        values: {
          essencial: false,
          profissional: false,
          equipe: "Básico",
          operacao: "Avançado",
        },
      },
    ],
  },
  {
    title: "Suporte",
    rows: [
      {
        label: "Suporte",
        values: {
          essencial: "Padrão",
          profissional: "Padrão",
          equipe: "Prioritário",
          operacao: "Prioritário",
        },
      },
      {
        label: "Onboarding assistido",
        values: {
          essencial: false,
          profissional: "Opcional",
          equipe: "Opcional",
          operacao: true,
        },
      },
      {
        label: "Setup assistido",
        values: {
          essencial: "Opcional",
          profissional: "Opcional",
          equipe: "Opcional",
          operacao: "Incluso",
        },
      },
    ],
  },
];

export const pricingOperationPlan: PricingOperationCta = {
  slug: "operacao",
  name: "Operação",
  price: "Sob consulta",
  label: "Para operações maiores",
  description:
    "Fale com a equipe para planos com múltiplas equipes, onboarding assistido e volume maior de campanhas.",
  cta: "Falar com a equipe",
  href: buildPreparedSignupPath("operacao"),
  features: [
    "Até 8 usuários",
    "Múltiplas equipes",
    "Relatórios avançados",
    "Permissões por perfil",
    "Suporte prioritário",
    "Onboarding assistido",
    "Usuário extra por R$ 39/mês",
  ],
};

export const pricingAddons: PricingAddon[] = [
  { title: "Pacote extra de 30 campanhas com IA", price: "R$ 29" },
  { title: "Pacote extra de 100 mensagens com IA", price: "R$ 19" },
  { title: "Setup assistido Meta/CRM", price: "R$ 197 uma vez" },
  { title: "Configuração assistida de campanha", price: "a partir de R$ 97" },
  { title: "Design para anúncio", price: "sob orçamento" },
  { title: "Vídeo curto para anúncio", price: "sob orçamento" },
];

export const pricingNotice =
  "O investimento em anúncios na Meta não está incluso nos planos. A verba de mídia é paga diretamente pelo cliente à Meta.";

export const founderOffer: FounderOffer = {
  eyebrow: "Plano Fundador",
  title: "Entre como cliente fundador",
  price: "R$ 297/mês por 90 dias",
  description:
    "Para os primeiros clientes que querem testar a plataforma com acompanhamento próximo, implantação gratuita e prioridade nas melhorias iniciais.",
  details: [
    "Oferta limitada para clientes piloto",
    "Sem taxa de implantação durante o período fundador",
    "Após os 90 dias, a conta migra para um dos planos oficiais",
  ],
  cta: "Quero entrar como fundador",
  href: "/login",
};

export const aiCreditsInfo = {
  title: "Como funcionam os créditos de IA?",
  description:
    "Os recursos de Inteligência Artificial (Mensagens e Campanhas) utilizam um sistema de créditos. Cada plano inclui uma franquia mensal de créditos para sua operação.",
  details:
    "Caso você precise de um volume maior de processamento, é possível adquirir pacotes de créditos adicionais diretamente no painel a qualquer momento.",
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
