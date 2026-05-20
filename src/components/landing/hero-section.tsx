"use client";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative px-4 pb-16 pt-28 md:pt-36" id="inicio">
      <div className="section-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/52 px-4 py-2 text-xs font-semibold text-cobalt shadow-soft backdrop-blur-xl">
            <Sparkles size={13} className="text-cobalt" />
            Criador de anúncios com Inteligência Artificial
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7.5xl">
            Crie anúncios com IA para vender{" "}
            <span className="text-cobalt">plano de saúde</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-ink/68 md:text-xl">
            O Leadi ajuda sua operação a criar campanhas, revisar linguagem, captar leads do Facebook e Instagram e acompanhar cada oportunidade em um CRM comercial feito especificamente para corretoras.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-8 py-4 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-cobalt/95"
              href="https://wa.me/5511920595133?text=Ola!%20Gostaria%20de%20agendar%20uma%20apresenta%C3%A7%C3%A3o%20do%20Leadi!"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Play size={16} aria-hidden="true" className="fill-white" />
              Agendar demonstração
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/54 px-8 py-4 font-semibold text-ink shadow-soft backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/80"
              href="#como-funciona"
            >
              Ver como funciona
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

