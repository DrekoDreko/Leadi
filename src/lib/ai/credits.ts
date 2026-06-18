import "server-only";

import crypto from "node:crypto";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env/server";
import { LeadHealthOpenAIError } from "@/lib/openai";
import {
  listStoredAiCreditPackages,
  type AiCreditPackage
} from "./credit-orders.server";
import { AI_FEATURE_LABELS, getAiCreditCost, type AiFeatureKey } from "./credit-costs";

export type AiCreditBalance = {
  orgId: string;
  availableCredits: number;
  includedCredits: number;
  purchasedCredits: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type OrgAiBalanceRow = {
  available_credits: number | null;
  included_credits_balance: number | null;
  purchased_credits_balance: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AiUsageEventStatus = "success" | "failed" | "refunded";

export type AiUsageEventInput = {
  orgId: string;
  userId?: string | null;
  feature: AiFeatureKey;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedCost?: number | null;
  creditsCharged: number;
  status: AiUsageEventStatus;
  errorMessage?: string | null;
  metadata?: Json | null;
};

export type ConsumeAiCreditsInput = {
  orgId: string;
  userId?: string | null;
  amount: number;
  reason: string;
  metadata?: Json | null;
  referenceType?: string | null;
  referenceId?: string | null;
};

export type AddAiCreditsInput = {
  orgId: string;
  userId?: string | null;
  amount: number;
  type?: "purchase" | "monthly_grant" | "refund" | "adjustment";
  reason: string;
  metadata?: Json | null;
  referenceType?: string | null;
  referenceId?: string | null;
};

export class AiCreditsError extends Error {
  constructor(
    message: string,
    public readonly code: "insufficient_credits" | "invalid_credits" | "storage_unavailable"
  ) {
    super(message);
    this.name = "AiCreditsError";
  }
}

export function requirePlatformOpenAIKey() {
  const apiKey = getServerEnv("OPENAI_API_KEY");

  if (apiKey) {
    return apiKey;
  }

  throw new LeadHealthOpenAIError(
    "IA da plataforma ainda não configurada.",
    "missing_api_key"
  );
}

export async function listActiveAiCreditPackages(): Promise<AiCreditPackage[]> {
  return listStoredAiCreditPackages();
}

function createEmptyAiBalance(orgId = ""): AiCreditBalance {
  return {
    orgId,
    availableCredits: 0,
    includedCredits: 0,
    purchasedCredits: 0,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    createdAt: null,
    updatedAt: null
  };
}

async function getAiBalanceForOrganization(orgId: string): Promise<AiCreditBalance> {
  if (!orgId || !hasSupabaseServiceRole()) {
    return createEmptyAiBalance(orgId);
  }

  const admin = createSupabaseAdminClient();
  const balanceQuery = await admin
    .from("org_ai_balances")
    .select(
      "available_credits,included_credits_balance,purchased_credits_balance,current_period_start,current_period_end,created_at,updated_at"
    )
    .eq("org_id", orgId)
    .maybeSingle();
  const data = balanceQuery.data as OrgAiBalanceRow | null;
  const error = balanceQuery.error;

  if (error || !data) {
    return createEmptyAiBalance(orgId);
  }

  return {
    orgId,
    availableCredits: Math.max(0, data.available_credits ?? 0),
    includedCredits: Math.max(0, data.included_credits_balance ?? 0),
    purchasedCredits: Math.max(0, data.purchased_credits_balance ?? 0),
    currentPeriodStart: data.current_period_start ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
    createdAt: data.created_at ?? null,
    updatedAt: data.updated_at ?? null
  };
}

export async function getCurrentAiBalance(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile?.organization_id) {
    return 0;
  }

  const balance = await getAiBalanceForOrganization(profile.organization_id);
  return balance.availableCredits;
}

export async function getCurrentAiBalanceDetails(): Promise<AiCreditBalance> {
  if (!isSupabaseConfigured()) {
    return createEmptyAiBalance();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return createEmptyAiBalance();
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !profile?.organization_id) {
    return createEmptyAiBalance();
  }

  return getAiBalanceForOrganization(profile.organization_id);
}

export type AiUsageThisPeriodSummary = {
  usedCredits: number;
  periodEnd: string | null;
};

async function getAiUsageThisPeriodForOrganization(
  orgId: string,
  periodStart: string | null,
  periodEnd: string | null
): Promise<number> {
  if (!orgId || !periodStart || !hasSupabaseServiceRole()) {
    return 0;
  }

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("ai_usage_events")
    .select("credits_charged")
    .eq("org_id", orgId)
    .eq("status", "success")
    .gte("created_at", periodStart);

  if (periodEnd) {
    query = query.lte("created_at", periodEnd);
  }

  const { data, error } = await query;

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum, row) => sum + Math.max(0, Number(row.credits_charged ?? 0)), 0);
}

