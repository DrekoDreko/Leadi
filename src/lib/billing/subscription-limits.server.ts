import { createBillingAdminClient } from "@/lib/billing/admin";
import { isBillingConfigured } from "@/lib/billing/config";
import type { Database, Json } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export type BillingGuardResource =
  | "lead_creation"
  | "team_invites"
  | "campaign_generation"
  | "campaign_questions"
  | "whatsapp_generation"
  | "creative_requests";

export type ResourceAccessSummary = {
  resource: BillingGuardResource;
  allowed: boolean;
  reason:
    | "allowed"
    | "billing_not_configured"
    | "no_subscription"
    | "inactive_subscription"
    | "feature_unavailable"
    | "limit_reached";
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
  limit: number | null;
  used: number | null;
};

export type SubscriptionNotice = {
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
};

type PlanLimits = {
  leads: number | null;
  users: number | null;
  campaigns: number | null;
};

type PlanFeatures = {
  ai: boolean;
  creativeRequests: boolean;
  teamInvites: boolean;
};

type UsageSnapshot = {
  leads: number;
  users: number;
  campaigns: number;
};

type OrganizationBillingState = {
  billingMode: "configured" | "not-configured";
  plan: PlanRow | null;
  subscription: SubscriptionRow | null;
  hasValidSubscription: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
  usage: UsageSnapshot;
};

const VALID_SUBSCRIPTION_STATUSES = new Set<SubscriptionRow["status"]>(["trialing", "active"]);
const DEFAULT_ACTION_HREF = "/dashboard/perfil/creditos";

const DEFAULT_PLAN_LIMITS: Record<
  string,
  {
    limits: PlanLimits;
    features: PlanFeatures;
  }
> = {
  default: {
    limits: {
      leads: 1000,
      users: 1,
      campaigns: 30
    },
    features: {
      ai: true,
      creativeRequests: false,
      teamInvites: false
    }
  },
  equipe: {
    limits: {
      leads: 10000,
      users: 3,
      campaigns: 180
    },
    features: {
      ai: true,
      creativeRequests: false,
      teamInvites: true
    }
  },
  essencial: {
    limits: {
      leads: 1500,
      users: 1,
      campaigns: 40
    },
    features: {
      ai: true,
      creativeRequests: false,
      teamInvites: false
    }
  },
  profissional: {
    limits: {
      leads: 5000,
      users: 1,
      campaigns: 180
    },
    features: {
      ai: true,
      creativeRequests: false,
      teamInvites: false
    }
  }
};

export class BillingResourceAccessError extends Error {
  access: ResourceAccessSummary;
  status: number;

  constructor(access: ResourceAccessSummary, status = 402) {
    super(access.message);
    this.name = "BillingResourceAccessError";
    this.access = access;
    this.status = status;
  }
}

export async function getCurrentSubscriptionNotice(): Promise<SubscriptionNotice | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    return null;
  }

  return getOrganizationSubscriptionNotice(organizationId);
}

export async function getOrganizationSubscriptionNotice(
  organizationId: string
): Promise<SubscriptionNotice | null> {
  const state = await getOrganizationBillingState(organizationId);

  if (state.billingMode !== "configured" || state.hasValidSubscription) {
    return null;
  }

  if (!state.subscription || !state.plan) {
    return {
      title: "Sua assinatura está pausada",
      message:
        "Nao encontramos uma assinatura ativa nesta organizacao. Abra o billing para escolher um plano e liberar leads, campanhas, convites e IA.",
      actionHref: DEFAULT_ACTION_HREF,
      actionLabel: "Escolher plano"
    };
  }

  return {
    title: "Sua assinatura precisa de atenção",
    message: `A assinatura atual está ${getSubscriptionStatusLabel(
      state.subscription.status
    ).toLowerCase()}. Abra o billing para regularizar e liberar leads, campanhas, convites e IA.`,
    actionHref: DEFAULT_ACTION_HREF,
    actionLabel: "Abrir billing"
  };
}

