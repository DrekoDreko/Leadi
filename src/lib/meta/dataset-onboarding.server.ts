import "server-only";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { getMetaGraphApiVersion } from "@/lib/meta/config";

// Mudanca 8: onboarding de pixel/dataset.
//
// A conta nao tem dataset (pixel). O formulario instantaneo funciona sem ele, mas
// sem pixel o corretor nunca tera retargeting de visitantes, lookalike de quem
// converteu, nem medicao pos-lead. Aqui detectamos a ausencia e o app guia a
// criacao — sem bloquear a publicacao (e melhoria, nao pre-requisito).

function sanitizeAdAccountId(adAccountId: string): string {
  return adAccountId.replace(/^act_/, "");
}

// A conta tem ao menos um dataset/pixel? Best-effort: falha de rede vira "true"
// para nao empurrar o onboarding sem certeza.
export async function accountHasDataset(
  accessToken: string,
  adAccountId: string
): Promise<boolean> {
  try {
    const url = new URL(
      `https://graph.facebook.com/${getMetaGraphApiVersion()}/act_${sanitizeAdAccountId(adAccountId)}/adspixels`
    );
    url.searchParams.set("fields", "id");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });

    if (!response.ok) return true;
    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{ id?: string }>;
    } | null;
    return (payload?.data?.length ?? 0) > 0;
  } catch {
    return true;
  }
}

// Marca o passo de onboarding de dataset como dispensado para a organizacao.
export async function dismissDatasetOnboarding(organizationId: string): Promise<void> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ dataset_onboarding_dismissed_at: new Date().toISOString() })
    .eq("id", organizationId);

  if (error) {
    throw new Error(error.message);
  }
}

// Ja foi dispensado?
export async function isDatasetOnboardingDismissed(organizationId: string): Promise<boolean> {
  if (!hasSupabaseServiceRole()) return false;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("organizations")
    .select("dataset_onboarding_dismissed_at")
    .eq("id", organizationId)
    .maybeSingle();

  return Boolean((data as { dataset_onboarding_dismissed_at: string | null } | null)?.dataset_onboarding_dismissed_at);
}
