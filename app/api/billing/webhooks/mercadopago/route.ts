import { NextResponse } from "next/server";
import {
  creditBillingCredits,
  getBillingPurchaseByExternalReference,
  getBillingPurchaseByPaymentId,
  updateBillingPurchase
} from "@/lib/billing/admin";
import {
  fetchMercadoPagoPayment,
  getMercadoPagoPaymentIdFromWebhook,
  getMercadoPagoPaymentPayload,
  getMercadoPagoWebhookRequestId,
  getMercadoPagoWebhookSignature,
  validateMercadoPagoWebhookSignature
} from "@/lib/billing/mercadopago";
import { EnvValidationError } from "@/lib/env/server";

export async function POST(request: Request) {
  try {
    const signature = getMercadoPagoWebhookSignature(request);
    const requestId = getMercadoPagoWebhookRequestId(request);
    const urlPaymentId = getMercadoPagoPaymentIdFromWebhook(request);
    const bodyPayload = await getMercadoPagoPaymentPayload(request);
    const dataId = urlPaymentId || bodyPayload.dataId;

    if (!validateMercadoPagoWebhookSignature({ signatureHeader: signature, requestIdHeader: requestId, dataId })) {
      return NextResponse.json({ error: "Webhook Mercado Pago invalido." }, { status: 401 });
    }

    if (!dataId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = await fetchMercadoPagoPayment(dataId);
    const paymentId = String(payment.id);
    const externalReference = payment.external_reference?.toString() ?? "";
    const purchase =
      (await getBillingPurchaseByPaymentId(paymentId)) ||
      (externalReference ? await getBillingPurchaseByExternalReference(externalReference) : null);

    if (!purchase) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    await updateBillingPurchase(purchase.id, {
      paymentId,
      externalReference: externalReference || purchase.external_reference || purchase.id,
      status:
        payment.status === "approved"
          ? "approved"
          : payment.status === "rejected"
            ? "rejected"
            : payment.status === "cancelled"
              ? "cancelled"
              : payment.status === "expired"
                ? "expired"
                : "pending",
      providerPayload: {
        payment,
        webhook: {
          data_id: dataId,
          request_id: requestId,
          signature
        }
      }
    });

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    const alreadyCredited = purchase.status === "credited";

    if (!alreadyCredited) {
      await creditBillingCredits({
        organizationId: purchase.organization_id,
        amount: purchase.credits,
        source: purchase.product_kind === "plan" ? "plan" : "pack",
        referenceType: "mercadopago_payment",
        referenceId: paymentId,
        metadata: {
          purchase_id: purchase.id,
          product_key: purchase.product_key,
          amount_cents: purchase.amount_cents,
          currency: purchase.currency,
          payment_status: payment.status
        }
      });

      await updateBillingPurchase(purchase.id, {
        status: "credited",
        creditedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ ok: true, status: payment.status, credited: !alreadyCredited });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel processar o webhook.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
