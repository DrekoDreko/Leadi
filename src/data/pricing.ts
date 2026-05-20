export type PricingPlan = {
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
    name: "Essencial",
    label: "Para corretores individuais",
    description: "Organização comercial básica para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.",
    price: "R$ 297/mês",
    implantation: "Implantação: R$ 297",
    cta: "Falar com a equipe",
    href: "/login",
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
    name: "Profissional",
    label: "Para pequenas equipes",
    description: "O plano principal para equipes que precisam conectar captação, campanhas e distribuição em um fluxo único.",
    price: "R$ 797/mês",
    implantation: "Implantação: R$ 997",
    cta: "Falar com a equipe",
    href: "/login",
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
    name: "Operação",
    label: "Para corretoras com equipe comercial",
    description: "Estrutura para operações com múltiplas equipes, gestão de propostas e mais acompanhamento da rotina comercial.",
    price: "A partir de R$ 1.997/mês",
    implantation: "Implantação: sob análise, a partir de R$ 2.500",
    cta: "Falar com a equipe",
    href: "/login",
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
