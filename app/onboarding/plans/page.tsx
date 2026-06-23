import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { marketingPricingPlans } from "@/data/pricing";
import { cn } from "@/lib/utils";
import { choosePlanAction } from "./actions";

const errorMessages: Record<string, string> = {
  "invalid-plan": "Plano invalido. Escolha um dos planos disponiveis.",
  "setup-failed": "Nao foi possivel salvar o plano escolhido. Tente novamente.",
  "setup-schema-missing":
    "O banco conectado ainda nao recebeu a migration de planos no onboarding. Aplique a migration mais recente no Supabase e tente novamente."
};

export default async function OnboardingPlansPage({
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
      <section className="w-full max-w-6xl">
        <div className="mb-6">
          <BrandMark />
        </div>

        <div className="glass-strong rounded-[34px] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-cobalt">Configuracao inicial</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              Escolha o plano ideal para comecar
            </h1>
            <p className="mt-4 leading-7 text-ink/62">
              O plano define seu workspace, suas permissoes e o caminho do seu onboarding.
              Voce pode evoluir de plano quando quiser.
            </p>
          </div>

          {error && (
            <p className="mt-6 rounded-[22px] bg-signal/34 px-4 py-3 text-sm font-medium text-ink dark:text-cloud">
              {error}
            </p>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {marketingPricingPlans.map((plan) => {
              const price = plan.prices.monthly;
              const isHighlight = Boolean(plan.highlight);
              const isTeam = Boolean(plan.isTeam);

              return (
                <form
                  key={plan.slug}
                  action={choosePlanAction}
                  className="group flex h-full flex-col"
                >
                  <input type="hidden" name="planCode" value={plan.slug} />
                  <div
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-[30px] p-6 shadow-soft",
                      isHighlight
                        ? "border border-signal/35 bg-[linear-gradient(180deg,rgba(18,23,33,0.98),rgba(25,35,55,0.96))] text-cloud"
                        : isTeam
                        ? "border border-violet-500/35 bg-[linear-gradient(180deg,rgba(18,12,33,0.98),rgba(25,18,50,0.96))] text-cloud"
                        : "surface-card-strong"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {plan.badge ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                              isTeam ? "bg-violet-600 text-white" : "bg-signal text-accent-foreground"
                            )}
                          >
                            {plan.badge}
                          </span>
                        ) : null}
                        <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
                        <p
                          className={cn(
                            "mt-2 text-sm font-semibold",
                            isHighlight ? "text-signal" : isTeam ? "text-violet-400" : "text-cobalt"
                          )}
                        >
                          {plan.label}
                        </p>
                      </div>
                      {isHighlight ? (
                        <Sparkles className="text-signal" size={22} aria-hidden="true" />
                      ) : isTeam ? (
                        <Sparkles className="text-violet-400" size={22} aria-hidden="true" />
                      ) : null}
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end gap-2">
                        <p className="text-4xl font-semibold tracking-tight">{price.amount}</p>
                        <span
                          className={cn(
                            "pb-1 text-base font-medium",
                            isHighlight || isTeam ? "text-white/74" : "text-foreground/62"
                          )}
                        >
                          {price.suffix}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-2 text-sm",
                          isHighlight || isTeam ? "text-white/62" : "text-muted-soft"
                        )}
                      >
                        {price.note}
                      </p>
                    </div>

                    <div className="mt-6 grow space-y-3">
                      {plan.features.map((feature) => (
                        <div className="flex items-start gap-3" key={feature}>
                          <CheckCircle2
                            className={
                              isHighlight
                                ? "mt-0.5 text-signal"
                                : isTeam
                                ? "mt-0.5 text-violet-400"
                                : "mt-0.5 text-lagoon"
                            }
                            size={18}
                            aria-hidden="true"
                          />
                          <span
                            className={
                              isHighlight || isTeam ? "text-white/84" : "text-foreground/78"
                            }
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className={cn(
                        "mt-8 w-full rounded-full px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5",
                        isHighlight
                          ? "bg-signal text-[#121721] hover:bg-signal/90"
                          : isTeam
                          ? "bg-violet-600 text-white hover:bg-violet-700"
                          : "bg-cobalt text-white hover:bg-cobalt/90"
                      )}
                    >
                      Continuar com {plan.name}
                    </button>
                  </div>
                </form>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
