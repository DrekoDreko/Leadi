import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvValidationError, requireIntegrationEnv } from "@/lib/env/server";
import {
  createAiCreditOrder,
  getAiCreditPackageBySlug,
  assertAiCreditPurchaseAllowed,
  updateAiCreditOrder
} from "@/lib/ai/credit-orders.server";
import {
  finalizeAiCreditOrderPayment
} from "@/lib/ai/credits";
import {
  isAiCreditPackageSlug,
  type AiCreditPackageSlug
} from "@/lib/ai/credit-packages";
import { createMercadoPagoCardPayment } from "@/lib/billing/mercadopago";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

const aiCreditsCheckoutSchema = z.object({
  packageSlug: z.string().trim().min(1, "Selecione um pacote de créditos valido."),
  token: z.string().trim().min(1, "Nao foi possivel validar o token do pagamento."),
  issuer_id: z.string().trim().optional(),
  payment_method_id: z.string().trim().min(1, "Forma de pagamento invalida."),
  installments: z.coerce.number().int().positive().max(24).optional(),
  payer: z.object({
    email: z.string().trim().email("Informe um email valido para o pagamento."),
    identification: z
      .object({
        type: z.string().trim().min(1),
        number: z.string().trim().min(1)
      })
      .optional()
  })
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-ai-credits-checkout",
      limit: 8,
      windowMs: 60 * 1000
    });

    requireIntegrationEnv("billing");

    const body = await parseJsonBody(request, aiCreditsCheckoutSchema);
    const packageSlug = parsePackageSlug(body.packageSlug);
    const context = await getBillingAuthContext();

    if (!context) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    await assertAiCreditPurchaseAllowed(context.organizationId);

    const packageRecord = await getAiCreditPackageBySlug(packageSlug);

    if (!packageRecord?.id || !packageRecord.isActive) {
      return NextResponse.json(
        { error: "Pacote de créditos indisponivel no momento." },
        { status: 404 }
      );
    }

    const order = await createAiCreditOrder({
      organizationId: context.organizationId,
      userId: context.profileId,
      packageRecord,
      metadata: {
        package_slug: packageRecord.slug,
        checkout_mode: "ai_credits"
      }
    });

    const payment = await createMercadoPagoCardPayment({
      transactionAmount: packageRecord.priceCents / 100,
      token: body.token,
      description: `${packageRecord.name} - ${packageRecord.credits} créditos de IA`,
      externalReference: order.id,
      paymentMethodId: body.payment_method_id,
      issuerId: body.issuer_id,
      installments: body.installments,
      payer: body.payer
    });

    const paymentId = String(payment.id);
    const mappedStatus = mapMercadoPagoPaymentStatus(payment.status);
    const metadata = {
      payment_status: payment.status ?? null,
      payment_status_detail: payment.status_detail ?? null,
      payment_method_id: body.payment_method_id,
      transaction_amount: payment.transaction_amount ?? packageRecord.priceCents / 100
    };

    await updateAiCreditOrder(order.id, {
      status: payment.status === "approved" ? undefined : mappedStatus,
      providerPaymentId: paymentId,
      metadata
    });

    let credited = false;
    let aiBalance: number | null = null;

    if (payment.status === "approved") {
      const finalization = await finalizeAiCreditOrderPayment({
        orderId: order.id,
        providerPaymentId: paymentId,
        paidAt: payment.date_approved ?? payment.date_last_updated ?? null,
        metadata
      });

      credited = !finalization.alreadyProcessed;
      aiBalance = finalization.newBalance;
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: mappedStatus,
      credited,
      aiBalance
    });
  } catch (error) {
    const status = getAiCreditsCheckoutStatus(error);
    const message = getAiCreditsCheckoutMessage(error);

    logApiError({
      route: "/api/billing/ai-credits/checkout",
      operation: "CREATE_AI_CREDITS_CHECKOUT",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function parsePackageSlug(value: string): AiCreditPackageSlug {
  if (isAiCreditPackageSlug(value)) {
    return value;
  }

  throw new Error("Selecione um pacote de créditos valido.");
}

function mapMercadoPagoPaymentStatus(status: string | undefined) {
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

function getAiCreditsCheckoutStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  if (error instanceof EnvValidationError) {
    return 503;
  }

  if (error instanceof Error && error.name === "AiCreditPurchaseAccessError") {
    return 402;
  }

  return 400;
}

function getAiCreditsCheckoutMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  if (error instanceof EnvValidationError) {
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Nao foi possivel iniciar a compra de créditos de IA.";
}
