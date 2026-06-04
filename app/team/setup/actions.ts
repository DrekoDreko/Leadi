"use server";

import { revalidatePath } from "next/cache";
import {
  BillingResourceAccessError,
  assertCurrentResourceAccess
} from "@/lib/billing/subscription-limits.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { InviteApprovalStatus, InviteStatus } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startMemberDeactivationForCurrentUser, TeamAccessError } from "@/lib/workspaces/team";

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
    }
  | {
      ok: false;
      error: string;
    };

type UpdateTeamNameResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

type UpdateMemberRoleResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

type RemoveMemberResult =
  | {
      ok: true;
      result: Awaited<ReturnType<typeof startMemberDeactivationForCurrentUser>>;
    }
  | {
      ok: false;
      error: string;
    };

export async function createInviteAction(formData: FormData): Promise<CreateInviteResult> {
  const roleToAssign = parseInviteRole(formData.get("roleToAssign"));

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      id: "demo-invite",
      invitePath: "/invite/demo",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      roleToAssign,
      status: "active",
      requiresApproval: false,
      approvalStatus: "not_required"
    };
  }

  try {
    await assertCurrentResourceAccess("team_invites");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("create_workspace_invite", { requested_role_to_assign: roleToAssign })
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: "Nao foi possivel gerar o convite agora."
      };
    }

    const { data: inviteRow } = await supabase
      .from("invites")
      .select("id, status, requires_approval, approval_status")
      .eq("token", data.token)
      .maybeSingle();

    revalidatePath("/team/setup");

    return {
      ok: true,
      id: inviteRow?.id ?? data.token,
      invitePath: data.invite_url_path,
      expiresAt: data.expires_at,
      roleToAssign: parseInviteRole(data.role_to_assign),
      status: inviteRow?.status ?? "active",
      requiresApproval: inviteRow?.requires_approval ?? false,
      approvalStatus: inviteRow?.approval_status ?? "not_required"
    };
  } catch (error) {
    if (error instanceof BillingResourceAccessError) {
      return {
        ok: false,
        error: error.access.message
      };
    }

    return {
      ok: false,
      error: "Nao foi possivel gerar o convite agora."
    };
  }
}

export async function updateTeamNameAction(formData: FormData): Promise<UpdateTeamNameResult> {
  const workspaceName = String(formData.get("workspaceName") ?? "").trim();

  if (!workspaceName) {
    return {
      ok: false,
      error: "Informe o nome da corretora."
    };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_workspace_name", {
    workspace_name: workspaceName
  });

  if (error) {
    return {
      ok: false,
      error: "Nao foi possivel atualizar o nome da corretora."
    };
  }

  revalidatePath("/team/setup");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");

  return { ok: true };
}

export async function updateMemberRoleAction(formData: FormData): Promise<UpdateMemberRoleResult> {
  const targetProfileId = String(formData.get("memberProfileId") ?? "").trim();
  const nextRole = parseInviteRole(formData.get("role"));

  if (!targetProfileId) {
    return {
      ok: false,
      error: "Informe o membro que voce quer atualizar."
    };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_workspace_member_role", {
    target_profile_id: targetProfileId,
    next_role: nextRole
  });

  if (error) {
    return {
      ok: false,
      error: "Nao foi possivel atualizar o papel do membro agora."
    };
  }

  revalidatePath("/team/setup");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function removeMemberAction(formData: FormData): Promise<RemoveMemberResult> {
  const targetProfileId = String(formData.get("memberProfileId") ?? "").trim();

  if (!targetProfileId) {
    return {
      ok: false,
      error: "Informe o membro que voce quer remover."
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      result: {
        outcome: "deactivated",
        targetProfileId,
        closedRequestIds: []
      }
    };
  }

  try {
    const result = await startMemberDeactivationForCurrentUser(targetProfileId);

    revalidatePath("/team/setup");
    revalidatePath("/dashboard");

    return {
      ok: true,
      result
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof TeamAccessError
          ? error.message
          : "Nao foi possivel concluir a desativacao do membro agora."
    };
  }
}

function parseInviteRole(value: FormDataEntryValue | null): TeamRole {
  return value === "admin" ? "admin" : "seller";
}
