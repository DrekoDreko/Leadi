"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { CheckCircle2, Sparkles } from "lucide-react";

import { PricingComparisonTable } from "@/components/ui/pricing-comparison-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ShinyBordersButton from "@/components/ui/shiny-borders-button";
import { TimelineContent } from "@/components/ui/timeline-animation";
import {
  marketingPricingPlans,
  pricingAddons,
  pricingComparisonCategories,
  pricingNotice,
  type PricingCycle
} from "@/data/pricing";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buildPlanSignupPath } from "@/lib/billing/checkout-flow";

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

const pricingCycles: Array<{ value: PricingCycle; label: string }> = [
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" },
];

type PricingSectionProps = {
  showComparisonDetails?: boolean;
};

export function PricingSection({ showComparisonDetails = true }: PricingSectionProps) {
  const pricingRef = useRef<HTMLDivElement>(null);
  const [cycle, setCycle] = useState<PricingCycle>("monthly");

  return (
    <section className="relative overflow-visible px-4 py-14 md:py-20" id="planos" ref={pricingRef}>
      <div className="section-shell relative z-10">
        <div className="relative isolate pb-10 pt-4 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[9rem] h-[40rem] w-[min(92rem,128vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(52,98,238,0.18)_0%,rgba(74,145,168,0.14)_26%,rgba(234,240,220,0.08)_42%,transparent_72%)] blur-[120px] dark:bg-[radial-gradient(ellipse_at_center,rgba(86,126,255,0.34)_0%,rgba(74,145,168,0.18)_28%,rgba(30,37,50,0.12)_46%,transparent_74%)]"
          />

          <TimelineContent
            as="p"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="surface-pill relative z-10 mx-auto mb-5 inline-flex rounded-full px-4 py-2 text-sm font-medium"
          >
            Planos pensados para consultores e equipes que precisam organizar leads, campanhas e rotina comercial sem inflar a operação.
          </TimelineContent>

          <TimelineContent
            as="h2"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="relative z-10 mx-auto max-w-4xl text-4xl font-semibold leading-tight text-foreground md:text-6xl"
          >
            Escolha o plano ideal para sua operação
          </TimelineContent>

          <TimelineContent
            as="p"
            animationNum={2}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-muted-soft relative z-10 mx-auto mt-5 max-w-2xl text-base leading-8 md:text-lg"
          >
            O Leadi centraliza CRM, funil, campanhas com IA, mensagens, importação de leads e integração Meta Lead Ads em um fluxo mais claro para o time comercial.
          </TimelineContent>

          <TimelineContent
            as="div"
            animationNum={3}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="relative z-10 mt-8 flex justify-center"
          >
            <div
              className="relative inline-flex rounded-full border border-white/60 bg-white/76 p-1.5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/8"
              aria-label="Alternar ciclo de cobrança"
            >
              {pricingCycles.map((item) => {
                const active = item.value === cycle;

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCycle(item.value)}
                    className={cn(
                      "relative rounded-full px-5 py-3 text-sm font-semibold transition",
                      active
                        ? "text-cloud dark:text-[#121721]"
                        : "text-ink/58 hover:text-ink dark:text-cloud/62 dark:hover:text-cloud"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="pricing-cycle-active-bg"
                        className="absolute inset-0 z-0 rounded-full bg-ink shadow-soft dark:bg-cloud"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </TimelineContent>
        </div>

        <div className="grid gap-5 pb-6 lg:grid-cols-3">
          {marketingPricingPlans.map((plan, index) => {
            const currentPrice = plan.prices[cycle];
            const checkoutHref = buildPlanSignupPath(plan.slug, cycle);

            return (
              <TimelineContent
                key={plan.slug}
                as="article"
                animationNum={4 + index}
                timelineRef={pricingRef}
                customVariants={revealVariants}
                className="h-full"
              >
                <Card
                  className={cn(
                    "group relative flex min-h-[510px] h-full flex-col overflow-hidden rounded-[34px] p-0 transition-all duration-300 ease-out will-change-transform hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_30px_80px_rgba(18,34,61,0.16)] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 dark:hover:shadow-[0_30px_80px_rgba(0,0,0,0.38)]",
                    plan.highlight
                      ? "!border-signal/35 !bg-[linear-gradient(180deg,rgba(18,23,33,0.98),rgba(25,35,55,0.96))] !text-cloud shadow-soft"
                      : plan.isTeam
                      ? "!border-violet-500/35 !bg-[linear-gradient(180deg,rgba(18,12,33,0.98),rgba(25,18,50,0.96))] !text-cloud shadow-soft"
                      : "surface-card-strong"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 z-0 rounded-[34px] opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      plan.highlight
                        ? "bg-[radial-gradient(circle_at_50%_0%,rgba(255,245,72,0.18),transparent_58%)]"
                        : plan.isTeam
                        ? "bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.18),transparent_58%)]"
                        : "bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.68),transparent_54%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_58%)]"
                    )}
                  />

                  <CardHeader className="relative z-10 flex-1 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {plan.badge ? (
                          <span className={cn(
                            "inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                            plan.isTeam ? "bg-violet-600 text-white" : "bg-signal text-accent-foreground"
                          )}>
                            {plan.badge}
                          </span>
                        ) : null}
                        <h3 className="mt-4 text-2xl font-semibold">{plan.name}</h3>
                        <p className={cn("mt-3 text-sm font-semibold", plan.highlight ? "text-signal" : plan.isTeam ? "text-violet-400" : "text-cobalt")}>
                          {plan.label}
                        </p>
                        <p className={cn("mt-3 leading-7", plan.highlight || plan.isTeam ? "text-white/76" : "text-muted-soft")}>
                          {plan.description}
                        </p>
                      </div>

                      {plan.highlight ? <Sparkles className="text-signal" size={24} aria-hidden="true" /> : plan.isTeam ? <Sparkles className="text-violet-400" size={24} aria-hidden="true" /> : null}
                    </div>

                    <div className="mt-8">
                      <div className="flex items-end gap-2">
                        <p className="text-4xl font-semibold tracking-tight md:text-[2.7rem]">{currentPrice.amount}</p>
                        <span
                          className={cn(
                            "pb-1 text-base font-medium",
                            plan.highlight || plan.isTeam ? "text-white/74" : "text-foreground/62"
                          )}
                        >
                          {currentPrice.suffix}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-sm font-medium",
                          plan.highlight || plan.isTeam ? "text-white/62" : "text-muted-soft"
                        )}
                      >
                        {currentPrice.note}
                      </p>
                      {!currentPrice.available ? (
                        <p
                          className={cn(
                            "mt-3 text-sm leading-6",
                            plan.highlight || plan.isTeam ? "text-white/78" : "text-ink/70 dark:text-cloud/72"
                          )}
                        >
                          {currentPrice.unavailableMessage}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-8 space-y-3">
                      {plan.features.map((feature) => (
                        <div className="flex items-start gap-3" key={feature}>
                          <CheckCircle2
                            className={plan.highlight ? "mt-0.5 text-signal" : plan.isTeam ? "mt-0.5 text-violet-400" : "mt-0.5 text-lagoon"}
                            size={18}
                            aria-hidden="true"
                          />
                          <span className={plan.highlight || plan.isTeam ? "text-white/84" : "text-foreground/78"}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10 p-6 pt-0">
                    <Button
                      asChild
                      className={cn(
                        "w-full py-4 text-sm",
                        plan.highlight
                          ? "bg-signal !text-[#121721] hover:bg-signal/90"
                          : plan.isTeam
                          ? "bg-violet-600 !text-white hover:bg-violet-700"
                          : "bg-primary text-primary-foreground hover:bg-primary/92"
                      )}
                      >
                      <Link href={plan.detailsUrl ? plan.detailsUrl : checkoutHref}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </TimelineContent>
            );
          })}
        </div>

        {showComparisonDetails ? (
          <div className="space-y-8 pt-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cobalt">
                Compare os planos em detalhes
              </p>
              <h3 className="mt-3 text-3xl font-semibold leading-tight text-ink dark:text-cloud md:text-4xl">
                Veja o que está incluso em cada plano antes de escolher.
              </h3>
            </div>

            <PricingComparisonTable
              categories={pricingComparisonCategories}
              cycle={cycle}
              plans={marketingPricingPlans}
            />

            <div className="rounded-[28px] border border-cobalt/12 bg-cobalt/8 px-5 py-4 text-sm leading-7 text-ink/70 dark:border-cobalt/18 dark:bg-cobalt/12 dark:text-cloud/72">
              {pricingNotice}
            </div>

            <div className="rounded-[32px] border border-white/50 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/6 md:p-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cobalt">
                  Créditos extras
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-ink dark:text-cloud">
                  Compre créditos avulsos quando a franquia do plano terminar.
                </h3>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pricingAddons.map((addon) => (
                  <div
                    key={addon.title}
                    className="rounded-[24px] border border-white/50 bg-white/74 px-4 py-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-sm font-medium leading-6 text-ink/74 dark:text-cloud/74">{addon.title}</p>
                    <p className="mt-3 text-lg font-semibold text-ink dark:text-cloud">{addon.price}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/60 dark:text-cloud/68">
                      {addon.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-8 md:pt-10">
            <div className="mx-auto flex max-w-3xl justify-center text-center">
              <ShinyBordersButton
                aria-label="Compare os planos em detalhes"
                className="w-full md:max-w-sm lg:w-[calc(33.333%-0.85rem)]"
                href="/pricing"
                text="Compare os Planos"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PricingSection;
