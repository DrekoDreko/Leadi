"use client";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative px-4 pb-16 pt-28 md:pt-36" id="inicio">
      <div className="section-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex rounded-full bg-white/52 px-4 py-2 text-sm font-medium text-ink/70 shadow-soft backdrop-blur-xl">
            CRM e automação para gestão de leads
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7xl">
            Leads do Meta organizados em um CRM feito para{" "}
            <span className="text-cobalt">vender plano de saúde empresarial</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink/68 md:text-xl">
            Capture, acompanhe e transforme leads do Facebook e Instagram em oportunidades comerciais com funil, IA, mensagens consultivas e controle de atendimento.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-7 py-4 font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
              href="/login"
            >
              <Play size={16} aria-hidden="true" />
              Ver demonstração
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/54 px-7 py-4 font-semibold text-ink shadow-soft backdrop-blur-2xl transition hover:-translate-y-0.5"
              href="#planos"
            >
              Conhecer planos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
