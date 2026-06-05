import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";
import { distributeLeadsEquallyForCurrentUser } from "@/lib/leads/repository.server";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  parseJsonBody
} from "@/lib/api/route-security";

const distributeSchema = z
  .object({
    leadIds: z.array(z.string().uuid("ID de lead invalido")).min(1, "Selecione pelo menos um lead"),
    targetProfileIds: z
      .array(z.string().uuid("ID de destinatario invalido"))
      .min(1, "Selecione pelo menos um destinatario")
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;

  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-leads-distribute",
      limit: 20,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const payload = await parseJsonBody(request, distributeSchema);
    body = payload;
    const result = await distributeLeadsEquallyForCurrentUser(payload);

    return NextResponse.json({ ...result, mode }, { status: 200 });
  } catch (error) {
    const status =
      error instanceof Error && error.message.includes("Somente owner ou admin") ? 403 : 500;
    const errorMessage =
      error instanceof Error ? error.message : "Nao foi possivel distribuir os leads agora.";

    logger.error(
      {
        route: "/api/leads/distribute",
        operation: "DISTRIBUTE_LEADS",
        status,
        message: errorMessage,
        data: { body }
      },
      error
    );

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
