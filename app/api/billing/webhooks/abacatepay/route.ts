import { NextResponse } from "next/server";
import {
  creditBillingCredits,
  getBillingPurchaseByExternalReference,
  getBillingPurchaseByPaymentId,
  updateBillingPurchase
} from "@/lib/billing/admin";
import {
  grantSubscriptionIncludedAiCredits,
  finalizeAiCreditOrderPayment
} from "@/lib/ai/credits";
import {
  getAiCreditOrderByExternalReference,
  getAiCreditOrderByPaymentId,
  updateAiCreditOrder
} from "@/lib/ai/credit-orders.server";
import {
  getBillingSubscriptionByExternalReference,
  updateBillingSubscription,
  createBillingPaymentEvent
} from "@/lib/billing/subscriptions";
import {
  parseAbacatePayWebhookPayload,
  verifyAbacatePayWebhookSignature,
  mapAbacatePayEventToStatus,
  mapAbacatePayEventStatus,
} from "@/lib/billing/abacatepay";
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
      keyPrefix: "api-billing-webhook-abacatepay",
      limit: 120,
      windowMs: 60 * 1000
    });
    assertPayloadSize(request, "WEBHOOK_JSON");

    const bodyText = await request.text();

    const signature = request.headers.get("x-webhook-signature") ?? "";
    if (signature && !verifyAbacatePayWebhookSignature(bodyText, signature)) {
      return jsonError("Assinatura do webhook invalida.", 401);
    }

    let bodyPayload: unknown = {};
    try {
      bodyPayload = JSON.parse(bodyText);
    } catch {
      return jsonError("Payload JSON invalido.", 400);
    }

    const { webhookId, event, billingId, status, metadata, data } =
      parseAbacatePayWebhookPayload(bodyPayload);

    if (!event || !billingId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const externalReference = (metadata.externalReference as string) ??
      (data.externalId as string) ?? "";
    const mappedStatus = mapAbacatePayEventToStatus(event);
    const isPaid = mappedStatus === "paid";
    const nowIso = new Date().toISOString();

    // 1. Subscription payment
    const subscription =
      (externalReference ? await getBillingSubscriptionByExternalReference(externalReference) : null) ||
      (await getBillingSubscriptionByExternalReference(billingId));

    if (subscription) {
      await createBillingPaymentEvent({
        organizationId: subscription.organization_id,
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        gateway: "abacatepay",
        eventType: "payment",
        status: mapAbacatePayEventStatus(event),
        externalId: billingId,
        amountCents: 0,
        payload: bodyPayload as Record<string, unknown>
      });

      if (isPaid) {
        const cycle = resolveSubscriptionCyclePeriod(
          subscription.current_period_start,
          subscription.current_period_end,
          nowIso
        );

        await updateBillingSubscription(subscription.id, {
          status: "active",
          current_period_start: cycle.currentPeriodStart,
          current_period_end: cycle.currentPeriodEnd
        });

        await grantSubscriptionIncludedAiCredits({
          subscriptionId: subscription.id,
          referenceId: `${subscription.id}:${cycle.currentPeriodStart}`,
          metadata: {
            billing_id: billingId,
            webhook_id: webhookId,
            webhook_event: event,
            payment_paid_at: nowIso
          }
        });
      } else if (mappedStatus === "cancelled") {
        await updateBillingSubscription(subscription.id, { status: "past_due" });
      }

      return NextResponse.json({ ok: true, type: "subscription_payment", event });
    }

    // 2. AI credit order
    const aiCreditOrder =
      (await getAiCreditOrderByPaymentId(billingId)) ||
      (externalReference ? await getAiCreditOrderByExternalReference(externalReference) : null);

    if (aiCreditOrder) {
      await updateAiCreditOrder(aiCreditOrder.id, {
        status: isPaid ? undefined : mappedStatus === "disputed" ? "failed" : mappedStatus,
        providerPaymentId: billingId,
        metadata: {
          webhook_id: webhookId,
          webhook_event: event,
          webhook_billing_id: billingId
        }
      });

      if (!isPaid) {
        return NextResponse.json({ ok: true, type: "ai_credit_order", event });
      }

      const finalization = await finalizeAiCreditOrderPayment({
        orderId: aiCreditOrder.id,
        providerPaymentId: billingId,
        paidAt: nowIso,
        metadata: {
          webhook_id: webhookId,
          webhook_event: event,
          webhook_billing_id: billingId
        }
      });

      return NextResponse.json({
        ok: true,
        type: "ai_credit_order",
        event,
        credited: !finalization.alreadyProcessed
      });
    }

    // 3. Credit pack purchase
    const purchase =
      (await getBillingPurchaseByPaymentId(billingId)) ||
      (externalReference ? await getBillingPurchaseByExternalReference(externalReference) : null);

    if (!purchase) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const purchaseStatus = isPaid
      ? "approved"
      : mappedStatus === "cancelled"
        ? "cancelled"
        : mappedStatus === "refunded" || mappedStatus === "disputed"
          ? "rejected"
          : "pending";

    await updateBillingPurchase(purchase.id, {
      paymentId: billingId,
      externalReference: externalReference || purchase.external_reference || purchase.id,
      status: purchaseStatus as "approved" | "rejected" | "cancelled" | "pending",
      providerPayload: {
        webhook_id: webhookId,
        webhook_event: event,
        billing_id: billingId,
        payment: bodyPayload as Record<string, unknown>
      }
    });

    if (!isPaid) {
      return NextResponse.json({ ok: true, event });
    }

    const alreadyCredited = purchase.status === "credited";

    if (!alreadyCredited) {
      await creditBillingCredits({
        organizationId: purchase.organization_id,
        amount: purchase.credits,
        source: purchase.product_kind === "plan" ? "plan" : "pack",
        referenceType: "abacatepay_payment",
        referenceId: billingId,
        metadata: {
          purchase_id: purchase.id,
          product_key: purchase.product_key,
          amount_cents: purchase.amount_cents,
          currency: purchase.currency,
          webhook_event: event
        }
      });

      await updateBillingPurchase(purchase.id, {
        status: "credited",
        creditedAt: nowIso
      });
    }

    return NextResponse.json({ ok: true, event, credited: !alreadyCredited });
  } catch (error) {
    const status = getWebhookErrorStatus(error);
    const message = getWebhookErrorMessage(error);

    logApiError({
      route: "/api/billing/webhooks/abacatepay",
      operation: "PROCESS_ABACATEPAY_WEBHOOK",
      message,
      status,
      error
    });

    return jsonError(message, status);
  }
}

