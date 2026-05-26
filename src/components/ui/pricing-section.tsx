"use client";

import Link from "next/link";
import { useRef } from "react";

import { CheckCircle2, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { pricingPlans } from "@/data/pricing";

const revealVariants = {
  visible: (index: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: index * 0.12,
      duration: 0.45,
    },
  }),
  hidden: {
    y: 18,
    opacity: 0,
    filter: "blur(10px)",
  },
};

export function PricingSection() {
  const pricingRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-24" id="planos" ref={pricingRef}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-[420px] w-[min(1200px,94vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(52,98,238,0.12)_0%,rgba(234,240,220,0.6)_45%,transparent_78%)] blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(75,116,240,0.18)_0%,rgba(30,37,50,0.42)_48%,transparent_80%)]" />
      </div>

      <div className="section-shell relative z-10">
        <div className="pb-12 pt-8 text-center">
          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="surface-pill mx-auto mb-5 inline-flex rounded-full px-4 py-2 text-sm font-medium"
          >
            Planos para corretores e corretoras que querem organizar leads, campanhas e vendas em um único fluxo.
          </TimelineContent>

          <TimelineContent
            as="h2"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="mx-auto max-w-3xl text-5xl font-semibold leading-tight text-foreground md:text-6xl"
          >
            Escolha o plano ideal para sua operação
          </TimelineContent>

          <TimelineContent
            as="p"
            animationNum={2}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-muted-soft mx-auto mt-5 max-w-2xl text-lg leading-8"
          >
            O Leadi foi pensado para organizar leads, integrar Meta Lead Ads, usar IA em campanhas e mensagens e apoiar a operação comercial da corretora.
          </TimelineContent>
        </div>

        <div className="grid gap-4 pb-4 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <TimelineContent
              key={plan.name}
              as="article"
              animationNum={3 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="h-full"
            >
              <Card
                className={`group relative flex min-h-[430px] h-full flex-col overflow-hidden rounded-[34px] p-0 transition-all duration-300 ease-out will-change-transform hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_30px_80px_rgba(18,34,61,0.16)] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 dark:hover:shadow-[0_30px_80px_rgba(0,0,0,0.38)] ${
                  plan.highlight
                    ? "!border-primary/20 !bg-[linear-gradient(180deg,rgba(18,23,33,0.98),rgba(25,35,55,0.96))] !text-cloud shadow-soft"
                    : "surface-card-strong"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 z-0 rounded-[34px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                    plan.highlight
                      ? "bg-[radial-gradient(circle_at_50%_0%,rgba(255,245,72,0.14),transparent_58%)]"
                      : "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.68),transparent_54%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_58%)]"
                  }`}
                />
                <CardHeader className="relative z-10 flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">{plan.name}</h3>
                      <p className={`mt-3 leading-7 ${plan.highlight ? "text-white/74" : "text-muted-soft"}`}>
                        {plan.description}
                      </p>
                      <p className={`mt-3 text-sm font-semibold ${plan.highlight ? "text-white/84" : "text-cobalt"}`}>
                        {plan.label}
                      </p>
                    </div>
                    {plan.highlight && <Sparkles className="text-signal" size={24} aria-hidden="true" />}
                  </div>

                  <p className="mt-8 text-4xl font-semibold">{plan.price}</p>
                  {plan.implantation && (
                    <p className={`mt-2 text-sm font-medium ${plan.highlight ? "text-white/62" : "text-muted-soft"}`}>
                      {plan.implantation}
                    </p>
                  )}

                  <div className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <div className="flex items-center gap-3" key={feature}>
                        <CheckCircle2
                          className={plan.highlight ? "text-signal" : "text-lagoon"}
                          size={18}
                          aria-hidden="true"
                        />
                        <span className={plan.highlight ? "text-white/84" : "text-foreground/78"}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 p-6 pt-0">
                  <Link
                    className={`inline-flex w-full justify-center rounded-full px-5 py-4 font-semibold transition hover:-translate-y-0.5 ${
                      plan.highlight ? "bg-signal text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary/92"
                    }`}
                    href={plan.href}
                  >
                    {plan.cta}
                  </Link>
                </CardContent>
              </Card>
            </TimelineContent>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
