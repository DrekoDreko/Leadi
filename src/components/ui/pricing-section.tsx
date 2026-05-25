"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { buildPlanSignupPath, type PublicPlanSlug } from "@/lib/billing/checkout-flow";
import NumberFlow from "@number-flow/react";
import { Briefcase, CheckCheck, Database, Server } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

const plans = [
  {
    slug: "essencial" as PublicPlanSlug,
    name: "Essencial",
    description:
      "Organização comercial básica para centralizar leads, acompanhar oportunidades e manter o histórico.",
    price: 297,
    yearlyPrice: 237,
    buttonText: "Contratar",
    buttonVariant: "outline" as const,
    features: [
      { text: "CRM de leads", icon: <Briefcase size={20} /> },
      { text: "Funil de oportunidades", icon: <Database size={20} /> },
      { text: "Histórico de atendimento", icon: <Server size={20} /> },
    ],
    includes: [
      "Incluso no plano:",
      "Mensagens com IA",
      "Importação de leads",
      "Organização de equipe",
    ],
  },
  {
    slug: "profissional" as PublicPlanSlug,
    name: "Profissional",
    description:
      "O plano principal para equipes que precisam conectar captação, campanhas e distribuição em um fluxo.",
    price: 797,
    yearlyPrice: 637,
    buttonText: "Contratar",
    buttonVariant: "default" as const,
    popular: true,
    features: [
      { text: "Tudo do plano Essencial", icon: <Briefcase size={20} /> },
      { text: "Integração Meta Lead Ads", icon: <Database size={20} /> },
      { text: "Distribuição de leads", icon: <Server size={20} /> },
    ],
    includes: [
      "Tudo do Essencial, mais:",
      "Campanhas com IA",
      "Painel de métricas",
      "Checklist de compliance",
    ],
  },
  {
    slug: "operacao" as PublicPlanSlug,
    name: "Operação",
    description:
      "Estrutura para operações com múltiplas equipes, gestão de propostas e mais acompanhamento.",
    price: 1997,
    yearlyPrice: 1597,
    buttonText: "Contratar",
    buttonVariant: "outline" as const,
    features: [
      { text: "Tudo do plano Profissional", icon: <Briefcase size={20} /> },
      { text: "Múltiplas equipes", icon: <Database size={20} /> },
      { text: "Gestão de propostas", icon: <Server size={20} /> },
    ],
    includes: [
      "Tudo do Profissional, mais:",
      "Agenda e lembretes",
      "Prioridade de suporte",
      "Onboarding assistido",
    ],
  },
];

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: string) => void }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-50 mx-auto flex w-fit rounded-full bg-mist/10 dark:bg-ink/50 border border-mist/20 dark:border-cloud/10 p-1">
        <button
          onClick={() => handleSwitch("0")}
          className={`relative z-10 w-fit sm:h-12 h-10 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors ${
            selected === "0"
              ? "text-cloud"
              : "text-ink/60 dark:text-cloud/60 hover:text-ink dark:hover:text-cloud"
          }`}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 sm:h-12 h-10 w-full rounded-full border-4 shadow-sm shadow-cobalt/40 border-cobalt bg-gradient-to-t from-cobalt via-cobalt/80 to-cobalt"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Mensal</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={`relative z-10 w-fit sm:h-12 h-8 flex-shrink-0 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors ${
            selected === "1"
              ? "text-cloud"
              : "text-ink/60 dark:text-cloud/60 hover:text-ink dark:hover:text-cloud"
          }`}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 sm:h-12 h-10 w-full rounded-full border-4 shadow-sm shadow-cobalt/40 border-cobalt bg-gradient-to-t from-cobalt via-cobalt/80 to-cobalt"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Anual
            <span className="rounded-full bg-cobalt/10 dark:bg-cloud/20 px-2 py-0.5 text-xs font-medium text-ink dark:text-cloud">
              20% OFF
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const togglePricingPeriod = (value: string) =>
    setIsYearly(Number.parseInt(value) === 1);

  return (
    <section className="px-4 py-24 mx-auto relative bg-transparent" ref={pricingRef} id="planos">
      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0 pointer-events-none"
        style={{
          backgroundImage: `
        radial-gradient(circle at center, rgb(var(--color-cobalt) / 0.05) 0%, transparent 70%)
      `,
          opacity: 0.6,
          mixBlendMode: "normal",
        }}
      />

      <div className="text-center mb-6 max-w-3xl mx-auto relative z-10">
        <p className="mb-3 text-sm font-medium text-cobalt">Planos públicos</p>
        <TimelineContent
          as="h2"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="md:text-5xl sm:text-4xl text-3xl font-semibold leading-tight text-ink dark:text-cloud mb-4"
        >
          Escolha o plano ideal para sua{" "}
          <TimelineContent
            as="span"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="border border-dashed border-cobalt px-2 py-1 rounded-xl bg-cobalt/10 dark:bg-cobalt/20 capitalize inline-block"
          >
            operação
          </TimelineContent>
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={2}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="sm:text-lg text-base text-ink/64 dark:text-cloud/64 sm:w-[70%] w-[80%] mx-auto"
        >
          Planos para corretores e corretoras que querem organizar leads, campanhas e vendas em um único fluxo.
        </TimelineContent>
      </div>

      <TimelineContent
        as="div"
        animationNum={3}
        timelineRef={pricingRef}
        customVariants={revealVariants}
      >
        <PricingSwitch onSwitch={togglePricingPeriod} />
      </TimelineContent>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 max-w-6xl gap-6 pt-10 mx-auto relative z-10">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={4 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="h-full"
          >
            <Card
              className={`relative h-full flex flex-col border-mist/20 dark:border-cloud/10 ${
                plan.popular ? "ring-2 ring-signal dark:bg-ink bg-signal/20 dark:bg-signal/10" : "bg-cloud dark:bg-ink"
              }`}
            >
              <CardHeader className="text-left">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-semibold text-ink dark:text-cloud">
                    {plan.name}
                  </h3>
                  {plan.popular && (
                    <div className="">
                      <span className="bg-signal text-ink px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                        Popular
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-ink/60 dark:text-cloud/60 mb-4 line-clamp-3 min-h-[60px]">{plan.description}</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-semibold text-ink dark:text-cloud">
                    R$
                    <NumberFlow
                      value={isYearly ? plan.yearlyPrice : plan.price}
                      className="text-4xl font-semibold mx-1"
                    />
                  </span>
                  <span className="text-ink/60 dark:text-cloud/60 ml-1">
                    /mês
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col flex-1">
                <Link
                  href={buildPlanSignupPath(plan.slug)}
                  className={`w-full inline-flex justify-center items-center mb-6 p-4 text-sm font-semibold rounded-xl transition hover:-translate-y-0.5 ${
                    plan.popular
                      ? "bg-signal text-ink shadow-soft hover:brightness-105"
                      : "bg-ink dark:bg-cloud text-cloud dark:text-ink shadow-soft hover:opacity-90"
                  }`}
                >
                  {plan.buttonText}
                </Link>
                <ul className="space-y-3 font-medium py-2 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="text-cobalt grid place-content-center mt-0.5 mr-3 shrink-0">
                        {feature.icon}
                      </span>
                      <span className="text-sm text-ink/80 dark:text-cloud/80">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 pt-6 border-t border-mist/20 dark:border-cloud/10 mt-4">
                  <h4 className="font-medium text-sm text-ink dark:text-cloud">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-2 font-medium">
                    {plan.includes.slice(1).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="h-5 w-5 bg-cobalt/10 border border-cobalt/20 rounded-full grid place-content-center mt-0.5 mr-3 shrink-0">
                          <CheckCheck className="h-3 w-3 text-cobalt " />
                        </span>
                        <span className="text-sm text-ink/70 dark:text-cloud/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>
    </section>
  );
}

export default PricingSection;
