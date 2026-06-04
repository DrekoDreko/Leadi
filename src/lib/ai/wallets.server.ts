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
