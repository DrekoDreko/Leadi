import { isPublicPlanSlug, type PublicPlanSlug } from "@/lib/billing/checkout-flow";

/**
 * Fonte da verdade das permissoes e limites por plano publico.
 *
 * Este mapa e usado tanto pelo gate de billing (subscription-limits) quanto pela
 * navegacao/guards do dashboard. Ele vale MESMO com BILLING_DISABLED, porque o
 * plano escolhido fica salvo em `organizations.plan_type` e dirige o que cada
 * conta pode fazer independentemente de existir uma assinatura cobrada.
 */

export type PlanPermissionLimits = {
  leads: number | null;
  users: number | null;
  campaigns: number | null;
};

export type PlanPermissionFeatures = {
  /** Qualquer recurso de IA (campanhas, imagens, mensagens, textos, compliance). */
  ai: boolean;
  /** Pedidos de criativo para a equipe interna. */
  creativeRequests: boolean;
  /** Convidar supervisores/consultores (workspace de equipe). */
  teamInvites: boolean;
  /** Integracao com Meta Lead Ads. */
  metaIntegration: boolean;
  /** Distribuir leads entre supervisores/consultores. */
  leadDistribution: boolean;
};

export type PlanPermissions = {
  limits: PlanPermissionLimits;
  features: PlanPermissionFeatures;
  includedCredits: number;
};

export const PLAN_PERMISSIONS: Record<PublicPlanSlug, PlanPermissions> = {
  essencial: {
    limits: { leads: 1500, users: 1, campaigns: 40 },
    features: {
      ai: false,
      creativeRequests: false,
      teamInvites: false,
      metaIntegration: false,
      leadDistribution: false
    },
    includedCredits: 0
  },
  profissional: {
    limits: { leads: 5000, users: 1, campaigns: 180 },
    features: {
      ai: true,
      creativeRequests: false,
      teamInvites: false,
      metaIntegration: true,
      leadDistribution: false
    },
    includedCredits: 75
  },
  equipe: {
    // users: null = sem teto rigido. O plano inclui 3 usuarios gratuitos (alem do
    // gestor/dono) e cobra R$ 59/mes por usuario a partir do 4o; a distincao
    // gratis/pago e aplicada no fluxo de convites, nao por um limite que bloqueia.
    limits: { leads: 10000, users: null, campaigns: 180 },
    features: {
      ai: true,
      creativeRequests: false,
      teamInvites: true,
      metaIntegration: true,
      leadDistribution: true
    },
    includedCredits: 150
  }
};

/**
 * Fallback usado quando a conta ainda nao tem `plan_type` definido (ex.: contas
 * antigas ou ambiente de dev). Mantemos a IA liberada para nao quebrar contas
 * pre-existentes; apenas o plano Essencial explicito bloqueia a IA.
 */
export const DEFAULT_PLAN_PERMISSIONS: PlanPermissions = {
  limits: { leads: 1000, users: 1, campaigns: 30 },
  features: {
    ai: true,
    creativeRequests: false,
    teamInvites: false,
    metaIntegration: true,
    leadDistribution: false
  },
  includedCredits: 0
};

export function getPlanPermissions(planCode: string | null | undefined): PlanPermissions {
  if (planCode && isPublicPlanSlug(planCode)) {
    return PLAN_PERMISSIONS[planCode];
  }

  return DEFAULT_PLAN_PERMISSIONS;
}

export function planAllowsAi(planCode: string | null | undefined): boolean {
  return getPlanPermissions(planCode).features.ai;
}

export function planAllowsTeamInvites(planCode: string | null | undefined): boolean {
  return getPlanPermissions(planCode).features.teamInvites;
}
