import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "./route";
import { finalizeAiCreditOrderPayment, grantSubscriptionIncludedAiCredits } from "@/lib/ai/credits";
import {
  getAiCreditOrderByExternalReference,
  getAiCreditOrderByPaymentId,
  updateAiCreditOrder
} from "@/lib/ai/credit-orders.server";
import { fetchMercadoPagoPayment, validateMercadoPagoWebhookSignature } from "@/lib/billing/mercadopago";

vi.mock("@/lib/ai/credits", () => ({
  finalizeAiCreditOrderPayment: vi.fn(),
  grantSubscriptionIncludedAiCredits: vi.fn()
}));

vi.mock("@/lib/ai/credit-orders.server", () => ({
  getAiCreditOrderByExternalReference: vi.fn(),
  getAiCreditOrderByPaymentId: vi.fn(),
  updateAiCreditOrder: vi.fn()
}));

vi.mock("@/lib/billing/admin", () => ({
  creditBillingCredits: vi.fn(),
  getBillingPurchaseByExternalReference: vi.fn().mockResolvedValue(null),
  getBillingPurchaseByPaymentId: vi.fn().mockResolvedValue(null),
  updateBillingPurchase: vi.fn()
}));

vi.mock("@/lib/billing/subscriptions", () => ({
  createBillingPaymentEvent: vi.fn(),
  getBillingSubscriptionByExternalReference: vi.fn().mockResolvedValue(null),
  updateBillingSubscription: vi.fn()
}));

vi.mock("@/lib/billing/mercadopago", () => ({
  fetchMercadoPagoPayment: vi.fn(),
  getMercadoPagoWebhookRequestId: vi.fn(() => "req-1"),
  getMercadoPagoWebhookSignature: vi.fn(() => "sig"),
  validateMercadoPagoWebhookSignature: vi.fn(() => true)
}));

vi.mock("@/lib/api/route-security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/route-security")>(
    "@/lib/api/route-security"
  );

  return {
    ...actual,
    assertRouteRateLimit: vi.fn(),
    logApiError: vi.fn()
  };
});

vi.mock("@/lib/payload-limits", () => ({
  assertPayloadSize: vi.fn(),
  PayloadTooLargeError: class PayloadTooLargeError extends Error {
    status = 413;
  }
}));

describe("Mercado Pago Webhook - AI credit orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateMercadoPagoWebhookSignature).mockReturnValue(true);
    vi.mocked(grantSubscriptionIncludedAiCredits).mockResolvedValue({
      newBalance: 75,
      includedBalance: 75,
      purchasedBalance: 0,
      ledgerId: "grant-ledger-1",
      alreadyProcessed: false
    });
  });

  it("não duplica créditos quando o webhook aprovado chega novamente", async () => {
    vi.mocked(fetchMercadoPagoPayment).mockResolvedValue({
      id: "pay-1",
      status: "approved",
      external_reference: "order-1",
      transaction_amount: 79.9,
      currency_id: "BRL",
      status_detail: "accredited",
      date_approved: "2026-05-28T10:10:00.000Z"
    } as never);
    vi.mocked(getAiCreditOrderByPaymentId).mockResolvedValue({
      id: "order-1",
      organizationId: "org-1"
    } as never);
    vi.mocked(getAiCreditOrderByExternalReference).mockResolvedValue(null);
    vi.mocked(updateAiCreditOrder).mockResolvedValue({} as never);
    vi.mocked(finalizeAiCreditOrderPayment).mockResolvedValue({
      orderStatus: "paid",
      alreadyProcessed: true,
      newBalance: 350,
      ledgerId: "ledger-1"
    });

    const response = await POST(
      new Request(
        "http://localhost:3000/api/billing/webhooks/mercadopago?type=payment&data.id=pay-1",
        {
          method: "POST",
          body: JSON.stringify({
            data: { id: "pay-1" },
            type: "payment"
          })
        }
      )
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      ok: true,
      type: "ai_credit_order",
      status: "approved",
      credited: false
    });
    expect(finalizeAiCreditOrderPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        providerPaymentId: "pay-1"
      })
    );
  });
});
