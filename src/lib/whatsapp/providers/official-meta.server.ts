import "server-only";

import { getServerEnv } from "@/lib/env/server";
import type { WhatsAppOutboundMessage, WhatsAppProvider, WhatsAppProviderSendResult } from "./types";
import { WhatsAppProviderError } from "./types";

export function createOfficialMetaWhatsAppProvider(
  phoneNumberId: string,
  apiVersion = getServerEnv("META_WHATSAPP_API_VERSION") || "v25.0"
): WhatsAppProvider {
  const isReady = Boolean(getServerEnv("META_WHATSAPP_ACCESS_TOKEN")) && Boolean(phoneNumberId.trim());

  return {
    kind: "official_meta",
    isReady,
    async sendMessage(input: WhatsAppOutboundMessage): Promise<WhatsAppProviderSendResult> {
      const accessToken = getServerEnv("META_WHATSAPP_ACCESS_TOKEN");
      const phone = sanitizePhone(input.to);

      if (!accessToken) {
        throw new WhatsAppProviderError(
          "Credenciais oficiais do WhatsApp nao configuradas.",
          "credentials_missing",
          503,
          { missing: ["META_WHATSAPP_ACCESS_TOKEN"] }
        );
      }

      if (!phoneNumberId.trim()) {
        throw new WhatsAppProviderError(
          "Phone number id do WhatsApp nao configurado.",
          "credentials_missing",
          503,
          { missing: ["META_WHATSAPP_PHONE_NUMBER_ID"] }
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

      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phone,
            type: "text",
            text: {
              preview_url: false,
              body: input.body
            }
          })
        }
      );

      const rawResponse = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        throw buildProviderError(response.status, rawResponse, "Meta");
      }

      return {
        providerMessageId: getString(rawResponse, "messages", "0", "id") ?? getString(rawResponse, "message_id"),
        rawResponse
      };
    }
  };
}

function sanitizePhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function getString(
  source: Record<string, unknown>,
  ...path: string[]
): string | null {
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
