import { redirect } from "next/navigation";
import { BriefcaseBusiness, UserRoundCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { completeProfileSetupAction } from "./actions";

const errorMessages: Record<string, string> = {
  "setup-failed": "Nao foi possivel salvar sua configuracao inicial. Tente novamente.",
  "setup-schema-missing":
    "O banco conectado ainda nao recebeu a migration de onboarding. Aplique supabase/migrations/202604290003_onboarding_workspaces_invites.sql no Supabase e tente novamente."
};

export default async function ProfileSetupPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const context = await getCurrentWorkspaceContext();
  const params = await searchParams;

  if (context.mode === "supabase" && context.profileSetupCompleted) {
    redirect("/dashboard");
  }

  const error = params?.error ? errorMessages[params.error] ?? params.error : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-5xl">
        <div className="mb-6">
          <BrandMark />
        </div>

        <div className="glass-strong rounded-[34px] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-cobalt">Configuracao inicial</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              Como voce vai usar a LeadHealth?
            </h1>
            <p className="mt-4 leading-7 text-ink/62">
              Essa escolha define seu workspace, permissoes e a experiencia inicial do CRM.
            </p>
          </div>

          {error && (
            <p className="mt-6 rounded-[22px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink">
              {error}
            </p>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <form action={completeProfileSetupAction}>
              <input name="setupMode" type="hidden" value="solo" />
              <button
                className="group h-full w-full rounded-[30px] border border-white/56 bg-white/42 p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-white/64"
                type="submit"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt text-white">
                  <UserRoundCheck size={21} aria-hidden="true" />
                </span>
                <span className="mt-6 block text-2xl font-semibold">Sou vendedor solo</span>
                <span className="mt-3 block leading-7 text-ink/62">
                  Vou trabalhar minha propria carteira de leads, campanhas, mensagens,
                  compliance, pedidos e importacoes.
                </span>
                <span className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
                  Continuar como vendedor
                </span>
              </button>
            </form>

            <form action={completeProfileSetupAction}>
              <input name="setupMode" type="hidden" value="supervisor" />
              <button
                className="group h-full w-full rounded-[30px] border border-white/56 bg-white/42 p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-white/64"
                type="submit"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lagoon text-white">
                  <BriefcaseBusiness size={21} aria-hidden="true" />
                </span>
                <span className="mt-6 block text-2xl font-semibold">
                  Sou supervisor / gestor de equipe
                </span>
                <span className="mt-3 block leading-7 text-ink/62">
                  Vou criar um workspace de equipe para convidar vendedores, acompanhar leads
                  e organizar a operacao comercial.
                </span>
                <span className="mt-6 inline-flex rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white">
                  Configurar equipe
                </span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