export async function getAiUsageThisPeriod(): Promise<AiUsageThisPeriodSummary> {
  const balance = await getCurrentAiBalanceDetails();
  const usedCredits = await getAiUsageThisPeriodForOrganization(
    balance.orgId,
    balance.currentPeriodStart,
    balance.currentPeriodEnd
  );

  return {
    usedCredits,
    periodEnd: balance.currentPeriodEnd
  };
}

export type AiUsageHistoryItem = {
  id: string;
  feature: string;
  featureLabel: string;
  creditsCharged: number;
  status: AiUsageEventStatus;
  errorMessage: string | null;
  createdAt: string;
  actorId: string | null;
  actorName: string | null;
};

/**
 * Resolve quais user_ids o usuario atual pode ver no historico de uso de creditos.
 * - owner: toda a organizacao (sem filtro de autor; vê o gasto de toda a equipe e o seu).
 * - admin (supervisor): apenas os consultores das suas equipes + ele mesmo.
 *   Nao enxerga o gasto do owner nem de outros supervisores.
 * - seller (consultor): apenas o proprio gasto.
 *
 * Retorna `null` quando nao deve haver filtro por autor (caso owner).
 */
async function resolveUsageHistoryActorScope(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  profile: { id: string; organization_id: string; role: string }
): Promise<string[] | null> {
  if (profile.role === "owner") {
    return null;
  }

  if (profile.role !== "admin") {
    // Consultor (seller) ou qualquer outro papel: somente o proprio gasto.
    return [profile.id];
  }

  // Supervisor: equipes ativas das quais ele participa.
  const { data: memberships } = await admin
    .from("team_members")
    .select("team_id")
    .eq("organization_id", profile.organization_id)
    .eq("profile_id", profile.id)
    .eq("status", "active");

  const teamIds = [
    ...new Set((memberships ?? []).map((row) => row.team_id).filter(Boolean))
  ];

  if (teamIds.length === 0) {
    return [profile.id];
  }

  // Consultores ativos dessas equipes.
  const { data: consultants } = await admin
    .from("team_members")
    .select("profile_id")
    .eq("organization_id", profile.organization_id)
    .eq("role", "consultant")
    .eq("status", "active")
    .in("team_id", teamIds);

  const actorIds = new Set<string>([profile.id]);
  for (const row of consultants ?? []) {
    if (row.profile_id) {
      actorIds.add(row.profile_id);
    }
  }

  return [...actorIds];
}

export async function getAiUsageHistory(limit = 50): Promise<AiUsageHistoryItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,organization_id,role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile?.organization_id || !profile.id || !hasSupabaseServiceRole()) {
    return [];
  }

  const admin = createSupabaseAdminClient();

  const actorScope = await resolveUsageHistoryActorScope(admin, {
    id: profile.id,
    organization_id: profile.organization_id,
    role: profile.role
  });

  let query = admin
    .from("ai_usage_events")
    .select("id,feature,credits_charged,status,error_message,created_at,user_id")
    .eq("org_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (actorScope) {
    if (actorScope.length === 0) {
      return [];
    }
    query = query.in("user_id", actorScope);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  // Para owner/supervisor, anexa o nome de quem consumiu para distinguir os gastos.
  // O consultor ve apenas o proprio historico, entao nao precisa do rotulo.
  let actorNames = new Map<string, string>();
  if (profile.role === "owner" || profile.role === "admin") {
    const actorIds = [
      ...new Set(
        data
          .map((row) => row.user_id as string | null)
          .filter((id): id is string => Boolean(id))
      )
    ];

    if (actorIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id,full_name")
        .in("id", actorIds);

      actorNames = new Map(
        (profiles ?? [])
          .filter((row) => row.id)
          .map((row) => [row.id as string, (row.full_name as string | null)?.trim() || ""])
      );
    }
  }

  return data.map((row) => {
    const actorId = (row.user_id as string | null) ?? null;
    return {
      id: row.id as string,
      feature: row.feature as string,
      featureLabel: AI_FEATURE_LABELS[row.feature as AiFeatureKey] ?? row.feature,
      creditsCharged: Number(row.credits_charged ?? 0),
      status: row.status as AiUsageEventStatus,
      errorMessage: (row.error_message as string) ?? null,
      createdAt: row.created_at as string,
      actorId,
      actorName: actorId ? actorNames.get(actorId) || null : null
    };
  });
}

