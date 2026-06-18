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
  isAiCreditPackageSlug,
  type AiCreditPackageSlug
} from "@/lib/ai/credit-packages";
import { createAbacatePayTransparent } from "@/lib/billing/abacatepay";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

const pixCheckoutSchema = z.object({
  packageSlug: z.string().trim().min(1, "Selecione um pacote de créditos valido.")
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-pix-create",
      limit: 8,
      windowMs: 60 * 1000
    });

    requireIntegrationEnv("billing");

    const body = await parseJsonBody(request, pixCheckoutSchema);
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
        checkout_mode: "pix_transparent"
      }
    });

    const charge = await createAbacatePayTransparent({
      amount: packageRecord.priceCents,
      description: `${packageRecord.name} - ${packageRecord.credits} créditos de IA`,
      externalId: order.id,
      customerEmail: context.email,
      metadata: {
        order_id: order.id,
        package_slug: packageRecord.slug
      }
    });

    await updateAiCreditOrder(order.id, {
      providerPreferenceId: charge.id,
      metadata: {
        transparent_id: charge.id,
        checkout_mode: "pix_transparent",
        br_code: charge.brCode,
        br_code_base64: charge.brCodeBase64,
        pix_amount: charge.amount,
        pix_expires_at: charge.expiresAt
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      transparentId: charge.id,
      brCode: charge.brCode,
      brCodeBase64: charge.brCodeBase64,
      amount: charge.amount,
      expiresAt: charge.expiresAt
    });
  } catch (error) {
    const status = getPixErrorStatus(error);
    const message = getPixErrorMessage(error);

    logApiError({
      route: "/api/billing/pix/create",
      operation: "CREATE_PIX_TRANSPARENT",
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

function getPixErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) return getErrorStatus(error);
  if (error instanceof EnvValidationError) return 503;
  if (error instanceof Error && error.name === "AiCreditPurchaseAccessError") return 402;
  return 400;
}

function getPixErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) return error.message;
  if (error instanceof EnvValidationError) return error.message;
  return error instanceof Error && error.message
    ? error.message
    : "Nao foi possivel gerar o PIX.";
}
