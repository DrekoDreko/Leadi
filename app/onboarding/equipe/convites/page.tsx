import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { requireWorkspaceManager } from "@/lib/workspaces/context";
import { OnboardingInvites } from "./onboarding-invites";

export default async function OnboardingConvitesPage() {
  const context = await requireWorkspaceManager();

  if (context.mode === "supabase" && context.workspace?.plan_type !== "equipe") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-3xl">
        <div className="mb-6">
          <BrandMark />
        </div>

        <div className="glass-strong rounded-[34px] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-cobalt">Passo 2 de 3 · Equipe</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">Convide sua equipe</h1>
            <p className="mt-4 leading-7 text-ink/62">
              Gere links de convite para supervisores e consultores. Cada pessoa entra na sua
              corretora pelo link. Voce pode fazer isso agora ou depois, pelo painel de equipe.
            </p>
          </div>

          <OnboardingInvites />
        </div>
      </section>
    </main>
  );
}
