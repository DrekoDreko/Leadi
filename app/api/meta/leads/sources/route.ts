import { NextResponse } from "next/server";
import { listMetaLeadImportSourcesForCurrentUser } from "@/lib/meta/manual-lead-import.server";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const state = await listMetaLeadImportSourcesForCurrentUser();
    const status = state.mode === "unauthenticated" ? 401 : 200;

    return NextResponse.json(state, { status });
  } catch (error) {
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
