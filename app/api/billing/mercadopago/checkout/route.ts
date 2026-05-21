import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvValidationError, requireIntegrationEnv } from "@/lib/env/server";
import {
  BILLING_PRODUCTS,
  type BillingProductKey,
  getBillingProduct,
  getProductPriceDisplay
} from "@/lib/billing/catalog";
import { isBillingConfigured } from "@/lib/billing/config";
import { createBillingPurchase, updateBillingPurchase } from "@/lib/billing/admin";
import { createMercadoPagoCheckout } from "@/lib/billing/mercadopago";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

const checkoutSchema = z.object({
  productKey: z.string().trim().min(1, "Selecione um plano ou pacote de créditos valido.")
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-checkout",
      limit: 10,
      windowMs: 60 * 1000
    });

    if (!isBillingConfigured()) {
      requireIntegrationEnv("billing");
    }

    const body = await parseJsonBody(request, checkoutSchema);
    const productKey = parseProductKey(body.productKey);
    const product = getBillingProduct(productKey);
    const context = await getBillingAuthContext();

    if (!context) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const purchase = await createBillingPurchase({
      organizationId: context.organizationId,
      profileId: context.profileId,
      productKey: product.key,
      productKind: product.kind,
      credits: product.credits,
      amountCents: product.amountCents
    });

    const checkout = await createMercadoPagoCheckout({
      title: product.label,
      unitPrice: product.amountCents / 100,
      quantity: 1,
      externalReference: purchase.id,
      purchaseId: purchase.id,
      description: `${product.description} - ${getProductPriceDisplay(product)}`,
      payerEmail: context.email
    });

    await updateBillingPurchase(purchase.id, {
      externalReference: purchase.id,
      preferenceId: checkout.preferenceId,
      checkoutUrl: checkout.checkoutUrl,
      status: "pending",
      providerPayload: {
        preference_id: checkout.preferenceId,
        checkout_url: checkout.checkoutUrl
      }
    });

    return NextResponse.json({
      checkout: {
        purchaseId: purchase.id,
        preferenceId: checkout.preferenceId,
        checkoutUrl: checkout.checkoutUrl,
        product
      }
    });
  } catch (error) {
    const status = getCheckoutErrorStatus(error);
    const message = getCheckoutErrorMessage(error);

    logApiError({
      route: "/api/billing/mercadopago/checkout",
      operation: "CREATE_MERCADOPAGO_CHECKOUT",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function getCheckoutErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  if (error instanceof EnvValidationError) {
    return 503;
  }

  return 400;
}

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  if (error instanceof EnvValidationError) {
    return error.message;
  }

  return error instanceof Error && error.message
    ? error.message
    : "Nao foi possivel iniciar a compra no Mercado Pago.";
}

function parseProductKey(value: unknown): BillingProductKey {
  if (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(BILLING_PRODUCTS, value)
  ) {
    return value as BillingProductKey;
  }

  throw new Error("Selecione um plano ou pacote de créditos valido.");
}
