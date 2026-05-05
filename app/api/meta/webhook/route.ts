import { NextResponse } from "next/server";
import { recordLeadWebhookEvent } from "@/lib/leads/webhook-events.server";
import { getMetaAppSecret, getMetaVerifyToken } from "@/lib/meta/config";
import {
  getMetaWebhookSafeHeaders,
  parseMetaWebhookPayload,
  validateMetaWebhookSignature
} from "@/lib/meta/webhook";

export async function GET(request: Request) {
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

  return NextResponse.json({ error: "Meta webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
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

    await recordLeadWebhookEvent({
      status: "processed",
      httpStatus: 200,
      rawPayload: body,
      safeHeaders: getMetaWebhookSafeHeaders(request)
    });

    return NextResponse.json({
      ok: true,
      object: payload.object,
      entry_count: payload.entry.length,
      leadgen_events: payload.leadgenEvents.length
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel processar o webhook da Meta.";
    const status = getMetaWebhookErrorStatus(error);

    await recordLeadWebhookEvent({
      status: "failed",
      httpStatus: status,
      rawPayload: body,
      safeHeaders: getMetaWebhookSafeHeaders(request),
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
  const message = error instanceof Error ? error.message : "";

  if (message.includes("META_APP_SECRET")) {
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
