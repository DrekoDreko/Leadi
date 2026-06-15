import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import { MetaMarketingPermissionError } from "@/lib/meta/campaign-publication.server";
import { updateMetaAdSetBudget } from "@/lib/meta/campaign-controls.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

const budgetSchema = z.object({
  dailyBudget: z.number().min(1).max(100000)
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
    keyPrefix: "api-campaigns-budget",
    limit: 30,
    windowMs: 60 * 1000
  });

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
  }

  if (!identity.canManageConnections) {
    return NextResponse.json(
      { error: "Apenas owner ou admin podem alterar o orcamento de campanhas." },
      { status: 403 }
    );
  }

  const { id: campaignId } = await params;
  const body = await parseJsonBody(request, budgetSchema);

  try {
    const campaign = await updateMetaAdSetBudget({
      organizationId: identity.organization.id,
      campaignId,
      dailyBudget: body.dailyBudget
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    const { message, status } = resolveError(error);

    logApiError({
      route: "/api/campaigns/[id]/budget",
      operation: "UPDATE_META_ADSET_BUDGET",
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
  return { message: "Nao foi possivel atualizar o orcamento agora.", status: 400 };
}
