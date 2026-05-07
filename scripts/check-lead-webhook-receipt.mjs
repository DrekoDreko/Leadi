#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_LOOKBACK_MINUTES = 30;
const DEFAULT_LIMIT = 5;
const EXPECTED_SOURCE = "make_zapier";

loadEnvFile(".env");
loadEnvFile(".env.local");

await main();

async function main() {
  const supabase = createAdminClient();
  const organizationHint = getOrganizationHint();
  const lookbackMinutes = getPositiveInteger(
    process.env.LEAD_WEBHOOK_LOOKBACK_MINUTES,
    DEFAULT_LOOKBACK_MINUTES
  );
  const limit = clamp(getPositiveInteger(process.env.LEAD_WEBHOOK_LIMIT, DEFAULT_LIMIT), 1, 20);
  const sinceIso = new Date(Date.now() - lookbackMinutes * 60_000).toISOString();
  const organization = await resolveOrganization(supabase, organizationHint);

  let eventsQuery = supabase
    .from("lead_webhook_events")
    .select(
      "id, organization_id, integration_id, lead_id, status, http_status, error_message, received_at, raw_payload"
    )
    .gte("received_at", sinceIso)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (organization?.id) {
    eventsQuery = eventsQuery.eq("organization_id", organization.id);
  }

  const { data: events, error: eventsError } = await eventsQuery;
  if (eventsError) {
    throw new Error(`Falha ao consultar lead_webhook_events: ${eventsError.message}`);
  }

  const latestEvent = Array.isArray(events) ? events[0] ?? null : null;
  const linkedLead = latestEvent?.lead_id
    ? await getLeadById(supabase, latestEvent.lead_id, organization?.id ?? latestEvent.organization_id ?? null)
    : null;
  const recentLeads = await getRecentLeads(supabase, organization?.id ?? null, limit);

  const output = {
    configured: true,
    expectedSource: EXPECTED_SOURCE,
    lookbackMinutes,
    since: sinceIso,
    organization: organization
      ? {
          id: organization.id,
          slug: organization.slug,
          name: organization.name
        }
      : null,
    checks: {
      receivedEvent: Boolean(latestEvent),
      processedEvent: latestEvent?.status === "processed",
      linkedLeadPresent: Boolean(linkedLead),
      linkedLeadSourceValid: linkedLead?.source === EXPECTED_SOURCE
    },
    latestEvent: latestEvent ? summarizeEvent(latestEvent) : null,
    linkedLead: linkedLead ? summarizeLead(linkedLead) : null,
    recentMatchingLeads: recentLeads.map(summarizeLead)
  };

  console.log(JSON.stringify(output, null, 2));

  if (!latestEvent) {
    process.exitCode = 2;
    return;
  }

  if (latestEvent.status !== "processed" || !linkedLead || linkedLead.source !== EXPECTED_SOURCE) {
    process.exitCode = 1;
  }
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente ou em .env.local."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getOrganizationHint() {
  const organizationId = process.env.LEAD_WEBHOOK_ORG_ID?.trim() ?? "";
  const organizationSlug = process.env.LEAD_WEBHOOK_ORG_SLUG?.trim() ?? "";

  return {
    id: organizationId || null,
    slug: organizationSlug || null
  };
}

async function resolveOrganization(supabase, hint) {
  if (!hint.id && !hint.slug) {
    return null;
  }

  const query = supabase.from("organizations").select("id, slug, name");
  const result = hint.id
    ? await query.eq("id", hint.id).maybeSingle()
    : await query.eq("slug", hint.slug).maybeSingle();

  if (result.error) {
    throw new Error(`Falha ao consultar organizations: ${result.error.message}`);
  }

  if (!result.data) {
    throw new Error("Organizacao informada nao foi encontrada.");
  }

  return result.data;
}

async function getLeadById(supabase, leadId, organizationId) {
  let query = supabase
    .from("leads")
    .select("id, organization_id, owner_profile_id, name, email, phone, source, received_at, notes")
    .eq("id", leadId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Falha ao consultar o lead vinculado: ${error.message}`);
  }

  return data ?? null;
}

async function getRecentLeads(supabase, organizationId, limit) {
  let query = supabase
    .from("leads")
    .select("id, organization_id, owner_profile_id, name, email, phone, source, received_at, notes")
    .eq("source", EXPECTED_SOURCE)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Falha ao consultar leads recentes: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

function summarizeEvent(event) {
  return {
    id: event.id,
    organizationId: event.organization_id,
    integrationId: event.integration_id,
    leadId: event.lead_id,
    status: event.status,
    httpStatus: event.http_status,
    errorMessage: event.error_message,
    receivedAt: event.received_at,
    payload: summarizePayload(event.raw_payload)
  };
}

function summarizeLead(lead) {
  return {
    id: lead.id,
    organizationId: lead.organization_id,
    ownerProfileId: lead.owner_profile_id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    receivedAt: lead.received_at,
    notes: lead.notes
  };
}

function summarizePayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const payload = getNestedRecord(value, ["lead", "data", "payload", "contact", "prospect"]);
  const source = getTextValue(payload ?? value, ["source", "origem"]);

  return {
    source: source || null,
    name: getTextValue(payload ?? value, ["name", "nome", "full_name", "fullName"]) || null,
    email: getTextValue(payload ?? value, ["email", "e-mail"]) || null,
    phone:
      getTextValue(payload ?? value, ["phone", "telefone", "whatsapp", "celular"]) || null,
    interest: getTextValue(payload ?? value, ["interest", "interesse", "produto"]) || null
  };
}

function getNestedRecord(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value;
  for (const key of keys) {
    if (record[key] && typeof record[key] === "object" && !Array.isArray(record[key])) {
      return record[key];
    }
  }

  return null;
}

function getTextValue(record, keys) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function loadEnvFile(filename) {
  const path = resolve(PROJECT_ROOT, filename);

  if (!existsSync(path)) {
    return;
  }

  const contents = readFileSync(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    process.env[match[1]] = unquoteEnvValue(match[2].trim());
  }
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function getPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
