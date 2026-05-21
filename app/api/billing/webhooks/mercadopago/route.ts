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
import { assertPayloadSize, PayloadTooLargeError } from "@/lib/payload-limits";
import {
  assertRouteRateLimit,
  getErrorStatus,
  jsonError,
  logApiError
} from "@/lib/api/route-security";

export async function POST(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-webhook-mercadopago",
      limit: 120,
      windowMs: 60 * 1000
    });
    assertPayloadSize(request, "WEBHOOK_JSON");
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
        webhook: {
          data_id: dataId,
          request_id: requestId
        },
        payment: {
          id: paymentId,
          status: payment.status,
          status_detail: payment.status_detail ?? null,
          external_reference: externalReference || null,
          transaction_amount: payment.transaction_amount ?? null,
          currency_id: payment.currency_id ?? null,
          date_approved: payment.date_approved ?? null,
          date_created: payment.date_created ?? null,
          date_last_updated: payment.date_last_updated ?? null
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
    const status = getMercadoPagoWebhookErrorStatus(error);
    const message = getMercadoPagoWebhookErrorMessage(error);

    logApiError({
      route: "/api/billing/webhooks/mercadopago",
      operation: "PROCESS_MERCADOPAGO_WEBHOOK",
      message,
      status,
      error
    });

    return jsonError(message, status);
  }
}

function getMercadoPagoWebhookErrorStatus(error: unknown) {
  if (error instanceof EnvValidationError || error instanceof PayloadTooLargeError) {
    return getErrorStatus(error, error.status);
  }

  return 400;
}

function getMercadoPagoWebhookErrorMessage(error: unknown) {
  if (error instanceof EnvValidationError) {
    return "Configuracao de billing indisponivel.";
  }

  if (error instanceof PayloadTooLargeError) {
    return "Payload do webhook excede o limite permitido.";
  }

  return "Nao foi possivel processar o webhook.";
}
