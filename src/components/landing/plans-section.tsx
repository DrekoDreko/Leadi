import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Inicial",
    label: "Para corretores individuais",
    desc: "Organize seus leads e comece a acompanhar oportunidades de forma profissional.",
    price: "Sob consulta",
    cta: "Falar com a equipe",
    href: "/login",
    highlight: false,
    features: [
      "CRM de leads",
      "Funil de oportunidades",
      "Mensagens com IA",
      "Importação de leads",
      "Histórico de atendimento"
    ]
  },
  {
    name: "Profissional",
    label: "Para pequenas equipes",
    desc: "Para equipes que captam leads no Meta e precisam de organização e controle.",
    price: "Sob consulta",
    cta: "Falar com a equipe",
    href: "/login",
    highlight: true,
    features: [
      "Tudo do plano Inicial",
      "Integração Meta Lead Ads",
      "Campanhas com IA",
      "Distribuição de leads",
      "Painel de métricas",
      "Checklist de compliance"
    ]
  },
  {
    name: "Operação",
    label: "Para corretoras com equipe",
    desc: "Para corretoras com múltiplos vendedores, campanhas ativas e processos comerciais.",
    price: "Sob consulta",
    cta: "Falar com a equipe",
    href: "/login",
    highlight: false,
    features: [
      "Tudo do plano Profissional",
      "Múltiplas equipes",
      "Gestão de propostas",
      "Agenda e lembretes",
      "Prioridade de suporte",
      "Onboarding assistido"
    ]
  }
];

export function PlansSection() {
  return (
    <section className="section-shell pb-24" id="planos">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">Planos</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Escolha o plano ideal para sua operação
        </h2>
        <p className="mt-4 text-lg leading-7 text-ink/64">
          Preços disponíveis mediante consulta com a equipe Codeellow.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
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
              <p className={`mt-2 text-sm leading-6 ${plan.highlight ? "text-white/60" : "text-ink/60"}`}>{plan.desc}</p>
              <p className={`mt-5 text-lg font-semibold ${plan.highlight ? "text-signal" : "text-cobalt"}`}>{plan.price}</p>
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
    </section>
  );
}
