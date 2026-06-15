export const AI_CREDIT_COSTS = {
  generate_whatsapp_message: 1,
  generate_ad_copy: 5,
  generate_campaign_questions: 4,
  generate_creative_brief: 4,
  generate_campaign_plan: 25,
  generate_compliance_review: 10,
  generate_ad_image: 30,
  generate_ad_image_set: 50
} as const;

export type AiFeatureKey = keyof typeof AI_CREDIT_COSTS;

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  generate_whatsapp_message: "Mensagem com IA",
  generate_ad_copy: "Texto de anúncio",
  generate_campaign_questions: "Perguntas de campanha",
  generate_creative_brief: "Briefing criativo",
  generate_campaign_plan: "Campanha completa",
  generate_compliance_review: "Análise de compliance",
  generate_ad_image: "Imagem de anúncio",
  generate_ad_image_set: "Par de imagens (Feed + Vertical)"
};

export const AI_PUBLIC_CONSUMPTION_ITEMS = [
  {
    feature: "generate_whatsapp_message",
    label: "Mensagem com IA",
    credits: AI_CREDIT_COSTS.generate_whatsapp_message
  },
  {
    feature: "generate_ad_image_set",
    label: "Imagem de anúncio",
    credits: AI_CREDIT_COSTS.generate_ad_image_set
  }
] as const;

export function getAiCreditCost(feature: AiFeatureKey) {
  return AI_CREDIT_COSTS[feature];
}

export function formatAiCreditsLabel(credits: number) {
  return `${credits} crédito${credits === 1 ? "" : "s"}`;
}
