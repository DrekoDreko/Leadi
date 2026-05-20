import { BrainCircuit } from "lucide-react";

const aiFeatures = [
  { title: "Sugestão de campanhas", desc: "A IA propõe estruturas de campanha baseadas no perfil do público e do produto." },
  { title: "Textos consultivos", desc: "Gere copy de anúncio com linguagem adequada para plano de saúde." },
  { title: "Mensagens de WhatsApp", desc: "Crie mensagens para cada etapa: primeiro contato, follow-up e proposta." },
  { title: "Análise de linguagem sensível", desc: "Identifica termos de risco antes de publicar qualquer material." },
  { title: "Sugestão de próxima ação", desc: "Apoia o consultor com o que fazer em cada momento da negociação." },
  { title: "Resumo de atendimento", desc: "Ajuda a registrar o histórico de forma estruturada e consultiva." }
];

export function AISection() {
  return (
    <section className="section-shell pb-24" id="ia">
      <div className="glass-dark rounded-[40px] p-8 text-white md:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink">
              <BrainCircuit size={22} aria-hidden="true" />
            </span>
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
              IA para acelerar a operação, não para substituir o consultor
            </h2>
            <p className="mt-4 text-lg leading-7 text-white/64">
              O consultor mantém o controle de cada negociação. A IA apoia com sugestões, textos e análises — mas a decisão e o relacionamento sempre ficam com a equipe comercial.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/70">
              Controle humano sempre presente
            </div>
          </div>
          <div className="grid gap-3">
            {aiFeatures.map((f) => (
              <div key={f.title} className="rounded-[22px] bg-white/8 p-4">
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-sm leading-5 text-white/58">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
