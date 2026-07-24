"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanChoiceContextValue = {
  submittingPlan: string | null;
  setSubmittingPlan: Dispatch<SetStateAction<string | null>>;
};

const PlanChoiceContext = createContext<PlanChoiceContextValue | null>(null);

/**
 * Compartilha qual plano esta sendo enviado para que os botoes dos outros
 * cards fiquem desabilitados durante a escolha.
 */
export function PlanChoiceProvider({ children }: { children: ReactNode }) {
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);

  return (
    <PlanChoiceContext.Provider value={{ submittingPlan, setSubmittingPlan }}>
      {children}
    </PlanChoiceContext.Provider>
  );
}

export function PlanSubmitButton({
  planSlug,
  planName,
  className
}: {
  planSlug: string;
  planName: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const context = useContext(PlanChoiceContext);
  const setSubmittingPlan = context?.setSubmittingPlan;

  useEffect(() => {
    if (!setSubmittingPlan) return;

    if (pending) {
      setSubmittingPlan(planSlug);
      return;
    }

    setSubmittingPlan((current) => (current === planSlug ? null : current));
  }, [pending, planSlug, setSubmittingPlan]);

  const otherPlanPending = Boolean(
    context?.submittingPlan && context.submittingPlan !== planSlug
  );
  const disabled = pending || otherPlanPending;

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-busy={pending}
      className={cn(
        "mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
          Preparando seu workspace...
        </>
      ) : (
        <>Continuar com {planName}</>
      )}
    </button>
  );
}
