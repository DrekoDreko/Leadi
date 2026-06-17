import { NextResponse } from "next/server";
import { listMetaLeadImportSourcesForCurrentUser } from "@/lib/meta/manual-lead-import.server";
import { logger } from "@/lib/logger";
import { RateLimitError } from "@/lib/rate-limit";
import { assertRouteRateLimit } from "@/lib/api/route-security";

export async function GET(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-meta-leads-sources-get",
      limit: 60,
      windowMs: 60 * 1000
    });

    const state = await listMetaLeadImportSourcesForCurrentUser();
    const status = state.mode === "unauthenticated" ? 401 : 200;

    if (state.mode === "unauthenticated") {
      return NextResponse.json(
        { error: "Sua sessao expirou. Entre novamente para listar fontes Meta." },
        { status }
      );
    }

    return NextResponse.json(state, { status });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    logger.error(
      {
        route: "/api/meta/leads/sources",
        operation: "LIST_META_LEAD_IMPORT_SOURCES",
        status: 500,
        message: "Falha ao listar fontes Meta para importacao."
      },
      error
    );

    return NextResponse.json(
      {
        mode: "error",
        hasConnection: false,
        canImport: false,
        sources: [],
        message: "Nao foi possivel carregar fontes Meta para importacao."
      },
      { status: 500 }
    );
  }
}
