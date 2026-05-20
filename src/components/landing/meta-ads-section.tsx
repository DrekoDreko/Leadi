import { Sparkles, UsersRound, Share2, Facebook, Instagram } from "lucide-react";

export function MetaAdsSection() {
  const blocks = [
    {
      icon: Sparkles,
      title: "1. Campanha com IA",
      desc: "Ideias e copys consultivas alinhadas com as regras de compliance e prontas para rodar no Meta."
    },
    {
      icon: Share2,
      title: "2. Leads do Facebook e Instagram",
      desc: "Integração automática para receber leads de formulários oficiais sem perda de tempo ou planilhas."
    },
    {
      icon: UsersRound,
      title: "3. CRM e funil comercial",
      desc: "Distribuição instantânea por corretor, acompanhamento em etapas claras e sugestões de WhatsApp."
    }
  ];

  return (
    <section className="section-shell pb-24" id="meta-ads">
      <div className="mx-auto max-w-4xl text-center mb-16">
        <p className="mb-3 text-sm font-semibold text-cobalt uppercase tracking-wider">Integração Direta</p>
        <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
          Crie a campanha. Receba o lead. Acompanhe a venda.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-ink/64 md:text-lg max-w-3xl mx-auto">
          O Leadi conecta a criação de campanhas, a captura imediata de leads e o acompanhamento comercial em uma operação única para plano de saúde.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {blocks.map((block, i) => {
          const Icon = block.icon;
          return (
            <div
              key={block.title}
              className="glass-strong rounded-[32px] p-8 border border-white/50 shadow-soft relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt/10 text-cobalt mb-6">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="text-xl font-bold text-ink tracking-tight">{block.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{block.desc}</p>
              </div>
              
              {i === 1 && (
                <div className="mt-6 flex items-center gap-3 text-ink/40 text-xs font-semibold">
                  <span>Plataformas suportadas:</span>
                  <div className="flex gap-2">
                    <Facebook size={14} className="text-ink/60" />
                    <Instagram size={14} className="text-ink/60" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[11px] leading-relaxed text-ink/40 max-w-2xl mx-auto">
          Meta, Facebook e Instagram são marcas registradas da Meta Platforms, Inc. O Leadi é uma plataforma independente e não possui filiação, patrocínio, endosso ou parceria oficial com a Meta Platforms.
        </p>
      </div>
    </section>
  );
}

