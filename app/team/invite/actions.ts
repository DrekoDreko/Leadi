"use server";

import { revalidatePath } from "next/cache";
import {
  BillingResourceAccessError,
  assertCurrentResourceAccess
} from "@/lib/billing/subscription-limits.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { InviteApprovalStatus, InviteStatus } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TeamRole = "admin" | "seller";

type CreateInviteResult =
  | {
      ok: true;
      id: string;
      invitePath: string;
      expiresAt: string;
      roleToAssign: TeamRole;
      status: InviteStatus;
      requiresApproval: boolean;
      approvalStatus: InviteApprovalStatus;
      invitedEmail: string | null;
    }
  | {
      ok: false;
      error: string;
    };

export async function createInviteByEmailAction(formData: FormData): Promise<CreateInviteResult> {
  const roleToAssign = parseInviteRole(formData.get("roleToAssign"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { ok: false, error: "Informe um email valido." };
  }

  return createInviteInternal(roleToAssign, email);
}

export async function createInviteLinkAction(formData: FormData): Promise<CreateInviteResult> {
  const roleToAssign = parseInviteRole(formData.get("roleToAssign"));

  return createInviteInternal(roleToAssign, null);
}

async function createInviteInternal(
  roleToAssign: TeamRole,
  targetEmail: string | null
): Promise<CreateInviteResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      id: "demo-invite",
      invitePath: "/invite/demo",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      roleToAssign,
      status: "active",
      requiresApproval: !targetEmail,
      approvalStatus: targetEmail ? "not_required" : "pending",
      invitedEmail: targetEmail
    };
  }

  try {
    await assertCurrentResourceAccess("team_invites");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("create_workspace_invite", {
        requested_role_to_assign: roleToAssign,
        target_email: targetEmail
      })
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: "Nao foi possivel gerar o convite agora."
      };
    }

    revalidatePath("/team/invite");
    revalidatePath("/dashboard/equipes");

    return {
      ok: true,
      id: data.id,
      invitePath: data.invite_url_path,
      expiresAt: data.expires_at,
      roleToAssign: parseInviteRole(data.role_to_assign),
      status: (data.status ?? "active") as InviteStatus,
      requiresApproval: data.requires_approval ?? false,
      approvalStatus: (data.approval_status ?? "not_required") as InviteApprovalStatus,
      invitedEmail: targetEmail
    };
  } catch (error) {
    if (error instanceof BillingResourceAccessError) {
      return { ok: false, error: error.access.message };
    }

    return { ok: false, error: "Nao foi possivel gerar o convite agora." };
  }
}

function parseInviteRole(value: FormDataEntryValue | null): TeamRole {
  return value === "admin" ? "admin" : "seller";
}
