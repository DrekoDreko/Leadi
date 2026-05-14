import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { aiCreditsInfo, founderOffer, pricingNotice, pricingPlans } from "@/data/pricing";

export function PlansSection() {
  return (
    <section className="section-shell pb-24" id="planos">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">Planos</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Escolha o plano ideal para sua operação
        </h2>
        <p className="mt-4 text-lg leading-7 text-ink/64">
          Planos para corretores e corretoras que querem organizar leads, campanhas e vendas em um único fluxo.
        </p>
      </div>
      <p className="mb-6 max-w-3xl text-sm leading-6 text-ink/58">
        {pricingNotice}
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-[34px] p-7 ${
              plan.highlight
                ? "glass-dark text-white"
                : "glass-strong"
            }`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${plan.highlight ? "text-signal" : "text-cobalt"}`}>
                {plan.label}
              </p>
              <h3 className="mt-2 text-2xl font-semibold">{plan.name}</h3>
              <p className={`mt-2 text-sm leading-6 ${plan.highlight ? "text-white/60" : "text-ink/60"}`}>{plan.description}</p>
              <p className={`mt-5 text-lg font-semibold ${plan.highlight ? "text-signal" : "text-cobalt"}`}>{plan.price}</p>
              {plan.implantation && (
                <p className={`mt-2 text-xs font-medium ${plan.highlight ? "text-white/52" : "text-ink/48"}`}>
                  {plan.implantation}
                </p>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className={`shrink-0 ${plan.highlight ? "text-signal" : "text-cobalt"}`} aria-hidden="true" />
                  <span className={`text-sm ${plan.highlight ? "text-white/80" : "text-ink/75"}`}>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 ${
                plan.highlight
                  ? "bg-signal text-ink shadow-soft"
                  : "bg-ink text-white shadow-soft"
              }`}
            >
              {plan.cta}
              <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          ))}
      </div>

      {/* Explicação de Créditos de IA */}
      <div className="mt-8 flex flex-col items-start gap-4 rounded-[28px] border border-cobalt/10 bg-white/40 p-6 backdrop-blur-sm md:flex-row md:items-center md:gap-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cobalt text-white">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-ink">{aiCreditsInfo.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-ink/64">
            {aiCreditsInfo.description} <span className="hidden md:inline">{aiCreditsInfo.details}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-[30px] border border-cobalt/10 bg-white/44 p-6 shadow-soft backdrop-blur-xl md:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-cobalt">
              {founderOffer.eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink md:text-3xl">{founderOffer.title}</h3>
            <p className="mt-3 text-lg leading-7 text-ink/68">
              {founderOffer.description}
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
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <p className="text-2xl font-semibold text-ink">{founderOffer.price}</p>
            <Link
              href={founderOffer.href}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
            >
              {founderOffer.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
