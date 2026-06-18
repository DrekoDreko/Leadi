import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AiCreditsError } from "./credits";

export type CreditWalletType = "organization" | "team" | "user";

export type CreditWallet = {
  id: string;
  organizationId: string;
  teamId: string | null;
  profileId: string | null;
  walletType: CreditWalletType;
  availableCredits: number;
  createdAt: string;
  updatedAt: string;
};

export type AllocateCreditsInput = {
  orgId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  reason: string;
  actorId: string;
  targetUserId?: string | null;
  metadata?: Json | null;
};

/**
 * Returns all wallets available to the current user.
 * - Owner sees all wallets in the organization.
 * - Admin sees organization wallet + team wallets they belong to.
 * - Seller sees only their own wallet.
 */
export async function getAccessibleWallets(): Promise<CreditWallet[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("credit_wallets").select("*");

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    teamId: row.team_id,
    profileId: row.profile_id,
    walletType: row.wallet_type,
    availableCredits: row.available_credits,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/**
 * Gets or creates the main organization wallet using admin client.
 */
export async function getOrCreateOrganizationWallet(orgId: string): Promise<CreditWallet> {
  const admin = createSupabaseAdminClient();

  // Try fetching
  const { data: existing } = await admin
    .from("credit_wallets")
    .select("*")
    .eq("organization_id", orgId)
    .eq("wallet_type", "organization")
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      organizationId: existing.organization_id,
      teamId: existing.team_id,
      profileId: existing.profile_id,
      walletType: existing.wallet_type,
      availableCredits: existing.available_credits,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at
    };
  }

  // Create if missing
  const { data: created, error } = await admin
    .from("credit_wallets")
    .insert({
      organization_id: orgId,
      wallet_type: "organization",
      available_credits: 0
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error("Failed to create organization wallet.");
  }

  return {
    id: created.id,
    organizationId: created.organization_id,
    teamId: created.team_id,
    profileId: created.profile_id,
    walletType: created.wallet_type,
    availableCredits: created.available_credits,
    createdAt: created.created_at,
    updatedAt: created.updated_at
  };
}

/**
 * Allocates credits from one wallet to another (e.g. Org -> Team, Org -> User).
 * Requires admin privileges.
 */
export async function allocateCreditWalletBalance({
  orgId,
  fromWalletId,
  toWalletId,
  amount,
  reason,
  actorId,
  targetUserId,
  metadata
}: AllocateCreditsInput) {
  if (amount <= 0) {
    throw new AiCreditsError(
      "A quantidade de créditos precisa ser maior que zero.",
      "invalid_credits"
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("allocate_credit_wallet_balance", {
    p_organization_id: orgId,
    p_from_wallet_id: fromWalletId,
    p_to_wallet_id: toWalletId,
    p_amount: amount,
    p_reason: reason,
    p_actor_id: actorId,
    p_target_user_id: targetUserId ?? null,
    p_metadata: metadata ?? {}
  });

  if (error) {
    if (error.message.includes("Créditos insuficientes")) {
      throw new AiCreditsError(
        "A carteira de origem não possui créditos suficientes.",
        "insufficient_credits"
      );
    }
    throw new Error(error.message);
  }

  const result = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;

  return {
    fromWalletBalance: Number(result?.from_wallet_balance ?? 0),
    toWalletBalance: Number(result?.to_wallet_balance ?? 0),
    transactionId: String(result?.transaction_id ?? "")
  };
}

function mapWalletRow(row: {
  id: string;
  organization_id: string;
  team_id: string | null;
  profile_id: string | null;
  wallet_type: CreditWalletType;
  available_credits: number;
  created_at: string;
  updated_at: string;
}): CreditWallet {
  return {
    id: row.id,
    organizationId: row.organization_id,
    teamId: row.team_id,
    profileId: row.profile_id,
    walletType: row.wallet_type,
    availableCredits: row.available_credits,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Saldo real do pool da organização (org_ai_balances). A carteira-org em
 * credit_wallets é apenas um handle; o saldo distribuível vive aqui.
 */
export async function getOrgPoolBalance(orgId: string): Promise<number> {
  if (!orgId) {
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

  return Math.max(0, Number(data.available_credits ?? 0));
}

/**
 * Reads a wallet by id (admin). Used for server-side authorization checks
 * where the caller's RLS scope is not enough to resolve the source wallet.
 */
export async function getCreditWalletById(walletId: string): Promise<CreditWallet | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("credit_wallets")
    .select("*")
    .eq("id", walletId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapWalletRow(data);
}

/**
 * Allocates credits from the organization pool (org_ai_balances) into a
 * team/user wallet. Debits franchise (included) credits first, then purchased.
 */
export async function allocateFromOrgPool({
  orgId,
  toWalletId,
  amount,
  reason,
  actorId,
  targetUserId,
  metadata
}: {
  orgId: string;
  toWalletId: string;
  amount: number;
  reason: string;
  actorId: string;
  targetUserId?: string | null;
  metadata?: Json | null;
}) {
  if (amount <= 0) {
    throw new AiCreditsError(
      "A quantidade de créditos precisa ser maior que zero.",
      "invalid_credits"
    );
  }

  const admin = createSupabaseAdminClient();
  const rpcClient = admin as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await rpcClient.rpc("allocate_from_org_pool", {
    p_organization_id: orgId,
    p_to_wallet_id: toWalletId,
    p_amount: amount,
    p_reason: reason,
    p_actor_id: actorId,
    p_target_user_id: targetUserId ?? null,
    p_metadata: metadata ?? {}
  });

  if (error) {
    if (error.message.includes("não possui créditos suficientes")) {
      throw new AiCreditsError(
        "O pool da organização não possui créditos suficientes.",
        "insufficient_credits"
      );
    }
    throw new Error(error.message);
  }

  const result = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;

  return {
    orgPoolBalance: Number(result?.org_pool_balance ?? 0),
    toWalletBalance: Number(result?.to_wallet_balance ?? 0),
    transactionId: String(result?.transaction_id ?? "")
  };
}

/**
 * Creates a wallet for a specific team or user if it doesn't exist.
 */
export async function ensureSubWallet({
  orgId,
  walletType,
  teamId,
  profileId
}: {
  orgId: string;
  walletType: "team" | "user";
  teamId?: string;
  profileId?: string;
}): Promise<CreditWallet> {
  const admin = createSupabaseAdminClient();

  let query = admin
    .from("credit_wallets")
    .select("*")
    .eq("organization_id", orgId)
    .eq("wallet_type", walletType);

  if (walletType === "team" && teamId) {
    query = query.eq("team_id", teamId);
  } else if (walletType === "user" && profileId) {
    query = query.eq("profile_id", profileId);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      organizationId: existing.organization_id,
      teamId: existing.team_id,
      profileId: existing.profile_id,
      walletType: existing.wallet_type,
      availableCredits: existing.available_credits,
      createdAt: existing.created_at,
      updatedAt: existing.updated_at
    };
  }

  const { data: created, error } = await admin
    .from("credit_wallets")
    .insert({
      organization_id: orgId,
      team_id: teamId ?? null,
      profile_id: profileId ?? null,
      wallet_type: walletType,
      available_credits: 0
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(`Failed to create ${walletType} wallet.`);
  }

  return {
    id: created.id,
    organizationId: created.organization_id,
    teamId: created.team_id,
    profileId: created.profile_id,
    walletType: created.wallet_type,
    availableCredits: created.available_credits,
    createdAt: created.created_at,
    updatedAt: created.updated_at
  };
}
