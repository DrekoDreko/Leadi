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

export async function POST(request: Request) {
  try {
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
    const message = error instanceof Error && error.message ? error.message : "Nao foi possivel processar a exclusao de dados da Meta.";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
