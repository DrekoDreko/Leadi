import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Crown,
  Megaphone,
  UserPlus
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { requireCompletedProfile } from "@/lib/workspaces/context";

const steps = [
  {
    icon: Building2,
    title: "1. Configure sua corretora",
    description: "Nome, logo e dados basicos para identificar sua operacao e os relatorios por responsavel."
  },
  {
    icon: UserPlus,
    title: "2. Convide sua equipe",
    description: "Convide supervisores e consultores. Cada um recebe um link para entrar na sua corretora."
  },
  {
    icon: Megaphone,
    title: "3. Crie anuncios ou importe leads",
    description: "Gere seu primeiro anuncio com IA ou importe leads para distribuir aos supervisores."
  }
];

export default async function OnboardingEquipePage() {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && context.workspace?.plan_type !== "equipe") {
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
              <Crown size={15} aria-hidden="true" /> Plano Equipe
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              Voce e o Owner da corretora
            </h1>
            <p className="mt-4 leading-7 text-ink/62">
              Como Owner (dono da corretora), voce tem o controle total: cria a estrutura da
              equipe, convida supervisores e consultores, importa os leads e os distribui. O
              fluxo e simples — <strong>o Owner importa os leads e distribui para os
              supervisores; os supervisores distribuem para os consultores</strong>. Voce
              acompanha o desempenho de toda a operacao em um lugar so.
            </p>
          </div>

          <div className="surface-card mt-8 rounded-[30px] p-6">
            <p className="text-sm font-semibold text-muted-strong">Proximos passos</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.title} className="surface-card-muted rounded-[24px] p-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cobalt text-white">
                    <step.icon size={21} aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-base font-semibold">{step.title}</h2>
                  <p className="mt-2 leading-7 text-muted-soft">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href="/onboarding/equipe/corretora"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-8 py-4 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-cobalt/90"
            >
              CONTINUAR
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
