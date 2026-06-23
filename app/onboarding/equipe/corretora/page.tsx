import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { BrokerageForm } from "./brokerage-form";

const errorMessages: Record<string, string> = {
  invalid: "Revise os dados da corretora. O nome e obrigatorio.",
  "logo-type": "Use uma imagem JPG, PNG ou WEBP para o logo.",
  "logo-size": "O logo deve ter no maximo 2MB.",
  failed: "Nao foi possivel salvar os dados. Tente novamente."
};

export default async function OnboardingCorretoraPage({
  searchParams
}: {
  searchParams?: Promise<{ done?: string; error?: string }>;
}) {
  const context = await requireCompletedProfile();

  if (context.mode === "supabase" && context.workspace?.plan_type !== "equipe") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const done = params?.done === "1";
  const error = params?.error ? errorMessages[params.error] ?? params.error : null;

  const workspace = context.workspace;
  const defaultName =
    workspace?.name && !/\sCRM$/i.test(workspace.name) ? workspace.name : "";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-3xl">
        <div className="mb-6">
          <BrandMark />
        </div>

        <div className="glass-strong rounded-[34px] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-cobalt">Passo 1 de 3 · Equipe</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              Configure sua corretora
            </h1>
            <p className="mt-4 leading-7 text-ink/62">
              Esses dados identificam sua corretora no painel e nos relatorios por responsavel.
            </p>
          </div>

          {error && (
            <p className="mt-6 rounded-[22px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink dark:text-cloud">
              {error}
            </p>
          )}

          <BrokerageForm
            defaultName={defaultName}
            defaultPhone={workspace?.phone ?? ""}
            defaultCity={workspace?.address_city ?? ""}
            defaultState={workspace?.address_state ?? ""}
            logoUrl={workspace?.logo_url ?? null}
            done={done}
            summary={{
              name: workspace?.name ?? "Sua corretora",
              phone: workspace?.phone ?? null,
              city: workspace?.address_city ?? null,
              state: workspace?.address_state ?? null,
              logoUrl: workspace?.logo_url ?? null
            }}
          />
        </div>
      </section>
    </main>
  );
}
