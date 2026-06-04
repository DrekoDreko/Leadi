import "server-only";

import type { Database, Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_AI_CREDIT_PACKAGES,
  getDefaultAiCreditPackage,
  isAiCreditPackageSlug,
  type AiCreditPackageDefinition,
  type AiCreditPackageSlug
} from "./credit-packages";

type AiCreditPackageRow = {
  id: string;
  slug: string;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  description: string | null;
  is_active: boolean;
  is_featured: boolean;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

type AiCreditOrderRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  package_id: string;
  payment_provider: string;
  provider_payment_id: string | null;
  provider_preference_id: string | null;
  status: "pending" | "paid" | "cancelled" | "failed" | "refunded";
  amount_cents: number;
  credits: number;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

export type AiCreditPackage = AiCreditPackageDefinition & {
  id: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AiCreditOrder = {
  id: string;
  organizationId: string;
  userId: string | null;
  packageId: string;
  paymentProvider: string;
  providerPaymentId: string | null;
  providerPreferenceId: string | null;
  status: AiCreditOrderRow["status"];
  amountCents: number;
  credits: number;
  metadata: Json | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};

export type AiCreditPurchaseEligibility = {
  allowed: boolean;
  reason:
    | "allowed"
    | "billing_not_configured"
    | "storage_unavailable"
    | "no_subscription"
    | "inactive_subscription";
  message: string;
  subscriptionStatus: string | null;
};

const VALID_PURCHASE_SUBSCRIPTION_STATUSES = new Set(["trialing", "active"]);

export class AiCreditPurchaseAccessError extends Error {
  constructor(
    message: string,
    public readonly status = 402
  ) {
    super(message);
    this.name = "AiCreditPurchaseAccessError";
  }
}

export async function listStoredAiCreditPackages(): Promise<AiCreditPackage[]> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return DEFAULT_AI_CREDIT_PACKAGES.map((pkg) => ({ ...pkg, id: null }));
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_credit_packages")
    .select("*")
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as AiCreditPackageRow[]).map(mapPackageRow);
}

export async function getAiCreditPackageBySlug(
  slug: AiCreditPackageSlug
): Promise<AiCreditPackage | null> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    const fallback = getDefaultAiCreditPackage(slug);
    return fallback ? { ...fallback, id: null } : null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_credit_packages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPackageRow(data as AiCreditPackageRow) : null;
}

export async function getAiCreditOrderById(orderId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_credit_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapOrderRow(data as AiCreditOrderRow) : null;
}

export async function getAiCreditOrderByPaymentId(paymentId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_credit_orders")
    .select("*")
    .eq("provider_payment_id", paymentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapOrderRow(data as AiCreditOrderRow) : null;
}

export async function getAiCreditOrderByExternalReference(externalReference: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_credit_orders")
    .select("*")
    .eq("id", externalReference)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapOrderRow(data as AiCreditOrderRow) : null;
}

export async function createAiCreditOrder(input: {
  organizationId: string;
  userId: string;
  packageRecord: AiCreditPackage;
  metadata?: Json | null;
}) {
  if (!input.packageRecord.id) {
    throw new Error("Pacote de créditos indisponível neste ambiente.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_credit_orders")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      package_id: input.packageRecord.id,
      payment_provider: "mercadopago",
      amount_cents: input.packageRecord.priceCents,
      credits: input.packageRecord.credits,
      status: "pending",
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel registrar o pedido de créditos.");
  }

  return mapOrderRow(data as AiCreditOrderRow);
}

export async function updateAiCreditOrder(
  orderId: string,
  patch: Partial<{
    status: AiCreditOrderRow["status"];
    providerPaymentId: string | null;
    providerPreferenceId: string | null;
    paidAt: string | null;
    metadata: Json | null;
  }>
) {
  const admin = createSupabaseAdminClient();
  const payload: Database["public"]["Tables"]["ai_credit_orders"]["Update"] = {};

  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.providerPaymentId !== undefined) payload.provider_payment_id = patch.providerPaymentId;
  if (patch.providerPreferenceId !== undefined) {
    payload.provider_preference_id = patch.providerPreferenceId;
  }
  if (patch.paidAt !== undefined) payload.paid_at = patch.paidAt;

  if (patch.metadata !== undefined) {
    const { data: currentRow, error: currentError } = await admin
      .from("ai_credit_orders")
      .select("metadata")
      .eq("id", orderId)
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    const currentMetadata =
      currentRow?.metadata && typeof currentRow.metadata === "object" && !Array.isArray(currentRow.metadata)
        ? (currentRow.metadata as Record<string, unknown>)
        : {};
    const nextMetadata =
      patch.metadata && typeof patch.metadata === "object" && !Array.isArray(patch.metadata)
        ? (patch.metadata as Record<string, unknown>)
        : {};

    payload.metadata = {
      ...currentMetadata,
      ...nextMetadata
    } as Json;
  }

  const { data, error } = await admin
    .from("ai_credit_orders")
    .update(payload)
    .eq("id", orderId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel atualizar o pedido de créditos.");
  }

  return mapOrderRow(data as AiCreditOrderRow);
}

