import { NextResponse } from "next/server";
import { getBillingSubscriptionByExternalReference } from "@/lib/billing/subscriptions";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  logApiError
} from "@/lib/api/route-security";

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-subscription-status",
      limit: 60,
      windowMs: 60 * 1000
    });

    const context = await getBillingAuthContext();

    if (!context) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("id")?.trim();

    if (!subscriptionId) {
      return NextResponse.json({ error: "ID da assinatura ausente." }, { status: 400 });
    }

    const subscription = await getBillingSubscriptionByExternalReference(subscriptionId);

    if (!subscription || subscription.organization_id !== context.organizationId) {
      return NextResponse.json({ error: "Assinatura nao encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      status: subscription.status
    });
  } catch (error) {
    logApiError({
      route: "/api/billing/subscription-status",
      operation: "CHECK_SUBSCRIPTION_STATUS",
      message: error instanceof Error ? error.message : "Erro ao verificar status.",
      status: 400,
      error
    });

    return NextResponse.json(
      { error: "Nao foi possivel verificar o status da assinatura." },
      { status: 400 }
    );
  }
}
