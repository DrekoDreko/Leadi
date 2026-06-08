import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type LeadWebhookIntegrationRow =
  Database["public"]["Tables"]["lead_webhook_integrations"]["Row"];

export type LeadWebhookAuthContext = {
  integrationId: string;
  organizationId: string;
  label: string | null;
};

export async function authenticateLeadWebhookRequest(
  request: Request
): Promise<LeadWebhookAuthContext> {
  const token = getLeadWebhookToken(request);

  if (!token) {
    throw new Error("Webhook token ausente.");
  }

  const supabase = createSupabaseAdminClient();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase
    .from("lead_webhook_integrations")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Webhook nao autorizado.");
  }

  await touchLeadWebhookIntegration(supabase, data);

  return {
    integrationId: data.id,
    organizationId: data.organization_id,
    label: data.label
  };
}

function getLeadWebhookToken(request: Request) {
  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^bearer\s+/i, "")
    .trim();
  const headerToken = request.headers.get("x-leadi-token")?.trim()
    || request.headers.get("x-leadhealth-token")?.trim();

  return headerToken || bearerToken || "";
}

async function touchLeadWebhookIntegration(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  integration: LeadWebhookIntegrationRow
) {
  const { error } = await supabase
    .from("lead_webhook_integrations")
    .update({
      last_used_at: new Date().toISOString()
    })
    .eq("id", integration.id);

  if (error) {
    console.error("Nao foi possivel registrar o uso do token do webhook.", error);
  }
}
