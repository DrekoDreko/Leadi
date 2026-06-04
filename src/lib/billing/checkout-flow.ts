const PLAN_SLUGS = ["essencial", "profissional", "equipe"] as const;
const BILLING_CYCLES = ["monthly", "annual"] as const;

export type PublicPlanSlug = (typeof PLAN_SLUGS)[number];
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export function isPublicPlanSlug(value: string): value is PublicPlanSlug {
  return PLAN_SLUGS.includes(value as PublicPlanSlug);
}

export function isBillingCycle(value: string): value is BillingCycle {
  return BILLING_CYCLES.includes(value as BillingCycle);
}

export function buildPlanCheckoutPath(planSlug: PublicPlanSlug, cycle: BillingCycle = "monthly") {
  const searchParams = new URLSearchParams({
    plan: planSlug,
    cycle
  });

  return `/checkout?${searchParams.toString()}`;
}

export function buildPlanSignupPath(
  planSlug: PublicPlanSlug,
  cycle: BillingCycle = "monthly"
) {
  const searchParams = new URLSearchParams({
    mode: "signup",
    next: buildPlanCheckoutPath(planSlug, cycle)
  });

  return `/login?${searchParams.toString()}`;
}
