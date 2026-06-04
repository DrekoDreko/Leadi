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
  fetchMercadoPagoPayment,
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

    // Read body text once so we can parse it
    const bodyText = await request.text();
    let bodyPayload: { data?: { id?: string | number }, id?: string | number, type?: string, topic?: string } = {};
    try {
      bodyPayload = JSON.parse(bodyText);
    } catch {}

    const url = new URL(request.url);
    const urlDataId = url.searchParams.get("data.id") ?? url.searchParams.get("data_id");
    const dataId = (urlDataId || bodyPayload?.data?.id || bodyPayload?.id || "").toString().toLowerCase().trim();
    const eventType = (url.searchParams.get("type") || url.searchParams.get("topic") || bodyPayload?.type || bodyPayload?.topic || "").toString().toLowerCase().trim();

    if (!validateMercadoPagoWebhookSignature({ signatureHeader: signature, requestIdHeader: requestId, dataId })) {
      return NextResponse.json({ error: "Webhook Mercado Pago invalido." }, { status: 401 });
    }

    if (!dataId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 1. Lidar com webhooks de Assinatura (Preapproval)
    if (eventType === "subscription_preapproval") {
      // O MP enviou notificação de que a assinatura mudou de status
      // A assinatura real precisa ser atualizada no banco.
      const subscription = await getBillingSubscriptionByExternalReference(dataId);
      if (subscription) {
        // Neste caso básico, o status poderia vir de um GET ao /preapproval/:id, 
        // mas vamos apenas atualizar com as info do webhook se disponíveis ou aguardar o pagamento.
        await updateBillingSubscription(subscription.id, {
          status: "active" // Ou verificar status real
        });
      }
      return NextResponse.json({ ok: true, type: eventType });
    }

    // 2. Lidar com webhooks de Pagamentos (One-off e Mensalidades)
    if (eventType === "payment") {
      const payment = await fetchMercadoPagoPayment(dataId);
      const paymentId = String(payment.id);
      const externalReference = payment.external_reference?.toString() ?? "";

      // Verifica se o pagamento é referente a uma Assinatura (Subscription)
      const subscription = externalReference ? await getBillingSubscriptionByExternalReference(externalReference) : null;
      if (subscription) {
        // Log do evento
        await createBillingPaymentEvent({
          organizationId: subscription.organization_id,
          subscriptionId: subscription.id,
          planId: subscription.plan_id,
          gateway: "mercado_pago",
          eventType: "payment",
          status: mapBillingPaymentEventStatus(payment.status),
          externalId: paymentId,
          amountCents: payment.transaction_amount ? Math.round(payment.transaction_amount * 100) : 0,
          payload: payment
        });

        // Atualiza status da assinatura
        if (payment.status === "approved") {
          const cycle = resolveSubscriptionCyclePeriod(
            subscription.current_period_start,
            subscription.current_period_end,
            payment.date_approved ?? payment.date_last_updated ?? null
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
              payment_id: paymentId,
              payment_status: payment.status,
              payment_approved_at: payment.date_approved ?? payment.date_last_updated ?? null
            }
          });
        } else if (payment.status === "rejected" || payment.status === "cancelled") {
          await updateBillingSubscription(subscription.id, { status: "past_due" });
        }

        return NextResponse.json({ ok: true, type: "subscription_payment", status: payment.status });
      }

      const aiCreditOrder =
        (await getAiCreditOrderByPaymentId(paymentId)) ||
        (externalReference ? await getAiCreditOrderByExternalReference(externalReference) : null);

      if (aiCreditOrder) {
        const mappedStatus = mapMercadoPagoOrderStatus(payment.status);
        const metadata = {
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
        };

        await updateAiCreditOrder(aiCreditOrder.id, {
          status: payment.status === "approved" ? undefined : mappedStatus,
          providerPaymentId: paymentId,
          metadata
        });

        if (payment.status !== "approved") {
          return NextResponse.json({ ok: true, type: "ai_credit_order", status: payment.status });
        }

        const finalization = await finalizeAiCreditOrderPayment({
          orderId: aiCreditOrder.id,
          providerPaymentId: paymentId,
          paidAt: payment.date_approved ?? payment.date_last_updated ?? null,
          metadata
        });

        return NextResponse.json({
          ok: true,
          type: "ai_credit_order",
          status: payment.status,
          credited: !finalization.alreadyProcessed
        });
      }

      // Caso contrário, é uma compra avulsa (Credit Pack)
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
    }

    return NextResponse.json({ ok: true, ignored: true });
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

function mapMercadoPagoOrderStatus(status: string | undefined) {
  if (status === "approved") {
    return "paid" as const;
  }

  if (status === "cancelled") {
    return "cancelled" as const;
  }

  if (status === "rejected") {
    return "failed" as const;
  }

  if (status === "refunded" || status === "charged_back") {
    return "refunded" as const;
  }

  return "pending" as const;
}

function mapBillingPaymentEventStatus(status: string | undefined) {
  if (status === "approved") {
    return "processed";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  if (status === "rejected" || status === "charged_back") {
    return "failed";
  }

  return "pending";
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