export async function getCurrentResourceAccess(
  resource: BillingGuardResource
): Promise<ResourceAccessSummary> {
  if (!isSupabaseConfigured()) {
    return {
      resource,
      allowed: true,
      reason: "billing_not_configured",
      title: "Modo local liberado",
      message:
        "Supabase e billing não estão configurados neste ambiente. O recurso segue liberado para desenvolvimento local.",
      actionHref: DEFAULT_ACTION_HREF,
      actionLabel: "Ver billing",
      limit: null,
      used: null
    };
  }

  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    return buildDeniedAccess(resource, "inactive_subscription", {
      message: "Sua sessão expirou. Entre novamente para continuar.",
      title: "Sessão expirada"
    });
  }

  return getOrganizationResourceAccess(organizationId, resource);
}

export async function getOrganizationResourceAccess(
  organizationId: string,
  resource: BillingGuardResource
): Promise<ResourceAccessSummary> {
  const state = await getOrganizationBillingState(organizationId);

  if (state.billingMode !== "configured") {
    return {
      resource,
      allowed: true,
      reason: "billing_not_configured",
      title: "Billing local em modo amigável",
      message:
        "Billing não está configurado neste ambiente. Os recursos seguem liberados para desenvolvimento local.",
      actionHref: DEFAULT_ACTION_HREF,
      actionLabel: "Ver billing",
      limit: null,
      used: null
    };
  }

  if (!state.hasValidSubscription) {
    return buildSubscriptionBlockedAccess(resource, state.subscription);
  }

  if (resource === "creative_requests" && !state.features.creativeRequests) {
    return buildDeniedAccess(resource, "feature_unavailable", {
      title: "Seu plano ainda não inclui pedidos criativos",
      message:
        "Pedidos de criativo não fazem parte dos planos públicos atuais. Fale com a equipe se precisar desse fluxo.",
      limit: null,
      used: null
    });
  }

  if (resource === "team_invites" && !state.features.teamInvites) {
    return buildDeniedAccess(resource, "feature_unavailable", {
      title: "Seu plano atual não libera equipe",
      message:
        "Convites para consultores ficam disponíveis a partir do plano Equipe. Faça upgrade para adicionar usuários.",
      limit: state.limits.users,
      used: state.usage.users
    });
  }

  if (
    (resource === "campaign_generation" ||
      resource === "campaign_questions" ||
      resource === "whatsapp_generation") &&
    !state.features.ai
  ) {
    return buildDeniedAccess(resource, "feature_unavailable", {
      title: "Seu plano atual não libera IA",
      message:
        "Os recursos de IA deste fluxo não estão disponíveis no plano atual. Atualize o billing para continuar.",
      limit: null,
      used: null
    });
  }

  if (resource === "lead_creation" && hasReachedLimit(state.usage.leads, state.limits.leads)) {
    return buildDeniedAccess(resource, "limit_reached", {
      title: "Limite de leads atingido",
      message: `Sua organização atingiu o limite de ${formatLimit(
        state.limits.leads
      )} leads neste plano. Faça upgrade para continuar cadastrando ou recebendo novos leads.`,
      limit: state.limits.leads,
      used: state.usage.leads
    });
  }

  if (resource === "team_invites" && hasReachedLimit(state.usage.users, state.limits.users)) {
    return buildDeniedAccess(resource, "limit_reached", {
      title: "Limite de usuários atingido",
      message: `Sua organização atingiu o limite de ${formatLimit(
        state.limits.users
      )} usuários ou convites ativos neste plano. Faça upgrade para convidar mais pessoas.`,
      limit: state.limits.users,
      used: state.usage.users
    });
  }

  if (
    resource === "campaign_generation" &&
    hasReachedLimit(state.usage.campaigns, state.limits.campaigns)
  ) {
    return buildDeniedAccess(resource, "limit_reached", {
      title: "Limite de campanhas atingido",
      message: `Sua organização atingiu o limite de ${formatLimit(
        state.limits.campaigns
      )} campanhas salvas neste plano. Faça upgrade para gerar novas campanhas.`,
      limit: state.limits.campaigns,
      used: state.usage.campaigns
    });
  }

  return {
    resource,
    allowed: true,
    reason: "allowed",
    title: "Recurso liberado",
    message: "Recurso liberado pela assinatura atual.",
    actionHref: DEFAULT_ACTION_HREF,
    actionLabel: "Ver billing",
    limit: getResourceLimit(state.limits, resource),
    used: getResourceUsage(state.usage, resource)
  };
}

