import "server-only";

import { logger, sensitize } from "@/lib/logger";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { AuditLogStatus, Database, Json, ProfileRole } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];
type AuditActorProfile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "organization_id" | "role">;

const MAX_AUDIT_DEPTH = 5;
const MAX_ARRAY_ITEMS = 25;
const MAX_TEXT_LENGTH = 1000;
const MAX_USER_AGENT_LENGTH = 1024;
const OMITTED_AUDIT_KEYS = [
  "raw_payload",
  "payload",
  "headers",
  "cookies",
  "body",
  "html",
  "content",
  "authorization",
  "secret",
  "token",
  "password",
  "api_key",
  "access_token",
  "refresh_token"
];

export type AuditLogInput = {
  organizationId: string;
  action: string;
  actorProfileId?: string | null;
  actorRole?: ProfileRole | null;
  teamId?: string | null;
  targetType?: string;
  targetId?: string | null;
  status?: AuditLogStatus;
  metadata?: Json;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type RecordAuditLogResult =
  | {
      ok: true;
      id: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function recordAuditLog(input: AuditLogInput): Promise<RecordAuditLogResult> {
  const action = normalizeText(input.action, 120);

  if (!input.organizationId || !action) {
    return { ok: false, error: "organizationId e action sao obrigatorios para audit_logs." };
  }

  const supabase = hasSupabaseServiceRole()
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();

  const payload: AuditLogInsert = {
    organization_id: input.organizationId,
    team_id: input.teamId ?? null,
    actor_profile_id: input.actorProfileId ?? null,
    actor_role: input.actorRole ?? null,
    action,
    target_type: normalizeText(input.targetType ?? "organization", 120) ?? "organization",
    target_id: normalizeText(input.targetId, 255),
    status: input.status ?? "success",
    metadata: sanitizeAuditMetadata(input.metadata),
    ip_address: normalizeText(input.ipAddress, 64),
    user_agent: normalizeText(input.userAgent, MAX_USER_AGENT_LENGTH)
  };

  const { data, error } = await supabase.from("audit_logs").insert(payload).select("id").single();

  if (error || !data) {
    logger.error(
      {
        route: "audit_logs",
        operation: "insert",
        message: "Falha ao gravar evento de auditoria.",
        data: {
          organizationId: input.organizationId,
          action,
          targetType: payload.target_type,
          status: payload.status
        }
      },
      error
    );

    return { ok: false, error: error?.message ?? "Falha ao inserir audit log." };
  }

  return { ok: true, id: data.id };
}

export async function recordAuditLogForCurrentUser(
  input: Omit<AuditLogInput, "organizationId" | "actorProfileId" | "actorRole">
): Promise<RecordAuditLogResult> {
  const actor = await resolveCurrentAuditActor();

  if (!actor) {
    return { ok: false, error: "Usuario autenticado nao encontrado para gravar audit log." };
  }

  return recordAuditLog({
    ...input,
    organizationId: actor.organization_id,
    actorProfileId: actor.id,
    actorRole: actor.role
  });
}

export function sanitizeAuditMetadata(metadata?: Json): Json {
  if (metadata === undefined) {
    return {};
  }

  return sanitizeAuditValue(sensitize(metadata) as Json);
}

async function resolveCurrentAuditActor(): Promise<AuditActorProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

function sanitizeAuditValue(value: Json, depth = 0): Json {
  if (depth >= MAX_AUDIT_DEPTH) {
    return "[TRUNCATED]";
  }

  if (typeof value === "string") {
    return truncateText(value, MAX_TEXT_LENGTH);
  }

  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeAuditValue(item, depth + 1));
  }

  const result: { [key: string]: Json | undefined } = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) {
      continue;
    }

    if (shouldOmitAuditKey(key)) {
      result[key] = "[OMITTED]";
      continue;
    }

    result[key] = sanitizeAuditValue(entry, depth + 1);
  }

  return result;
}

function shouldOmitAuditKey(key: string) {
  const lowerKey = key.toLowerCase();
  return OMITTED_AUDIT_KEYS.some((entry) => lowerKey.includes(entry));
}

function normalizeText(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return truncateText(normalized, maxLength);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}
