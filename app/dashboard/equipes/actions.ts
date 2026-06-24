"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  reassignTeamMember,
  deactivateTeamWithMembersForCurrentUser,
  startMemberDeactivationForCurrentUser,
  reactivateMemberForCurrentUser,
  updateTeamForCurrentUser,
  promoteToSupervisorForCurrentUser,
  demoteSupervisorForCurrentUser,
  changeTeamSupervisorForCurrentUser,
  setMemberAdCreationGrantForCurrentUser
} from "@/lib/workspaces/team";
import { getCurrentWorkspaceContext } from "@/lib/workspaces/context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();
const optionalUuidSchema = z.string().uuid().nullable();
const teamNameSchema = z.string().trim().min(1).max(120);

function parseUuid(value: FormDataEntryValue | null) {
  return uuidSchema.safeParse(typeof value === "string" ? value : "");
}

export async function reassignMemberAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id || !context.profile?.id) {
    return { error: "Apenas o gestor pode reorganizar equipes." };
  }

  const parsedProfile = parseUuid(formData.get("profileId"));
  if (!parsedProfile.success) {
    return { error: "Membro não informado." };
  }

  const fromTeamId = optionalUuidSchema.safeParse((formData.get("fromTeamId") as string) || null);
  const toTeamId = optionalUuidSchema.safeParse((formData.get("toTeamId") as string) || null);
  if (!fromTeamId.success || !toTeamId.success) {
    return { error: "Equipe invalida." };
  }

  if (fromTeamId.data === toTeamId.data) {
    return { error: "O membro já pertence a essa equipe." };
  }

  try {
    await reassignTeamMember({
      profileId: parsedProfile.data,
      fromTeamId: fromTeamId.data,
      toTeamId: toTeamId.data,
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

  const parsedTeam = parseUuid(formData.get("teamId"));
  if (!parsedTeam.success) {
    return { error: "Equipe não informada." };
  }

  try {
    await deactivateTeamWithMembersForCurrentUser(parsedTeam.data);
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

  const parsedProfile = parseUuid(formData.get("profileId"));
  if (!parsedProfile.success) {
    return { error: "Membro não informado." };
  }

  try {
    await startMemberDeactivationForCurrentUser(parsedProfile.data);
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

  const parsedProfile = parseUuid(formData.get("profileId"));
  if (!parsedProfile.success) {
    return { error: "Membro não informado." };
  }

  try {
    await reactivateMemberForCurrentUser(parsedProfile.data);
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

  const parsedTeam = parseUuid(formData.get("teamId"));
  const parsedName = teamNameSchema.safeParse(formData.get("name"));
  if (!parsedTeam.success || !parsedName.success) {
    return { error: "Equipe ou nome não informados." };
  }

  try {
    await updateTeamForCurrentUser(parsedTeam.data, { name: parsedName.data });
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

  const parsedProfile = parseUuid(formData.get("profileId"));
  if (!parsedProfile.success) {
    return { error: "Membro não informado." };
  }

  try {
    await promoteToSupervisorForCurrentUser(parsedProfile.data);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao promover membro.";
    return { error: message };
  }
}

export async function setMemberAdCreationGrantAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode liberar a criação de anúncios." };
  }

  const parsedProfile = parseUuid(formData.get("profileId"));
  if (!parsedProfile.success) {
    return { error: "Membro não informado." };
  }

  const enabled = formData.get("enabled") === "true";

  try {
    await setMemberAdCreationGrantForCurrentUser({
      targetProfileId: parsedProfile.data,
      enabled
    });
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar a liberação.";
    return { error: message };
  }
}

export async function demoteSupervisorAction(formData: FormData) {
  const context = await getCurrentWorkspaceContext();

  if (!context.isOwner || !context.workspace?.id) {
    return { error: "Apenas o gestor pode rebaixar supervisores." };
  }

  const parsedProfile = parseUuid(formData.get("profileId"));
  if (!parsedProfile.success) {
    return { error: "Membro não informado." };
  }

  try {
    await demoteSupervisorForCurrentUser(parsedProfile.data);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao rebaixar supervisor.";
    return { error: message };
  }
}

export async function updateWorkspaceNameAction(formData: FormData) {
  const parsedName = teamNameSchema.safeParse(formData.get("workspaceName"));

  if (!parsedName.success) {
    return { ok: false as const, error: "Informe o nome da corretora." };
  }

  const workspaceName = parsedName.data;

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

  const parsedTeam = parseUuid(formData.get("teamId"));
  const parsedSupervisor = parseUuid(formData.get("newSupervisorProfileId"));
  if (!parsedTeam.success || !parsedSupervisor.success) {
    return { error: "Equipe ou novo supervisor não informados." };
  }

  try {
    await changeTeamSupervisorForCurrentUser(parsedTeam.data, parsedSupervisor.data);
    revalidatePath("/dashboard/equipes");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao alterar supervisor.";
    return { error: message };
  }
}