export async function assertCurrentResourceAccess(resource: BillingGuardResource) {
  const access = await getCurrentResourceAccess(resource);

  if (!access.allowed) {
    throw new BillingResourceAccessError(access);
  }

  return access;
}

export async function assertOrganizationResourceAccess(
  organizationId: string,
  resource: BillingGuardResource
) {
  const access = await getOrganizationResourceAccess(organizationId, resource);

  if (!access.allowed) {
    throw new BillingResourceAccessError(access);
  }

  return access;
}

async function getCurrentOrganizationId() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return profile?.organization_id ?? null;
}

async function getOrganizationBillingState(
  organizationId: string
): Promise<OrganizationBillingState> {
  if (!isBillingConfigured()) {
    return {
      billingMode: "not-configured",
      plan: null,
      subscription: null,
      hasValidSubscription: true,
      limits: {
        leads: null,
        users: null,
        campaigns: null
      },
      features: {
        ai: true,
        creativeRequests: true,
        teamInvites: true
      },
      usage: {
        leads: 0,
        users: 0,
        campaigns: 0
      }
    };
  }

  const supabase = createBillingAdminClient();
  const [{ data: subscriptions }, usage] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("current_period_end", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    getUsageSnapshot(supabase, organizationId)
  ]);

  const subscription = subscriptions?.[0] ?? null;
  const plan = subscription
    ? await getPlanById(supabase, subscription.plan_id)
    : null;
  const hasValidSubscription = Boolean(
    subscription &&
      plan &&
      VALID_SUBSCRIPTION_STATUSES.has(subscription.status) &&
      new Date(subscription.current_period_end).getTime() > Date.now()
  );
  const defaults = getPlanDefaults(plan?.code);

  return {
    billingMode: "configured",
    plan,
    subscription,
    hasValidSubscription,
    limits: {
      leads: getMetadataNumber(plan?.metadata, ["limits", "leads"]) ?? defaults.limits.leads,
      users: getMetadataNumber(plan?.metadata, ["limits", "users"]) ?? defaults.limits.users,
      campaigns:
        getMetadataNumber(plan?.metadata, ["limits", "campaigns"]) ?? defaults.limits.campaigns
    },
    features: {
      ai: getMetadataBoolean(plan?.metadata, ["features", "ai"]) ?? defaults.features.ai,
      creativeRequests:
        getMetadataBoolean(plan?.metadata, ["features", "creative_requests"]) ??
        defaults.features.creativeRequests,
      teamInvites:
        getMetadataBoolean(plan?.metadata, ["features", "team_invites"]) ??
        defaults.features.teamInvites
    },
    usage
  };
}

async function getPlanById(
  supabase: ReturnType<typeof createBillingAdminClient>,
  planId: string
) {
  const { data } = await supabase.from("plans").select("*").eq("id", planId).maybeSingle();
  return (data as PlanRow | null) ?? null;
}

async function getUsageSnapshot(
  supabase: ReturnType<typeof createBillingAdminClient>,
  organizationId: string
): Promise<UsageSnapshot> {
  const [leadCount, campaignCount, profileCount, memberCount, inviteCount] = await Promise.all([
    countRows(supabase, "leads", [eq("organization_id", organizationId)]),
    countRows(supabase, "campaigns", [eq("organization_id", organizationId)]),
    countRows(supabase, "profiles", [eq("organization_id", organizationId)]),
    countRows(supabase, "workspace_members", [
      eq("workspace_id", organizationId),
      neq("status", "removed")
    ]),
    countRows(supabase, "invites", [eq("workspace_id", organizationId), eq("status", "active")])
  ]);

  return {
    leads: leadCount,
    campaigns: campaignCount,
    users: Math.max(profileCount, memberCount) + inviteCount
  };
}

