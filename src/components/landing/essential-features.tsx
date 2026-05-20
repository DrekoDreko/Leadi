import React from "react";
import {
  Sparkles,
  ShieldCheck,
  Share2,
  UsersRound,
  MessageSquare,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

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
        <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
          Tudo em um único fluxo comercial
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/64 md:text-lg">
          Substitua dezenas de ferramentas isoladas por um ecossistema integrado feito especificamente para quem vende planos de saúde.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group relative flex flex-col justify-between rounded-[32px] border border-white/40 bg-white/30 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/50 hover:shadow-[0_20px_50px_rgba(52,98,238,0.08)]"
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-cobalt/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-cobalt shadow-soft transition-colors duration-300 group-hover:bg-cobalt group-hover:text-white">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  {f.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 bg-white/50 px-2.5 py-1 rounded-full border border-white/30">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="mt-6 text-xl font-bold text-ink tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/64">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

