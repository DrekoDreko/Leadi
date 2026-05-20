"use client";

import { useState } from "react";
import { CheckCircle2, Circle, X, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  isCompleted: boolean;
};

type OnboardingChecklistProps = {
  steps: OnboardingStep[];
  onDismiss: () => Promise<void>;
  onToggleStep: (stepId: string, completed: boolean) => Promise<void>;
};

export function OnboardingChecklist({
  steps: initialSteps,
  onDismiss,
  onToggleStep
}: OnboardingChecklistProps) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);

  const completedCount = initialSteps.filter((s) => s.isCompleted).length;
  const totalSteps = initialSteps.length;
  const progress = Math.round((completedCount / totalSteps) * 100);
  const isAllCompleted = progress === 100;

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await onDismiss();
    } catch (error) {
      console.error("Erro ao ocultar checklist:", error);
      setIsDismissing(false);
    }
  };

  const handleToggle = async (stepId: string, currentStatus: boolean) => {
    if (togglingStepId) return;
    setTogglingStepId(stepId);
    try {
      await onToggleStep(stepId, !currentStatus);
    } catch (error) {
      console.error("Erro ao alternar passo:", error);
    } finally {
      setTogglingStepId(null);
    }
  };

  return (
    <div
      className={cn(
        "glass overflow-hidden rounded-[32px] border border-white/20 !bg-cloud/95 shadow-xl transition-all duration-700 animate-in fade-in slide-in-from-top-4",
        isDismissing && "scale-95 opacity-0 duration-300"
      )}
    >
      <div className="flex items-center justify-between border-b border-white/20 px-6 py-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500",
              isAllCompleted ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "bg-cobalt/10 text-cobalt"
            )}
          >
            {isAllCompleted ? <CheckCircle2 size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-ink">
              {isAllCompleted ? "Tudo pronto!" : "Primeiros Passos"}
            </h3>
            <p className="text-sm text-ink/60">
              {isAllCompleted
                ? "Sua conta está ativa e você já explorou as principais funções."
                : `Complete ${totalSteps} passos para ativar sua conta e gerar valor.`}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="group flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-red-50 text-ink/30 hover:text-red-500"
          title="Ocultar checklist"
        >
          {isDismissing ? <Loader2 size={18} className="animate-spin" /> : <X size={20} />}
        </button>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink/80">Sua jornada de ativação</span>
            <span
              className={cn(
                "font-bold transition-colors duration-500",
                isAllCompleted ? "text-teal-600" : "text-cobalt"
              )}
            >
              {progress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink/5 p-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                isAllCompleted ? "bg-teal-500" : "bg-cobalt"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {initialSteps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-500",
                step.isCompleted
                  ? "border-teal-500/20 !bg-cloud/95"
                  : "border-white/40 !bg-cloud/95 hover:border-cobalt/30 hover:!bg-cloud/95 hover:shadow-lg hover:shadow-cobalt/5"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => handleToggle(step.id, step.isCompleted)}
                  disabled={togglingStepId === step.id}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    step.isCompleted
                      ? "bg-teal-500 text-white"
                      : "border-2 border-ink/10 text-transparent hover:border-cobalt/50"
                  )}
                >
                  {togglingStepId === step.id ? (
                    <Loader2 size={14} className="animate-spin text-ink/40" />
                  ) : step.isCompleted ? (
                    <CheckCircle2 size={14} strokeWidth={3} />
                  ) : (
                    <Circle size={14} />
                  )}
                </button>

                {!step.isCompleted && (
                  <a
                    href={step.href}
                    className="flex h-8 items-center gap-2 rounded-full bg-cobalt/5 px-3 text-xs font-bold text-cobalt transition-all hover:bg-cobalt hover:text-white"
                  >
                    Começar
                    <ArrowRight size={14} />
                  </a>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4
                  className={cn(
                    "text-sm font-bold transition-all duration-500",
                    step.isCompleted ? "text-teal-800/60 line-through" : "text-ink"
                  )}
                >
                  {step.title}
                </h4>
                <p
                  className={cn(
                    "mt-1.5 text-xs leading-relaxed transition-all duration-500",
                    step.isCompleted ? "text-teal-900/40" : "text-ink/60"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {isAllCompleted && (
          <div className="mt-8 flex animate-bounce items-center justify-center gap-2 text-sm font-bold text-teal-600">
            <span>🎉 Você está pronto para decolar!</span>
          </div>
        )}
      </div>
    </div>
  );
}
