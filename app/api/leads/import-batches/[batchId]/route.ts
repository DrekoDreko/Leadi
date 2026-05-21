import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { undoCsvImportBatchForCurrentUser } from "@/lib/leads/repository.server";
import { assertRouteRateLimit, assertSameOrigin, logApiError } from "@/lib/api/route-security";

type RouteContext = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { batchId } = await context.params;
    const mode = isSupabaseConfigured() ? "supabase" : "not-configured";
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-leads-import-batches-delete",
      suffix: batchId,
      limit: 10,
      windowMs: 60 * 1000
    });
    const deletedCount = await undoCsvImportBatchForCurrentUser(batchId);

    return NextResponse.json({ ok: true, mode, deletedCount });
  } catch (error) {
    logApiError({
      route: "/api/leads/import-batches/[batchId]",
      operation: "UNDO_CSV_IMPORT_BATCH",
      message: getUndoImportErrorMessage(error),
      status: getUndoImportErrorStatus(error),
      error
    });

    return NextResponse.json(
      {
        error: getUndoImportErrorMessage(error)
      },
      { status: getUndoImportErrorStatus(error) }
    );
  }
}

function getUndoImportErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return "Sua sessao expirou. Entre novamente para desfazer a importacao.";
  }

  if (message.includes("Perfil nao encontrado")) {
    return "Nao encontramos seu perfil no CRM. Recarregue a pagina ou fale com o administrador.";
  }

  if (message.includes("Sem permissao")) {
    return "Voce nao tem permissao para desfazer esta importacao.";
  }

  if (message.includes("Supabase nao configurado")) {
    return "Supabase ainda nao configurado. Nao foi possivel desfazer a importacao.";
  }

  return "Nao foi possivel desfazer a importacao. Tente novamente em instantes.";
}

function getUndoImportErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Usuario nao autenticado")) {
    return 401;
  }

  if (message.includes("Sem permissao")) {
    return 403;
  }

  return 400;
}
