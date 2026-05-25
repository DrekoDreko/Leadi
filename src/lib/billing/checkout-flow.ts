const PLAN_SLUGS = ["essencial", "profissional", "operacao"] as const;

export type PublicPlanSlug = (typeof PLAN_SLUGS)[number];

export function isPublicPlanSlug(value: string): value is PublicPlanSlug {
  return PLAN_SLUGS.includes(value as PublicPlanSlug);
}

export function buildPlanCheckoutPath(planSlug: PublicPlanSlug) {
  return `/checkout?plan=${encodeURIComponent(planSlug)}`;
}

export function buildPlanSignupPath(planSlug: PublicPlanSlug) {
  const searchParams = new URLSearchParams({
    mode: "signup",
    next: buildPlanCheckoutPath(planSlug)
  });

  return `/login?${searchParams.toString()}`;
}
