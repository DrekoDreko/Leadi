import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import { runDeliveryHealthCheck } from "@/lib/meta/delivery-health.server";
import { RateLimitError } from "@/lib/rate-limit";
import { assertRouteRateLimit } from "@/lib/api/route-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mudanca 7: job diario de saude de entrega. Para cada campanha ativa, compara o
// gasto de ontem com o orcamento e dispara alertas acionaveis no sino. Protegida
// pelo mesmo segredo compartilhado (CRON_SECRET) do reconcile, no header
// `x-cron-secret` ou como Bearer. Chamada pelo pg_cron (Supabase) uma vez ao dia.
export async function POST(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-internal-meta-delivery-health",
      limit: 10,
      windowMs: 60 * 1000
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const configuredSecret = getServerEnv("CRON_SECRET");
  if (!configuredSecret) {
    return NextResponse.json({ error: "CRON_SECRET nao configurada no servidor." }, { status: 503 });
  }

  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!timingSafeEqual(provided, configuredSecret)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const summary = await runDeliveryHealthCheck();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Falha ao avaliar a saude de entrega das campanhas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Comparacao de tempo constante para nao vazar o segredo por timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
