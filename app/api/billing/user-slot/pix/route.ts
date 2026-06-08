import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvValidationError, requireIntegrationEnv } from "@/lib/env/server";
import { createAbacatePayTransparent } from "@/lib/billing/abacatepay";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  getErrorStatus,
  logApiError,
  parseJsonBody
} from "@/lib/api/route-security";

const USER_SLOT_PRICE_CENTS = 5900;

const userSlotPixSchema = z.object({
  roleToAssign: z.enum(["admin", "seller"]),
  inviteEmail: z.string().email().optional().nullable()
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-user-slot-pix",
      limit: 8,
      windowMs: 60 * 1000
    });

    requireIntegrationEnv("billing");

    const body = await parseJsonBody(request, userSlotPixSchema);
    const context = await getBillingAuthContext();

    if (!context) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    if (context.role !== "owner") {
      return NextResponse.json(
        { error: "Apenas o gestor pode adicionar membros." },
        { status: 403 }
      );
    }

    const roleLabel = body.roleToAssign === "admin" ? "Supervisor" : "Consultor";
    const description = body.inviteEmail
      ? `Novo ${roleLabel} - ${body.inviteEmail} - Leadi`
      : `Novo ${roleLabel} - Convite por link - Leadi`;

    const externalId = `user-slot:${context.organizationId}:${Date.now()}`;

    const charge = await createAbacatePayTransparent({
      amount: USER_SLOT_PRICE_CENTS,
      description,
      externalId,
      customerEmail: context.email,
      metadata: {
        type: "user_slot",
        organization_id: context.organizationId,
        profile_id: context.profileId,
        role_to_assign: body.roleToAssign,
        invite_email: body.inviteEmail ?? null
      }
    });

    return NextResponse.json({
      success: true,
      transparentId: charge.id,
      brCode: charge.brCode,
      brCodeBase64: charge.brCodeBase64,
      amount: charge.amount,
      expiresAt: charge.expiresAt
    });
  } catch (error) {
    const status =
      error instanceof ApiRouteError
        ? getErrorStatus(error)
        : error instanceof EnvValidationError
          ? 503
          : 400;

    const message =
      error instanceof Error ? error.message : "Nao foi possivel gerar o PIX.";

    logApiError({
      route: "/api/billing/user-slot/pix",
      operation: "CREATE_USER_SLOT_PIX",
      message,
      status,
      error
    });

    return NextResponse.json({ error: message }, { status });
  }
}
