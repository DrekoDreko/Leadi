import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { updateCampaignApprovalStatus } from "@/lib/campaigns/repository.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

const approveCampaignSchema = z.object({
  campaignId: requiredTrimmedString("Informe o id da campanha.").max(120),
  approvalStatus: z.enum(["approved", "rejected", "needs_adjustment"])
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase indisponivel." },
      { status: 503 }
    );
  }

  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-campaigns-approve",
      limit: 20,
      windowMs: 60 * 1000
    });

    const billingContext = await getBillingAuthContext();
    if (!billingContext) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    if (billingContext.role !== "owner") {
      return NextResponse.json(
        { error: "Apenas o gestor (owner) pode aprovar campanhas." },
        { status: 403 }
      );
    }

    const body = await parseJsonBody(request, approveCampaignSchema);
    
    const updatedCampaign = await updateCampaignApprovalStatus(
      body.campaignId,
      body.approvalStatus
    );

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    const status = error instanceof ApiRouteError ? getErrorStatus(error) : 400;
    const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o status de aprovacao.";

    logApiError({
      route: "/api/campaigns/approve",
      operation: "APPROVE_CAMPAIGN",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}
