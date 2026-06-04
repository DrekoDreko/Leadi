export type AiCreditPackageSlug = "essencial" | "campanhas" | "criativos";

export type AiCreditPackageDefinition = {
  slug: AiCreditPackageSlug;
  name: string;
  credits: number;
  priceCents: number;
  currency: "BRL";
  description: string;
  approximateUses: string[];
  badge?: string;
  featured: boolean;
  isActive: boolean;
};

export type AiCreditPackagePresentation = {
  slug: AiCreditPackageSlug;
  name: string;
  description: string;
  approximateUses: string[];
  badge?: string;
  featuredSupportText?: string;
  costPerCreditLabel: string;
  purchaseNote: string;
};

export const DEFAULT_AI_CREDIT_PACKAGES: readonly AiCreditPackageDefinition[] = [
  {
    slug: "essencial",
    name: "100 créditos",
    credits: 100,
    priceCents: 3000,
    currency: "BRL",
    description: "Recarga enxuta para continuar usando a IA no dia a dia.",
    approximateUses: [
      "Uso adicional quando os créditos inclusos do plano terminarem.",
      "Liberação automática para a organização após a confirmação do pagamento."
    ],
    featured: false,
    isActive: true
  },
  {
    slug: "campanhas",
    name: "300 créditos",
    credits: 300,
    priceCents: 7000,
    currency: "BRL",
    description: "Mais volume com custo por crédito melhor para uso recorrente.",
    approximateUses: [
      "Boa faixa para times que usam IA com frequência na rotina.",
      "Funciona como saldo extra além da franquia mensal da assinatura."
    ],
    featured: false,
    isActive: true
  },
  {
    slug: "criativos",
    name: "1000 créditos",
    credits: 1000,
    priceCents: 15000,
    currency: "BRL",
    description: "Maior volume com o menor custo por crédito da vitrine.",
    approximateUses: [
      "Pensado para equipes com uso intenso de IA no workspace.",
      "Melhor custo por crédito entre os pacotes disponíveis."
    ],
    badge: "Melhor valor",
    featured: true,
    isActive: true
  }
] as const;

export function isAiCreditPackageSlug(value: string): value is AiCreditPackageSlug {
  return DEFAULT_AI_CREDIT_PACKAGES.some((pkg) => pkg.slug === value);
}

export function getDefaultAiCreditPackage(slug: AiCreditPackageSlug) {
  return DEFAULT_AI_CREDIT_PACKAGES.find((pkg) => pkg.slug === slug) ?? null;
}

export function buildAiCreditsCheckoutPath(slug: AiCreditPackageSlug) {
  return `/checkout?mode=ai_credits&package=${encodeURIComponent(slug)}`;
}

export function formatAiCreditPackagePrice(priceCents: number) {
  return `R$ ${(priceCents / 100).toFixed(2).replace(".", ",")}`;
}

export function formatAiCreditPackageCostPerCredit(priceCents: number, credits: number) {
  if (credits <= 0) {
    return "R$ 0,000/crédito";
  }

  const costPerCredit = priceCents / 100 / credits;

  return `R$ ${costPerCredit.toFixed(3).replace(".", ",")}/crédito`;
}

export function getAiCreditPackagePresentation(
  pkg: Pick<AiCreditPackageDefinition, "slug" | "priceCents" | "credits"> & Partial<AiCreditPackageDefinition>
): AiCreditPackagePresentation {
  const normalizedApproximateUses =
    pkg.approximateUses?.filter((value): value is string => typeof value === "string" && value.trim().length > 0) ?? [];

  return {
    slug: pkg.slug,
    name: pkg.name?.trim() || `${pkg.credits} créditos`,
    description: pkg.description?.trim() || "Pacote de créditos para uso no workspace.",
    approximateUses:
      normalizedApproximateUses.length > 0
        ? normalizedApproximateUses
        : [
            "Créditos compartilhados pela organização.",
            "Liberação automática após a confirmação do pagamento."
          ],
    badge: pkg.badge,
    featuredSupportText: undefined,
    purchaseNote:
      "Os créditos extras entram no saldo da organização após a confirmação do pagamento.",
    costPerCreditLabel: formatAiCreditPackageCostPerCredit(pkg.priceCents, pkg.credits)
  };
}
