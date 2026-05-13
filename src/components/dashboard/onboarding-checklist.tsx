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
  const progress = Math.round((completedCount / initialSteps.length) * 100);

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
    setTogglingStepId(stepId);
    try {
      await onToggleStep(stepId, !currentStatus);
    } catch (error) {
      console.error("Erro ao alternar passo:", error);
    } finally {
      setTogglingStepId(null);
    }
  };

  if (progress === 100 && !isDismissing) {
    // Optional: Auto-hide when 100%? The requirements say "Permitir ocultar ou concluir manualmente".
    // I'll keep it visible but maybe with a success state.
  }

  return (
    <div className="glass overflow-hidden rounded-[32px] border border-white/20 bg-white/40 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between border-b border-white/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">Primeiros Passos</h3>
            <p className="text-xs text-ink/60">
              Complete {initialSteps.length} passos para ativar sua conta e gerar valor.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="group flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-red-50 text-ink/40 hover:text-red-500"
          title="Ocultar checklist"
        >
          {isDismissing ? <Loader2 size={16} className="animate-spin" /> : <X size={18} />}
        </button>
      </div>

      <div className="p-6">
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink/80">Sua jornada de ativação</span>
            <span className="font-bold text-cobalt">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/5">
            <div
              className="h-full bg-cobalt transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {initialSteps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300",
                step.isCompleted
                  ? "border-cobalt/20 bg-cobalt/5"
                  : "border-white/40 bg-white/20 hover:border-cobalt/30 hover:bg-white/40"
              )}
            >
              <button
                onClick={() => handleToggle(step.id, step.isCompleted)}
                disabled={togglingStepId === step.id}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all",
                  step.isCompleted
                    ? "bg-cobalt text-white"
                    : "border-2 border-ink/20 text-transparent hover:border-cobalt/50"
                )}
              >
                {togglingStepId === step.id ? (
                  <Loader2 size={12} className="animate-spin text-ink/40" />
                ) : step.isCompleted ? (
                  <CheckCircle2 size={12} strokeWidth={3} />
                ) : (
                  <Circle size={12} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={cn(
                      "text-sm font-bold transition-all",
                      step.isCompleted ? "text-cobalt/80 line-through" : "text-ink"
                    )}
                  >
                    {step.title}
                  </h4>
                  {!step.isCompleted && (
                    <a
                      href={step.href}
                      className="text-cobalt opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight size={14} />
                    </a>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1 text-xs leading-relaxed transition-all",
                    step.isCompleted ? "text-ink/40" : "text-ink/60"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
