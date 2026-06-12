import { HeartPulse, Lock, Share2, ShieldCheck, type LucideIcon } from "lucide-react";

const trustItems: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: HeartPulse,
    title: "Especialista no seu mercado",
    desc: "Feito exclusivamente para quem vende plano de saúde"
  },
  {
    icon: ShieldCheck,
    title: "Compliance em cada anúncio",
    desc: "Checklist revisa a linguagem antes de publicar"
  },
  {
    icon: Share2,
    title: "Meta Lead Ads integrado",
    desc: "Leads dos formulários oficiais do Facebook e Instagram"
  },
  {
    icon: Lock,
    title: "Dados protegidos",
    desc: "Privacidade e tratamento de dados conforme a LGPD"
  }
];

export function TrustStrip() {
  return (
    <section className="section-shell px-4 pb-4">
      <div className="glass-strong rounded-[28px] border border-white/50 px-6 py-6 shadow-soft dark:border-white/10 md:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <span className="surface-pill-strong flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-cobalt shadow-soft">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink dark:text-cloud">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/56 dark:text-cloud/64">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
