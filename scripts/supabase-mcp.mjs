#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const MAX_LIMIT = 100;

const ALLOWED_TABLES = [
  "campaigns",
  "meta_campaign_publication_attempts",
  "creative_requests",
  "creative_request_comments",
  "whatsapp_messages",
  "plans",
  "subscriptions",
  "payment_events",
  "organizations",
  "meta_integrations",
  "meta_pages",
  "meta_forms",
  "meta_ad_accounts",
  "meta_ad_image_uploads",
  "lead_webhook_integrations",
  "lead_webhook_events",
  "lead_follow_up_events",
  "profiles",
  "workspace_members",
  "invites",
  "leads",
  "onboarding_states",
  "system_templates"
];

loadEnvFile(".env");
loadEnvFile(".env.local");

const TableNameSchema = z.enum(ALLOWED_TABLES);
const JsonRecordSchema = z.record(z.string(), z.unknown());
const FilterSchema = z.object({
  column: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is"]),
  value: z.unknown()
});

const server = new McpServer({
  name: "leadhealth-supabase",
  version: "0.1.0"
});

server.registerTool(
  "supabase_status",
  {
    title: "Supabase status",
    description: "Checks whether this MCP can create an admin Supabase client and shows the allowed tables."
  },
  async () => {
    const { url, serviceRoleKey } = getSupabaseEnv();

    return jsonResult({
      configured: Boolean(url && serviceRoleKey),
      url: url ? redactSupabaseUrl(url) : null,
      serviceRoleKeyConfigured: Boolean(serviceRoleKey),
      allowedTables: ALLOWED_TABLES,
      maxLimit: MAX_LIMIT
    });
  }
);

server.registerTool(
  "supabase_select",
  {
    title: "Select rows",
    description: "Reads rows from an allowlisted Supabase table using the service role key.",
    inputSchema: {
      table: TableNameSchema,
      columns: z.string().min(1).default("*"),
      filters: z.array(FilterSchema).max(8).default([]),
      limit: z.number().int().min(1).max(MAX_LIMIT).default(20),
      orderBy: z.string().min(1).optional(),
      ascending: z.boolean().default(false)
    }
  },
  async ({ table, columns, filters, limit, orderBy, ascending }) => {
    const supabase = createAdminClient();
    let query = supabase.from(table).select(columns).limit(limit);

    query = applyFilters(query, filters);

    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }

    const { data, error } = await query;
    if (error) {
      return errorResult(error.message);
    }

    return jsonResult({ table, count: Array.isArray(data) ? data.length : 0, rows: data });
  }
);

server.registerTool(
  "supabase_insert",
  {
    title: "Insert rows",
    description: "Inserts rows into an allowlisted Supabase table using the service role key.",
    inputSchema: {
      table: TableNameSchema,
      records: z.array(JsonRecordSchema).min(1).max(25),
      returning: z.boolean().default(true)
    }
  },
  async ({ table, records, returning }) => {
    const supabase = createAdminClient();
    const query = supabase.from(table).insert(records);
    const result = returning ? await query.select("*") : await query;

    if (result.error) {
      return errorResult(result.error.message);
    }

    return jsonResult({ table, inserted: records.length, rows: returning ? result.data : undefined });
  }
);

server.registerTool(
  "supabase_update",
  {
    title: "Update rows",
    description: "Updates rows in an allowlisted Supabase table. At least one filter is required.",
    inputSchema: {
      table: TableNameSchema,
      values: JsonRecordSchema,
      filters: z.array(FilterSchema).min(1).max(8),
      returning: z.boolean().default(true)
    }
  },
  async ({ table, values, filters, returning }) => {
    const supabase = createAdminClient();
    let query = supabase.from(table).update(values);
    query = applyFilters(query, filters);

    const result = returning ? await query.select("*") : await query;
    if (result.error) {
      return errorResult(result.error.message);
    }

    return jsonResult({ table, updated: returning && Array.isArray(result.data) ? result.data.length : null, rows: result.data });
  }
);

server.registerTool(
  "supabase_delete",
  {
    title: "Delete rows",
    description: "Deletes rows from an allowlisted Supabase table. Requires filters and confirm='DELETE'.",
    inputSchema: {
      table: TableNameSchema,
      filters: z.array(FilterSchema).min(1).max(8),
      confirm: z.literal("DELETE"),
      returning: z.boolean().default(true)
    }
  },
  async ({ table, filters, returning }) => {
    const supabase = createAdminClient();
    let query = supabase.from(table).delete();
    query = applyFilters(query, filters);

    const result = returning ? await query.select("*") : await query;
    if (result.error) {
      return errorResult(result.error.message);
    }

    return jsonResult({ table, deleted: returning && Array.isArray(result.data) ? result.data.length : null, rows: result.data });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url || !serviceRoleKey) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente ou em .env.local.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? ""
  };
}

function applyFilters(query, filters) {
  return filters.reduce((currentQuery, filter) => {
    if (filter.op === "is") {
      return currentQuery.is(filter.column, filter.value);
    }

    return currentQuery[filter.op](filter.column, filter.value);
  }, query);
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

function redactSupabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return "invalid-url";
  }
}

function jsonResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function errorResult(message) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: message
      }
    ]
  };
}
