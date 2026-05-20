export const AI_CREDIT_COSTS = {
  generate_whatsapp_message: 1,
  generate_ad_copy: 3,
  generate_campaign_plan: 5,
  generate_compliance_review: 2,
  generate_creative_brief: 4,
  generate_image_prompt: 3
} as const;

export type AiFeatureKey = keyof typeof AI_CREDIT_COSTS;

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  generate_whatsapp_message: "Mensagens de WhatsApp",
  generate_ad_copy: "Copy de anúncio",
  generate_campaign_plan: "Plano de campanha",
  generate_compliance_review: "Revisão de compliance",
  generate_creative_brief: "Briefing criativo",
  generate_image_prompt: "Prompt de imagem"
};

export function getAiCreditCost(feature: AiFeatureKey) {
  return AI_CREDIT_COSTS[feature];
}

