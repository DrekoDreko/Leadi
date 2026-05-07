import { NextResponse } from "next/server";
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

type CheckoutRequestBody = {
  productKey?: unknown;
};

export async function POST(request: Request) {
  try {
    if (!isBillingConfigured()) {
      requireIntegrationEnv("billing");
    }

    const body = (await request.json().catch(() => null)) as CheckoutRequestBody | null;
    const productKey = parseProductKey(body?.productKey);
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
    if (error instanceof EnvValidationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel iniciar a compra no Mercado Pago.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
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
