"use server";

import { revalidatePath } from "next/cache";
import {
  reassignTeamMember,
  deactivateTeamWithMembersForCurrentUser,
  startMemberDeactivationForCurrentUser,
  reactivateMemberForCurrentUser,
  updateTeamForCurrentUser,
  promoteToSupervisorForCurrentUser,
  demoteSupervisorForCurrentUser,
  changeTeamSupervisorForCurrentUser
} from "@/lib/workspaces/team";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function reassignMemberAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id || !context.profile?.id) {
    return { error: "Apenas o gestor pode reorganizar equipes." };
  }

  const profileId = formData.get("profileId") as string;
  const fromTeamId = (formData.get("fromTeamId") as string) || null;
  const toTeamId = (formData.get("toTeamId") as string) || null;

  if (!profileId) {
    return { error: "Membro não informado." };
  }

  if (fromTeamId === toTeamId) {
    return { error: "O membro já pertence a essa equipe." };
  }

  try {
    await reassignTeamMember({
      profileId,
      fromTeamId,
      toTeamId,
      organizationId: context.workspace.id,
      actorProfileId: context.profile.id
    });

    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao reatribuir membro.";
    return { error: message };
  }
}

export async function deactivateTeamAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode desativar equipes." };
  }

  const teamId = formData.get("teamId") as string;
  if (!teamId) {
    return { error: "Equipe não informada." };
  }

  try {
    await deactivateTeamWithMembersForCurrentUser(teamId);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao desativar equipe.";
    return { error: message };
  }
}

export async function deactivateMemberAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode desativar membros." };
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) {
    return { error: "Membro não informado." };
  }

  try {
    await startMemberDeactivationForCurrentUser(profileId);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao desativar membro.";
    return { error: message };
  }
}

export async function reactivateMemberAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode reativar membros." };
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) {
    return { error: "Membro não informado." };
  }

  try {
    await reactivateMemberForCurrentUser(profileId);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao reativar membro.";
    return { error: message };
  }
}

export async function updateTeamNameAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode editar equipes." };
  }

  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  if (!teamId || !name) {
    return { error: "Equipe ou nome não informados." };
  }

  try {
    await updateTeamForCurrentUser(teamId, { name });
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao editar equipe.";
    return { error: message };
  }
}

export async function promoteMemberAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode promover membros." };
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) {
    return { error: "Membro não informado." };
  }

  try {
    await promoteToSupervisorForCurrentUser(profileId);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao promover membro.";
    return { error: message };
  }
}

export async function demoteSupervisorAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode rebaixar supervisores." };
  }

  const profileId = formData.get("profileId") as string;
  if (!profileId) {
    return { error: "Membro não informado." };
  }

  try {
    await demoteSupervisorForCurrentUser(profileId);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao rebaixar supervisor.";
    return { error: message };
  }
}

export async function updateWorkspaceNameAction(formData: FormData) {
  const workspaceName = String(formData.get("workspaceName") ?? "").trim();

  if (!workspaceName) {
    return { ok: false as const, error: "Informe o nome da corretora." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true as const };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_workspace_name", {
    workspace_name: workspaceName
  });

  if (error) {
    return { ok: false as const, error: "Nao foi possivel atualizar o nome da corretora." };
  }

  revalidatePath("/dashboard/equipes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");

  return { ok: true as const };
}

export async function changeTeamSupervisorAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode alterar o supervisor." };
  }

  const teamId = formData.get("teamId") as string;
  const newSupervisorProfileId = formData.get("newSupervisorProfileId") as string;
  if (!teamId || !newSupervisorProfileId) {
    return { error: "Equipe ou novo supervisor não informados." };
  }

  try {
    await changeTeamSupervisorForCurrentUser(teamId, newSupervisorProfileId);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao alterar supervisor.";
    return { error: message };
  }
}
