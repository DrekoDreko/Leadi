import type { WhatsAppDeliveryProvider } from "@/lib/supabase/database.types";
import type { WhatsAppDeliveryConfiguration } from "../types";

export type WhatsAppOutboundMessage = {
  to: string;
  body: string;
  leadId: string | null;
  messageId: string;
  organizationId: string;
  profileId: string;
};

export type WhatsAppProviderSendResult = {
  providerMessageId: string | null;
  rawResponse: Record<string, unknown>;
};

export type WhatsAppProviderErrorCode =
  | "opt_in_required"
  | "credentials_missing"
  | "invalid_phone"
  | "rate_limited"
  | "blocked"
  | "provider_error";

export class WhatsAppProviderError extends Error {
  constructor(
    message: string,
    public readonly code: WhatsAppProviderErrorCode,
    public readonly status = 400,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "WhatsAppProviderError";
  }
}

export type WhatsAppProvider = {
  kind: WhatsAppDeliveryProvider;
  isReady: boolean;
  sendMessage(input: WhatsAppOutboundMessage): Promise<WhatsAppProviderSendResult>;
};

export type WhatsAppProviderFactoryResult = {
  provider: WhatsAppProvider | null;
  configuration: WhatsAppDeliveryConfiguration;
};
