import "server-only";

import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/lib/supabase/database.types";
import { mapWhatsAppRowToHistoryItem } from "./repository.server";
import { resolveWhatsAppProviderForOrganization } from "./providers/index.server";
import { WhatsAppProviderError } from "./providers/types";
import type {
  WhatsAppDeliveryAttempt,
  WhatsAppDeliveryStatus,
  WhatsAppHistoryItem,
  WhatsAppSendRequest,
  WhatsAppSendResult
} from "./types";

type WhatsAppRow = Database["public"]["Tables"]["whatsapp_messages"]["Row"];

export type WhatsAppSendOutcome = {
  updatedMessage: WhatsAppHistoryItem;
  result: WhatsAppSendResult;
  configurationStatus: "ready" | "opt_in_required" | "credentials_missing" | "not_configured";
};

export async function sendWhatsAppMessageForCurrentUser(
  input: WhatsAppSendRequest
): Promise<WhatsAppSendOutcome> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase ainda nao configurado.");
  }

  const context = await getBillingAuthContext();

  if (!context) {
    throw new Error("Usuario nao autenticado.");
  }

  const admin = createSupabaseAdminClient();
  const messageRow = await getMessageRow(admin, context.organizationId, input.messageId);

  if (!messageRow) {
    throw new Error("Mensagem nao encontrada para envio.");
  }

  const recipientPhone = await resolveRecipientPhone(
    admin,
    messageRow.organization_id,
    messageRow,
    input.recipientPhone,
    input.leadId
  );
  const { provider, configuration } = await resolveWhatsAppProviderForOrganization(
    context.organizationId
  );

  if (!configuration.sendingEnabled || !configuration.optInConfirmedAt) {
    const outcome = await recordDeliveryOutcome(admin, messageRow, {
      status: configuration.optInConfirmedAt ? "pending_config" : "opt_in_required",
      provider: configuration.provider,
      providerMessageId: null,
      errorCode: "opt_in_required",
      errorMessage:
        "Envio por WhatsApp ainda nao foi autorizado explicitamente para esta organizacao.",
      requestedByProfileId: context.profileId,
      recipientPhone,
      rawResponse: {
        sendingEnabled: configuration.sendingEnabled,
        optInConfirmedAt: configuration.optInConfirmedAt
      }
    });

    return {
      updatedMessage: outcome.updatedMessage,
      result: outcome.result,
      configurationStatus: configuration.optInConfirmedAt ? "not_configured" : "opt_in_required"
    };
  }

  if (!configuration.credentialsConfigured || !provider) {
    const outcome = await recordDeliveryOutcome(admin, messageRow, {
      status: "credentials_missing",
      provider: configuration.provider,
      providerMessageId: null,
      errorCode: "credentials_missing",
      errorMessage: `Credenciais ausentes: ${configuration.missingCredentials.join(", ")}`,
      requestedByProfileId: context.profileId,
      recipientPhone,
      rawResponse: {
        missingCredentials: configuration.missingCredentials
      }
    });

    return {
      updatedMessage: outcome.updatedMessage,
      result: outcome.result,
      configurationStatus: "credentials_missing"
    };
  }

  try {
    const providerResult = await provider.sendMessage({
      to: recipientPhone,
      body: formatOutgoingWhatsAppMessage(messageRow),
      leadId: messageRow.lead_id,
      messageId: messageRow.id,
      organizationId: messageRow.organization_id,
      profileId: context.profileId
    });

    const outcome = await recordDeliveryOutcome(admin, messageRow, {
      status: "sent",
      provider: configuration.provider,
      providerMessageId: providerResult.providerMessageId,
      errorCode: null,
      errorMessage: null,
      requestedByProfileId: context.profileId,
      recipientPhone,
      rawResponse: providerResult.rawResponse
    });

    return {
      updatedMessage: outcome.updatedMessage,
      result: outcome.result,
      configurationStatus: "ready"
    };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    const outcome = await recordDeliveryOutcome(admin, messageRow, {
      status: normalized.status,
      provider: configuration.provider,
      providerMessageId: null,
      errorCode: normalized.code,
      errorMessage: normalized.message,
      requestedByProfileId: context.profileId,
      recipientPhone,
      rawResponse: normalized.details
    });

    return {
      updatedMessage: outcome.updatedMessage,
      result: outcome.result,
      configurationStatus: normalized.status === "credentials_missing" ? "credentials_missing" : "ready"
    };
  }
}

async function getMessageRow(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  messageId: string
) {
  const { data, error } = await admin
    .from("whatsapp_messages")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", messageId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as WhatsAppRow;
}

async function resolveRecipientPhone(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  row: WhatsAppRow,
  explicitPhone: string | null | undefined,
  leadId?: string | null
) {
  const preferred = explicitPhone?.trim() || "";
  if (preferred) {
    return preferred;
  }

  const payloadPhone = stringFromPayload(row.input_payload, "recipientPhone");
  if (payloadPhone) {
    return payloadPhone;
  }

  const resolvedLeadId = leadId ?? row.lead_id;
  if (resolvedLeadId) {
    const { data: lead, error } = await admin
      .from("leads")
      .select("phone,phone_e164")
      .eq("organization_id", organizationId)
      .eq("id", resolvedLeadId)
      .maybeSingle();

    if (!error && lead) {
      const preferredPhone =
        typeof lead.phone_e164 === "string" && lead.phone_e164.trim()
          ? lead.phone_e164.trim()
          : typeof lead.phone === "string" && lead.phone.trim()
            ? lead.phone.trim()
            : "";

      if (preferredPhone) {
        return preferredPhone;
      }
    }

    throw new Error("Telefone do lead nao encontrado para envio.");
  }

  throw new Error("Telefone do destinatario nao informado para envio.");
}

