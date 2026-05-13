import { NextResponse } from "next/server";
import { BillingResourceAccessError } from "@/lib/billing/subscription-limits.server";
import { EnvValidationError, requireIntegrationEnv } from "@/lib/env/server";
import { recordLeadWebhookEvent } from "@/lib/leads/webhook-events.server";
import { getMetaAppSecret, getMetaVerifyToken } from "@/lib/meta/config";
import { processMetaLeadgenEvent } from "@/lib/meta/webhook-processing.server";
import {
  getMetaWebhookSafeHeaders,
  parseMetaWebhookPayload,
  validateMetaWebhookSignature
} from "@/lib/meta/webhook";

import { logger } from "@/lib/logger";
import { assertPayloadSize, PayloadTooLargeError } from "@/lib/payload-limits";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

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
      return NextResponse.json({ error: error.message }, { status: 503 });
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
    assertRateLimit({
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
      throw new Error("Meta webhook signature invalid.");
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
        rawPayload: {
          source: "meta_lead_ads",
          duplicate: result.status === "duplicate",
          duplicate_reason: result.duplicateReason ?? null,
          meta_webhook_event: event,
          meta_webhook_payload: body
        },
        safeHeaders,
        errorMessage: duplicateMessage
      });
    }

    return NextResponse.json({
      ok: true,
      object: payload.object,
      entry_count: payload.entry.length,
      leadgen_events: payload.leadgenEvents.length,
      processed_events: eventResults
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel processar o webhook da Meta.";
    const status = getMetaWebhookErrorStatus(error);

    logger.error({
      route: "/api/meta/webhook",
      operation: "META_WEBHOOK_ERROR",
      status,
      message: errorMessage,
      data: { body, headers: safeHeaders }
    }, error);

    await recordLeadWebhookEvent({
      status: "failed",
      httpStatus: status,
      rawPayload: body,
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
  if (
    error instanceof BillingResourceAccessError ||
    error instanceof PayloadTooLargeError ||
    error instanceof RateLimitError
  ) {
    return error.status;
  }

  const message = error instanceof Error ? error.message : "";

  if (error instanceof EnvValidationError || message.includes("META_APP_SECRET")) {
    return 503;
  }

  if (message.includes("Content-Type invalido")) {
    return 415;
  }

  if (message.includes("signature invalid")) {
    return 401;
  }

  if (message.includes("Payload")) {
    return 400;
  }

  return 400;
}
