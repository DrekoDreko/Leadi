import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/data/pricing";
import {
  buildAiCreditsCheckoutPath,
  formatAiCreditPackagePrice,
  getAiCreditPackagePresentation,
  isAiCreditPackageSlug
} from "@/lib/ai/credit-packages";
import {
  getAiCreditOrderById,
  getAiCreditOrderPackageSlug,
  getAiCreditOrderPixDetails,
  getAiCreditPackageBySlug,
  isAiCreditOrderPixExpired
} from "@/lib/ai/credit-orders.server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  buildPlanCheckoutPath,
  buildPlanSignupPath,
  isBillingCycle,
  isPublicPlanSlug,
  type BillingCycle
} from "@/lib/billing/checkout-flow";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckoutClient, type PixData } from "./checkout-client";

type CheckoutMode = "plan" | "ai_credits";

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{
    plan?: string;
    cycle?: string;
    mode?: string;
    package?: string;
    resume?: string;
  }>;
}) {
  const params = await searchParams;
  const mode = resolveCheckoutMode(params);

  if (mode === "ai_credits") {
    if (params.resume) {
      return renderResumeCheckout(params.resume);
    }

    const packageSlug = params.package;

    if (!packageSlug || !isAiCreditPackageSlug(packageSlug)) {
      redirect("/dashboard/perfil/creditos?purchase=package_unavailable");
    }

    const creditPackage = await getAiCreditPackageBySlug(packageSlug);

    if (!creditPackage || !creditPackage.isActive) {
      redirect("/dashboard/perfil/creditos?purchase=package_unavailable");
    }

    const displayPackage = getAiCreditPackagePresentation(creditPackage);

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        redirect(`/login?next=${encodeURIComponent(buildAiCreditsCheckoutPath(packageSlug))}`);
      }
    }

    return (
      <CheckoutLayout
        eyebrow="Créditos de IA"
        summaryDescription={`Compra de ${creditPackage.credits} créditos para o seu saldo pessoal.`}
        summaryItems={displayPackage.approximateUses}
        summaryLabel="Pacote"
        summaryPrice={formatAiCreditPackagePrice(creditPackage.priceCents)}
        summaryTitle={displayPackage.name}
        title="Finalizar compra de créditos"
      >
        <CheckoutClient
          amount={creditPackage.priceCents / 100}
          checkoutMode="ai_credits"
          creditPackageSlug={creditPackage.slug}
        />
      </CheckoutLayout>
    );
  }

  const planSlug = params.plan;
  const requestedCycle = params.cycle;
  const cycle: BillingCycle =
    requestedCycle && isBillingCycle(requestedCycle) ? requestedCycle : "monthly";

  if (!planSlug || !isPublicPlanSlug(planSlug)) {
    redirect("/pricing");
  }

  const plan = pricingPlans.find((pricingPlan) => pricingPlan.slug === planSlug);

  if (!plan) {
    redirect("/pricing");
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(buildPlanSignupPath(planSlug, cycle));
    }
  }

  const currentPrice = plan.prices[cycle];
  const paymentDisabledMessage =
    currentPrice.available
      ? null
      : currentPrice.unavailableMessage ??
        "Este ciclo ainda não está disponível no checkout.";

  return (
    <CheckoutLayout
      eyebrow="Planos"
      paymentDisabledHref={buildPlanCheckoutPath(planSlug, "monthly")}
      paymentDisabledLabel="Assinar no ciclo mensal"
      paymentDisabledMessage={paymentDisabledMessage}
      summaryDescription={`Você está assinando o plano ${plan.name} no ciclo ${
        cycle === "annual" ? "anual" : "mensal"
      }.`}
      summaryItems={plan.features}
      summaryLabel="Plano"
      summaryPrice={`${currentPrice.amount}${currentPrice.suffix}`}
      summaryTitle={plan.name}
      title="Finalizar assinatura"
    >
      <CheckoutClient
        amount={currentPrice.checkoutAmountCents / 100}
        billingCycle={cycle}
        checkoutMode="plan"
        planSlug={planSlug}
      />
    </CheckoutLayout>
  );
}

