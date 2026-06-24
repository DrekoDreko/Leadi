import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import {
  MetaMarketingPermissionError,
  publishPausedMetaCampaign
} from "@/lib/meta/campaign-publication.server";
import type { CampaignPublishMode } from "@/lib/campaigns/types";
import { canManageOwnMetaConnection } from "@/lib/workspaces/permissions";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const publishCampaignSchema = z.object({
  campaignId: requiredTrimmedString("Informe o id da campanha.").max(120),
  publishMode: z.enum(["draft", "manual_review", "scheduled", "paused"]).optional(),
  dailyBudget: z.number().min(1).max(100000).optional()
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel. Configure o backend antes de publicar campanhas." },
      { status: 503 }
    );
  }

  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-campaigns-publish",
    limit: 20,
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
      { error: "Voce nao tem permissao para publicar campanhas na Meta." },
      { status: 403 }
    );
  }

  const body = await parseJsonBody(request, publishCampaignSchema);
  const campaignId = body.campaignId;
  const publishMode = normalizePublishMode(body?.publishMode);

  try {
    const result = await publishPausedMetaCampaign({
      organizationId: identity.organization.id,
      campaignId,
      createdByProfileId: identity.profile.id,
      // Consultor só publica a própria campanha; owner/admin sem restrição.
      restrictToCreatorProfileId: identity.canManageConnections ? null : identity.profile.id,
      publishMode,
      dailyBudget: body.dailyBudget
    });

    return NextResponse.json({
      campaign: result.campaign,
      attempt: result.attempt
    });
  } catch (error) {
    const { message, status } = getCampaignPublishError(error);

    logApiError({
      route: "/api/campaigns/publish",
      operation: "PUBLISH_META_CAMPAIGN",
      message,
      status,
      error,
      data: {
        campaignId,
        organizationId: identity.organization.id
      }
    });

    return NextResponse.json({ error: message }, { status });
  }
}

function normalizePublishMode(value: unknown): CampaignPublishMode {
  if (
    value === "draft" ||
    value === "manual_review" ||
    value === "scheduled" ||
    value === "paused"
  ) {
    return value;
  }

  return "paused";
}

function getCampaignPublishError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return {
      message: error.message,
      status: getErrorStatus(error)
    };
  }

  if (error instanceof MetaMarketingPermissionError) {
    return {
      message: error.message,
      status: error.status
    };
  }

  if (error instanceof Error && error.message) {
    return {
      message: error.message,
      status: 400
    };
  }

  return {
    message: "Nao foi possivel publicar a campanha agora.",
    status: 400
  };
}
