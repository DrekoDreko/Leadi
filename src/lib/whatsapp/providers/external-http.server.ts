import "server-only";

import { getServerEnv } from "@/lib/env/server";
import type { WhatsAppOutboundMessage, WhatsAppProvider, WhatsAppProviderSendResult } from "./types";
import { WhatsAppProviderError } from "./types";

export function createExternalHttpWhatsAppProvider(
  endpointUrl = getServerEnv("WHATSAPP_EXTERNAL_SEND_URL"),
  senderId = getServerEnv("WHATSAPP_EXTERNAL_SENDER_ID")
): WhatsAppProvider {
  const isReady =
    Boolean(getServerEnv("WHATSAPP_EXTERNAL_API_KEY")) && Boolean(endpointUrl.trim());

  return {
    kind: "external_http",
    isReady,
    async sendMessage(input: WhatsAppOutboundMessage): Promise<WhatsAppProviderSendResult> {
      const apiKey = getServerEnv("WHATSAPP_EXTERNAL_API_KEY");
      const phone = sanitizePhone(input.to);

      if (!endpointUrl.trim()) {
        throw new WhatsAppProviderError(
          "Endpoint do provedor externo nao configurado.",
          "credentials_missing",
          503,
          { missing: ["WHATSAPP_EXTERNAL_SEND_URL"] }
        );
      }

      if (!apiKey) {
        throw new WhatsAppProviderError(
          "Credenciais do provedor externo nao configuradas.",
          "credentials_missing",
          503,
          { missing: ["WHATSAPP_EXTERNAL_API_KEY"] }
        );
      }

      if (phone.length < 8) {
        throw new WhatsAppProviderError(
          "Numero de telefone invalido para envio.",
          "invalid_phone",
          400,
          { phone: input.to }
        );
      }

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderId: senderId || null,
          to: phone,
          body: input.body,
          leadId: input.leadId,
          messageId: input.messageId,
          organizationId: input.organizationId,
          profileId: input.profileId
        })
      });

      const rawResponse = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        throw buildProviderError(response.status, rawResponse, "Provedor externo");
      }

      return {
        providerMessageId: getString(rawResponse, "id") ?? getString(rawResponse, "messageId"),
        rawResponse
      };
    }
  };
}

function sanitizePhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function getString(source: Record<string, unknown>, ...path: string[]): string | null {
  let current: unknown = source;

  for (const segment of path) {
    if (current && typeof current === "object" && !Array.isArray(current) && segment in current) {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }

    if (Array.isArray(current) && /^[0-9]+$/.test(segment)) {
      current = current[Number(segment)];
      continue;
    }

    return null;
  }

  return typeof current === "string" ? current : null;
}

function buildProviderError(
  status: number,
  payload: Record<string, unknown>,
  providerLabel: string
) {
  if (status === 429) {
    return new WhatsAppProviderError(
      `${providerLabel} limitou a taxa de envio.`,
      "rate_limited",
      status,
      payload
    );
  }

  if (status === 403) {
    return new WhatsAppProviderError(
      `${providerLabel} bloqueou o envio para este numero.`,
      "blocked",
      status,
      payload
    );
  }

  return new WhatsAppProviderError(
    `${providerLabel} retornou erro ao enviar a mensagem.`,
    "provider_error",
    status,
    payload
  );
}
