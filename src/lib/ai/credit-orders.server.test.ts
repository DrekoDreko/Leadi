import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAiCreditPurchaseEligibilityForOrganization } from "./credit-orders.server";

vi.mock("server-only", () => ({}));

const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn());
const hasSupabaseServiceRoleMock = vi.hoisted(() => vi.fn());
const isSupabaseConfiguredMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
  hasSupabaseServiceRole: hasSupabaseServiceRoleMock
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock
}));

function createSubscriptionsAdminClient(
  rows: Array<{ status?: string | null; current_period_end?: string | null }>
) {
  return {
    from: vi.fn((table: string) => {
      if (table !== "subscriptions") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({
                data: rows,
                error: null
              })
            }))
          }))
        }))
      };
    })
  };
}

describe("getAiCreditPurchaseEligibilityForOrganization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseConfiguredMock.mockReturnValue(true);
    hasSupabaseServiceRoleMock.mockReturnValue(true);
  });

  it("permite compra quando existe uma assinatura ativa valida mesmo com uma pending mais recente", async () => {
    createSupabaseAdminClientMock.mockReturnValue(
      createSubscriptionsAdminClient([
        {
          status: "pending",
          current_period_end: "2099-07-01T00:00:00.000Z"
        },
        {
          status: "active",
          current_period_end: "2099-06-01T00:00:00.000Z"
        }
      ])
    );

    const eligibility = await getAiCreditPurchaseEligibilityForOrganization("org-1");

    expect(eligibility).toEqual({
      allowed: true,
      reason: "allowed",
      message: "",
      subscriptionStatus: "active"
    });
  });

  it("bloqueia compra quando existem assinaturas mas nenhuma esta valida no periodo atual", async () => {
    createSupabaseAdminClientMock.mockReturnValue(
      createSubscriptionsAdminClient([
        {
          status: "trialing",
          current_period_end: "2020-01-01T00:00:00.000Z"
        },
        {
          status: "pending",
          current_period_end: "2099-07-01T00:00:00.000Z"
        }
      ])
    );

    const eligibility = await getAiCreditPurchaseEligibilityForOrganization("org-1");

    expect(eligibility).toEqual({
      allowed: false,
      reason: "inactive_subscription",
      message:
        "Sua organizacao precisa estar com a assinatura ativa ou em trial para comprar créditos de IA.",
      subscriptionStatus: "trialing"
    });
  });
});
