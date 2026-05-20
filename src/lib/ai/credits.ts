import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env/server";
import { LeadHealthOpenAIError } from "@/lib/openai";
import { AI_FEATURE_LABELS, getAiCreditCost, type AiFeatureKey } from "./credit-costs";

export type AiCreditBalance = {
  orgId: string;
  availableCredits: number;
  createdAt: string | null;
  updatedAt: string | null;
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

export type ReserveAiCreditsInput = {
  orgId: string;
  userId?: string | null;
  credits: number;
  feature: AiFeatureKey;
  description?: string | null;
  metadata?: Json | null;
};

export type RefundAiCreditsInput = {
  orgId: string;
  userId?: string | null;
  credits: number;
  reason?: string | null;
  metadata?: Json | null;
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

export async function getAiBalance(orgId: string): Promise<number> {
  if (!orgId || !hasSupabaseServiceRole()) {
    return 0;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("org_ai_balances")
    .select("available_credits")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return Math.max(0, data.available_credits ?? 0);
}

export async function ensureSufficientCredits(orgId: string, requiredCredits: number) {
  validateCreditAmount(requiredCredits);

  const balance = await getAiBalance(orgId);

  if (balance < requiredCredits) {
    throw new AiCreditsError(
      "Você não possui créditos de IA suficientes para executar esta ação.",
      "insufficient_credits"
    );
  }

  return balance;
}

export async function reserveOrDebitCredits({
  orgId,
  userId,
  credits,
  feature,
  description,
  metadata
}: ReserveAiCreditsInput) {
  validateCreditAmount(credits);
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("apply_ai_credit_change", {
    target_org_id: orgId,
    amount: -Math.abs(credits),
    p_type: "usage",
    p_user_id: userId ?? null,
    p_description: description ?? `Consumo de IA: ${AI_FEATURE_LABELS[feature]}`,
    p_metadata: buildAiMetadata({
      feature,
      description,
      metadata,
      credits
    })
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

export async function refundCredits({
  orgId,
  userId,
  credits,
  reason,
  metadata
}: RefundAiCreditsInput) {
  validateCreditAmount(credits);
  assertAiStorageConfigured();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("apply_ai_credit_change", {
    target_org_id: orgId,
    amount: Math.abs(credits),
    p_type: "refund",
    p_user_id: userId ?? null,
    p_description: reason ? `Estorno: ${reason}` : "Estorno de créditos de IA",
    p_metadata: buildAiMetadata({
      reason,
      metadata,
      credits
    })
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
  const availableCredits = await ensureSufficientCredits(orgId, credits);
  const reservation = await reserveOrDebitCredits({
    orgId,
    userId,
    credits,
    feature,
    description,
    metadata
  });
  const apiKey = requirePlatformOpenAIKey();

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
        remainingCredits: reservation.newBalance
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
        remainingCredits: reservation.newBalance
      })
    });

    try {
      const refund = await refundCredits({
        orgId,
        userId,
        credits,
        reason: errorMessage,
        metadata: buildAiMetadata({
          description,
          metadata,
          reservedCredits: credits,
          availableCredits,
          failedAt: new Date().toISOString()
        })
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
          refundedAt: new Date().toISOString()
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
