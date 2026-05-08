import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getIntegrationSecretKey } from "./crypto.server";

export type MetaOAuthStatePayload = {
  organizationId: string;
  profileId: string;
  returnTo: string;
  nonce: string;
  issuedAt: number;
};

export function createMetaOAuthState(input: {
  organizationId: string;
  profileId: string;
  returnTo: string;
}) {
  const payload: MetaOAuthStatePayload = {
    organizationId: input.organizationId,
    profileId: input.profileId,
    returnTo: sanitizeReturnTo(input.returnTo),
    nonce: randomUUID(),
    issuedAt: Date.now()
  };

  return encodeState(payload);
}

export function parseMetaOAuthState(state: string) {
  const [encodedPayload, signature] = state.trim().split(".");

  if (!encodedPayload || !signature) {
    throw new Error("State Meta invalido.");
  }

  const payloadBuffer = Buffer.from(encodedPayload, "base64url");
  const expectedSignature = createHmac("sha256", getStateSigningSecret())
    .update(payloadBuffer)
    .digest();
  const receivedSignature = Buffer.from(signature, "base64url");

  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    throw new Error("State Meta invalido.");
  }

  const parsed = JSON.parse(payloadBuffer.toString("utf8")) as Partial<MetaOAuthStatePayload>;

  if (
    typeof parsed.organizationId !== "string" ||
    typeof parsed.profileId !== "string" ||
    typeof parsed.returnTo !== "string" ||
    typeof parsed.nonce !== "string" ||
    typeof parsed.issuedAt !== "number"
  ) {
    throw new Error("State Meta invalido.");
  }

  return {
    organizationId: parsed.organizationId,
    profileId: parsed.profileId,
    returnTo: sanitizeReturnTo(parsed.returnTo),
    nonce: parsed.nonce,
    issuedAt: parsed.issuedAt
  } satisfies MetaOAuthStatePayload;
}

function encodeState(payload: MetaOAuthStatePayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getStateSigningSecret())
    .update(Buffer.from(encodedPayload, "base64url"))
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function getStateSigningSecret() {
  return getIntegrationSecretKey();
}

function sanitizeReturnTo(value: string) {
  const normalized = value.trim();

  if (!normalized.startsWith("/")) {
    return "/dashboard/perfil?section=empresa";
  }

  return normalized;
}
