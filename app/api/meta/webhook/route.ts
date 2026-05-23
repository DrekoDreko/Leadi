import { NextResponse } from "next/server";
import { EnvValidationError, requireIntegrationEnv } from "@/lib/env/server";
import { recordLeadWebhookEvent } from "@/lib/leads/webhook-events.server";
import { getMetaAppSecret, getMetaVerifyToken } from "@/lib/meta/config";
import { processMetaLeadgenEvent } from "@/lib/meta/webhook-processing.server";
import {
  getMetaWebhookSafeHeaders,
  parseMetaWebhookPayload,
  validateMetaWebhookSignature
} from "@/lib/meta/webhook";
import { MetaWebhookError } from "@/lib/meta/errors";

import { logger } from "@/lib/logger";
import { assertPayloadSize, PayloadTooLargeError } from "@/lib/payload-limits";
import { assertDistributedRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    requireIntegrationEnv("meta_webhook");
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode")?.trim();
    const verifyToken = url.searchParams.get("hub.verify_token")?.trim();
    const challenge = url.searchParams.get("hub.challenge")?.trim();
    const expectedVerifyToken = getMetaVerifyToken();

    if (
      mode === "subscribe" &&
      challenge &&
      expectedVerifyToken &&
      verifyToken === expectedVerifyToken
    ) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }
  } catch (error) {
    if (error instanceof EnvValidationError) {
      return NextResponse.json({ error: "Webhook Meta indisponivel." }, { status: 503 });
    }
  }

  return NextResponse.json({ error: "Meta webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  let body: unknown;
  const safeHeaders = getMetaWebhookSafeHeaders(request);

  try {
    // Rate Limit por IP
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    await assertDistributedRateLimit({
      key: `meta-ip:${ip}`,
      limit: 150, // Um pouco mais generoso para Meta
      windowMs: 60 * 1000
    });

    requireIntegrationEnv("meta_webhook");
    assertPayloadSize(request, "WEBHOOK_JSON");
    assertJsonRequest(request);
    const rawBody = await request.text();
    assertRawBody(rawBody);

    const isSignatureValid = validateMetaWebhookSignature({
      rawBody,
      appSecret: getMetaAppSecret(),
      signatureHeader: request.headers.get("x-hub-signature-256")
    });

    if (!isSignatureValid) {
      throw new MetaWebhookError("Meta webhook signature invalid.");
    }

    body = JSON.parse(rawBody) as unknown;
    const payload = parseMetaWebhookPayload(body);
    const eventResults = [];

    for (const event of payload.leadgenEvents) {
      const result = await processMetaLeadgenEvent({
        event,
        rawPayload: body
      });

      const duplicateMessage =
        result.status === "duplicate" && result.duplicateReason === "meta_lead_id"
          ? `Evento duplicado ignorado para meta_lead_id ${result.metaLeadId}.`
          : null;

      if (duplicateMessage) {
        logger.info({
          route: "/api/meta/webhook",
          operation: "META_WEBHOOK_DUPLICATE",
          message: duplicateMessage,
          data: { metaLeadId: result.metaLeadId }
        });
      }

      eventResults.push({
        lead_id: result.leadId,
        meta_lead_id: result.metaLeadId,
        organization_id: result.organizationId,
        integration_id: result.integrationId,
        status: result.status
      });

      await recordLeadWebhookEvent({
        organizationId: result.organizationId,
        integrationId: result.integrationId,
        leadId: result.leadId,
        status: "processed",
        httpStatus: result.status === "created" ? 201 : 200,
        rawPayload: buildMetaWebhookStoragePayload({
          payload: body,
          event,
          processingOutcome: result.status,
          duplicateReason: result.duplicateReason ?? null
        }),
        safeHeaders,
        errorMessage: undefined
      });
    }

    return NextResponse.json({
      ok: true,
      object: payload.object,
      entry_count: payload.entry.length,
      leadgen_events: payload.leadgenEvents.length,
      processed_events: eventResults.length
    });
  } catch (error) {
    let errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel processar o webhook da Meta.";

    if (
      errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      errorMessage.includes("FetchError") ||
      errorMessage.includes("Database error")
    ) {
      errorMessage = "Servico indisponivel temporariamente.";
    }
    const status = getMetaWebhookErrorStatus(error);

    logger.error({
      route: "/api/meta/webhook",
      operation: "META_WEBHOOK_ERROR",
      status,
      message: errorMessage,
      data: {
        body: summarizeMetaWebhookPayloadForLogs(body),
        headers: safeHeaders
      }
    }, error);

    await recordLeadWebhookEvent({
      status: "failed",
      httpStatus: status,
      rawPayload: buildMetaWebhookStoragePayload({
        payload: body,
        processingOutcome: "failed",
        summaryMessage: errorMessage
      }),
      safeHeaders,
      errorMessage
    });

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

function assertJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Content-Type invalido. Use application/json.");
  }
}

function assertRawBody(rawBody: string) {
  if (!rawBody.trim()) {
    throw new Error("Payload invalido. Body vazio.");
  }
}

function getMetaWebhookErrorStatus(error: unknown) {
  if (error instanceof RateLimitError) {
    return error.status;
  }

  if (error instanceof PayloadTooLargeError) {
    return error.status;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("signature invalid")) {
    return 401;
  }

  // Para evitar que a Meta desative o webhook por falhas internas nossas (ou erros de parse),
  // retornamos 200 OK. A falha já foi gravada e logada internamente.
  return 200;
}

function buildMetaWebhookStoragePayload(input: {
  payload: unknown;
  event?: unknown;
  processingOutcome: "created" | "duplicate" | "failed";
  duplicateReason?: string | null;
  summaryMessage?: string;
}) {
  return {
    source: "meta_lead_ads",
    processing_outcome: input.processingOutcome,
    duplicate: input.processingOutcome === "duplicate",
    duplicate_reason: input.duplicateReason ?? null,
    summary_message:
      input.summaryMessage ??
      getMetaWebhookSummaryMessage(input.processingOutcome, input.duplicateReason ?? null),
    meta_webhook_event: input.event,
    meta_webhook_payload: input.payload
  };
}

function summarizeMetaWebhookPayloadForLogs(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { payload_type: Array.isArray(value) ? "array" : typeof value };
  }

  const payload = value as {
    object?: unknown;
    entry?: unknown[];
  };
  const entry = Array.isArray(payload.entry) ? payload.entry : [];
  const leadgenEventCount = entry.reduce<number>((count, entryItem) => {
    if (!entryItem || typeof entryItem !== "object" || Array.isArray(entryItem)) {
      return count;
    }

    const rawChanges = (entryItem as { changes?: unknown[] }).changes;
    const changes = Array.isArray(rawChanges) ? rawChanges : [];

    return (
      count +
      changes.filter((change) => {
        return (
          change &&
          typeof change === "object" &&
          !Array.isArray(change) &&
          (change as { field?: unknown }).field === "leadgen"
        );
      }).length
    );
  }, 0);

  return {
    object: typeof payload.object === "string" ? payload.object : null,
    entry_count: entry.length,
    leadgen_event_count: leadgenEventCount
  };
}

function getMetaWebhookSummaryMessage(
  outcome: "created" | "duplicate" | "failed",
  duplicateReason: string | null
) {
  if (outcome === "created") {
    return "Lead da Meta processado com sucesso.";
  }

  if (outcome === "duplicate") {
    return `Evento duplicado absorvido com seguranca (${getDuplicateReasonLabel(duplicateReason)}).`;
  }

  return "Falha ao processar o webhook da Meta.";
}

function getDuplicateReasonLabel(reason: string | null) {
  if (reason === "meta_lead_id") {
    return "mesmo meta_lead_id";
  }

  if (reason === "phone_e164") {
    return "telefone ja existente";
  }

  if (reason === "email") {
    return "email ja existente";
  }

  return "motivo nao identificado";
}
