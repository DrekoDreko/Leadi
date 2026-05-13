import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import {
  MetaMarketingPermissionError,
  publishPausedMetaCampaign
} from "@/lib/meta/campaign-publication.server";
import type { CampaignPublishMode } from "@/lib/campaigns/types";

type CampaignPublishRequestBody = {
  campaignId?: unknown;
  publishMode?: unknown;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel. Configure o backend antes de publicar campanhas." },
      { status: 503 }
    );
  }

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
  }

  if (!identity.canManageConnections) {
    return NextResponse.json(
      { error: "Apenas owner ou admin podem publicar campanhas na Meta." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as CampaignPublishRequestBody | null;
  const campaignId = typeof body?.campaignId === "string" ? body.campaignId.trim() : "";
  const publishMode = normalizePublishMode(body?.publishMode);

  if (!campaignId) {
    return NextResponse.json({ error: "Informe o id da campanha." }, { status: 400 });
  }

  try {
    const result = await publishPausedMetaCampaign({
      organizationId: identity.organization.id,
      campaignId,
      createdByProfileId: identity.profile.id,
      publishMode
    });

    return NextResponse.json({
      campaign: result.campaign,
      attempt: result.attempt
    });
  } catch (error) {
    const { message, status } = getCampaignPublishError(error);

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