async function renderResumeCheckout(orderId: string) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard/perfil/creditos");
  }

  const billingContext = await getBillingAuthContext();

  if (!billingContext) {
    redirect("/login?next=/dashboard/perfil/creditos");
  }

  const order = await getAiCreditOrderById(orderId);

  if (
    !order ||
    order.organizationId !== billingContext.organizationId ||
    order.userId !== billingContext.profileId
  ) {
    redirect("/dashboard/perfil/creditos");
  }

  const packageSlug = getAiCreditOrderPackageSlug(order);
  const pix = getAiCreditOrderPixDetails(order);

  // Sem PIX recuperavel, expirado ou ja resolvido: manda gerar um novo.
  if (order.status !== "pending" || !pix || isAiCreditOrderPixExpired(order)) {
    redirect(
      packageSlug && isAiCreditPackageSlug(packageSlug)
        ? buildAiCreditsCheckoutPath(packageSlug)
        : "/dashboard/perfil/creditos"
    );
  }

  const slug = packageSlug && isAiCreditPackageSlug(packageSlug) ? packageSlug : null;
  const creditPackage = slug ? await getAiCreditPackageBySlug(slug) : null;
  const displayPackage = creditPackage ? getAiCreditPackagePresentation(creditPackage) : null;

  const initialPix: PixData = {
    orderId: order.id,
    transparentId: pix.transparentId,
    brCode: pix.brCode,
    brCodeBase64: pix.brCodeBase64,
    amount: pix.amount,
    expiresAt: pix.expiresAt ?? ""
  };

  return (
    <CheckoutLayout
      eyebrow="Créditos de IA"
      summaryDescription={`Compra de ${order.credits} créditos para o seu saldo pessoal.`}
      summaryItems={displayPackage?.approximateUses ?? []}
      summaryLabel="Pacote"
      summaryPrice={formatAiCreditPackagePrice(order.amountCents)}
      summaryTitle={displayPackage?.name ?? `${order.credits} créditos de IA`}
      title="Concluir pagamento dos créditos"
    >
      <CheckoutClient
        amount={order.amountCents / 100}
        checkoutMode="ai_credits"
        creditPackageSlug={slug ?? ""}
        initialPix={initialPix}
      />
    </CheckoutLayout>
  );
}

function CheckoutLayout({
  title,
  eyebrow,
  summaryTitle,
  summaryDescription,
  summaryLabel,
  summaryPrice,
  summaryItems,
  paymentDisabledMessage,
  paymentDisabledHref,
  paymentDisabledLabel,
  children
}: {
  title: string;
  eyebrow: string;
  summaryTitle: string;
  summaryDescription: string;
  summaryLabel: string;
  summaryPrice: string;
  summaryItems: string[];
  paymentDisabledMessage?: string | null;
  paymentDisabledHref?: string;
  paymentDisabledLabel?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-4 md:py-8">
      <div className="section-shell max-w-5xl">
        <header className="glass mb-8 flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-4 py-2 text-sm font-semibold hover:bg-surface-elevated"
            href="/dashboard/perfil/creditos"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="flex flex-col rounded-[34px] surface-card p-6 md:p-8">
            <p className="text-sm font-medium text-cobalt">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
            <p className="mt-2 text-ink/64">{summaryDescription}</p>

            <div className="mt-8 flex-1">
              <div className="mb-6 rounded-2xl bg-ink/5 p-6">
                <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                  <span className="font-medium text-ink/70">{summaryLabel}</span>
                  <span className="font-semibold text-ink">{summaryTitle}</span>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="font-medium text-ink/70">Total</span>
                  <span className="text-2xl font-bold text-ink">{summaryPrice}</span>
                </div>
              </div>

              <h3 className="mb-4 font-semibold text-ink">O que este pacote cobre:</h3>
              <ul className="space-y-3">
                {summaryItems.map((item) => (
                  <li className="flex items-start gap-3" key={item}>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
                    <span className="text-ink/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[34px] surface-card p-6 md:p-8">
            <h2 className="mb-6 text-xl font-semibold text-ink">Pagamento</h2>
            {paymentDisabledMessage ? (
              <div className="space-y-4 rounded-[28px] border border-amber-200/70 bg-amber-50/80 p-5 text-sm leading-6 text-amber-900">
                <p className="font-semibold">{paymentDisabledMessage}</p>
                <p>
                  O ciclo mensal continua disponível enquanto a cobrança anual é preparada com segurança no billing.
                </p>
                {paymentDisabledHref && paymentDisabledLabel ? (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={paymentDisabledHref}>{paymentDisabledLabel}</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              children
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function resolveCheckoutMode(params: {
  plan?: string;
  cycle?: string;
  mode?: string;
  package?: string;
}): CheckoutMode {
  if (params.mode === "ai_credits" || params.package) {
    return "ai_credits";
  }

  return "plan";
}
