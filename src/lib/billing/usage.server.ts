import { isBillingConfigured } from "./config";
import { debitBillingCredits, type BillingSnapshot } from "./admin";

export type BillingUsageResult =
  | {
      mode: "enabled";
      balance: number;
      transactionId: string;
    }
  | {
      mode: "skipped";
      balance: null;
      transactionId: null;
    };

export async function chargeCreditsForFeature(input: {
  organizationId: string;
  amount: number;
  featureKey: string;
  source: "system" | "plan" | "pack";
  referenceType: string;
  referenceId: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}) : Promise<BillingUsageResult> {
  if (!isBillingConfigured()) {
    return {
      mode: "skipped",
      balance: null,
      transactionId: null
    };
  }

  const result = await debitBillingCredits({
    organizationId: input.organizationId,
    amount: input.amount,
    featureKey: input.featureKey,
    source: input.source,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    profileId: input.profileId,
    metadata: input.metadata
  });

  return {
    mode: "enabled",
    balance: result.balance,
    transactionId: result.transactionId
  };
}

export function buildDemoBillingSnapshot(): BillingSnapshot {
  return {
    wallet: {
      balance: 240,
      totalGranted: 360,
      totalSpent: 120
    },
    recentTransactions: [
      {
        id: "demo-tx-1",
        kind: "grant",
        source: "plan",
        featureKey: null,
        amount: 240,
        balanceAfter: 240,
        referenceType: "demo",
        referenceId: "starter",
        status: "completed",
        createdAt: new Date().toISOString()
      }
    ],
    recentPurchases: [
      {
        id: "demo-purchase-1",
        productKey: "team_plan",
        productKind: "plan",
        credits: 400,
        amountCents: 24700,
        status: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
}