function formatOutgoingWhatsAppMessage(row: WhatsAppRow) {
  const opening = stringFromPayload(row.result_payload, "openingMessage") ?? row.opening_message;
  const followUp = stringFromPayload(row.result_payload, "followUpMessage") ?? row.follow_up_message;
  const objectionReply =
    stringFromPayload(row.result_payload, "objectionReply") ?? row.objection_reply;

  return [opening, followUp, objectionReply].filter(Boolean).join("\n\n");
}

async function recordDeliveryOutcome(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  row: WhatsAppRow,
  input: {
    status: WhatsAppDeliveryStatus;
    provider: WhatsAppRow["delivery_provider"];
    providerMessageId: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    requestedByProfileId: string;
    recipientPhone: string;
    rawResponse: Record<string, unknown>;
  }
): Promise<{
  updatedMessage: WhatsAppHistoryItem;
  result: WhatsAppSendResult;
}> {
  const attemptedAt = new Date().toISOString();
  const sentAt = input.status === "sent" ? attemptedAt : null;
  const deliveryHistory = appendDeliveryHistory(row.delivery_history, {
    id: crypto.randomUUID(),
    status: input.status,
    provider: input.provider,
    attemptedAt,
    sentAt,
    providerMessageId: input.providerMessageId,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage
  });

  const payload = {
    delivery_provider: input.provider,
    delivery_status: input.status,
    delivery_attempted_at: attemptedAt,
    delivery_sent_at: sentAt,
    delivery_provider_message_id: input.providerMessageId,
    delivery_error_code: input.errorCode,
    delivery_error_message: input.errorMessage,
    delivery_request_payload: buildDeliveryRequestPayload(
      row,
      input.requestedByProfileId,
      input.recipientPhone
    ),
    delivery_response_payload: scrubProviderResponse(input.rawResponse),
    delivery_history: deliveryHistory
  };

  const { data, error } = await admin
    .from("whatsapp_messages")
    .update(payload)
    .eq("organization_id", row.organization_id)
    .eq("id", row.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar o envio.");
  }

  return {
    updatedMessage: mapWhatsAppRowToHistoryItem(data as WhatsAppRow),
    result: {
      messageId: data.id,
      status: input.status,
      provider: input.provider,
      providerMessageId: input.providerMessageId,
      attemptedAt,
      sentAt,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage
    }
  };
}

function appendDeliveryHistory(
  current: Json | null | undefined,
  event: WhatsAppDeliveryAttempt
) {
  const history = Array.isArray(current) ? current : [];

  return [
    ...history,
    {
      id: event.id,
      status: event.status,
      provider: event.provider,
      attemptedAt: event.attemptedAt,
      sentAt: event.sentAt,
      providerMessageId: event.providerMessageId,
      errorCode: event.errorCode,
      errorMessage: event.errorMessage
    }
  ];
}

function buildDeliveryRequestPayload(
  row: WhatsAppRow,
  requestedByProfileId: string,
  recipientPhone: string
) {
  const storedRecipientPhone = stringFromPayload(row.input_payload, "recipientPhone") ?? recipientPhone;

  return {
    messageId: row.id,
    organizationId: row.organization_id,
    leadId: row.lead_id,
    leadName: row.lead_name,
    stage: row.stage,
    product: row.product,
    requestedByProfileId,
    recipientPhone: maskPhone(storedRecipientPhone),
    textLength: formatOutgoingWhatsAppMessage(row).length
  };
}

function scrubProviderResponse(rawResponse: Record<string, unknown>) {
  return {
    ...rawResponse,
    access_token: undefined,
    token: undefined,
    message: undefined
  };
}

function normalizeProviderError(error: unknown) {
  if (error instanceof WhatsAppProviderError) {
    return {
      status:
        error.code === "opt_in_required"
          ? "opt_in_required"
          : error.code === "credentials_missing"
            ? "credentials_missing"
            : error.code === "rate_limited"
              ? "rate_limited"
              : error.code === "blocked"
                ? "blocked"
                : "failed",
      code: error.code,
      message: error.message,
      details: error.details
    } as const;
  }

  if (error instanceof Error) {
    return {
      status: "failed" as const,
      code: "provider_error" as const,
      message: error.message,
      details: { name: error.name }
    };
  }

  return {
    status: "failed" as const,
    code: "provider_error" as const,
    message: "Nao foi possivel enviar a mensagem.",
    details: {}
  };
}

function maskPhone(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
}

function stringFromPayload(payload: Json | null | undefined, key: string) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return null;
  }

  const value = (payload as Record<string, Json>)[key];
  return typeof value === "string" ? value : null;
}
