import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Megaphone,
  Palette,
  Sparkles
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { SupportCard } from "./support-card";

const primaryCreations = [
  {
    title: "IA Gerador de Campanha",
    description: "Monte a campanha com publico, objetivo, oferta, observacoes e briefing criativo.",
    href: "/dashboard/criacoes/campanhas",
    icon: Sparkles,
    tone: "bg-primary text-primary-foreground"
  },
  {
    title: "Anuncios criados",
    description: "Veja o historico dos anuncios e retome campanhas ja preparadas.",
    href: "/dashboard/anuncios",
    icon: Megaphone,
    tone: "bg-surface-elevated text-foreground ring-1 ring-border/70"
  },
  {
    title: "IA Gerador de Criativo",
    description: "Gerador de imagens para anuncio com IA a partir do seu briefing.",
    href: "/dashboard/criacoes/solicitar",
    icon: Palette,
    tone: "bg-signal text-accent-foreground"
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
    title: "Solicitar criativo à equipe de design",
    description: "Abra um briefing para a nossa equipe de design criar o material (sem IA).",
    href: "/dashboard/criacoes/solicitar-design",
    icon: Palette
  }
];

export default async function CriacoesPage() {
  const context = await requireCompletedProfile();
  const isConsultant = context.isTeamSeller;

  // Consultor só acessa a solicitação de criativo (sem IA Gerador nem validadores).
  const visiblePrimary = isConsultant
    ? primaryCreations.filter((item) => item.title === "IA Gerador de Criativo")
    : context.isOwner
      ? primaryCreations
      : primaryCreations.filter((item) => item.title !== "Anuncios criados");

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Criar"
        title="Novas criacoes"
        description={
          isConsultant
            ? "Abra aqui a sua solicitacao de criativo para a equipe de operacao."
            : context.isOwner
              ? "Este e o hub de criacao do Leadi: campanhas, validador, solicitacao de criativo e futuras rotinas da operacao."
              : "Crie campanhas e solicite criativos para a operacao."
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {visiblePrimary.map((item) => (
          <Link
            className="group surface-card flex min-h-[250px] flex-col justify-between rounded-[34px] p-6 transition hover:-translate-y-1 hover:border-cobalt/24 hover:bg-surface-elevated"
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
              <p className="text-muted-soft mt-3 leading-7">{item.description}</p>
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
        {!context.isOwner && <SupportCard variant="primary" />}
      </section>

      {context.isOwner && (
      <section className="surface-card space-y-6 rounded-[34px] p-6 md:p-7">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-cobalt">Complementos</p>
            <h2 className="mt-2 text-2xl font-semibold">Tudo o que apoia a criacao</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {secondaryCreations.map((item) => (
            <Link
              className="group surface-card-muted flex min-h-[190px] flex-col justify-between rounded-[26px] p-5 transition hover:-translate-y-1 hover:border-cobalt/18 hover:bg-surface-elevated"
              href={item.href}
              key={item.title}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="surface-pill-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground">
                    <item.icon size={19} aria-hidden="true" />
                  </span>
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-transparent text-muted-foreground transition group-hover:border-cobalt/20 group-hover:bg-cobalt/10 group-hover:text-cobalt group-hover:shadow-[0_8px_24px_rgba(37,99,235,0.16)]">
                    <ArrowRight
                      className="transition group-hover:translate-x-0.5"
                      size={18}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <h3 className="mt-5 font-semibold">{item.title}</h3>
                <p className="text-muted-soft mt-2 text-sm leading-6">{item.description}</p>
              </div>
            </Link>
          ))}
          <SupportCard />
        </div>
      </section>
      )}
    </div>
  );
}
