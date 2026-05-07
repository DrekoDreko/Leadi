import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import { getServerEnv } from "@/lib/env/server";

const CIPHER_ALGORITHM = "aes-256-gcm";

export function encryptIntegrationSecret(secret: string) {
  const plaintext = secret.trim();

  if (!plaintext) {
    throw new Error("Segredo vazio nao pode ser cifrado.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER_ALGORITHM, getIntegrationSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export function decryptIntegrationSecret(payload: string) {
  const [version, ivPart, authTagPart, encryptedPart] = payload.trim().split(".");

  if (version !== "v1" || !ivPart || !authTagPart || !encryptedPart) {
    throw new Error("Payload cifrado invalido.");
  }

  const decipher = createDecipheriv(
    CIPHER_ALGORITHM,
    getIntegrationSecretKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

export function createIntegrationSecretFingerprint(secret: string) {
  return createHash("sha256").update(secret.trim(), "utf8").digest("hex");
}

export function maskIntegrationSecretPreview(secret: string, visibleTail = 4) {
  const normalized = secret.trim();

  if (!normalized) {
    return "";
  }

  const tail = Math.max(2, visibleTail);
  if (normalized.length <= tail + 4) {
    return `${normalized.slice(0, Math.min(4, normalized.length))}...`;
  }

  return `${normalized.slice(0, 4)}...${normalized.slice(-tail)}`;
}

export function getIntegrationSecretKey() {
  const candidates = [
    getServerEnv("INTEGRATIONS_SECRET_KEY"),
    getServerEnv("SUPABASE_SERVICE_ROLE_KEY")
  ];

  const seed = candidates.find((candidate) => Boolean(candidate.trim()))?.trim();

  if (!seed) {
    throw new Error(
      "INTEGRATIONS_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY nao configurado para cifrar segredos."
    );
  }

  return createHash("sha256").update(seed, "utf8").digest();
}
