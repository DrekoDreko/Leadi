import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import { reconcileAllPublishedCampaigns } from "@/lib/meta/delivery-status.server";
import { RateLimitError } from "@/lib/rate-limit";
import { assertRouteRateLimit } from "@/lib/api/route-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Camada 3 (background): reconcilia o status real de veiculacao de todas as
// campanhas publicadas com a Meta, sem ninguem abrir a tela. Protegida por um
// segredo compartilhado (CRON_SECRET) enviado no header `x-cron-secret` ou como
// Bearer. Pensada para ser chamada por um agendador (Supabase pg_cron + pg_net,
// cron da hospedagem, ou similar).
export async function POST(request: Request) {
  // Limite defensivo por IP: protege contra abuso caso o CRON_SECRET vaze.
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-internal-meta-reconcile",
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
    return NextResponse.json(
      { error: "CRON_SECRET nao configurada no servidor." },
      { status: 503 }
    );
  }

  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!timingSafeEqual(provided, configuredSecret)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  // scope=pending: loop rapido (30s) que reconcilia so as campanhas em revisao,
  // para detectar a aprovacao quase em tempo real. Sem o parametro, varre tudo.
  const scope = new URL(request.url).searchParams.get("scope");
  const statuses = scope === "pending" ? (["pending_review"] as const) : undefined;

  try {
    const summary = await reconcileAllPublishedCampaigns(
      statuses ? { statuses: [...statuses] } : undefined
    );
    return NextResponse.json({ ok: true, scope: scope ?? "all", ...summary });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Falha ao reconciliar veiculacao das campanhas.";
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
