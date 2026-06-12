"use client";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";

import { WHATSAPP_DEMO_URL } from "@/data/site-links";

export function HeroSection() {
  return (
    <section className="relative px-4 pb-16 pt-28 md:pt-36" id="inicio">
      <div className="section-shell">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/52 dark:bg-white/10 px-4 py-2 text-xs font-semibold text-cobalt shadow-soft backdrop-blur-xl">
            <Sparkles size={13} className="text-cobalt" />
            Anúncios com IA + CRM para corretores de plano de saúde
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl lg:text-7.5xl">
            Venda mais <span className="text-cobalt">planos de saúde</span> sem perder nenhum lead
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-ink/68 md:text-xl">
            Crie campanhas com IA, receba os leads do Facebook e Instagram direto no CRM e conduza cada oportunidade até a proposta — tudo em uma única plataforma.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-signal px-8 py-4 font-semibold text-accent-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-signal/92"
              href="/pricing"
            >
              Começar agora
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              className="surface-action-secondary inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold shadow-soft backdrop-blur-2xl"
              href={WHATSAPP_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Play size={16} aria-hidden="true" />
              Agendar demonstração
            </a>
          </div>

          {/* Mockup do painel — o produto visível logo no primeiro scroll */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 bottom-0 top-10 rounded-[48px] bg-[radial-gradient(ellipse_at_center,rgba(52,98,238,0.16)_0%,rgba(74,145,168,0.10)_40%,transparent_72%)] blur-3xl"
            />
            <div className="glass-strong relative rounded-[28px] border border-white/50 p-2.5 shadow-[0_30px_80px_rgba(18,34,61,0.16)] dark:border-white/10 dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)] md:p-3">
              <div className="rounded-[20px] border border-ink/6 bg-white/90 p-4 text-left dark:border-white/10 dark:bg-[#1A2332]/95 md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-ink/40 dark:text-cloud/48">
                      Painel Leadi
                    </span>
                  </div>
                  <span className="surface-pill flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-cobalt dark:bg-surface-elevated dark:text-cloud/82">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-cobalt" />
                    Real time
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-ink/5 bg-neutral-50/80 p-3 dark:border-white/8 dark:bg-[#243449] md:p-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/52">
                      <Users size={11} className="text-cobalt" /> Leads hoje
                    </div>
                    <p className="mt-1.5 text-lg font-extrabold text-ink dark:text-cloud md:text-2xl">12</p>
                    <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">+5 desde ontem</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/8 p-3 dark:bg-emerald-500/10 md:p-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/52">
                      <Wallet size={11} className="text-emerald-500" /> Custo por lead
                    </div>
                    <p className="mt-1.5 text-lg font-extrabold text-emerald-600 dark:text-emerald-400 md:text-2xl">R$ 5,00</p>
                    <p className="text-[9px] font-semibold text-ink/40 dark:text-cloud/52">*ilustrativo</p>
                  </div>
                  <div className="rounded-2xl border border-ink/5 bg-neutral-50/80 p-3 dark:border-white/8 dark:bg-[#243449] md:p-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-cloud/52">
                      <TrendingUp size={11} className="text-signal" /> Em proposta
                    </div>
                    <p className="mt-1.5 text-lg font-extrabold text-ink dark:text-cloud md:text-2xl">8</p>
                    <p className="text-[9px] font-semibold text-ink/40 dark:text-cloud/52">funil ativo</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { stage: "Novo Lead", dot: "bg-cobalt", name: "Ana Souza", info: "PME • 5 vidas" },
                    { stage: "Qualificação", dot: "bg-lagoon", name: "Lucas Lima", info: "PME • 12 vidas" },
                    { stage: "Proposta", dot: "bg-signal", name: "Marcos Silva", info: "PME • 4 vidas" }
                  ].map((col) => (
                    <div key={col.stage} className="rounded-2xl border border-ink/5 bg-neutral-50/60 p-2.5 dark:border-white/8 dark:bg-[#202c3f] md:p-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                        <span className="truncate text-[9px] font-bold text-ink/60 dark:text-cloud/72">{col.stage}</span>
                      </div>
                      <div className="rounded-lg border border-ink/5 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#1A2332]">
                        <span className={`mb-1 block h-1 w-5 rounded-full ${col.dot}`} />
                        <p className="truncate text-[10px] font-bold leading-tight text-ink dark:text-cloud">{col.name}</p>
                        <p className="mt-0.5 truncate text-[8px] text-ink/40 dark:text-cloud/56">{col.info}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
