import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { founderOffer, pricingNotice, pricingPlans } from "@/data/pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen px-4 py-4">
      <div className="section-shell">
        <header className="glass mb-8 flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/44 px-4 py-2 text-sm font-semibold"
            href="/"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar
          </Link>
        </header>

        <section className="pb-12 pt-8 text-center">
          <p className="mx-auto mb-5 inline-flex rounded-full bg-white/48 px-4 py-2 text-sm font-medium text-ink/64">
            Planos para corretores e corretoras que querem organizar leads, campanhas e vendas em um único fluxo.
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">
            Escolha o plano ideal para sua operação
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink/64">
            O Leadi foi pensado para organizar leads, integrar Meta Lead Ads, usar IA em campanhas e mensagens e apoiar a operação comercial da corretora.
          </p>
        </section>

        <section className="grid gap-4 pb-16 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              className={`flex min-h-[430px] flex-col rounded-[34px] p-6 ${
                plan.highlight ? "glass-dark text-white" : "glass-strong"
              }`}
              key={plan.name}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{plan.name}</h2>
                  <p className={`mt-3 leading-7 ${plan.highlight ? "text-white/68" : "text-ink/62"}`}>
                    {plan.description}
                  </p>
                  <p className={`mt-3 text-sm font-semibold ${plan.highlight ? "text-white/78" : "text-cobalt"}`}>
                    {plan.label}
                  </p>
                </div>
                {plan.highlight && <Sparkles className="text-signal" size={24} aria-hidden="true" />}
              </div>
              <p className="mt-8 text-4xl font-semibold">
                {plan.price}
              </p>
              {plan.implantation && (
                <p className={`mt-2 text-sm font-medium ${plan.highlight ? "text-white/56" : "text-ink/48"}`}>
                  {plan.implantation}
                </p>
              )}
              <div className="mt-8 flex-1 space-y-3">
              {plan.features.map((feature) => (
                  <div className="flex items-center gap-3" key={feature}>
                    <CheckCircle2
                      className={plan.highlight ? "text-signal" : "text-lagoon"}
                      size={18}
                      aria-hidden="true"
                    />
                    <span className={plan.highlight ? "text-white/82" : "text-ink/70"}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                className={`mt-8 inline-flex w-full justify-center rounded-full px-5 py-4 font-semibold ${
                  plan.highlight ? "bg-signal text-ink dark:text-cloud" : "bg-ink text-cloud"
                }`}
                href={plan.href}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </section>
        <section className="pb-16">
          <div className="rounded-[34px] border border-cobalt/10 bg-white/46 p-6 shadow-soft backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-cobalt">
                  {founderOffer.eyebrow}
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
                  {founderOffer.title}
                </h2>
                <p className="mt-4 text-lg leading-7 text-ink/68">
                  {founderOffer.price} — {founderOffer.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {founderOffer.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-ink/68">
                      <CheckCircle2 className="shrink-0 text-cobalt" size={15} aria-hidden="true" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3.5 font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
                href={founderOffer.href}
              >
                {founderOffer.cta}
              </Link>
            </div>
          </div>
        </section>
        <p className="mx-auto max-w-4xl pb-8 text-center text-sm leading-6 text-ink/58">
          {pricingNotice}
        </p>
      </div>
    </main>
  );
}
