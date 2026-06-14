import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import { updateCampaignCopyForCurrentUser } from "@/lib/campaigns/repository.server";
import { reviewCampaignCopyLocally } from "@/lib/campaigns/compliance";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const updateCopySchema = z
  .object({
    campaignId: requiredTrimmedString("Informe o id da campanha.").max(120),
    primaryText: z.string().trim().max(2000).optional(),
    headline: z.string().trim().max(400).optional(),
    description: z.string().trim().max(800).optional(),
    callToAction: z.string().trim().max(200).optional()
  })
  .strict();

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel. Configure o backend antes de editar campanhas." },
      { status: 503 }
    );
  }

  let campaignId = "";

  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-campaigns-copy",
      limit: 30,
      windowMs: 60 * 1000
    });

    const identity = await resolveCurrentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    if (!identity.canManageConnections) {
      return NextResponse.json(
        { error: "Apenas owner ou admin podem editar campanhas." },
        { status: 403 }
      );
    }

    const body = await parseJsonBody(request, updateCopySchema);
    campaignId = body.campaignId;

    const campaign = await updateCampaignCopyForCurrentUser(campaignId, {
      primaryText: body.primaryText,
      headline: body.headline,
      description: body.description,
      callToAction: body.callToAction
    });

    const review = reviewCampaignCopyLocally({
      primaryText: campaign.result.primaryText,
      headline: campaign.result.headline,
      description: campaign.result.description,
      callToAction: campaign.result.callToAction
    });

    return NextResponse.json({ campaign, review });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel atualizar os textos da campanha.";
    const status = getErrorStatus(error);

    logApiError({
      route: "/api/campaigns/copy",
      operation: "UPDATE_CAMPAIGN_COPY",
      message,
      status,
      error,
      data: { campaignId }
    });

    return NextResponse.json({ error: message }, { status });
  }
}
