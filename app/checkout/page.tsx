import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { pricingPlans } from "@/data/pricing";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planSlug } = await searchParams;

  if (!planSlug) {
    redirect("/pricing");
  }

  // Acha o plano no pricing.ts baseado no slug esperado ("essencial", "profissional", "operacao")
  // Aqui, usaremos um mapeamento simples baseado no nome já que pricing.ts não tem "slug" explícito
  const slugToNameMap: Record<string, string> = {
    essencial: "Essencial",
    profissional: "Profissional",
    operacao: "Operação",
  };

  const expectedName = slugToNameMap[planSlug.toLowerCase()];
  const plan = pricingPlans.find((p) => p.name === expectedName);

  if (!plan) {
    redirect("/pricing");
  }

  // Extrai valor numérico do "price" (ex: "R$ 297/mês" -> 297)
  const priceMatches = plan.price.match(/\d+/g);
  const numericPrice = priceMatches ? parseInt(priceMatches.join(""), 10) : 0;

  return (
    <main className="min-h-screen px-4 py-4 md:py-8">
      <div className="section-shell max-w-5xl">
        <header className="glass mb-8 flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/44 px-4 py-2 text-sm font-semibold hover:bg-white/60"
            href="/pricing"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar aos planos
          </Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="flex flex-col rounded-[34px] bg-white p-6 shadow-soft md:p-8">
            <h1 className="text-3xl font-semibold text-ink">Finalizar Assinatura</h1>
            <p className="mt-2 text-ink/64">
              Você está assinando o plano <strong>{plan.name}</strong>.
            </p>

            <div className="mt-8 flex-1">
              <div className="mb-6 rounded-2xl bg-ink/5 p-6">
                <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                  <span className="font-medium text-ink/70">Plano</span>
                  <span className="font-semibold text-ink">{plan.name}</span>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="font-medium text-ink/70">Total mensal</span>
                  <span className="text-2xl font-bold text-ink">{plan.price}</span>
                </div>
              </div>

              <h3 className="mb-4 font-semibold text-ink">O que está incluso:</h3>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex items-start gap-3" key={feature}>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-cobalt" size={18} aria-hidden="true" />
                    <span className="text-ink/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[34px] bg-white p-6 shadow-soft md:p-8">
            <h2 className="mb-6 text-xl font-semibold text-ink">Pagamento</h2>
            <CheckoutClient planSlug={planSlug} amount={numericPrice} />
          </section>
        </div>
      </div>
    </main>
  );
}
