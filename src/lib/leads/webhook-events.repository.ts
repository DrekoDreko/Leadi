import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { isWorkspaceManagerRole } from "@/lib/workspaces/permissions";

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

export type LeadWebhookSummary = {
  isConfigured: boolean;
  activeIntegrationLabel: string | null;
  leadsReceivedToday: number;
  lastLeadReceivedAt: string | null;
  lastLeadName: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
};

const DEFAULT_LEAD_WEBHOOK_SUMMARY: LeadWebhookSummary = {
  isConfigured: false,
  activeIntegrationLabel: null,
  leadsReceivedToday: 0,
  lastLeadReceivedAt: null,
  lastLeadName: null,
  lastError: null,
  lastErrorAt: null
};

export async function listLeadWebhookLogsByOrganization(input: {
  organizationId: string;
  filter: WebhookLogFilter;
  limit?: number;
}): Promise<LeadWebhookLog[]> {
  if (!hasSupabaseServiceRole()) {
    return [];
  }

  await assertCurrentUserCanReadWebhookLogs(input.organizationId);

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

export async function getLeadWebhookSummaryByOrganization(input: {
  organizationId: string;
  timeZone?: string;
}): Promise<LeadWebhookSummary> {
  if (!hasSupabaseServiceRole()) {
    return DEFAULT_LEAD_WEBHOOK_SUMMARY;
  }

  await assertCurrentUserCanReadWebhookLogs(input.organizationId);

  const supabase = createSupabaseAdminClient();
  const timeZone = input.timeZone ?? "America/Sao_Paulo";
  const [integrationResult, todayCountResult, latestLeadLogs, latestErrorLogs] = await Promise.all([
    supabase
      .from("lead_webhook_integrations")
      .select("id, label, created_at, last_used_at, revoked_at")
      .eq("organization_id", input.organizationId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    countProcessedWebhookEventsForToday(supabase, input.organizationId, timeZone),
    listLeadWebhookLogsByOrganization({
      organizationId: input.organizationId,
      filter: "processed",
      limit: 1
    }),
    listLeadWebhookLogsByOrganization({
      organizationId: input.organizationId,
      filter: "failed",
      limit: 1
    })
  ]);

  if (integrationResult.error) {
    console.error("Nao foi possivel carregar o token ativo do webhook de leads.", integrationResult.error);
  }

  const activeIntegration = integrationResult.data ?? null;
  const latestLead = latestLeadLogs[0] ?? null;
  const latestError = latestErrorLogs[0] ?? null;

  return {
    isConfigured: Boolean(activeIntegration),
    activeIntegrationLabel: activeIntegration?.label ?? null,
    leadsReceivedToday: todayCountResult,
    lastLeadReceivedAt: latestLead?.receivedAt ?? null,
    lastLeadName: latestLead?.leadName ?? null,
    lastError: latestError?.errorMessage ?? null,
    lastErrorAt: latestError?.receivedAt ?? null
  };
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

async function countProcessedWebhookEventsForToday(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  timeZone: string
) {
  const { startIso, endIso } = getTodayRangeInTimeZone(timeZone);
  const { count, error } = await supabase
    .from("lead_webhook_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "processed")
    .gte("received_at", startIso)
    .lt("received_at", endIso);

  if (error) {
    console.error("Nao foi possivel contar os eventos do webhook de leads de hoje.", error);
    return 0;
  }

  return count ?? 0;
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

async function assertCurrentUserCanReadWebhookLogs(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id,role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(error?.message ?? "Perfil nao encontrado.");
  }

  if (
    profile.organization_id !== organizationId ||
    !isWorkspaceManagerRole(profile.role)
  ) {
    throw new Error("Sem permissao para visualizar os logs deste webhook.");
  }
}

function getTodayRangeInTimeZone(timeZone: string, now = new Date()) {
  const parts = getDatePartsInTimeZone(now, timeZone);
  const start = zonedDateTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0, timeZone);
  const nextDay = addDays(parts.year, parts.month, parts.day, 1);
  const end = zonedDateTimeToUtc(nextDay.year, nextDay.month, nextDay.day, 0, 0, 0, 0, timeZone);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

function addDays(year: number, month: number, day: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);

  return new Date(utcGuess - offset);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds()
  );

  return zonedAsUtc - date.getTime();
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
    second: Number(getPart("second"))
  };
}
