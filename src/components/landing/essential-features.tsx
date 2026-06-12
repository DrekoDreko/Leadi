import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Share2,
  UsersRound,
  MessageSquare,
  Play,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

import { WHATSAPP_DEMO_URL } from "@/data/site-links";

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
}

const features: FeatureCard[] = [
  {
    icon: Sparkles,
    title: "Anúncios com IA",
    desc: "Crie ideias, textos e estruturas de campanha com linguagem altamente consultiva e focada em conversão.",
    badge: "Inteligência Artificial"
  },
  {
    icon: ShieldCheck,
    title: "Checklist de compliance",
    desc: "Revise termos sensíveis de forma inteligente antes de publicar a campanha ou enviar mensagens ao cliente.",
    badge: "Segurança"
  },
  {
    icon: Share2,
    title: "Meta Lead Ads",
    desc: "Organize todos os leads captados pelos formulários oficiais do Facebook e Instagram em um só lugar de forma imediata.",
    badge: "Integração"
  },
  {
    icon: UsersRound,
    title: "CRM de leads",
    desc: "Centralize contatos, atribua responsáveis automaticamente, organize status e defina as próximas ações comerciais.",
    badge: "Gestão"
  },
  {
    icon: MessageSquare,
    title: "Mensagens com IA",
    desc: "Gere abordagens personalizadas e respostas de follow-up para o WhatsApp em cada etapa do atendimento.",
    badge: "Produtividade"
  },
  {
    icon: TrendingUp,
    title: "Funil e propostas",
    desc: "Acompanhe de perto as oportunidades comerciais até o envio de propostas, follow-up ativo e fechamento.",
    badge: "Vendas"
  }
];

export function EssentialFeatures() {
  return (
    <section className="section-shell pb-24" id="recursos">
      <div className="mb-12 max-w-3xl text-center md:text-left">
        <p className="mb-3 text-sm font-semibold text-cobalt uppercase tracking-wider">Recursos essenciais</p>
        <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink dark:text-cloud md:text-5xl">
          Tudo em um único fluxo comercial
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/64 dark:text-cloud/70 md:text-lg">
          Substitua dezenas de ferramentas isoladas por um ecossistema integrado feito especificamente para quem vende planos de saúde.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group surface-card-strong relative flex flex-col justify-between rounded-[32px] p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cobalt/26 hover:shadow-[0_20px_50px_rgba(52,98,238,0.08)] dark:border-border/75 dark:bg-[linear-gradient(180deg,rgba(26,33,46,0.98),rgba(31,39,54,0.95))]"
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cobalt/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="surface-pill-strong flex h-12 w-12 items-center justify-center rounded-2xl text-cobalt shadow-soft transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  {f.badge && (
                    <span className="surface-pill bg-surface-elevated/88 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground rounded-full dark:border-border/75 dark:text-cloud/76">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight text-ink dark:text-cloud">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/64 dark:text-cloud/78">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-14 flex flex-col items-center gap-4 text-center">
        <p className="text-base font-medium text-ink/64 dark:text-cloud/70">
          Pronto para centralizar sua operação em um só lugar?
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
      </div>
    </section>
  );
}
