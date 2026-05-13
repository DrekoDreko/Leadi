import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import type { OnboardingState } from "./types";

export type { OnboardingState };


export async function getOnboardingStateForCurrentUser(): Promise<OnboardingState | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return null;

  const { data, error } = await supabase
    .from("onboarding_states")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar estado de onboarding:", error);
    return null;
  }

  if (!data) {
    return {
      organizationId: profile.organization_id,
      dismissedAt: null,
      completedSteps: []
    };
  }

  return {
    organizationId: data.organization_id,
    dismissedAt: data.dismissed_at,
    completedSteps: data.completed_steps || []
  };
}

export async function updateOnboardingStateForCurrentUser(input: {
  dismissedAt?: string | null;
  completedSteps?: string[];
}) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuario nao autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) throw new Error("Perfil nao encontrado.");

  type OnboardingInsert = Database["public"]["Tables"]["onboarding_states"]["Insert"];
  
  const payload: OnboardingInsert = {
    organization_id: profile.organization_id,
  };

  if (input.dismissedAt !== undefined) {
    payload.dismissed_at = input.dismissedAt;
  }
  
  if (input.completedSteps !== undefined) {
    payload.completed_steps = input.completedSteps;
  }

  const { error } = await supabase
    .from("onboarding_states")
    .upsert(payload, { onConflict: "organization_id" });

  if (error) {
    throw new Error("Erro ao atualizar estado de onboarding: " + error.message);
  }
}

