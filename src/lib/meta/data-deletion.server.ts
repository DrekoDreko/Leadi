import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getSiteUrl } from "@/lib/site/config";

export type MetaDataDeletionSignedRequestPayload = {
  algorithm?: string;
  issued_at?: number;
  oauth_token?: string;
  expires?: number;
  user_id?: string;
  userId?: string;
  userID?: string;
  [key: string]: unknown;
};

export function parseMetaDataDeletionSignedRequest(
  signedRequest: string,
  appSecret: string
): MetaDataDeletionSignedRequestPayload {
  const trimmedSignedRequest = signedRequest.trim();

  if (!trimmedSignedRequest) {
    throw new Error("signed_request ausente.");
  }

  const [encodedSignature, encodedPayload, ...rest] = trimmedSignedRequest.split(".");

  if (!encodedSignature || !encodedPayload || rest.length > 0) {
    throw new Error("signed_request invalido.");
  }

  const signatureBuffer = decodeBase64Url(encodedSignature);
  const payloadBuffer = decodeBase64Url(encodedPayload);
  const expectedSignature = createHmac("sha256", appSecret.trim())
    .update(encodedPayload, "utf8")
    .digest();

  if (
    signatureBuffer.length !== expectedSignature.length ||
    !timingSafeEqual(signatureBuffer, expectedSignature)
  ) {
    throw new Error("signed_request com assinatura invalida.");
  }

  const payloadText = payloadBuffer.toString("utf8");
  const payload = JSON.parse(payloadText) as MetaDataDeletionSignedRequestPayload;

  if (!isRecord(payload)) {
    throw new Error("Payload de exclusao da Meta invalido.");
  }

  if (typeof payload.algorithm === "string" && payload.algorithm !== "HMAC-SHA256") {
    throw new Error("Algoritmo de signed_request nao suportado.");
  }

  return payload;
}

export function getMetaDataDeletionUserId(payload: MetaDataDeletionSignedRequestPayload) {
  const candidates = [payload.user_id, payload.userId, payload.userID];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const normalized = candidate.trim();
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

export function buildMetaDataDeletionStatusUrl(confirmationCode: string, siteUrl = getSiteUrl()) {
  const url = new URL("/data-deletion", siteUrl);
  url.searchParams.set("code", confirmationCode);
  return url.toString();
}

export function createMetaDataDeletionConfirmationCode() {
  return randomBytes(16).toString("hex");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padding)}`;

  return Buffer.from(padded, "base64");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
