"use server";

import { revalidatePath } from "next/cache";
import {
  BillingResourceAccessError,
  assertCurrentResourceAccess
} from "@/lib/billing/subscription-limits.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TeamRole = "admin" | "seller";

type CreateInviteResult =
  | {
      ok: true;
      invitePath: string;
      expiresAt: string;
      roleToAssign: TeamRole;
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

type RemoveMemberResult = UpdateMemberRoleResult;

export async function createInviteAction(formData: FormData): Promise<CreateInviteResult> {
  const roleToAssign = parseInviteRole(formData.get("roleToAssign"));

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      invitePath: "/invite/demo",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      roleToAssign
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

    revalidatePath("/team/setup");

    return {
      ok: true,
      invitePath: data.invite_url_path,
      expiresAt: data.expires_at,
      roleToAssign: parseInviteRole(data.role_to_assign)
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
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_workspace_member", {
    target_profile_id: targetProfileId
  });

  if (error) {
    return {
      ok: false,
      error: "Nao foi possivel remover o membro agora."
    };
  }

  revalidatePath("/team/setup");
  revalidatePath("/dashboard");

  return { ok: true };
}

function parseInviteRole(value: FormDataEntryValue | null): TeamRole {
  return value === "admin" ? "admin" : "seller";
}
