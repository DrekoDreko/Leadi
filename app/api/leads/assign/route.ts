import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";
import { assignLeadOwnersInBulkForCurrentUser } from "@/lib/leads/repository.server";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  parseJsonBody
} from "@/lib/api/route-security";

const assignSchema = z
  .object({
    leadIds: z.array(z.string().uuid("ID de lead invalido")).min(1, "Selecione pelo menos um lead"),
    ownerProfileId: z.string().uuid("ID de consultor invalido")
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;

  try {
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-leads-assign",
      limit: 20,
      windowMs: 60 * 1000
    });

    if (mode !== "not-configured") {
      await assertServerAuth();
    }

    const payload = await parseJsonBody(request, assignSchema);
    body = payload;
    const result = await assignLeadOwnersInBulkForCurrentUser(payload);

    return NextResponse.json({ ...result, mode }, { status: 200 });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Somente owner ou admin") ? 403 : 500;
    const errorMessage = error instanceof Error ? error.message : "Nao foi possivel distribuir os leads agora.";

    logger.error(
      {
        route: "/api/leads/assign",
        operation: "ASSIGN_LEADS",
        status,
        message: errorMessage,
        data: { body }
      },
      error
    );

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
