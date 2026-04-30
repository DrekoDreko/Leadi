import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const plans = [
  {
    name: "Solo",
    price: "R$ 97",
    description: "Para vendedor individual validar campanhas e organizar leads.",
    credits: "120 créditos inclusos",
    features: ["CRM básico", "Importação CSV", "Gerador de campanhas", "Mensagens WhatsApp"]
  },
  {
    name: "Equipe",
    price: "R$ 247",
    description: "Para gestores distribuírem leads e acompanharem vendedores.",
    credits: "400 créditos inclusos",
    features: ["Tudo do Solo", "Gestão de equipe", "Distribuição de leads", "Relatórios por vendedor"],
    featured: true
  },
  {
    name: "Operação",
    price: "Sob consulta",
    description: "Para corretoras que querem campanha, design e operação assistida.",
    credits: "Pacote maior sob demanda",
    features: ["Pedidos de criativo", "Revisão consultiva", "Setup manual Meta", "Suporte prioritário"]
  }
];

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
            Página de pagamentos preparada para o MVP
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">
            Planos para vender plano empresarial com mais controle
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink/64">
            Cada plano já foi pensado para liberar créditos de uso da IA. A cobrança
            real entra com Mercado Pago no checkout do app.
          </p>
        </section>

        <section className="grid gap-4 pb-16 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              className={`flex min-h-[430px] flex-col rounded-[34px] p-6 ${
                plan.featured ? "glass-dark text-white" : "glass-strong"
              }`}
              key={plan.name}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{plan.name}</h2>
                  <p className={`mt-3 leading-7 ${plan.featured ? "text-white/68" : "text-ink/62"}`}>
                    {plan.description}
                  </p>
                  <p className={`mt-3 text-sm font-semibold ${plan.featured ? "text-white/78" : "text-cobalt"}`}>
                    {plan.credits}
                  </p>
                </div>
                {plan.featured && <Sparkles className="text-signal" size={24} aria-hidden="true" />}
              </div>
              <p className="mt-8 text-4xl font-semibold">
                {plan.price}
                {plan.price.startsWith("R$") && (
                  <span className={`text-base ${plan.featured ? "text-white/56" : "text-ink/48"}`}>
                    /mês
                  </span>
                )}
              </p>
              <div className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <div className="flex items-center gap-3" key={feature}>
                    <CheckCircle2
                      className={plan.featured ? "text-signal" : "text-lagoon"}
                      size={18}
                      aria-hidden="true"
                    />
                    <span className={plan.featured ? "text-white/82" : "text-ink/70"}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
                <Link
                className={`mt-8 inline-flex w-full justify-center rounded-full px-5 py-4 font-semibold ${
                  plan.featured ? "bg-signal text-ink" : "bg-ink text-white"
                }`}
                href="/login?next=/dashboard/creditos"
              >
                Comprar com Mercado Pago
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
