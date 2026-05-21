import { NextResponse } from "next/server";

import { requireIntegrationEnv, EnvValidationError } from "@/lib/env/server";
import {
  buildMetaDataDeletionStatusUrl,
  createMetaDataDeletionConfirmationCode,
  getMetaDataDeletionUserId,
  parseMetaDataDeletionSignedRequest
} from "@/lib/meta/data-deletion.server";
import { getMetaAppSecret } from "@/lib/meta/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertRouteRateLimit } from "@/lib/api/route-security";

export async function POST(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-meta-data-deletion",
      limit: 60,
      windowMs: 60 * 1000
    });
    requireIntegrationEnv("meta_oauth");
    requireIntegrationEnv("supabase_admin");

    const signedRequest = await readSignedRequest(request);
    if (!signedRequest) {
      throw new Error("signed_request ausente.");
    }

    const payload = parseMetaDataDeletionSignedRequest(signedRequest, getMetaAppSecret());
    const userId = getMetaDataDeletionUserId(payload);

    if (!userId) {
      throw new Error("user_id ausente no payload da Meta.");
    }

    await deleteMetaConnectionDataForUserId(userId);

    const confirmationCode = createMetaDataDeletionConfirmationCode();
    const statusUrl = buildMetaDataDeletionStatusUrl(confirmationCode);

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  } catch (error) {
    const message = getMetaDataDeletionErrorMessage(error);
    const status = getMetaDataDeletionErrorStatus(error);

    return NextResponse.json({ error: message }, { status });
  }
}

async function deleteMetaConnectionDataForUserId(metaUserId: string) {
  const admin = createSupabaseAdminClient();
  const [userIdMatches, accountIdMatches] = await Promise.all([
    admin
      .from("meta_integrations")
      .select("id, organization_id")
      .eq("meta_user_id", metaUserId),
    admin
      .from("meta_integrations")
      .select("id, organization_id")
      .eq("meta_account_id", metaUserId)
  ]);

  if (userIdMatches.error) {
    throw new Error(userIdMatches.error.message);
  }

  if (accountIdMatches.error) {
    throw new Error(accountIdMatches.error.message);
  }

  const connections = dedupeConnections([
    ...(userIdMatches.data ?? []),
    ...(accountIdMatches.data ?? [])
  ]);

  if (!connections.length) {
    return;
  }

  const organizationIds = [...new Set(connections.map((connection) => connection.organization_id))];
  const connectionIds = [...new Set(connections.map((connection) => connection.id))];

  await purgeMetaCustomerDataForConnections(admin, organizationIds, connectionIds);

  const [metaFormsDelete, metaPagesDelete, metaAdAccountsDelete, syncLogsDelete, integrationsDelete] = await Promise.all([
    admin.from("meta_forms").delete().in("organization_id", organizationIds),
    admin.from("meta_pages").delete().in("organization_id", organizationIds),
    admin.from("meta_ad_accounts").delete().in("organization_id", organizationIds),
    admin
      .from("integration_sync_logs")
      .delete()
      .eq("provider", "meta")
      .in("organization_id", organizationIds),
    admin.from("meta_integrations").delete().in("id", connectionIds)
  ]);

  const firstError =
    metaFormsDelete.error ??
    metaPagesDelete.error ??
    metaAdAccountsDelete.error ??
    syncLogsDelete.error ??
    integrationsDelete.error;

  if (firstError) {
    throw new Error(firstError.message);
  }
}

async function purgeMetaCustomerDataForConnections(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationIds: string[],
  connectionIds: string[]
) {
  const organizationsWithOnlyRemovedConnections = await listOrganizationsWithOnlyRemovedConnections(
    admin,
    organizationIds,
    connectionIds
  );
  const targetLeadIds = await listTargetMetaLeadIds(admin, {
    organizationIds,
    connectionIds,
    organizationsWithOnlyRemovedConnections
  });

  if (!targetLeadIds.length) {
    await deleteMetaWebhookEvents(admin, connectionIds);
    return;
  }

  const redactedAt = new Date().toISOString();
  const leadChunks = chunkStrings(targetLeadIds, 200);

  for (const leadIds of leadChunks) {
    const [commentsDelete, followUpDelete, leadsUpdate] = await Promise.all([
      admin.from("lead_comments").delete().in("lead_id", leadIds),
      admin.from("lead_follow_up_events").delete().in("lead_id", leadIds),
      admin
        .from("leads")
        .update({
          name: "Lead removido (LGPD Meta)",
          phone: null,
          phone_e164: null,
          email: null,
          city: null,
          company_name: null,
          budget: null,
          interest: null,
          notes: null,
          last_interaction: "Dados anonimizados por solicitacao de exclusao da Meta.",
          meta_lead_id: null,
          archived_at: redactedAt,
          archive_reason: "LGPD Meta data deletion",
          raw_payload: {
            source: "meta_lead_ads",
            lgpd_redacted: true,
            redacted_at: redactedAt
          }
        })
        .in("id", leadIds)
    ]);

    const firstError = commentsDelete.error ?? followUpDelete.error ?? leadsUpdate.error;

    if (firstError) {
      throw new Error(firstError.message);
    }
  }

  await deleteMetaWebhookEvents(admin, connectionIds);
}

