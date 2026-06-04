import { NextResponse } from "next/server";
import { z } from "zod";
import { requireIntegrationEnv } from "@/lib/env/server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { createBillingAdminClient } from "@/lib/billing/admin";
import { createMercadoPagoPreapproval } from "@/lib/billing/mercadopago";
import { isBillingCycle, type BillingCycle } from "@/lib/billing/checkout-flow";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
} from "@/lib/api/route-security";

const createSubscriptionSchema = z.object({
  planSlug: z.string().min(1),
  cycle: z.string().optional(),
  token: z.string().min(1),
  issuer_id: z.string().optional(),
  payment_method_id: z.string().optional(),
  payer: z.object({
    email: z.string().email(),
    identification: z.object({
      type: z.string(),
      number: z.string(),
    }).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-create-subscription",
      limit: 5,
      windowMs: 60 * 1000,
    });

    requireIntegrationEnv("billing");

    const body = await parseJsonBody(request, createSubscriptionSchema);
    const context = await getBillingAuthContext();

    if (!context) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const supabase = createBillingAdminClient();

    // Busca o plano correspondente no banco de dados
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("code", body.planSlug)
      .eq("status", "active")
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plano inválido ou indisponível." }, { status: 400 });
    }

    const cycle = parseCycle(body.cycle);

    if (cycle === "annual") {
      return NextResponse.json(
        {
          error:
            "A cobrança anual ainda não está disponível no checkout. Escolha o ciclo mensal por enquanto."
        },
        { status: 409 }
      );
    }

    const planMetadata =
      plan.metadata && typeof plan.metadata === "object" && !Array.isArray(plan.metadata)
        ? (plan.metadata as Record<string, unknown>)
        : {};
    const includedCredits = getMetadataNumber(planMetadata, "included_credits");
    const includedUsers = getMetadataNumber(planMetadata, "included_users");
    const extraUserAmountCents = getMetadataNumber(planMetadata, "extra_user_amount_cents");

    // Cria a assinatura local em status 'pending'
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        organization_id: context.organizationId,
        plan_id: plan.id,
        status: "pending",
        gateway: "mercado_pago",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          requested_cycle: cycle,
          included_credits: includedCredits,
          included_users: includedUsers,
          extra_user_amount_cents: extraUserAmountCents
        }
      })
      .select("*")
      .single();

    if (subError || !subscription) {
      throw new Error("Não foi possível registrar a assinatura.");
    }

    // Cria a assinatura (Preapproval) no Mercado Pago usando o token do Brick
    const preapproval = await createMercadoPagoPreapproval({
      reason: `Assinatura Plano ${plan.name} - Leadi`,
      externalReference: subscription.id,
      payerEmail: body.payer.email,
      cardTokenId: body.token,
      amount: plan.amount_cents / 100,
      billingCycle: cycle
    });

    // Atualiza a assinatura local com o ID retornado pelo Mercado Pago
    await supabase
      .from("subscriptions")
      .update({ external_id: preapproval.id })
      .eq("id", subscription.id);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: preapproval.status,
    });
  } catch (error) {
    const status = getErrorStatusOrDefault(error);
    const message = getErrorMessage(error);

    logApiError({
      route: "/api/billing/create-subscription",
      operation: "CREATE_MERCADOPAGO_SUBSCRIPTION",
      message,
      status,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function getErrorStatusOrDefault(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }
  return 400;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Não foi possível criar a assinatura.";
}

function parseCycle(value: string | undefined): BillingCycle {
  if (value && isBillingCycle(value)) {
    return value;
  }

  return "monthly";
}

function getMetadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
