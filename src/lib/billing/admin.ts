import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireIntegrationEnv } from "@/lib/env/server";
import { isBillingConfigured } from "./config";

export type BillingWalletRow = {
  organization_id: string;
  balance: number;
  total_granted: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

export type BillingTransactionRow = {
  id: string;
  organization_id: string;
  created_by_profile_id: string | null;
  kind: "grant" | "spend" | "refund" | "adjustment";
  source: "plan" | "pack" | "manual" | "webhook" | "system";
  feature_key: string | null;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  status: "completed" | "pending" | "cancelled" | "failed";
  created_at: string;
};

export type BillingPurchaseRow = {
  id: string;
  organization_id: string;
  created_by_profile_id: string | null;
  provider: string;
  product_key: string;
  product_kind: "plan" | "pack";
  credits: number;
  amount_cents: number;
  currency: string;
  status: "created" | "pending" | "approved" | "rejected" | "cancelled" | "credited" | "expired";
  external_reference: string | null;
  preference_id: string | null;
  payment_id: string | null;
  checkout_url: string | null;
  provider_payload: Record<string, unknown>;
  credited_at: string | null;
  created_at: string;
  updated_at: string;
};

type BillingPurchaseSummary = {
  id: string;
  productKey: string;
  productKind: "plan" | "pack";
  credits: number;
  amountCents: number;
  status: BillingPurchaseRow["status"];
  createdAt: string;
  updatedAt: string;
};

type BillingTransactionSummary = {
  id: string;
  kind: BillingTransactionRow["kind"];
  source: BillingTransactionRow["source"];
  featureKey: string | null;
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  status: BillingTransactionRow["status"];
  createdAt: string;
};

export type BillingWalletSummary = {
  balance: number;
  totalGranted: number;
  totalSpent: number;
};

export type BillingSnapshot = {
  wallet: BillingWalletSummary;
  recentTransactions: BillingTransactionSummary[];
  recentPurchases: BillingPurchaseSummary[];
};

export function createBillingAdminClient() {
  requireIntegrationEnv("billing");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function getBillingSnapshot(organizationId: string): Promise<BillingSnapshot | null> {
  if (!isBillingConfigured()) {
    return null;
  }

  const supabase = createBillingAdminClient();
  const [walletResponse, transactionsResponse, purchasesResponse] = await Promise.all([
    supabase
      .from("credit_wallets")
      .select("balance,total_granted,total_spent")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("credit_transactions")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("billing_purchases")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const wallet = walletResponse.data ?? {
    balance: 0,
    total_granted: 0,
    total_spent: 0
  };

  return {
    wallet: {
      balance: wallet.balance ?? 0,
      totalGranted: wallet.total_granted ?? 0,
      totalSpent: wallet.total_spent ?? 0
    },
    recentTransactions: (transactionsResponse.data ?? []).map(mapTransactionRow),
    recentPurchases: (purchasesResponse.data ?? []).map(mapPurchaseRow)
  };
}

export async function getOrCreateBillingWallet(organizationId: string) {
  const supabase = createBillingAdminClient();

  const { error } = await supabase.rpc("ensure_credit_wallet", {
    target_organization_id: organizationId
  });

  if (error) {
    throw error;
  }

  const { data, error: walletError } = await supabase
    .from("credit_wallets")
    .select("balance,total_granted,total_spent")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (walletError) {
    throw walletError;
  }

  return {
    balance: data?.balance ?? 0,
    totalGranted: data?.total_granted ?? 0,
    totalSpent: data?.total_spent ?? 0
  } satisfies BillingWalletSummary;
}

export async function debitBillingCredits(input: {
  organizationId: string;
  amount: number;
  featureKey: string;
  source: "system" | "plan" | "pack";
  referenceType?: string;
  referenceId?: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase.rpc("consume_credits", {
    target_organization_id: input.organizationId,
    amount: input.amount,
    p_source: input.source,
    p_feature_key: input.featureKey,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_created_by_profile_id: input.profileId ?? null,
    p_metadata: input.metadata ?? {}
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    balance: Number(row?.new_balance ?? 0),
    transactionId: String(row?.transaction_id ?? "")
  };
}

export async function creditBillingCredits(input: {
  organizationId: string;
  amount: number;
  source: "system" | "plan" | "pack" | "webhook" | "manual";
  featureKey?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  profileId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase.rpc("grant_credits", {
    target_organization_id: input.organizationId,
    amount: input.amount,
    p_source: input.source,
    p_feature_key: input.featureKey ?? null,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_created_by_profile_id: input.profileId ?? null,
    p_metadata: input.metadata ?? {}
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    balance: Number(row?.new_balance ?? 0),
    transactionId: String(row?.transaction_id ?? "")
  };
}

export async function createBillingPurchase(input: {
  organizationId: string;
  profileId: string;
  productKey: string;
  productKind: "plan" | "pack";
  credits: number;
  amountCents: number;
}) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase
    .from("billing_purchases")
    .insert({
      organization_id: input.organizationId,
      created_by_profile_id: input.profileId,
      provider: "mercadopago",
      product_key: input.productKey,
      product_kind: input.productKind,
      credits: input.credits,
      amount_cents: input.amountCents,
      currency: "BRL",
      status: "created"
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel registrar a compra.");
  }

  return mapPurchaseRow(data as BillingPurchaseRow);
}

export async function updateBillingPurchase(
  purchaseId: string,
  patch: Partial<{
    status: BillingPurchaseRow["status"];
    externalReference: string | null;
    preferenceId: string | null;
    paymentId: string | null;
    checkoutUrl: string | null;
    providerPayload: Record<string, unknown>;
    creditedAt: string | null;
  }>
) {
  const supabase = createBillingAdminClient();
  const payload: Record<string, unknown> = {};

  if (patch.status) payload.status = patch.status;
  if (patch.externalReference !== undefined) payload.external_reference = patch.externalReference;
  if (patch.preferenceId !== undefined) payload.preference_id = patch.preferenceId;
  if (patch.paymentId !== undefined) payload.payment_id = patch.paymentId;
  if (patch.checkoutUrl !== undefined) payload.checkout_url = patch.checkoutUrl;
  if (patch.providerPayload !== undefined) payload.provider_payload = patch.providerPayload;
  if (patch.creditedAt !== undefined) payload.credited_at = patch.creditedAt;

  const { data, error } = await supabase
    .from("billing_purchases")
    .update(payload)
    .eq("id", purchaseId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel atualizar a compra.");
  }

  return mapPurchaseRow(data as BillingPurchaseRow);
}

export async function getBillingPurchaseByExternalReference(externalReference: string) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase
    .from("billing_purchases")
    .select("*")
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as BillingPurchaseRow) : null;
}

export async function getBillingPurchaseByPaymentId(paymentId: string) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase
    .from("billing_purchases")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as BillingPurchaseRow) : null;
}

function mapTransactionRow(row: BillingTransactionRow): BillingTransactionSummary {
  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    featureKey: row.feature_key,
    amount: row.amount,
    balanceAfter: row.balance_after,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    status: row.status,
    createdAt: row.created_at
  };
}

function mapPurchaseRow(row: BillingPurchaseRow): BillingPurchaseSummary {
  return {
    id: row.id,
    productKey: row.product_key,
    productKind: row.product_kind,
    credits: row.credits,
    amountCents: row.amount_cents,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