async function listOrganizationsWithOnlyRemovedConnections(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationIds: string[],
  connectionIds: string[]
) {
  const { data, error } = await admin
    .from("meta_integrations")
    .select("organization_id,id")
    .in("organization_id", organizationIds);

  if (error) {
    throw new Error(error.message);
  }

  const removedIds = new Set(connectionIds);
  const organizationsWithRemainingConnections = new Set(
    (data ?? [])
      .filter((connection) => !removedIds.has(connection.id))
      .map((connection) => connection.organization_id)
  );

  return organizationIds.filter((organizationId) => !organizationsWithRemainingConnections.has(organizationId));
}

async function listTargetMetaLeadIds(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: {
    organizationIds: string[];
    connectionIds: string[];
    organizationsWithOnlyRemovedConnections: string[];
  }
) {
  const [connectionLeadMatches, organizationLeadMatches] = await Promise.all([
    input.connectionIds.length
      ? admin
          .from("leads")
          .select("id")
          .eq("source", "meta_lead_ads")
          .in("meta_connected_account_id", input.connectionIds)
      : Promise.resolve({ data: [], error: null }),
    input.organizationsWithOnlyRemovedConnections.length
      ? admin
          .from("leads")
          .select("id")
          .eq("source", "meta_lead_ads")
          .in("organization_id", input.organizationsWithOnlyRemovedConnections)
      : Promise.resolve({ data: [], error: null })
  ]);

  const firstError = connectionLeadMatches.error ?? organizationLeadMatches.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  return [...new Set([...(connectionLeadMatches.data ?? []), ...(organizationLeadMatches.data ?? [])].map((lead) => lead.id))];
}

async function deleteMetaWebhookEvents(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  connectionIds: string[]
) {
  if (!connectionIds.length) {
    return;
  }

  const { error } = await admin
    .from("lead_webhook_events")
    .delete()
    .in("integration_id", connectionIds);

  if (error) {
    throw new Error(error.message);
  }
}

function chunkStrings(values: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function readSignedRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as unknown;
    return extractSignedRequest(body);
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    const value = formData.get("signed_request");
    return typeof value === "string" ? value.trim() : "";
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return "";
  }

  try {
    const formData = new URLSearchParams(rawBody);
    const value = formData.get("signed_request");
    if (value) {
      return value.trim();
    }
  } catch {
    // Fallback to JSON parsing below.
  }

  try {
    return extractSignedRequest(JSON.parse(rawBody));
  } catch {
    return "";
  }
}

function extractSignedRequest(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }

  const signedRequest = value.signed_request;
  return typeof signedRequest === "string" ? signedRequest.trim() : "";
}

function dedupeConnections(
  connections: Array<{
    id: string;
    organization_id: string;
  }>
) {
  const seen = new Set<string>();

  return connections.filter((connection) => {
    if (seen.has(connection.id)) {
      return false;
    }

    seen.add(connection.id);
    return true;
  });
}

function getMetaDataDeletionErrorStatus(error: unknown) {
  if (error instanceof EnvValidationError) {
    return 503;
  }

  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("signed_request ausente") ||
    normalizedMessage.includes("signed_request invalido") ||
    normalizedMessage.includes("user_id ausente")
  ) {
    return 400;
  }

  if (normalizedMessage.includes("assinatura invalida")) {
    return 401;
  }

  if (normalizedMessage.includes("algoritmo de signed_request")) {
    return 400;
  }

  return 500;
}

function getMetaDataDeletionErrorMessage(error: unknown) {
  const status = getMetaDataDeletionErrorStatus(error);

  if (status === 400) {
    return "Requisicao de exclusao de dados invalida.";
  }

  if (status === 401) {
    return "Assinatura da Meta invalida.";
  }

  if (status === 503) {
    return "Exclusao de dados da Meta indisponivel.";
  }

  return "Nao foi possivel processar a exclusao de dados da Meta.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
