import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getConnectedAccountsForCurrentUser,
  resolveCurrentIdentity,
  resolveMetaAccessTokenForOrganization
} from "@/lib/integrations/repository.server";
import {
  accountHasDataset,
  dismissDatasetOnboarding,
  isDatasetOnboardingDismissed
} from "@/lib/meta/dataset-onboarding.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError
} from "@/lib/api/route-security";

export const runtime = "nodejs";

// Mudanca 8: estado do passo de onboarding (o card no painel de anuncios consulta
// isto sob demanda para nao pesar o carregamento da pagina). show=true quando o
// owner/admin ainda nao dispensou e a conta de anuncio nao tem dataset/pixel.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ show: false });
  }

  const identity = await resolveCurrentIdentity().catch(() => null);
  if (!identity || !identity.canManageConnections) {
    return NextResponse.json({ show: false });
  }

  try {
    if (await isDatasetOnboardingDismissed(identity.organization.id)) {
      return NextResponse.json({ show: false });
    }

    const connected = await getConnectedAccountsForCurrentUser();
    const adAccount = connected.metaAdAccounts[0];
    if (!adAccount) {
      return NextResponse.json({ show: false });
    }

    const accessToken = await resolveMetaAccessTokenForOrganization(identity.organization.id);
    if (!accessToken) {
      return NextResponse.json({ show: false });
    }

    const hasDataset = await accountHasDataset(accessToken, adAccount.metaAdAccountId);
    return NextResponse.json({ show: !hasDataset });
  } catch {
    // Best-effort: na duvida, nao empurra o onboarding.
    return NextResponse.json({ show: false });
  }
}

// Mudanca 8: dispensa (uma vez) o passo de onboarding de pixel/dataset para a
// organizacao. So owner/admin.
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase indisponivel." }, { status: 503 });
  }

  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-meta-dataset-onboarding",
    limit: 10,
    windowMs: 60 * 1000
  });

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
  }

  if (!identity.canManageConnections) {
    return NextResponse.json({ error: "Apenas owner ou admin." }, { status: 403 });
  }

  try {
    await dismissDatasetOnboarding(identity.organization.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof ApiRouteError ? getErrorStatus(error) : 400;
    const message = error instanceof Error ? error.message : "Falha ao dispensar o passo.";
    logApiError({
      route: "/api/meta/dataset-onboarding",
      operation: "DISMISS_DATASET_ONBOARDING",
      message,
      status,
      error,
      data: { organizationId: identity.organization.id }
    });
    return NextResponse.json({ error: message }, { status });
  }
}
