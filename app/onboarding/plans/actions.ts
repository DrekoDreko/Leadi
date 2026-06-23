"use server";

import { redirect } from "next/navigation";
import {
  buildPlanCheckoutPath,
  isPublicPlanSlug,
  type PublicPlanSlug
} from "@/lib/billing/checkout-flow";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Caminho de continuacao do onboarding DEPOIS que o pagamento e confirmado no
 * checkout (cobranca real ou simulada com BILLING_DISABLED):
 *   essencial    -> dashboard direto
 *   profissional -> tela de atribuicoes
 *   equipe       -> wizard de equipe (intro do owner + passos)
 */
function continuationPathForPlan(plan: PublicPlanSlug): string {
  if (plan === "essencial") {
    return "/dashboard";
  }

  if (plan === "profissional") {
    return "/onboarding/profissional";
  }

  return "/onboarding/equipe";
}

export async function choosePlanAction(formData: FormData) {
  const rawPlan = String(formData.get("planCode") ?? "");

  if (!isPublicPlanSlug(rawPlan)) {
    redirect("/onboarding/plans?error=invalid-plan");
  }

  const plan = rawPlan as PublicPlanSlug;
  const continuation = continuationPathForPlan(plan);

  if (!isSupabaseConfigured()) {
    redirect(continuation);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .rpc("complete_plan_setup", { plan_code: plan })
    .single();

  if (error || !data) {
    redirect(`/onboarding/plans?error=${getSetupErrorCode(error)}`);
  }

  // Apos escolher o plano, o usuario vai para a tela de pagamento. Com
  // BILLING_DISABLED o checkout simula o pagamento aprovado e segue. O `next`
  // leva o usuario para o proximo passo do onboarding apos a confirmacao.
  redirect(`${buildPlanCheckoutPath(plan, "monthly")}&next=${encodeURIComponent(continuation)}`);
}

function getSetupErrorCode(error: { code?: string; message?: string } | null) {
  if (
    error?.code === "PGRST202" ||
    error?.code === "42703" ||
    error?.message?.includes("complete_plan_setup") ||
    error?.message?.includes("plan_type") ||
    error?.message?.includes("profile_setup_completed")
  ) {
    return "setup-schema-missing";
  }

  return "setup-failed";
}