export async function ensureSufficientCredits(orgId: string, requiredCredits: number) {
  validateCreditAmount(requiredCredits);

  const balance = await getAiBalanceForOrganization(orgId);

  if (balance.availableCredits < requiredCredits) {
    throw new AiCreditsError(
      "Você não possui créditos de IA suficientes para executar esta ação.",
      "insufficient_credits"
    );
  }

  return balance.availableCredits;
}

/**
 * Total de créditos que o usuário pode efetivamente gastar:
 * carteira pessoal + carteiras das equipes ativas + pool da organização.
 * Espelha a cascata de consumo da RPC `consume_ai_credits_for_user`.
 */
export async function getAccessibleAiCreditsForUser(
  orgId: string,
  profileId: string | null | undefined
): Promise<number> {
  if (!orgId || !profileId || !hasSupabaseServiceRole()) {
    const balance = await getAiBalanceForOrganization(orgId);
    return balance.availableCredits;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await rpcUntyped(admin).rpc("accessible_ai_credits", {
    target_org_id: orgId,
    p_profile_id: profileId
  });

  if (error || data == null) {
    const balance = await getAiBalanceForOrganization(orgId);
    return balance.availableCredits;
  }

  return Math.max(0, Number(data));
}

export async function ensureSufficientCreditsForUser({
  orgId,
  profileId,
  required
}: {
  orgId: string;
  profileId: string | null | undefined;
  required: number;
}) {
  validateCreditAmount(required);

  const available = await getAccessibleAiCreditsForUser(orgId, profileId);

  if (available < required) {
    throw new AiCreditsError(
      "Você não possui créditos de IA suficientes para executar esta ação.",
      "insufficient_credits"
    );
  }

  return available;
}

/**
 * Estorna uma operação revertendo exatamente os níveis debitados
 * (carteira pessoal/equipe e/ou pool da org). Idempotente por operationId.
 */
export async function refundAiCreditsForUser({
  orgId,
  profileId,
  operationId,
  reason,
  metadata
}: {
  orgId: string;
  profileId: string | null | undefined;
  operationId: string;
  reason?: string | null;
  metadata?: Json | null;
}) {
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();
  const { data, error } = await rpcUntyped(admin).rpc("refund_ai_credits_for_user", {
    target_org_id: orgId,
    p_profile_id: profileId ?? null,
    p_reason: reason ?? null,
    p_operation_id: operationId,
    p_metadata: metadata ?? {}
  });

  if (error) {
    throw mapAiStorageError(error.message);
  }

  const result = getSingleRowResult(data);

  return {
    newBalance: Number(result?.new_balance ?? 0),
    refunded: Number(result?.refunded ?? 0)
  };
}

export async function consumeAiCredits({
  orgId,
  userId,
  amount,
  reason,
  metadata,
  referenceType,
  referenceId
}: ConsumeAiCreditsInput) {
  validateCreditAmount(amount);
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();

  // Com usuário identificado, o consumo respeita a cascata de carteiras
  // (pessoal -> equipes ativas -> pool da org). Sem usuário, mantém o
  // consumo org-level legado.
  if (userId) {
    const { data, error } = await rpcUntyped(admin).rpc("consume_ai_credits_for_user", {
      target_org_id: orgId,
      p_profile_id: userId,
      amount,
      p_reason: reason,
      p_reference_type: referenceType ?? null,
      p_reference_id: referenceId ?? null,
      p_metadata: metadata ?? {}
    });

    if (error) {
      throw mapAiStorageError(error.message);
    }

    const result = getSingleRowResult(data);

    return {
      newBalance: Number(result?.new_balance ?? 0),
      ledgerId: String(result?.ledger_id ?? "")
    };
  }

  const { data, error } = await admin.rpc("consume_ai_credits", {
    target_org_id: orgId,
    amount,
    p_user_id: userId ?? null,
    p_reason: reason,
    p_reference_type: referenceType ?? null,
    p_reference_id: referenceId ?? null,
    p_metadata: metadata ?? {}
  });

  if (error) {
    throw mapAiStorageError(error.message);
  }

  const result = getSingleRowResult(data);

  return {
    newBalance: Number(result?.new_balance ?? 0),
    ledgerId: String(result?.ledger_id ?? "")
  };
}

export async function addAiCredits({
  orgId,
  userId,
  amount,
  type = "purchase",
  reason,
  metadata,
  referenceType,
  referenceId
}: AddAiCreditsInput) {
  validateCreditAmount(amount);
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("add_ai_credits", {
    target_org_id: orgId,
    amount,
    p_type: type,
    p_user_id: userId ?? null,
    p_reason: reason,
    p_reference_type: referenceType ?? null,
    p_reference_id: referenceId ?? null,
    p_metadata: metadata ?? {}
  });

  if (error) {
    throw mapAiStorageError(error.message);
  }

  const result = getSingleRowResult(data);

  return {
    newBalance: Number(result?.new_balance ?? 0),
    ledgerId: String(result?.ledger_id ?? "")
  };
}

export async function finalizeAiCreditOrderPayment(input: {
  orderId: string;
  providerPaymentId: string;
  providerPreferenceId?: string | null;
  paidAt?: string | null;
  metadata?: Json | null;
}) {
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("finalize_ai_credit_order_payment", {
    target_order_id: input.orderId,
    p_provider_payment_id: input.providerPaymentId,
    p_provider_preference_id: input.providerPreferenceId ?? null,
    p_paid_at: input.paidAt ?? null,
    p_metadata: input.metadata ?? {}
  });

  if (error) {
    throw mapAiStorageError(error.message);
  }

  const result = getSingleRowResult(data);

  return {
    orderStatus: String(result?.order_status ?? "pending"),
    alreadyProcessed: Boolean(result?.already_processed),
    newBalance: Number(result?.new_balance ?? 0),
    ledgerId: String(result?.ledger_id ?? "")
  };
}

export async function grantSubscriptionIncludedAiCredits(input: {
  subscriptionId: string;
  referenceId?: string | null;
  metadata?: Json | null;
}) {
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();
  const rpcClient = admin as typeof admin & {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await rpcClient.rpc("grant_subscription_included_ai_credits", {
    target_subscription_id: input.subscriptionId,
    p_reference_id: input.referenceId ?? null,
    p_metadata: input.metadata ?? {}
  });

  if (error) {
    throw mapAiStorageError(error.message);
  }

  const result = getSingleRowResult(data);

  return {
    newBalance: Number(result?.new_balance ?? 0),
    includedBalance: Number(result?.included_balance ?? 0),
    purchasedBalance: Number(result?.purchased_balance ?? 0),
    ledgerId: result?.ledger_id ? String(result.ledger_id) : "",
    alreadyProcessed: Boolean(result?.already_processed)
  };
}

export async function logAiUsageEvent(input: AiUsageEventInput) {
  if (!input.orgId || !hasSupabaseServiceRole()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_usage_events")
    .insert({
      org_id: input.orgId,
      user_id: input.userId ?? null,
      feature: input.feature,
      model: input.model ?? null,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      total_tokens: input.totalTokens ?? null,
      estimated_cost: input.estimatedCost ?? null,
      credits_charged: input.creditsCharged,
      status: input.status,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {}
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Nao foi possivel registrar o evento de IA.", error.message);
    return null;
  }

  return data ?? null;
}

export async function runAiActionWithCredits<T>({
  orgId,
  userId,
  feature,
  description,
  metadata,
  generate
}: {
  orgId: string;
  userId?: string | null;
  feature: AiFeatureKey;
  description?: string | null;
  metadata?: Json | null;
  generate: (apiKey: string) => Promise<T>;
}) {
  const credits = getAiCreditCost(feature);
  const apiKey = requirePlatformOpenAIKey();
  const availableCredits = userId
    ? await ensureSufficientCreditsForUser({ orgId, profileId: userId, required: credits })
    : await ensureSufficientCredits(orgId, credits);
  const operationId = crypto.randomUUID();
  const reservation = await consumeAiCredits({
    orgId,
    userId,
    amount: credits,
    reason: description ?? `Consumo de IA: ${AI_FEATURE_LABELS[feature]}`,
    metadata: buildAiMetadata({
      feature,
      ledger_source: getAiLedgerSourceForFeature(feature),
      description,
      metadata,
      credits,
      operationId
    }),
    referenceType: "ai_usage_operation",
    referenceId: operationId
  });

  try {
    const result = await generate(apiKey);

    await logAiUsageEvent({
      orgId,
      userId,
      feature,
      status: "success",
      creditsCharged: credits,
      metadata: buildAiMetadata({
        description,
        metadata,
        reservedCredits: credits,
        availableCredits,
        remainingCredits: reservation.newBalance,
        operationId
      })
    });

    return {
      result,
      remainingCredits: reservation.newBalance
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    await logAiUsageEvent({
      orgId,
      userId,
      feature,
      status: "failed",
      creditsCharged: credits,
      errorMessage,
      metadata: buildAiMetadata({
        description,
        metadata,
        reservedCredits: credits,
        availableCredits,
        remainingCredits: reservation.newBalance,
        operationId
      })
    });

    try {
      const refund = userId
        ? await refundAiCreditsForUser({
            orgId,
            profileId: userId,
            operationId,
            reason: errorMessage ? `Estorno: ${errorMessage}` : "Estorno de créditos de IA",
            metadata: buildAiMetadata({
              description,
              ledger_source: "refund",
              metadata,
              reservedCredits: credits,
              failedAt: new Date().toISOString(),
              operationId
            })
          })
        : await addAiCredits({
            orgId,
            userId,
            amount: credits,
            type: "refund",
            reason: errorMessage ? `Estorno: ${errorMessage}` : "Estorno de créditos de IA",
            metadata: buildAiMetadata({
              description,
              ledger_source: "refund",
              metadata,
              reservedCredits: credits,
              availableCredits,
              failedAt: new Date().toISOString(),
              operationId
            }),
            referenceType: "ai_usage_refund",
            referenceId: operationId
          });

      await logAiUsageEvent({
        orgId,
        userId,
        feature,
        status: "refunded",
        creditsCharged: credits,
        errorMessage,
        metadata: buildAiMetadata({
          description,
          metadata,
          reservedCredits: credits,
          remainingCredits: refund.newBalance,
          refundedAt: new Date().toISOString(),
          operationId
        })
      });
    } catch (refundError) {
      console.error("Nao foi possivel estornar os créditos de IA.", refundError);
    }

    throw error;
  }
}

function validateCreditAmount(credits: number) {
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new AiCreditsError(
      "A quantidade de créditos de IA precisa ser maior que zero.",
      "invalid_credits"
    );
  }
}

function assertAiStorageConfigured() {
  if (hasSupabaseServiceRole()) {
    return;
  }

  throw new AiCreditsError(
    "A plataforma ainda não está pronta para registrar créditos de IA.",
    "storage_unavailable"
  );
}

function buildAiMetadata(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null)
  ) as Json;
}

function getAiLedgerSourceForFeature(feature: AiFeatureKey) {
  switch (feature) {
    case "generate_whatsapp_message":
      return "ai_message";
    case "generate_ad_copy":
      return "ad_text";
    case "generate_campaign_plan":
      return "campaign";
    case "generate_campaign_questions":
      return "campaign_questions";
    case "generate_creative_brief":
      return "creative_brief";
    case "generate_compliance_review":
      return "compliance_review";
    case "generate_ad_image":
      return "image_standard";
    case "generate_ad_image_set":
      return "image_set";
    default:
      return "legacy";
  }
}

type UntypedRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Permite chamar RPCs ainda nao refletidas nos tipos gerados do banco
 * (consume/refund wallet-aware), seguindo o mesmo padrao usado em
 * grantSubscriptionIncludedAiCredits.
 */
function rpcUntyped(admin: ReturnType<typeof createSupabaseAdminClient>): UntypedRpcClient {
  return admin as unknown as UntypedRpcClient;
}

function getSingleRowResult(data: unknown) {
  if (Array.isArray(data)) {
    return data[0] as Record<string, unknown> | undefined;
  }

  return data as Record<string, unknown> | null | undefined;
}

function mapAiStorageError(message: string) {
  if (message.toLowerCase().includes("insuficiente")) {
    return new AiCreditsError(
      "Você não possui créditos de IA suficientes para executar esta ação.",
      "insufficient_credits"
    );
  }

  return new Error(message || "Nao foi possivel atualizar os créditos de IA.");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "A IA da plataforma falhou ao gerar a resposta.";
}
