import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "./route";
import { requireIntegrationEnv } from "@/lib/env/server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { finalizeAiCreditOrderPayment } from "@/lib/ai/credits";
import {
  assertAiCreditPurchaseAllowed,
  createAiCreditOrder,
  getAiCreditPackageBySlug,
  updateAiCreditOrder
} from "@/lib/ai/credit-orders.server";
import { createMercadoPagoCardPayment } from "@/lib/billing/mercadopago";

vi.mock("@/lib/env/server", () => ({
  requireIntegrationEnv: vi.fn(),
  EnvValidationError: class EnvValidationError extends Error {}
}));

vi.mock("@/lib/billing/auth.server", () => ({
  getBillingAuthContext: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  finalizeAiCreditOrderPayment: vi.fn()
}));

vi.mock("@/lib/ai/credit-orders.server", () => ({
  assertAiCreditPurchaseAllowed: vi.fn(),
  createAiCreditOrder: vi.fn(),
  getAiCreditPackageBySlug: vi.fn(),
  updateAiCreditOrder: vi.fn()
}));

vi.mock("@/lib/billing/mercadopago", () => ({
  createMercadoPagoCardPayment: vi.fn()
}));

vi.mock("@/lib/api/route-security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/route-security")>(
    "@/lib/api/route-security"
  );

  return {
    ...actual,
    assertRouteRateLimit: vi.fn(),
    assertSameOrigin: vi.fn(),
    logApiError: vi.fn()
  };
});

describe("AI Credits Checkout API - /api/billing/ai-credits/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireIntegrationEnv).mockImplementation(() => undefined);
    vi.mocked(getBillingAuthContext).mockResolvedValue({
      organizationId: "org-1",
      profileId: "profile-1",
      displayName: "Ana",
      brokerageName: "Leadi",
      email: "ana@example.com"
    });
    vi.mocked(assertAiCreditPurchaseAllowed).mockResolvedValue({
      allowed: true,
      reason: "allowed",
      message: "",
      subscriptionStatus: "active"
    });
  });

  it("cria o pedido, cobra no Mercado Pago e credita imediatamente quando o pagamento ja vem aprovado", async () => {
    vi.mocked(getAiCreditPackageBySlug).mockResolvedValue({
      id: "pkg-1",
      slug: "campanhas",
      name: "300 créditos",
      credits: 300,
      priceCents: 7000,
      currency: "BRL",
      description: "Uso misto",
      approximateUses: ["ate 70 textos"],
      featured: true,
      isActive: true
    });
    vi.mocked(createAiCreditOrder).mockResolvedValue({
      id: "order-1",
      organizationId: "org-1",
      userId: "profile-1",
      packageId: "pkg-1",
      paymentProvider: "mercadopago",
      providerPaymentId: null,
      providerPreferenceId: null,
      status: "pending",
      amountCents: 7000,
      credits: 300,
      metadata: {},
      createdAt: "2026-05-28T10:00:00.000Z",
      updatedAt: "2026-05-28T10:00:00.000Z",
      paidAt: null
    });
    vi.mocked(createMercadoPagoCardPayment).mockResolvedValue({
      id: "pay-1",
      status: "approved",
      status_detail: "accredited",
      transaction_amount: 70,
      date_approved: "2026-05-28T10:00:10.000Z"
    } as never);
    vi.mocked(updateAiCreditOrder).mockResolvedValue({} as never);
    vi.mocked(finalizeAiCreditOrderPayment).mockResolvedValue({
      orderStatus: "paid",
      alreadyProcessed: false,
      newBalance: 300,
      ledgerId: "ledger-1"
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/ai-credits/checkout", {
        method: "POST",
        body: JSON.stringify({
          packageSlug: "campanhas",
          token: "tok_123",
          payment_method_id: "visa",
          installments: 1,
          payer: {
            email: "ana@example.com"
          }
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      orderId: "order-1",
      status: "paid",
      credited: true,
      aiBalance: 300
    });
    expect(createMercadoPagoCardPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        externalReference: "order-1",
        paymentMethodId: "visa"
      })
    );
    expect(finalizeAiCreditOrderPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        providerPaymentId: "pay-1"
      })
    );
  });

  it("bloqueia pacote inexistente ou inativo", async () => {
    vi.mocked(getAiCreditPackageBySlug).mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/billing/ai-credits/checkout", {
        method: "POST",
        body: JSON.stringify({
          packageSlug: "essencial",
          token: "tok_123",
          payment_method_id: "visa",
          payer: {
            email: "ana@example.com"
          }
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Pacote de créditos indisponivel no momento.");
  });

  it("retorna erro quando a organizacao nao pode comprar créditos", async () => {
    const purchaseError = new Error(
      "Sua organizacao precisa de uma assinatura ativa para comprar créditos de IA."
    );
    purchaseError.name = "AiCreditPurchaseAccessError";
    vi.mocked(assertAiCreditPurchaseAllowed).mockRejectedValue(purchaseError);

    const response = await POST(
      new Request("http://localhost:3000/api/billing/ai-credits/checkout", {
        method: "POST",
        body: JSON.stringify({
          packageSlug: "essencial",
          token: "tok_123",
          payment_method_id: "visa",
          payer: {
            email: "ana@example.com"
          }
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(402);
    expect(data.error).toContain("assinatura ativa");
  });
});
