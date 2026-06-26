import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import { MetaMarketingPermissionError } from "@/lib/meta/campaign-publication.server";
import { updateMetaAccountSpendCap } from "@/lib/meta/campaign-controls.server";
import { canManageOwnMetaConnection } from "@/lib/workspaces/permissions";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

// spendCap em reais (teto rigido da conta) ou null para remover o limite.
const spendCapSchema = z.object({
  spendCap: z.number().min(1).max(1_000_000).nullable()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel. Configure o backend antes de operar campanhas." },
      { status: 503 }
    );
  }

  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-campaigns-spend-cap",
    limit: 10,
    windowMs: 60 * 1000
  });

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
  }

  const canManagePersonal = canManageOwnMetaConnection(
    identity.profile.role,
    identity.profile.ad_creation_enabled
  );

  if (!identity.canManageConnections && !canManagePersonal) {
    return NextResponse.json(
      { error: "Voce nao tem permissao para alterar o limite de gastos da conta." },
      { status: 403 }
    );
  }

  const { id: campaignId } = await params;
  const body = await parseJsonBody(request, spendCapSchema);

  try {
    const account = await updateMetaAccountSpendCap({
      organizationId: identity.organization.id,
      campaignId,
      spendCap: body.spendCap,
      restrictToCreatorProfileId: identity.canManageConnections ? null : identity.profile.id
    });

    return NextResponse.json({ account });
  } catch (error) {
    const { message, status } = resolveError(error);

    logApiError({
      route: "/api/campaigns/[id]/spend-cap",
      operation: "UPDATE_META_ACCOUNT_SPEND_CAP",
      message,
      status,
      error,
      data: { campaignId, organizationId: identity.organization.id }
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function resolveError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return { message: error.message, status: getErrorStatus(error) };
  }
  if (error instanceof MetaMarketingPermissionError) {
    return { message: error.message, status: error.status };
  }
  if (error instanceof Error && error.message) {
    return { message: error.message, status: 400 };
  }
  return { message: "Nao foi possivel atualizar o limite de gastos agora.", status: 400 };
}
