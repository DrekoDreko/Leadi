import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="section-shell pb-24" id="cta">
      <div className="glass-dark rounded-[40px] p-10 text-center text-white md:p-16">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
          Pronto para organizar seus leads do Meta em uma operação comercial de verdade?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-white/64">
          Veja como o Leadi pode ajudar sua equipe a captar, acompanhar e conduzir oportunidades de plano de saúde empresarial com mais controle.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-7 py-4 font-semibold text-ink shadow-soft transition hover:-translate-y-0.5"
          >
            Agendar demonstração
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5"
          >
            Abrir dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
