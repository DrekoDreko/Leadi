import "server-only";
import { createBillingAdminClient } from "./admin";

export async function getBillingSubscriptionByExternalReference(externalId: string) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .or(`id.eq.${externalId},external_id.eq.${externalId}`)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateBillingSubscription(
  subscriptionId: string,
  patch: {
    status?: string;
    canceled_at?: string;
    ended_at?: string;
    current_period_start?: string;
    current_period_end?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const supabase = createBillingAdminClient();
  const payload: Record<string, unknown> = {};
  if (patch.status) payload.status = patch.status;
  if (patch.canceled_at) payload.canceled_at = patch.canceled_at;
  if (patch.ended_at) payload.ended_at = patch.ended_at;
  if (patch.current_period_start) payload.current_period_start = patch.current_period_start;
  if (patch.current_period_end) payload.current_period_end = patch.current_period_end;
  if (patch.metadata) payload.metadata = patch.metadata;

  const { data, error } = await supabase
    .from("subscriptions")
    .update(payload)
    .eq("id", subscriptionId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Não foi possível atualizar a assinatura.");
  }
  return data;
}

export async function createBillingPaymentEvent(input: {
  organizationId: string;
  subscriptionId: string;
  planId: string;
  gateway: string;
  eventType: string;
  status: string;
  externalId: string;
  amountCents?: number;
  payload: unknown;
}) {
  const supabase = createBillingAdminClient();
  const { data, error } = await supabase
    .from("payment_events")
    .insert({
      organization_id: input.organizationId,
      subscription_id: input.subscriptionId,
      plan_id: input.planId,
      gateway: input.gateway,
      event_type: input.eventType,
      status: input.status,
      external_id: input.externalId,
      amount_cents: input.amountCents,
      payload: input.payload,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null; // Ignore unique constraint violation on external_id
    throw error;
  }
  return data;
}
