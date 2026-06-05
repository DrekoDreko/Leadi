export type BillingProductKey =
  | "solo_plan"
  | "team_plan"
  | "operation_plan"
  | "credit_pack_100"
  | "credit_pack_300"
  | "credit_pack_1000";

export type BillingFeatureKey = "campaign" | "campaign_questions" | "whatsapp_message";

export type BillingProduct = {
  key: BillingProductKey;
  label: string;
  description: string;
  kind: "plan" | "pack";
  credits: number;
  amountCents: number;
  badge?: string;
  featured?: boolean;
};

export const BILLING_PRODUCTS: Record<BillingProductKey, BillingProduct> = {
  solo_plan: {
    key: "solo_plan",
    label: "Plano Essencial",
    description: "Para consultores individuais que precisam organizar leads, oportunidades e atendimento.",
    kind: "plan",
    credits: 25,
    amountCents: 5900,
    badge: "Plano inicial",
    featured: false
  },
  team_plan: {
    key: "team_plan",
    label: "Plano Profissional",
    description: "Para consultores que captam leads com frequência e precisam criar campanhas com mais produtividade.",
    kind: "plan",
    credits: 75,
    amountCents: 11900,
    badge: "Mais escolhido",
    featured: true
  },
  operation_plan: {
    key: "operation_plan",
    label: "Plano Equipe",
    description: "Para pequenas equipes comerciais que precisam distribuir leads e acompanhar responsáveis.",
    kind: "plan",
    credits: 150,
    amountCents: 24900,
    badge: "Para corretoras",
    featured: true
  },
  credit_pack_100: {
    key: "credit_pack_100",
    label: "Pacote 100 créditos",
    description: "Recarga pequena para testar campanhas, mensagens e ajustes de funil.",
    kind: "pack",
    credits: 100,
    amountCents: 3000,
    featured: false
  },
  credit_pack_300: {
    key: "credit_pack_300",
    label: "Pacote 300 créditos",
    description: "Boa opção para manter o time rodando sem interromper a operação.",
    kind: "pack",
    credits: 300,
    amountCents: 7000,
    featured: true
  },
  credit_pack_1000: {
    key: "credit_pack_1000",
    label: "Pacote 1000 créditos",
    description: "Volume maior para campanhas em escala e múltiplos consultores.",
    kind: "pack",
    credits: 1000,
    amountCents: 15000,
    featured: false
  }
};

export const BILLING_FEATURE_COSTS: Record<BillingFeatureKey, number> = {
  campaign: 25,
  campaign_questions: 4,
  whatsapp_message: 1
};

export const FEATURE_LABELS: Record<BillingFeatureKey, string> = {
  campaign: "Campanha IA",
  campaign_questions: "Perguntas de campanha",
  whatsapp_message: "Mensagem WhatsApp"
};

export const billingPlans = ["solo_plan", "team_plan", "operation_plan"] as const;
export const billingPacks = ["credit_pack_100", "credit_pack_300", "credit_pack_1000"] as const;

export function getBillingProduct(productKey: BillingProductKey) {
  return BILLING_PRODUCTS[productKey];
}

export function getProductPriceDisplay(product: BillingProduct) {
  return `R$ ${(product.amountCents / 100).toFixed(2).replace(".", ",")}`;
}
