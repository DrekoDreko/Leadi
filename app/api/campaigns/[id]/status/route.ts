import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import { MetaMarketingPermissionError } from "@/lib/meta/campaign-publication.server";
import { updateMetaCampaignDelivery } from "@/lib/meta/campaign-controls.server";
import { canManageOwnMetaConnection } from "@/lib/workspaces/permissions";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

const statusSchema = z.object({
  action: z.enum(["activate", "pause"])
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
    keyPrefix: "api-campaigns-status",
    limit: 30,
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
      { error: "Voce nao tem permissao para ativar ou pausar campanhas." },
      { status: 403 }
    );
  }

  const { id: campaignId } = await params;
  const body = await parseJsonBody(request, statusSchema);

  try {
    const campaign = await updateMetaCampaignDelivery({
      organizationId: identity.organization.id,
      campaignId,
      createdByProfileId: identity.profile.id,
      restrictToCreatorProfileId: identity.canManageConnections ? null : identity.profile.id,
      action: body.action
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    const { message, status } = resolveError(error);

    logApiError({
      route: "/api/campaigns/[id]/status",
      operation: "UPDATE_META_CAMPAIGN_DELIVERY",
      message,
      status,
      error,
      data: { campaignId, organizationId: identity.organization.id, action: body.action }
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
  return { message: "Nao foi possivel atualizar a campanha agora.", status: 400 };
}
