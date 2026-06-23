import { NextResponse } from "next/server";
import { verifyAbacatePayWebhookSignature } from "@/lib/billing/abacatepay";
import { processAbacatePayWebhook } from "@/lib/billing/webhook-handler.server";
import { isAbacatePayWebhookSecretConfigured } from "@/lib/billing/config";
import { logger } from "@/lib/logger";
import { EnvValidationError } from "@/lib/env/server";
import { assertPayloadSize, PayloadTooLargeError } from "@/lib/payload-limits";
import {
  assertRouteRateLimit,
  getErrorStatus,
  jsonError,
  logApiError
} from "@/lib/api/route-security";

export async function POST(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-billing-webhook-abacatepay",
      limit: 120,
      windowMs: 60 * 1000
    });
    assertPayloadSize(request, "WEBHOOK_JSON");

    const bodyText = await request.text();

    const signature = request.headers.get("x-webhook-signature") ?? "";
    if (isAbacatePayWebhookSecretConfigured()) {
      // Segredo configurado: assinatura valida e obrigatoria.
      if (!verifyAbacatePayWebhookSignature(bodyText, signature)) {
        return jsonError("Assinatura do webhook invalida.", 401);
      }
    } else {
      // Sem segredo configurado ainda (migracao). Mantem comportamento legado,
      // mas registra para visibilidade ate que ABACATE_PAY_WEBHOOK_SECRET seja definido.
      logger.info({
        route: "/api/billing/webhooks/abacatepay",
        operation: "ABACATEPAY_WEBHOOK_SIGNATURE_SKIPPED",
        message:
          "ABACATE_PAY_WEBHOOK_SECRET nao configurado: webhook processado sem verificacao de assinatura.",
        data: { hasSignatureHeader: Boolean(signature) }
      });
    }

    let bodyPayload: unknown = {};
    try {
      bodyPayload = JSON.parse(bodyText);
    } catch {
      return jsonError("Payload JSON invalido.", 400);
    }

    const result = await processAbacatePayWebhook(bodyPayload);

    return NextResponse.json(result);
  } catch (error) {
    const status = getWebhookErrorStatus(error);
    const message = getWebhookErrorMessage(error);

    logApiError({
      route: "/api/billing/webhooks/abacatepay",
      operation: "PROCESS_ABACATEPAY_WEBHOOK",
      message,
      status,
      error
    });

    return jsonError(message, status);
  }
}

function getWebhookErrorStatus(error: unknown) {
  if (error instanceof EnvValidationError || error instanceof PayloadTooLargeError) {
    return getErrorStatus(error, error.status);
  }

  return 400;
}

function getWebhookErrorMessage(error: unknown) {
  if (error instanceof EnvValidationError) {
    return "Configuracao de billing indisponivel.";
  }

  if (error instanceof PayloadTooLargeError) {
    return "Payload do webhook excede o limite permitido.";
  }

  return "Nao foi possivel processar o webhook.";
}
