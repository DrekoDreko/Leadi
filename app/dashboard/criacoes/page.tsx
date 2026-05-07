import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  Megaphone,
  Palette,
  Plus,
  Sparkles,
  Upload,
  UsersRound
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";

const primaryCreations = [
  {
    title: "Nova campanha",
    description: "Crie uma campanha com objetivo, público, oferta e campos do formulário.",
    href: "/dashboard/campanhas",
    icon: Sparkles,
    tone: "bg-cobalt text-white"
  },
  {
    title: "Nova solicitação de design para anúncio",
    description: "Abra um briefing para peça estática, carrossel, vídeo ou criativo de lead form.",
    href: "/dashboard/pedidos",
    icon: Palette,
    tone: "bg-signal text-ink"
  },
  {
    title: "Novo anúncio",
    description: "Comece a organizar copy, criativo, público e destino para um novo anúncio.",
    href: "/dashboard/campanhas",
    icon: Megaphone,
    tone: "bg-ink text-white"
  }
];

const secondaryCreations = [
  {
    title: "Novo pedido",
    description: "Organize ajustes, variações de criativos, landing pages ou materiais de apoio.",
    href: "/dashboard/pedidos",
    icon: FilePlus2
  },
  {
    title: "Importar leads",
    description: "Envie uma base para alimentar o CRM e iniciar o acompanhamento comercial.",
    href: "/dashboard/importar",
    icon: Upload
  },
  {
    title: "Organizar equipe",
    description: "Convide vendedores, revise permissões e prepare a distribuição dos leads.",
    href: "/team/setup",
    icon: UsersRound
  }
];

export default function CriacoesPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Criar"
        title="Novas criações"
        description="Um ponto rápido para iniciar campanhas, anúncios, briefings criativos e materiais que ficam sob revisão da sua empresa."
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
              Começar agora
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
            <p className="text-sm font-medium text-cobalt">Outras ações</p>
            <h2 className="mt-2 text-2xl font-semibold">Também dá para pedir ou preparar</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink/58">
            Esta área pode crescer com novos fluxos conforme a operação precisar.
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
