import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { WhatsAppDeliveryConfiguration, WhatsAppDeliveryProviderKind } from "./types";
import { resolveWhatsAppDeliveryConfiguration } from "./providers/index.server";

type WhatsAppSettingsRow = Database["public"]["Tables"]["whatsapp_delivery_settings"]["Row"];
type WhatsAppSettingsInsert = Database["public"]["Tables"]["whatsapp_delivery_settings"]["Insert"];

export async function getWhatsAppDeliveryConfigurationForOrganization(
  organizationId: string
): Promise<WhatsAppDeliveryConfiguration> {
  return resolveWhatsAppDeliveryConfiguration(organizationId);
}

export async function upsertWhatsAppDeliverySettingsForOrganization(input: {
  organizationId: string;
  provider: WhatsAppDeliveryProviderKind;
  sendingEnabled: boolean;
  optInConfirmedAt?: string | null;
  optInConfirmedByProfileId?: string | null;
  providerConfig?: Record<string, unknown>;
  lastConfigurationCheckAt?: string | null;
  lastConfigurationError?: string | null;
}) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const payload: WhatsAppSettingsInsert = {
    organization_id: input.organizationId,
    provider: input.provider,
    sending_enabled: input.sendingEnabled,
    opt_in_confirmed_at: input.optInConfirmedAt ?? null,
    opt_in_confirmed_by_profile_id: input.optInConfirmedByProfileId ?? null,
    provider_config: toJson(input.providerConfig ?? {}),
    last_configuration_check_at: input.lastConfigurationCheckAt ?? null,
    last_configuration_error: input.lastConfigurationError ?? null
  };

  const { error } = await admin.from("whatsapp_delivery_settings").upsert(payload, {
    onConflict: "organization_id"
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getWhatsAppDeliverySettingsRowForOrganization(
  organizationId: string
): Promise<WhatsAppSettingsRow | null> {
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

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