export async function getAiCreditPurchaseEligibilityForOrganization(
  organizationId: string
): Promise<AiCreditPurchaseEligibility> {
  if (!isSupabaseConfigured()) {
    return {
      allowed: false,
      reason: "billing_not_configured",
      message: "Billing ainda nao esta configurado neste ambiente.",
      subscriptionStatus: null
    };
  }

  if (!hasSupabaseServiceRole()) {
    return {
      allowed: false,
      reason: "storage_unavailable",
      message: "A plataforma ainda nao esta pronta para registrar compras de créditos.",
      subscriptionStatus: null
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("organization_id", organizationId)
    .order("current_period_end", { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  const subscriptions = (data ?? []) as Array<{
    status?: string | null;
    current_period_end?: string | null;
  }>;
  const eligibleSubscription = subscriptions.find((subscription) =>
    isEligiblePurchaseSubscription(subscription.status, subscription.current_period_end)
  );

  if (eligibleSubscription?.status) {
    return {
      allowed: true,
      reason: "allowed",
      message: "",
      subscriptionStatus: eligibleSubscription.status
    };
  }

  const subscriptionStatus = subscriptions[0]?.status ?? null;

  if (!subscriptionStatus) {
    return {
      allowed: false,
      reason: "no_subscription",
      message:
        "Sua organizacao precisa de uma assinatura ativa para comprar créditos de IA.",
      subscriptionStatus: null
    };
  }

  return {
    allowed: false,
    reason: "inactive_subscription",
    message:
      "Sua organizacao precisa estar com a assinatura ativa ou em trial para comprar créditos de IA.",
    subscriptionStatus
  };
}

export async function assertAiCreditPurchaseAllowed(organizationId: string) {
  const eligibility = await getAiCreditPurchaseEligibilityForOrganization(organizationId);

  if (!eligibility.allowed) {
    throw new AiCreditPurchaseAccessError(eligibility.message);
  }

  return eligibility;
}

function isEligiblePurchaseSubscription(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined
) {
  if (!status || !VALID_PURCHASE_SUBSCRIPTION_STATUSES.has(status)) {
    return false;
  }

  if (!currentPeriodEnd) {
    return false;
  }

  const periodEnd = new Date(currentPeriodEnd).getTime();

  return Number.isFinite(periodEnd) && periodEnd > Date.now();
}

function mapPackageRow(row: AiCreditPackageRow): AiCreditPackage {
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const approximateUses = Array.isArray(metadata.approximate_uses)
    ? metadata.approximate_uses.filter((value): value is string => typeof value === "string")
    : [];
  const badge = typeof metadata.badge === "string" && metadata.badge.trim() ? metadata.badge : undefined;

  if (isAiCreditPackageSlug(row.slug)) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      credits: row.credits,
      priceCents: row.price_cents,
      currency: row.currency === "BRL" ? "BRL" : "BRL",
      description: row.description?.trim() || row.name,
      approximateUses,
      badge,
      featured: row.is_featured,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  const fallback = DEFAULT_AI_CREDIT_PACKAGES[0];
  return {
    ...fallback,
    id: row.id,
    slug: fallback.slug,
    name: row.name,
    credits: row.credits,
    priceCents: row.price_cents,
    description: row.description?.trim() || row.name,
    approximateUses,
    badge,
    featured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapOrderRow(row: AiCreditOrderRow): AiCreditOrder {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    packageId: row.package_id,
    paymentProvider: row.payment_provider,
    providerPaymentId: row.provider_payment_id,
    providerPreferenceId: row.provider_preference_id,
    status: row.status,
    amountCents: row.amount_cents,
    credits: row.credits,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at
  };
}
