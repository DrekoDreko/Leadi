import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="section-shell pb-24" id="cta">
      <div className="glass-dark rounded-[40px] p-10 text-center text-white md:p-16">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight md:text-4xl text-white">
          Pronto para organizar seus leads do Meta em uma operação comercial de verdade?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-white/64">
          Veja como o Leadi pode ajudar sua equipe a criar campanhas, captar e conduzir oportunidades de plano de saúde com total controle.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="https://wa.me/5511920595133?text=Ola!%20Gostaria%20de%20agendar%20uma%20apresenta%C3%A7%C3%A3o%20do%20Leadi!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-7 py-4 font-semibold text-ink dark:text-cloud shadow-soft transition hover:-translate-y-0.5"
          >
            Agendar demonstração
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Ver como funciona
          </a>
        </div>
      </div>
    </section>
  );
}