async function countRows(
  supabase: ReturnType<typeof createBillingAdminClient>,
  table: "leads" | "campaigns" | "profiles" | "workspace_members" | "invites",
  filters: Array<{ column: string; op: "eq" | "neq"; value: string }>
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  for (const filter of filters) {
    query = filter.op === "eq" ? query.eq(filter.column, filter.value) : query.neq(filter.column, filter.value);
  }

  const { count } = await query;
  return count ?? 0;
}

function eq(column: string, value: string) {
  return { column, op: "eq" as const, value };
}

function neq(column: string, value: string) {
  return { column, op: "neq" as const, value };
}

function getPlanDefaults(planCode?: string | null) {
  if (!planCode) {
    return DEFAULT_PLAN_LIMITS.default;
  }

  return DEFAULT_PLAN_LIMITS[planCode] ?? DEFAULT_PLAN_LIMITS.default;
}

function getMetadataNumber(value: Json | null | undefined, path: string[]) {
  const raw = getNestedMetadataValue(value, path);

  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

function getMetadataBoolean(value: Json | null | undefined, path: string[]) {
  const raw = getNestedMetadataValue(value, path);

  return typeof raw === "boolean" ? raw : null;
}

function getNestedMetadataValue(value: Json | null | undefined, path: string[]) {
  let current: Json | undefined | null = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, Json>)[key];
  }

  return current ?? null;
}

function hasReachedLimit(used: number, limit: number | null) {
  return limit !== null && used >= limit;
}

function getResourceLimit(limits: PlanLimits, resource: BillingGuardResource) {
  if (resource === "lead_creation") {
    return limits.leads;
  }

  if (resource === "team_invites") {
    return limits.users;
  }

  if (resource === "campaign_generation") {
    return limits.campaigns;
  }

  return null;
}

function getResourceUsage(usage: UsageSnapshot, resource: BillingGuardResource) {
  if (resource === "lead_creation") {
    return usage.leads;
  }

  if (resource === "team_invites") {
    return usage.users;
  }

  if (resource === "campaign_generation") {
    return usage.campaigns;
  }

  return null;
}

function buildSubscriptionBlockedAccess(
  resource: BillingGuardResource,
  subscription: SubscriptionRow | null
): ResourceAccessSummary {
  if (!subscription) {
    return buildDeniedAccess(resource, "no_subscription", {
      title: "Este recurso está bloqueado",
      message:
        "Sua organizacao ainda nao tem uma assinatura ativa. Abra o billing para ativar um plano e liberar este recurso.",
      limit: null,
      used: null
    });
  }

  return buildDeniedAccess(resource, "inactive_subscription", {
    title: "Assinatura inativa",
    message: `A assinatura da sua organizacao está ${getSubscriptionStatusLabel(
      subscription.status
    ).toLowerCase()}. Abra o billing para voltar a usar este recurso.`,
    limit: null,
    used: null
  });
}

function buildDeniedAccess(
  resource: BillingGuardResource,
  reason: ResourceAccessSummary["reason"],
  input: {
    title: string;
    message: string;
    limit?: number | null;
    used?: number | null;
  }
): ResourceAccessSummary {
  return {
    resource,
    allowed: false,
    reason,
    title: input.title,
    message: input.message,
    actionHref: DEFAULT_ACTION_HREF,
    actionLabel: "Abrir billing",
    limit: input.limit ?? null,
    used: input.used ?? null
  };
}

function formatLimit(limit: number | null) {
  return limit === null ? "uso liberado" : String(limit);
}

function getSubscriptionStatusLabel(status: SubscriptionRow["status"]) {
  switch (status) {
    case "active":
      return "Ativa";
    case "trialing":
      return "Em teste";
    case "pending":
      return "Pendente";
    case "past_due":
      return "Em atraso";
    case "paused":
      return "Pausada";
    case "cancelled":
      return "Cancelada";
    case "expired":
      return "Expirada";
    default:
      return "Inativa";
  }
}