function getWebhookErrorStatus(error: unknown) {
  if (error instanceof EnvValidationError || error instanceof PayloadTooLargeError) {
    return getErrorStatus(error, error.status);
  }

  return 400;
}

function getWebhookErrorMessage(error: unknown) {
  if (error instanceof EnvValidationError) {
    return "Configuracao de billing indisponivel.";
  }

  if (error instanceof PayloadTooLargeError) {
    return "Payload do webhook excede o limite permitido.";
  }

  return "Nao foi possivel processar o webhook.";
}

function resolveSubscriptionCyclePeriod(
  currentPeriodStart: string,
  currentPeriodEnd: string,
  paidAt: string | null
) {
  const paymentDate = paidAt ? new Date(paidAt) : new Date();
  const fallbackStart = new Date();
  const fallbackEnd = addMonths(fallbackStart, 1);
  let start = isValidDate(currentPeriodStart) ? new Date(currentPeriodStart) : fallbackStart;
  let end = isValidDate(currentPeriodEnd) ? new Date(currentPeriodEnd) : fallbackEnd;

  if (!(end.getTime() > start.getTime())) {
    start = fallbackStart;
    end = fallbackEnd;
  }

  while (paymentDate.getTime() >= end.getTime()) {
    start = end;
    end = addMonths(end, 1);
  }

  return {
    currentPeriodStart: start.toISOString(),
    currentPeriodEnd: end.toISOString()
  };
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isValidDate(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return Number.isFinite(new Date(value).getTime());
}
