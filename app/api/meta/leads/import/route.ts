import { NextResponse } from "next/server";
import { z } from "zod";
import {
  importMetaLeadsForCurrentUser,
  MetaLeadImportError
} from "@/lib/meta/manual-lead-import.server";
import type { MetaLeadImportSourceType } from "@/lib/meta/manual-lead-import.types";
import { logger } from "@/lib/logger";
import { assertPayloadSize, PayloadTooLargeError } from "@/lib/payload-limits";
import {
  ApiRouteError,
  assertRouteRateLimit,
  assertSameOrigin,
  assertServerAuth,
  getErrorStatus,
  parseJsonBody,
  requiredTrimmedString
} from "@/lib/api/route-security";

type ImportRequestBody = {
  sourceType?: MetaLeadImportSourceType;
  sourceId?: string;
  organizationId?: string | null;
};

const importRequestSchema = z.object({
  sourceType: z.enum(["form", "campaign", "ad"]).default("form"),
  sourceId: requiredTrimmedString("Fonte Meta invalida para importacao.").max(120),
  organizationId: z.string().trim().max(120).optional()
});

export async function POST(request: Request) {
  let body: ImportRequestBody | null = null;

  try {
    assertSameOrigin(request);
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-meta-leads-import",
      limit: 10,
      windowMs: 60 * 1000
    });
    await assertServerAuth();
    assertPayloadSize(request, "WEBHOOK_JSON");
    body = await parseJsonBody(request, importRequestSchema);

    const result = await importMetaLeadsForCurrentUser({
      sourceType: body.sourceType ?? "form",
      sourceId: body.sourceId ?? "",
      organizationId: body.organizationId ?? null
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = getImportErrorStatus(error);
    const message = getImportErrorMessage(error);

    logger.error(
      {
        route: "/api/meta/leads/import",
        operation: "IMPORT_META_LEADS",
        status,
        message,
        data: {
          sourceType: body?.sourceType,
          sourceId: body?.sourceId,
          organizationId: body?.organizationId
        }
      },
      error
    );

    return NextResponse.json(
      {
        success: false,
        status: "error",
        summary: {
          totalFound: 0,
          imported: 0,
          duplicates: 0,
          archived: 0,
          errors: 1
        },
        items: [],
        message,
        detail: "Nenhum lead foi importado nesta tentativa."
      },
      { status }
    );
  }
}

function getImportErrorStatus(error: unknown) {
  if (error instanceof ApiRouteError) {
    return getErrorStatus(error);
  }

  if (error instanceof PayloadTooLargeError) {
    return error.status;
  }

  if (error instanceof MetaLeadImportError) {
    return error.status;
  }

  return 500;
}

function getImportErrorMessage(error: unknown) {
  if (error instanceof ApiRouteError) {
    return error.message;
  }

  if (error instanceof MetaLeadImportError) {
    if (error.status >= 500) {
      return "Nao foi possivel importar leads Meta agora. Tente novamente em instantes.";
    }

    return error.message;
  }

  if (error instanceof PayloadTooLargeError) {
    return "A solicitacao de importacao ficou grande demais. Tente novamente com uma fonte menor.";
  }

  return "Nao foi possivel importar leads Meta agora.";
}
