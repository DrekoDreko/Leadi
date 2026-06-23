import "server-only";

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
  mapAbacatePayEventToStatus,
  mapAbacatePayEventStatus
} from "@/lib/billing/abacatepay";

/**
 * Nucleo de processamento do webhook do AbacatePay. Extraido da rota para que
 * tanto o webhook real quanto o modo de simulacao de pagamento (testes) usem
 * EXATAMENTE a mesma logica de credito/ativacao, sem risco de divergencia.
 *
 * Recebe o payload ja parseado/validado e aplica os efeitos colaterais
 * (ativar assinatura, creditar IA, marcar compra como paga). A verificacao de
 * assinatura HMAC e demais cuidados de transporte continuam na rota.
 */
export async function processAbacatePayWebhook(
  bodyPayload: unknown
): Promise<Record<string, unknown>> {
  const { webhookId, event, billingId, metadata, data } =
    parseAbacatePayWebhookPayload(bodyPayload);

  if (!event || !billingId) {
    return { ok: true, ignored: true };
  }

  const externalReference =
    (metadata.externalReference as string) ?? (data.externalId as string) ?? "";
  const mappedStatus = mapAbacatePayEventToStatus(event);
  const isPaid = mappedStatus === "paid";
  const nowIso = new Date().toISOString();

  // 1. Subscription payment
  const subscription =
    (externalReference
      ? await getBillingSubscriptionByExternalReference(externalReference)
      : null) || (await getBillingSubscriptionByExternalReference(billingId));

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

    return { ok: true, type: "subscription_payment", event };
  }

  // 2. AI credit order
  const aiCreditOrder =
    (await getAiCreditOrderByPaymentId(billingId)) ||
    (externalReference
      ? await getAiCreditOrderByExternalReference(externalReference)
      : null);

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
      return { ok: true, type: "ai_credit_order", event };
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

    return {
      ok: true,
      type: "ai_credit_order",
      event,
      credited: !finalization.alreadyProcessed
    };
  }

  // 3. Credit pack purchase
  const purchase =
    (await getBillingPurchaseByPaymentId(billingId)) ||
    (externalReference
      ? await getBillingPurchaseByExternalReference(externalReference)
      : null);

  if (!purchase) {
    return { ok: true, ignored: true };
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
    return { ok: true, event };
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

  return { ok: true, event, credited: !alreadyCredited };
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
