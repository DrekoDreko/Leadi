import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  buildMetaDataDeletionStatusUrl,
  createMetaDataDeletionConfirmationCode,
  getMetaDataDeletionUserId,
  parseMetaDataDeletionSignedRequest
} from "./data-deletion.server";

describe("meta data deletion helpers", () => {
  it("verifica o signed_request e extrai o payload", () => {
    const secret = "app-secret";
    const payload = {
      algorithm: "HMAC-SHA256",
      issued_at: 1710000000,
      user_id: "218471"
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const signature = createHmac("sha256", secret)
      .update(encodedPayload, "utf8")
      .digest("base64url");
    const signedRequest = `${signature}.${encodedPayload}`;

    const parsed = parseMetaDataDeletionSignedRequest(signedRequest, secret);

    expect(parsed).toMatchObject(payload);
    expect(getMetaDataDeletionUserId(parsed)).toBe("218471");
  });

  it("rejeita signed_request com assinatura invalida", () => {
    const secret = "app-secret";
    const payload = {
      algorithm: "HMAC-SHA256",
      user_id: "218471"
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const signature = Buffer.from("invalid-signature").toString("base64url");
    const signedRequest = `${signature}.${encodedPayload}`;

    expect(() => parseMetaDataDeletionSignedRequest(signedRequest, secret)).toThrow(
      /assinatura invalida/i
    );
  });

  it("gera uma URL publica de status com o codigo de confirmacao", () => {
    const confirmationCode = createMetaDataDeletionConfirmationCode();
    const statusUrl = buildMetaDataDeletionStatusUrl(confirmationCode, "https://example.com");

    expect(confirmationCode).toMatch(/^[a-f0-9]{32}$/);
    expect(statusUrl).toBe(`https://example.com/data-deletion?code=${confirmationCode}`);
  });
});
