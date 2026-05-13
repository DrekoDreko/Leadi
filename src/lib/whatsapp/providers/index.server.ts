import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";
import type {
  WhatsAppDeliveryConfiguration,
  WhatsAppDeliveryProviderKind,
  WhatsAppProviderFactoryResult
} from "../types";
import { createExternalHttpWhatsAppProvider } from "./external-http.server";
import { createOfficialMetaWhatsAppProvider } from "./official-meta.server";
import type { WhatsAppProvider } from "./types";

type SettingsRow = Database["public"]["Tables"]["whatsapp_delivery_settings"]["Row"];

export async function resolveWhatsAppProviderForOrganization(
  organizationId: string
): Promise<WhatsAppProviderFactoryResult> {
  const configuration = await resolveWhatsAppDeliveryConfiguration(organizationId);

  if (!configuration.sendingEnabled || !configuration.credentialsConfigured) {
    return {
      provider: null,
      configuration
    };
  }

  const provider = buildWhatsAppProvider(configuration.provider, configuration);

  return {
    provider,
    configuration
  };
}

export async function resolveWhatsAppDeliveryConfiguration(
  organizationId: string
): Promise<WhatsAppDeliveryConfiguration> {
  const row = await getWhatsAppDeliverySettingsRow(organizationId);

  if (!row) {
    return {
      organizationId,
      provider: "official_meta",
      sendingEnabled: false,
      optInConfirmedAt: null,
      optInConfirmedByProfileId: null,
      providerConfig: {},
      lastConfigurationCheckAt: null,
      lastConfigurationError: "Configuracao de envio ainda nao foi criada.",
      credentialsConfigured: false,
      missingCredentials: getMissingCredentials("official_meta", {})
    };
  }

  const providerConfig = isRecord(row.provider_config) ? row.provider_config : {};
  const missingCredentials = getMissingCredentials(row.provider, providerConfig);
  const credentialsConfigured = missingCredentials.length === 0;

  return {
    organizationId,
    provider: row.provider,
    sendingEnabled: row.sending_enabled,
    optInConfirmedAt: row.opt_in_confirmed_at,
    optInConfirmedByProfileId: row.opt_in_confirmed_by_profile_id,
    providerConfig,
    lastConfigurationCheckAt: row.last_configuration_check_at,
    lastConfigurationError: row.last_configuration_error,
    credentialsConfigured,
    missingCredentials
  };
}

export async function refreshWhatsAppConfigurationCheck(
  organizationId: string,
  patch: {
    checkedAt: string;
    error?: string | null;
  }
) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const admin = createSupabaseAdminClient();
  await admin
    .from("whatsapp_delivery_settings")
    .update({
      last_configuration_check_at: patch.checkedAt,
      last_configuration_error: patch.error ?? null
    })
    .eq("organization_id", organizationId);
}

function buildWhatsAppProvider(
  providerKind: WhatsAppDeliveryProviderKind,
  configuration: WhatsAppDeliveryConfiguration
): WhatsAppProvider {
  switch (providerKind) {
    case "external_http":
      return createExternalHttpWhatsAppProvider(
        stringFromConfig(configuration.providerConfig, "endpointUrl") ?? getServerEnv("WHATSAPP_EXTERNAL_SEND_URL"),
        stringFromConfig(configuration.providerConfig, "senderId") ?? getServerEnv("WHATSAPP_EXTERNAL_SENDER_ID")
      );
    case "official_meta":
    default:
      return createOfficialMetaWhatsAppProvider(
        stringFromConfig(configuration.providerConfig, "phoneNumberId") ?? getServerEnv("META_WHATSAPP_PHONE_NUMBER_ID")
      );
  }
}

async function getWhatsAppDeliverySettingsRow(
  organizationId: string
): Promise<SettingsRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("whatsapp_delivery_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

function getMissingCredentials(
  provider: WhatsAppDeliveryProviderKind,
  providerConfig: Record<string, unknown>
) {
  switch (provider) {
    case "external_http":
      return [
        ...missingIfEmpty(
          getServerEnv("WHATSAPP_EXTERNAL_API_KEY"),
          "WHATSAPP_EXTERNAL_API_KEY"
        ),
        ...missingIfBothEmpty(
          getServerEnv("WHATSAPP_EXTERNAL_SEND_URL"),
          stringFromConfig(providerConfig, "endpointUrl"),
          "WHATSAPP_EXTERNAL_SEND_URL"
        )
      ];
    case "official_meta":
    default:
      return [
        ...missingIfEmpty(
          getServerEnv("META_WHATSAPP_ACCESS_TOKEN"),
          "META_WHATSAPP_ACCESS_TOKEN"
        ),
        ...missingIfBothEmpty(
          getServerEnv("META_WHATSAPP_PHONE_NUMBER_ID"),
          stringFromConfig(providerConfig, "phoneNumberId"),
          "META_WHATSAPP_PHONE_NUMBER_ID"
        )
      ];
  }
}

function missingIfEmpty(value: string | null | undefined, label: string) {
  return value?.trim() ? [] : [label];
}

function missingIfBothEmpty(
  envValue: string | null | undefined,
  configuredValue: string | null | undefined,
  label: string
) {
  return envValue?.trim() || configuredValue?.trim() ? [] : [label];
}

function stringFromConfig(
  providerConfig: Record<string, unknown>,
  key: string
) {
  const value = providerConfig[key];
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
