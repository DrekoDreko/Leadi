import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type LeadWebhookEventInput = {
  organizationId?: string | null;
  integrationId?: string | null;
  leadId?: string | null;
  status: "processed" | "failed";
  httpStatus: number;
  rawPayload?: unknown;
  safeHeaders: Record<string, string>;
  errorMessage?: string | null;
};

export async function recordLeadWebhookEvent(input: LeadWebhookEventInput) {
  if (!hasSupabaseServiceRole()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("lead_webhook_events").insert({
    organization_id: input.organizationId ?? null,
    integration_id: input.integrationId ?? null,
    lead_id: input.leadId ?? null,
    status: input.status,
    http_status: input.httpStatus,
    raw_payload: toJson(input.rawPayload) ?? {},
    safe_headers: toJson(input.safeHeaders) ?? {},
    error_message: input.errorMessage ?? null
  });

  if (error) {
    console.error("Nao foi possivel registrar o evento do webhook de leads.", error);
  }
}

function toJson(value: unknown): Json | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}
