import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiCreditsError, runAiActionWithCredits } from "./credits";

vi.mock("server-only", () => ({}));

const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn());
const hasSupabaseServiceRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
  hasSupabaseServiceRole: hasSupabaseServiceRoleMock
}));

function createMockAdminClient(balance: number, rpcResults: Array<{ data: unknown; error: null }>) {
  const usageEvents: Array<Record<string, unknown>> = [];
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  const admin = {
    from: vi.fn((table: string) => {
      if (table === "org_ai_balances") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { available_credits: balance },
                error: null
              })
            }))
          }))
        };
      }

      if (table === "ai_usage_events") {
        return {
          insert: vi.fn((payload: Record<string, unknown>) => {
            usageEvents.push(payload);
            return {
              select: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: `event-${usageEvents.length}` },
                  error: null
                })
              }))
            };
          })
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      const next = rpcResults.shift() ?? {
        data: [{ ledger_id: `${fn}-ledger`, new_balance: balance }],
        error: null
      };

      return next;
    })
  };

  return { admin, rpcCalls, usageEvents };
}

describe("runAiActionWithCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSupabaseServiceRoleMock.mockReturnValue(true);
    process.env.OPENAI_API_KEY = "sk-platform-test";
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("debita, chama a OpenAI e registra uso quando ha saldo suficiente", async () => {
    const mockAdmin = createMockAdminClient(5, [
      { data: [{ ledger_id: "usage-1", new_balance: 4 }], error: null }
    ]);
    createSupabaseAdminClientMock.mockReturnValue(mockAdmin.admin);

    const generate = vi.fn().mockResolvedValue({ ok: true });

    const result = await runAiActionWithCredits({
      orgId: "org-1",
      userId: "user-1",
      feature: "generate_whatsapp_message",
      description: "Geracao de mensagem",
      metadata: { route: "whatsapp/generate" },
      generate
    });

    expect(generate).toHaveBeenCalledWith("sk-platform-test");
    expect(mockAdmin.rpcCalls).toHaveLength(1);
    expect(mockAdmin.rpcCalls[0]).toMatchObject({
      fn: "consume_ai_credits",
      args: {
        target_org_id: "org-1",
        amount: 1
      }
    });
    expect(mockAdmin.usageEvents).toHaveLength(1);
    expect(mockAdmin.usageEvents[0]).toMatchObject({
      org_id: "org-1",
      user_id: "user-1",
      feature: "generate_whatsapp_message",
      credits_charged: 1,
      status: "success"
    });
    expect(result).toEqual({
      result: { ok: true },
      remainingCredits: 4
    });
  });

  it("bloqueia antes da chamada quando o saldo e insuficiente", async () => {
    const mockAdmin = createMockAdminClient(0, []);
    createSupabaseAdminClientMock.mockReturnValue(mockAdmin.admin);

    const generate = vi.fn();

    const action = runAiActionWithCredits({
      orgId: "org-1",
      userId: "user-1",
      feature: "generate_whatsapp_message",
      description: "Geracao de mensagem",
      metadata: { route: "whatsapp/generate" },
      generate
    });

    await expect(action).rejects.toBeInstanceOf(AiCreditsError);
    await expect(action).rejects.toThrow("Você não possui créditos de IA suficientes para executar esta ação.");

    expect(generate).not.toHaveBeenCalled();
    expect(mockAdmin.rpcCalls).toHaveLength(0);
    expect(mockAdmin.usageEvents).toHaveLength(0);
  });

  it("registra falha e estorna os créditos quando a OpenAI falha", async () => {
    const mockAdmin = createMockAdminClient(5, [
      { data: [{ ledger_id: "usage-1", new_balance: 4 }], error: null },
      { data: [{ ledger_id: "refund-1", new_balance: 5 }], error: null }
    ]);
    createSupabaseAdminClientMock.mockReturnValue(mockAdmin.admin);

    const generate = vi.fn().mockRejectedValue(new Error("OpenAI caiu"));

    await expect(
      runAiActionWithCredits({
        orgId: "org-1",
        userId: "user-1",
        feature: "generate_whatsapp_message",
        description: "Geracao de mensagem",
        metadata: { route: "whatsapp/generate" },
        generate
      })
    ).rejects.toThrow("OpenAI caiu");

    expect(generate).toHaveBeenCalledWith("sk-platform-test");
    expect(mockAdmin.rpcCalls).toHaveLength(2);
    expect(mockAdmin.rpcCalls[0]).toMatchObject({
      fn: "consume_ai_credits",
      args: {
        amount: 1
      }
    });
    expect(mockAdmin.rpcCalls[1]).toMatchObject({
      fn: "add_ai_credits",
      args: {
        amount: 1,
        p_type: "refund"
      }
    });
    expect(mockAdmin.usageEvents).toHaveLength(2);
    expect(mockAdmin.usageEvents[0]).toMatchObject({
      status: "failed",
      error_message: "OpenAI caiu"
    });
    expect(mockAdmin.usageEvents[1]).toMatchObject({
      status: "refunded",
      error_message: "OpenAI caiu"
    });
  });
});
