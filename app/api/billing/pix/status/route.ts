import { NextResponse } from "next/server";
import { checkAbacatePayTransparent } from "@/lib/billing/abacatepay";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  logApiError
} from "@/lib/api/route-security";

export async function GET(request: Request) {
  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-pix-status",
      limit: 60,
      windowMs: 60 * 1000
    });

    const context = await getBillingAuthContext();

    if (!context) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transparentId = searchParams.get("id")?.trim();

    if (!transparentId) {
      return NextResponse.json({ error: "ID do pagamento ausente." }, { status: 400 });
    }

    const result = await checkAbacatePayTransparent(transparentId);

    return NextResponse.json({
      status: result.status,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    logApiError({
      route: "/api/billing/pix/status",
      operation: "CHECK_PIX_STATUS",
      message: error instanceof Error ? error.message : "Erro ao verificar status do PIX.",
      status: 400,
      error
    });

    return NextResponse.json(
      { error: "Nao foi possivel verificar o status do pagamento." },
      { status: 400 }
    );
  }
}
