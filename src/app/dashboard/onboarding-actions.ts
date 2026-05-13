"use server";

import { revalidatePath } from "next/cache";
import { updateOnboardingStateForCurrentUser } from "@/lib/onboarding/repository.server";

export async function dismissOnboardingChecklist() {
  await updateOnboardingStateForCurrentUser({
    dismissedAt: new Date().toISOString()
  });
  revalidatePath("/dashboard");
}

export async function toggleOnboardingStep(stepId: string, completed: boolean, currentCompletedSteps: string[]) {
  let nextSteps: string[];
  
  if (completed) {
    if (!currentCompletedSteps.includes(stepId)) {
      nextSteps = [...currentCompletedSteps, stepId];
    } else {
      nextSteps = currentCompletedSteps;
    }
  } else {
    nextSteps = currentCompletedSteps.filter(id => id !== stepId);
  }

  await updateOnboardingStateForCurrentUser({
    completedSteps: nextSteps
  });
  revalidatePath("/dashboard");
}
