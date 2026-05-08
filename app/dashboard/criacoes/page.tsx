import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FilePlus2,
  Megaphone,
  Palette,
  Plus,
  Sparkles
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";

const primaryCreations = [
  {
    title: "IA Gerador de Campanha",
    description: "Monte a campanha com publico, objetivo, oferta, observacoes e briefing criativo.",
    href: "/dashboard/criacoes/campanhas",
    icon: Sparkles,
    tone: "bg-cobalt text-white"
  },
  {
    title: "Validador de campanha",
    description: "Acompanhe o progresso da solicitacao, revise status e veja quando a campanha estiver pronta.",
    href: "/dashboard/criacoes/validador",
    icon: ClipboardCheck,
    tone: "bg-ink text-white"
  },
  {
    title: "Solicitacao de criativo",
    description: "Abra um briefing para arte, imagem, video ou outro material ligado a campanha.",
    href: "/dashboard/criacoes/campanhas",
    icon: Palette,
    tone: "bg-signal text-ink"
  }
];

const secondaryCreations = [
  {
    title: "Validador de texto",
    description: "Revise textos de anuncio, formulario e mensagem antes de publicar.",
    href: "/dashboard/criacoes/compliance",
    icon: ClipboardCheck
  },
  {
    title: "Anuncios criados",
    description: "Veja o historico dos anuncios e retome campanhas ja preparadas.",
    href: "/dashboard/anuncios",
    icon: Megaphone
  },
  {
    title: "Outras criacoes",
    description: "Este hub continua pronto para crescer com novas automacoes e materiais.",
    href: "/dashboard/criacoes",
    icon: FilePlus2
  }
];

export default function CriacoesPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Criar"
        title="Novas criacoes"
        description="Este e o hub de criacao da LeadHealth: campanhas, validador, solicitacao de criativo e futuras rotinas da operacao."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
          <Plus size={18} aria-hidden="true" />
          Escolha o que criar
        </span>
      </PageHeading>

      <section className="grid gap-4 lg:grid-cols-3">
        {primaryCreations.map((item) => (
          <Link
            className="group glass-strong flex min-h-[250px] flex-col justify-between rounded-[34px] p-6 transition hover:-translate-y-1 hover:bg-white/68"
            href={item.href}
            key={item.title}
          >
            <div>
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-[22px] ${item.tone}`}
              >
                <item.icon size={24} aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold leading-tight">{item.title}</h2>
              <p className="mt-3 leading-7 text-ink/62">{item.description}</p>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
              Abrir fluxo
              <ArrowRight
                className="transition group-hover:translate-x-1"
                size={18}
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 px-1 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-cobalt">Complementos</p>
            <h2 className="mt-2 text-2xl font-semibold">Tudo o que apoia a criacao</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink/58">
            O objetivo agora e concentrar o que antes ficava espalhado pelo menu em uma area unica e mais facil de navegar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {secondaryCreations.map((item) => (
            <Link
              className="group glass flex min-h-[190px] flex-col justify-between rounded-[26px] p-5 transition hover:-translate-y-1 hover:bg-white/62"
              href={item.href}
              key={item.title}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/66 text-ink">
                    <item.icon size={19} aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="mt-2 text-ink/36 transition group-hover:translate-x-1 group-hover:text-ink"
                    size={18}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-5 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/58">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
