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

import { logger, sensitize } from "@/lib/logger";

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
    raw_payload: sanitizeWebhookPayloadForStorage(input.rawPayload),
    safe_headers: toJson(input.safeHeaders) ?? {},
    error_message: input.errorMessage ?? null
  });

  if (error) {
    logger.error({
      route: "INTERNAL",
      operation: "RECORD_LEAD_WEBHOOK_EVENT",
      message: "Nao foi possivel registrar o evento do webhook de leads.",
      data: { input }
    }, error);
  }
}

function toJson(value: unknown): Json | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}

export function sanitizeWebhookPayloadForStorage(value: unknown): Json {
  const json = toJson(value);

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return {
      payload_type: Array.isArray(json) ? "array" : typeof json
    };
  }

  const record = json as Record<string, unknown>;

  return removeUndefinedValues({
    source: getOptionalText(record.source),
    processing_outcome: getOptionalProcessingOutcome(record.processing_outcome),
    duplicate: typeof record.duplicate === "boolean" ? record.duplicate : undefined,
    duplicate_reason: getOptionalText(record.duplicate_reason),
    summary_message: getOptionalSummaryMessage(record.summary_message),
    payload_keys: Object.keys(record).slice(0, 20),
    meta_webhook_event: summarizeNestedRecord(record.meta_webhook_event, [
      "leadgen_id",
      "form_id",
      "page_id",
      "ad_id",
      "adgroup_id",
      "created_time",
      "entry_id",
      "entry_index",
      "field"
    ]),
    meta_webhook_summary:
      summarizeNestedRecord(record.meta_webhook_summary, [
        "object",
        "entry_count",
        "leadgen_event_count"
      ]) ?? summarizeMetaWebhookPayload(record.meta_webhook_payload),
    meta_lead_summary: summarizeNestedRecord(record.meta_lead_summary, [
      "lead_id",
      "form_id",
      "campaign_id",
      "adset_id",
      "ad_id",
      "created_time",
      "platform",
      "field_names",
      "unmapped_field_names"
    ]),
    meta_import_context: summarizeNestedRecord(record.meta_import_context, [
      "form_id",
      "page_id",
      "page_name"
    ])
  });
}

function summarizeNestedRecord(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const summary = Object.fromEntries(
    keys.flatMap((key) => {
      const entryValue = record[key];

      if (entryValue === undefined) {
        return [];
      }

      return [[key, entryValue]];
    })
  );

  if (Object.keys(summary).length === 0) {
    return undefined;
  }

  return sensitize(summary);
}

function getOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getOptionalProcessingOutcome(value: unknown) {
  if (value !== "created" && value !== "duplicate" && value !== "failed") {
    return undefined;
  }

  return value;
}

function getOptionalSummaryMessage(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 180);
}

function summarizeMetaWebhookPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const payload = value as {
    object?: unknown;
    entry?: unknown[];
  };
  const entry = Array.isArray(payload.entry) ? payload.entry : [];
  const leadgenEventCount = entry.reduce<number>((count, entryItem) => {
    if (!entryItem || typeof entryItem !== "object" || Array.isArray(entryItem)) {
      return count;
    }

    const rawChanges = (entryItem as { changes?: unknown[] }).changes;
    const changes = Array.isArray(rawChanges) ? rawChanges : [];

    return (
      count +
      changes.filter((change) => {
        return (
          change &&
          typeof change === "object" &&
          !Array.isArray(change) &&
          (change as { field?: unknown }).field === "leadgen"
        );
      }).length
    );
  }, 0);

  return sensitize({
    object: typeof payload.object === "string" ? payload.object : null,
    entry_count: entry.length,
    leadgen_event_count: leadgenEventCount
  });
}

function removeUndefinedValues(value: Record<string, unknown>): Json {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as Json;
}
