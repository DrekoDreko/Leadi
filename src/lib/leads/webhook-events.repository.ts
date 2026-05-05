import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type LeadWebhookEventRow = Database["public"]["Tables"]["lead_webhook_events"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type WebhookLogFilter = "all" | "processed" | "failed";

export type LeadWebhookLog = {
  id: string;
  receivedAt: string;
  status: "processed" | "failed";
  httpStatus: number;
  leadId: string | null;
  leadName: string | null;
  errorMessage: string | null;
  source: string;
};

export async function listLeadWebhookLogsByOrganization(input: {
  organizationId: string;
  filter: WebhookLogFilter;
  limit?: number;
}): Promise<LeadWebhookLog[]> {
  if (!hasSupabaseServiceRole()) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const limit = clampLimit(input.limit ?? 40);
  let query = supabase
    .from("lead_webhook_events")
    .select("id, received_at, status, http_status, lead_id, error_message, raw_payload")
    .eq("organization_id", input.organizationId)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (input.filter !== "all") {
    query = query.eq("status", input.filter);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Nao foi possivel listar logs de webhook de leads.", error);
    return [];
  }

  const leadNamesById = await getLeadNamesById(
    supabase,
    data
      .map((event) => event.lead_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    input.organizationId
  );

  return data.map((event) => ({
    id: event.id,
    receivedAt: event.received_at,
    status: event.status,
    httpStatus: event.http_status,
    leadId: event.lead_id,
    leadName: event.lead_id ? leadNamesById.get(event.lead_id) ?? null : null,
    errorMessage: event.error_message,
    source: getWebhookSource(event)
  }));
}

async function getLeadNamesById(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  leadIds: string[],
  organizationId: string
) {
  if (!leadIds.length) {
    return new Map<string, string>();
  }

  const uniqueIds = Array.from(new Set(leadIds));
  const { data, error } = await supabase
    .from("leads")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("id", uniqueIds);

  if (error || !data) {
    console.error("Nao foi possivel carregar nomes de leads para logs de webhook.", error);
    return new Map<string, string>();
  }

  return new Map(
    (data as Pick<LeadRow, "id" | "name">[]).map((lead) => [lead.id, lead.name])
  );
}

function getWebhookSource(event: Pick<LeadWebhookEventRow, "raw_payload">) {
  const payload = event.raw_payload;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Make/Zapier";
  }

  const sourceValue = getPayloadTextValue(payload as Record<string, unknown>, [
    "source",
    "origem"
  ]);

  if (sourceValue === "api") {
    return "API";
  }

  if (sourceValue === "meta_lead_ads") {
    return "Meta Lead Ads";
  }

  return "Make/Zapier";
}

function getPayloadTextValue(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string") {
      return value.trim().toLowerCase();
    }
  }

  return "";
}

function clampLimit(value: number) {
  return Math.max(1, Math.min(value, 100));
}
