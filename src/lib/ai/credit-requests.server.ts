import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { allocateCreditWalletBalance, ensureSubWallet, getOrCreateOrganizationWallet } from "./wallets.server";

export type CreditRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type CreditRequestType = "team" | "user" | "campaign" | "image";

export type CreateCreditRequestInput = {
  orgId: string;
  teamId?: string | null;
  requestedByProfileId: string;
  requestType: CreditRequestType;
  amountRequested: number;
  creditsPerConsultant?: number | null;
  consultantCount?: number | null;
  reason: string;
  metadata?: Json | null;
};

export async function createCreditRequest(input: CreateCreditRequestInput) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("credit_requests")
    .insert({
      organization_id: input.orgId,
      team_id: input.teamId ?? null,
      requested_by_profile_id: input.requestedByProfileId,
      request_type: input.requestType,
      amount_requested: input.amountRequested,
      credits_per_consultant: input.creditsPerConsultant ?? null,
      consultant_count: input.consultantCount ?? null,
      reason: input.reason,
      status: "pending",
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Erro ao criar solicitação de créditos: ${error?.message}`);
  }

  return data;
}

export async function listCreditRequests(orgId: string, teamId?: string | null) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from("credit_requests")
    .select(`
      *,
      requested_by:profiles!credit_requests_requested_by_profile_id_fkey(full_name, email),
      approved_by:profiles!credit_requests_approved_by_profile_id_fkey(full_name, email)
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (teamId) {
    query = query.eq("team_id", teamId);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data;
}

export async function approveCreditRequest(input: {
  requestId: string;
  orgId: string;
  approvedByProfileId: string;
  amountApproved: number;
  reviewNotes?: string;
}) {
  const admin = createSupabaseAdminClient();

  // 1. Fetch request
  const { data: request, error: fetchError } = await admin
    .from("credit_requests")
    .select("*")
    .eq("id", input.requestId)
    .eq("organization_id", input.orgId)
    .single();

  if (fetchError || !request) {
    throw new Error("Solicitação não encontrada.");
  }

  if (request.status !== "pending") {
    throw new Error(`A solicitação já está com status: ${request.status}`);
  }

  // 2. Ensure wallets
  const orgWallet = await getOrCreateOrganizationWallet(input.orgId);
  
  let toWalletId = "";
  if (request.request_type === "team" && request.team_id) {
    const teamWallet = await ensureSubWallet({
      orgId: input.orgId,
      walletType: "team",
      teamId: request.team_id
    });
    toWalletId = teamWallet.id;
  } else if (request.request_type === "user") {
    const userWallet = await ensureSubWallet({
      orgId: input.orgId,
      walletType: "user",
      profileId: request.requested_by_profile_id
    });
    toWalletId = userWallet.id;
  } else {
    // Se for campaign ou image, mandamos pro próprio requerente inicialmente
    const userWallet = await ensureSubWallet({
      orgId: input.orgId,
      walletType: "user",
      profileId: request.requested_by_profile_id
    });
    toWalletId = userWallet.id;
  }

  // 3. Allocate credits
  await allocateCreditWalletBalance({
    orgId: input.orgId,
    fromWalletId: orgWallet.id,
    toWalletId,
    amount: input.amountApproved,
    reason: `Aprovação de solicitação de créditos: ${request.reason}`,
    actorId: input.approvedByProfileId,
    metadata: { credit_request_id: request.id }
  });

  // 4. Update request status
  const { data: updated, error: updateError } = await admin
    .from("credit_requests")
    .update({
      status: "approved",
      amount_approved: input.amountApproved,
      approved_by_profile_id: input.approvedByProfileId,
      review_notes: input.reviewNotes ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error("Erro ao atualizar o status da solicitação.");
  }

  return updated;
}

export async function rejectCreditRequest(input: {
  requestId: string;
  orgId: string;
  rejectedByProfileId: string;
  reviewNotes?: string;
}) {
  const admin = createSupabaseAdminClient();

  // 1. Fetch request
  const { data: request, error: fetchError } = await admin
    .from("credit_requests")
    .select("*")
    .eq("id", input.requestId)
    .eq("organization_id", input.orgId)
    .single();

  if (fetchError || !request) {
    throw new Error("Solicitação não encontrada.");
  }

  if (request.status !== "pending") {
    throw new Error(`A solicitação já está com status: ${request.status}`);
  }

  // 2. Update request status
  const { data: updated, error: updateError } = await admin
    .from("credit_requests")
    .update({
      status: "rejected",
      approved_by_profile_id: input.rejectedByProfileId, // we reuse this field for reviewer
      review_notes: input.reviewNotes ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error("Erro ao rejeitar a solicitação.");
  }

  return updated;
}
