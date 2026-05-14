import {
  AlertCircle,
  Clock,
  FolderOpen,
  MessageSquareX,
  TrendingDown,
  Users
} from "lucide-react";

const pains = [
  {
    icon: Users,
    title: "Leads chegam espalhados",
    desc: "Contatos de múltiplas campanhas sem prioridade ou organização clara."
  },
  {
    icon: Clock,
    title: "Demora no primeiro contato",
    desc: "Vendedores demoram para chamar no WhatsApp e oportunidades esfridam."
  },
  {
    icon: TrendingDown,
    title: "Oportunidades somem sem follow-up",
    desc: "Sem acompanhamento estruturado, leads são esquecidos no meio do funil."
  },
  {
    icon: FolderOpen,
    title: "Campanhas sem padrão comercial",
    desc: "Cada vendedor cria anúncios do seu jeito, sem processo ou histórico."
  },
  {
    icon: MessageSquareX,
    title: "Sem histórico de atendimento",
    desc: "Ninguém sabe o que foi dito, proposto ou combinado com o lead."
  },
  {
    icon: AlertCircle,
    title: "Linguagem de risco nos anúncios",
    desc: "Textos que podem gerar bloqueio de conta ou reprovação no Meta."
  }
];

export function PainSection() {
  return (
    <section className="section-shell pb-24" id="problema">
      <div className="mb-12 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-cobalt">O problema real</p>
        <h2 className="text-3xl font-semibold leading-tight text-ink md:text-4xl">
          Seu anúncio pode até gerar leads. O problema começa depois.
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pains.map((p) => (
          <div className="glass-strong rounded-[28px] p-6" key={p.title}>
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/60 text-ink shadow-soft">
              <p.icon size={20} aria-hidden="true" />
            </span>
            <h3 className="text-base font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/64">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
