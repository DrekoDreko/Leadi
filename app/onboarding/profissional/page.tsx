import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  ImageIcon,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRoundCheck
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { requireCompletedProfile } from "@/lib/workspaces/context";

const attributions = [
  {
    icon: Megaphone,
    title: "Campanhas completas com IA",
    description: "Gere campanhas de Meta Ads com publico, oferta, copy e estrutura prontos para publicar."
  },
  {
    icon: ImageIcon,
    title: "Imagens de anuncio com IA",
    description: "Crie artes de anuncio (feed e vertical) a partir de um briefing simples."
  },
  {
    icon: MessageCircle,
    title: "Mensagens e textos com IA",
    description: "Mensagens de WhatsApp e textos de anuncio gerados para acelerar o atendimento."
  },
  {
    icon: ShieldCheck,
    title: "Validador de anuncio / compliance",
    description: "Revise seus anuncios antes de publicar e reduza reprovacoes na Meta."
  },
  {
    icon: BarChart3,
    title: "Meta Lead Ads e relatorios de origem",
    description: "Conecte sua conta Meta, importe leads e acompanhe a origem de cada oportunidade."
  },
  {
    icon: UserRoundCheck,
    title: "Operacao individual",
    description: "Voce e o owner do seu workspace. Sem supervisores ou consultores neste plano."
  }
];

export default async function OnboardingProfissionalPage() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && context.workspace?.plan_type !== "profissional") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-5xl">
        <div className="mb-6">
          <BrandMark />
        </div>

        <div className="glass-strong rounded-[34px] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt">
              <Sparkles size={15} aria-hidden="true" /> Plano Profissional
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              Tudo o que voce pode fazer no Profissional
            </h1>
            <p className="mt-4 leading-7 text-ink/62">
              Voce entra como owner solo, com toda a IA do Leadi liberada para criar campanhas,
              organizar leads e acompanhar resultados em um fluxo so.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {attributions.map((item) => (
              <article
                key={item.title}
                className="surface-card-muted rounded-[26px] p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cobalt text-white">
                  <item.icon size={21} aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 leading-7 text-muted-soft">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-soft">
              Precisa de equipe, distribuicao de leads e supervisores? Voce pode migrar para o
              plano Equipe quando quiser.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5"
            >
              Ir para o painel
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
