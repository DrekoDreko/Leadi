import { reviewTextLocally, type LocalComplianceReview } from "@/lib/openai/compliance-guardrails";

export type CampaignAdCopy = {
  primaryText?: string | null;
  headline?: string | null;
  description?: string | null;
  callToAction?: string | null;
};

/**
 * Monta o texto do anúncio (copy principal + headline + descrição + CTA) em um
 * único bloco, usado tanto para exibição quanto para o gate de compliance.
 */
export function assembleCampaignAdCopy(copy: CampaignAdCopy): string {
  return [copy.primaryText, copy.headline, copy.description, copy.callToAction]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0)
    .join("\n");
}

/**
 * Roda os guardrails locais (sem custo de créditos) sobre a copy montada da campanha.
 * Fonte única do gate de compliance pré-publicação no Meta.
 */
export function reviewCampaignCopyLocally(copy: CampaignAdCopy): LocalComplianceReview {
  return reviewTextLocally(assembleCampaignAdCopy(copy));
}

/**
 * Risco alto bloqueia a publicação no Meta (plano de saúde é categoria sensível).
 */
export function isCampaignCopyBlocked(review: LocalComplianceReview): boolean {
  return review.riskLevel === "high";
}
