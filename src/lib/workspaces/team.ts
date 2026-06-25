import "server-only";

import { recordAuditLog } from "@/lib/audit/audit-log.server";
import {
  createTeamMemberAddedNotification,
  createAdCreationGrantNotification
} from "@/lib/notifications/repository.server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Database,
  InviteApprovalStatus,
  InviteStatus,
  Json
} from "@/lib/supabase/database.types";
import type { WorkspaceContext } from "./context";
import { normalizeWorkspaceRole, type WorkspaceRole } from "./permissions";

type InviteRow = Database["public"]["Tables"]["invites"]["Row"];
type MemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];
type ApprovalRequestRow = Database["public"]["Tables"]["approval_requests"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type TeamMember = {
  id: string;
  profileId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "seller";
  status: string;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
  adCreationEnabled: boolean;
};

export type TeamInvite = {
  id: string;
  token: string;
  teamId: string | null;
  teamName: string | null;
  invitePath: string;
  roleToAssign: "admin" | "seller";
  status: InviteStatus;
  requiresApproval: boolean;
  approvalStatus: InviteApprovalStatus;
  approvedByUserId: string | null;
  invitedEmail: string | null;
  requestedByUserId: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  createdAt: string;
  expiresAt: string;
};

export type TeamSetupTeam = WorkspaceTeam & {
  activeMembers: number;
  pendingMembers: number;
};

export type TeamSetupData = {
  workspaceName: string;
  members: TeamMember[];
  deactivatedMembers: TeamMember[];
  invites: TeamInvite[];
  deactivationRequests: TeamMemberDeactivationRequest[];
  teams: TeamSetupTeam[];
  initialSelectedTeamId: string | null;
  isRestrictedToSingleTeam: boolean;
};

export type WorkspaceTeam = {
  id: string;
  organizationId: string;
  name: string;
  createdByProfileId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InviteReviewDecision = Extract<InviteApprovalStatus, "approved" | "rejected">;
export type MemberDeactivationReviewDecision = Extract<
  ApprovalRequestRow["status"],
  "approved" | "rejected"
>;

export type TeamMemberDeactivationRequest = {
  id: string;
  status: ApprovalRequestRow["status"];
  teamId: string | null;
  teamName: string | null;
  requestedByProfileId: string;
  requestedByName: string;
  targetProfileId: string;
  targetName: string;
  targetEmail: string;
  targetRole: "admin" | "seller";
  title: string;
  description: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type MemberDeactivationMutationResult = {
  outcome: "requested" | "deactivated" | "approved" | "rejected";
  targetProfileId: string;
  closedRequestIds: string[];
  request?: TeamMemberDeactivationRequest;
};

type TeamActorProfile = Pick<ProfileRow, "id" | "organization_id" | "role" | "full_name" | "email">;

type TeamActor =
  | {
      mode: "not-configured";
      role: "owner";
      profile: TeamActorProfile;
    }
  | {
      mode: "supabase";
      role: WorkspaceRole;
      profile: TeamActorProfile;
      supabase: ServerClient;
    };

type MemberDeactivationExecutionResult = {
  teamId: string | null;
  targetName: string;
  targetRole: "admin" | "seller";
  unassignedLeadCount: number;
  closedRequestIds: string[];
};

export class TeamAccessError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TeamAccessError";
    this.status = status;
  }
}

export async function listTeamsForCurrentUser(): Promise<WorkspaceTeam[]> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);

  if (actor.mode === "not-configured") {
    return getMockTeamStore().map(mapWorkspaceTeam);
  }

  const { data, error } = await actor.supabase
    .from("teams")
    .select("*")
    .eq("organization_id", actor.profile.organization_id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapWorkspaceTeam);
}

export async function createTeamForCurrentUser(input: {
  name: string;
}): Promise<WorkspaceTeam> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const name = normalizeTeamName(input.name);

  if (actor.mode === "not-configured") {
    const team: TeamRow = {
      id: crypto.randomUUID(),
      organization_id: actor.profile.organization_id,
      name,
      created_by_profile_id: actor.profile.id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    getMockTeamStore().push(team);
    return mapWorkspaceTeam(team);
  }

  const { data, error } = await actor.supabase
    .from("teams")
    .insert({
      organization_id: actor.profile.organization_id,
      name,
      created_by_profile_id: actor.profile.id
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel criar a equipe.");
  }

  return mapWorkspaceTeam(data);
}

export async function updateTeamForCurrentUser(
  teamId: string,
  input: {
    name: string;
  }
): Promise<WorkspaceTeam> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedTeamId = normalizeTeamId(teamId);
  const name = normalizeTeamName(input.name);

  if (actor.mode === "not-configured") {
    const team = getMockTeamStore().find((item) => item.id === normalizedTeamId);

    if (!team || team.organization_id !== actor.profile.organization_id) {
      throw new TeamAccessError(404, "Equipe nao encontrada.");
    }

    team.name = name;
    team.updated_at = new Date().toISOString();
    return mapWorkspaceTeam(team);
  }

  const existingTeam = await getTeamRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedTeamId
  );

  const { data, error } = await actor.supabase
    .from("teams")
    .update({
      name
    })
    .eq("id", existingTeam.id)
    .eq("organization_id", actor.profile.organization_id)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel atualizar a equipe.");
  }

  return mapWorkspaceTeam(data);
}

export async function deactivateTeamForCurrentUser(teamId: string): Promise<WorkspaceTeam> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedTeamId = normalizeTeamId(teamId);

  if (actor.mode === "not-configured") {
    const team = getMockTeamStore().find((item) => item.id === normalizedTeamId);

    if (!team || team.organization_id !== actor.profile.organization_id) {
      throw new TeamAccessError(404, "Equipe nao encontrada.");
    }

    if (!team.is_active) {
      return mapWorkspaceTeam(team);
    }

    team.is_active = false;
    team.updated_at = new Date().toISOString();
    return mapWorkspaceTeam(team);
  }

  const existingTeam = await getTeamRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedTeamId
  );

  if (!existingTeam.is_active) {
    return mapWorkspaceTeam(existingTeam);
  }

  const { data, error } = await actor.supabase
    .from("teams")
    .update({
      is_active: false
    })
    .eq("id", existingTeam.id)
    .eq("organization_id", actor.profile.organization_id)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel desativar a equipe.");
  }

  return mapWorkspaceTeam(data);
}

export async function getTeamSetupData(context: WorkspaceContext): Promise<TeamSetupData> {
  if (!isSupabaseConfigured() || !context.workspace) {
    const demoTeams = getMockTeamStore().map((team) => ({
      ...mapWorkspaceTeam(team),
      activeMembers: 1,
      pendingMembers: 0
    }));

    return {
      workspaceName: context.workspaceName,
      members: [
        {
          id: "demo-member",
          profileId: "demo-profile",
          name: context.displayName,
          email: "demo@leadi.example",
          role: "owner",
          status: "active",
          createdAt: new Date().toISOString(),
          teamId: demoTeams[0]?.id ?? null,
          teamName: demoTeams[0]?.name ?? null,
          adCreationEnabled: false
        }
      ],
      deactivatedMembers: [],
      invites: [],
      deactivationRequests: [],
      teams: demoTeams,
      initialSelectedTeamId: demoTeams[0]?.id ?? null,
      isRestrictedToSingleTeam: false
    };
  }

  const supabase = await createSupabaseServerClient();
  const scopedTeamRows = await listScopedTeamRowsForContext(supabase, context);
  const scopedTeamIds = scopedTeamRows.map((team) => team.id);
  const scopedMembershipRows = await listScopedTeamMembershipRows(
    supabase,
    context.workspace.id,
    scopedTeamIds
  );
  const teams = buildTeamSetupTeams(scopedTeamRows, scopedMembershipRows);
  const activeRows = scopedMembershipRows.filter((member) => member.status !== "inactive");
  const inactiveRows = scopedMembershipRows.filter((member) => member.status === "inactive");
  const assignedMembers = await mapTeamMembers(
    supabase,
    context.workspace.id,
    activeRows,
    scopedTeamRows
  );
  // Convidados recem-aprovados entram em workspace_members mas ainda nao tem
  // equipe (sem linha em team_members). So o gestor distribui essas pessoas,
  // entao listamos os "sem equipe" apenas para owner — eles aparecem na coluna
  // "Sem Equipe" do organizador.
  const unassignedMembers =
    context.role === "owner"
      ? await listUnassignedWorkspaceMembers(supabase, context.workspace.id, assignedMembers)
      : [];
  const members = [...assignedMembers, ...unassignedMembers];
  const deactivatedMembers = await mapTeamMembers(
    supabase,
    context.workspace.id,
    inactiveRows,
    scopedTeamRows,
    { includeRemovedWorkspaceMembers: true }
  );
  const invites = await listTeamInvitesForCurrentUser(
    supabase,
    context.workspace.id,
    context.role,
    scopedTeamRows
  );
  const deactivationRequests = await listMemberDeactivationRequestsForCurrentUser(
    supabase,
    context.workspace.id,
    context.role === "owner" ? undefined : scopedTeamIds
  );

  return {
    workspaceName: context.workspace.name,
    members,
    deactivatedMembers,
    invites,
    deactivationRequests,
    teams,
    initialSelectedTeamId: teams[0]?.id ?? null,
    isRestrictedToSingleTeam: context.role !== "owner"
  };
}

export async function reviewInviteForCurrentUser(
  inviteId: string,
  decision: InviteReviewDecision
): Promise<TeamInvite> {
  const actor = await getCurrentTeamActor();

  if (actor.role !== "owner") {
    throw new TeamAccessError(403, "Somente owners podem aprovar convites.");
  }

  if (actor.mode === "not-configured") {
    throw new TeamAccessError(404, "Convite nao encontrado.");
  }

  if (!hasSupabaseServiceRole()) {
    throw new TeamAccessError(503, "A aprovacao de convites nao esta disponivel agora.");
  }

  const normalizedInviteId = normalizeInviteId(inviteId);
  const normalizedDecision = normalizeInviteDecision(decision);
  const invite = await getInviteRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedInviteId
  );

  if (invite.expires_at <= new Date().toISOString()) {
    await expireInviteIfNeeded(invite, actor.profile.organization_id);
    throw new TeamAccessError(400, "Este convite ja expirou.");
  }

  if (invite.status !== "active") {
    throw new TeamAccessError(400, getUnavailableInviteMessage(invite.status));
  }

  if (!invite.requires_approval || invite.approval_status === "not_required") {
    throw new TeamAccessError(400, "Este convite nao precisa de aprovacao.");
  }

  if (invite.approval_status !== "pending") {
    throw new TeamAccessError(400, "Este convite ja foi revisado.");
  }

  if (!invite.requested_by_user_id) {
    throw new TeamAccessError(
      400,
      "Aguarde o convidado criar a conta antes de aprovar este convite."
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: approvedInvite, error } = await admin
    .from("invites")
    .update({
      approval_status: normalizedDecision,
      approved_by_user_id: actor.profile.id
    })
    .eq("id", invite.id)
    .eq("workspace_id", actor.profile.organization_id)
    .select("*")
    .single();

  if (error || !approvedInvite) {
    throw error ?? new Error("Nao foi possivel revisar o convite agora.");
  }

  // Aprovar ja matricula o convidado na organizacao (entra sem equipe, para o
  // gestor distribuir). Antes, o convidado precisava revisitar o link para
  // aceitar — se nao voltasse, ficava aprovado mas fora da org, invisivel aqui.
  let updatedInvite = approvedInvite;
  if (normalizedDecision === "approved") {
    const { error: enrollError } = await admin.rpc("enroll_invited_member", {
      p_invite_id: approvedInvite.id
    });

    if (enrollError) {
      throw enrollError;
    }

    const { data: enrolledInvite } = await admin
      .from("invites")
      .select("*")
      .eq("id", approvedInvite.id)
      .single();

    if (enrolledInvite) {
      updatedInvite = enrolledInvite;
    }
  }

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: updatedInvite.team_id,
    action: normalizedDecision === "approved" ? "invite.approve" : "invite.reject",
    targetType: "invite",
    targetId: updatedInvite.id,
    status: "success",
    metadata: {
      previousApprovalStatus: invite.approval_status,
      nextApprovalStatus: updatedInvite.approval_status,
      enrolled: normalizedDecision === "approved" && updatedInvite.status === "used",
      roleToAssign: updatedInvite.role_to_assign,
      tokenSuffix: updatedInvite.token.slice(-6)
    }
  });

  // Mantem nome/email do convidado no retorno para a UI continuar exibindo.
  let claimant: { name: string | null; email: string | null } | null = null;
  if (updatedInvite.requested_by_user_id) {
    const { data: claimantRow } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", updatedInvite.requested_by_user_id)
      .maybeSingle();

    if (claimantRow) {
      claimant = { name: claimantRow.full_name, email: claimantRow.email };
    }
  }

  return mapInvite(updatedInvite, null, claimant);
}

export async function startMemberDeactivationForCurrentUser(
  targetProfileId: string
): Promise<MemberDeactivationMutationResult> {
  const actor = await getCurrentTeamActor();
  const normalizedTargetProfileId = normalizeTargetProfileId(targetProfileId);

  if (actor.role === "owner") {
    if (actor.mode === "not-configured") {
      return {
        outcome: "deactivated",
        targetProfileId: normalizedTargetProfileId,
        closedRequestIds: []
      };
    }

    const result = await performMemberDeactivation(actor, normalizedTargetProfileId);

    await recordAuditLog({
      organizationId: actor.profile.organization_id,
      actorProfileId: actor.profile.id,
      actorRole: actor.profile.role,
      teamId: result.teamId,
      action: "member.deactivate.direct",
      targetType: "profile",
      targetId: normalizedTargetProfileId,
      status: "success",
      metadata: {
        targetName: result.targetName,
        targetRole: result.targetRole,
        unassignedLeadCount: result.unassignedLeadCount,
        closedRequestIds: result.closedRequestIds
      }
    });

    return {
      outcome: "deactivated",
      targetProfileId: normalizedTargetProfileId,
      closedRequestIds: result.closedRequestIds
    };
  }

  if (actor.role !== "admin") {
    throw new TeamAccessError(403, "Somente o gestor ou supervisor pode desativar membros.");
  }

  const actorTeamMembership = await getActiveTeamMembershipForProfile(
    actor.supabase,
    actor.profile.organization_id,
    actor.profile.id
  );

  if (!actorTeamMembership || actorTeamMembership.role !== "supervisor") {
    throw new TeamAccessError(403, "O supervisor precisa estar vinculado a uma equipe ativa.");
  }

  const targetProfile = await getProfileRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedTargetProfileId
  );
  const targetTeamMembership = await getActiveTeamMembershipForProfile(
    actor.supabase,
    actor.profile.organization_id,
    targetProfile.id
  );
  const targetWorkspaceMember = await getWorkspaceMemberRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    targetProfile.id
  );

  assertSupervisorCanRequestMemberDeactivation(
    actor.profile.id,
    targetProfile,
    actorTeamMembership,
    targetTeamMembership,
    targetWorkspaceMember
  );

  const pendingRequests = await listPendingMemberRemovalRequests(
    actor.supabase,
    actor.profile.organization_id
  );
  const duplicateRequest = pendingRequests.find(
    (request) => getMemberRemovalTargetProfileId(request) === targetProfile.id
  );

  if (duplicateRequest) {
    throw new TeamAccessError(409, "Ja existe uma solicitacao pendente para este membro.");
  }

  const team = await getTeamRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    actorTeamMembership.team_id
  );
  const title = `Desativar ${getProfileName(targetProfile)}`;
  const description = `Solicitacao de desativacao do consultor ${getProfileName(
    targetProfile
  )} para revisao do gestor.`;

  const { data: insertedRequest, error } = await actor.supabase
    .from("approval_requests")
    .insert({
      organization_id: actor.profile.organization_id,
      team_id: actorTeamMembership.team_id,
      request_type: "member_remove",
      status: "pending",
      requested_by_profile_id: actor.profile.id,
      title,
      description,
      metadata: {
        targetProfileId: targetProfile.id,
        targetName: getProfileName(targetProfile),
        targetEmail: targetProfile.email,
        targetRole: "seller",
        requestedByName: getActorDisplayName(actor.profile),
        teamName: team.name
      }
    })
    .select("*")
    .single();

  if (error || !insertedRequest) {
    throw error ?? new Error("Nao foi possivel solicitar a desativacao agora.");
  }

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: actorTeamMembership.team_id,
    action: "member.deactivate.request",
    targetType: "approval_request",
    targetId: insertedRequest.id,
    status: "success",
    metadata: {
      targetProfileId: targetProfile.id,
      targetName: getProfileName(targetProfile),
      targetRole: targetProfile.role
    }
  });

  const [request] = await mapMemberDeactivationRequests(actor.supabase, [insertedRequest]);

  return {
    outcome: "requested",
    targetProfileId: normalizedTargetProfileId,
    closedRequestIds: [],
    request
  };
}

export async function reviewMemberDeactivationRequestForCurrentUser(
  requestId: string,
  decision: MemberDeactivationReviewDecision
): Promise<MemberDeactivationMutationResult> {
  const actor = await getCurrentTeamActor();

  if (actor.role !== "owner") {
    throw new TeamAccessError(403, "Somente owners podem aprovar desativacoes.");
  }

  if (actor.mode === "not-configured") {
    return {
      outcome: decision,
      targetProfileId: "demo-profile",
      closedRequestIds: [requestId],
      request: {
        id: requestId,
        status: decision,
        teamId: "demo-team",
        teamName: "Equipe Demo",
        requestedByProfileId: "demo-admin-profile",
        requestedByName: "Supervisor demo",
        targetProfileId: "demo-profile",
        targetName: "Consultor demo",
        targetEmail: "consultor@leadi.example",
        targetRole: "seller",
        title: "Desativar Consultor demo",
        description: "Solicitacao de desativacao enviada ao gestor.",
        createdAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString()
      }
    };
  }

  const normalizedRequestId = normalizeApprovalRequestId(requestId);
  const normalizedDecision = normalizeMemberDeactivationDecision(decision);
  const existingRequest = await getApprovalRequestRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedRequestId
  );

  if (existingRequest.request_type !== "member_remove") {
    throw new TeamAccessError(400, "Esta solicitacao nao pertence a desativacao de membros.");
  }

  if (existingRequest.status !== "pending") {
    throw new TeamAccessError(400, "Esta solicitacao ja foi revisada.");
  }

  const targetProfileId = getMemberRemovalTargetProfileId(existingRequest);

  if (!targetProfileId) {
    throw new TeamAccessError(400, "A solicitacao de desativacao esta sem o membro de destino.");
  }

  if (normalizedDecision === "rejected") {
    const reviewedRequest = await updateApprovalRequestStatus(
      actor.supabase,
      existingRequest.id,
      actor.profile.id,
      "rejected"
    );
    const [request] = await mapMemberDeactivationRequests(actor.supabase, [reviewedRequest]);

    await recordAuditLog({
      organizationId: actor.profile.organization_id,
      actorProfileId: actor.profile.id,
      actorRole: actor.profile.role,
      teamId: reviewedRequest.team_id,
      action: "member.deactivate.reject",
      targetType: "approval_request",
      targetId: reviewedRequest.id,
      status: "success",
      metadata: {
        targetProfileId,
        targetName: request?.targetName ?? null
      }
    });

    return {
      outcome: "rejected",
      targetProfileId,
      closedRequestIds: [reviewedRequest.id],
      request
    };
  }

  const result = await performMemberDeactivation(actor, targetProfileId);
  const reviewedRequest = await getApprovalRequestRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    existingRequest.id
  );
  const [request] = await mapMemberDeactivationRequests(actor.supabase, [reviewedRequest]);

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: result.teamId,
    action: "member.deactivate.approve",
    targetType: "approval_request",
    targetId: existingRequest.id,
    status: "success",
    metadata: {
      targetProfileId,
      targetName: result.targetName,
      targetRole: result.targetRole,
      unassignedLeadCount: result.unassignedLeadCount,
      closedRequestIds: result.closedRequestIds
    }
  });

  return {
    outcome: "approved",
    targetProfileId,
    closedRequestIds: result.closedRequestIds,
    request
  };
}

async function mapTeamMembers(
  supabase: ServerClient,
  organizationId: string,
  memberRows: TeamMemberRow[],
  teamRows: TeamRow[],
  options?: { includeRemovedWorkspaceMembers?: boolean }
): Promise<TeamMember[]> {
  if (memberRows.length === 0) {
    return [];
  }

  const profileIds = [...new Set(memberRows.map((member) => member.profile_id))];
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, email, ad_creation_enabled")
    .in("id", profileIds);
  let workspaceMembersQuery = supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", organizationId)
    .in("user_id", profileIds);
  if (!options?.includeRemovedWorkspaceMembers) {
    workspaceMembersQuery = workspaceMembersQuery.neq("status", "removed");
  }
  const { data: workspaceMemberRows } = await workspaceMembersQuery;

  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.id, profile]));
  const workspaceMembersByProfileId = new Map(
    (workspaceMemberRows ?? []).map((member) => [member.user_id, member])
  );
  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const roleRank: Record<TeamMember["role"], number> = {
    owner: 0,
    admin: 1,
    seller: 2
  };

  return [...memberRows]
    .sort((left, right) => {
      const leftTeamName = teamsById.get(left.team_id)?.name ?? "";
      const rightTeamName = teamsById.get(right.team_id)?.name ?? "";

      if (leftTeamName !== rightTeamName) {
        return leftTeamName.localeCompare(rightTeamName, "pt-BR");
      }

      if (left.status !== right.status) {
        return left.status === "active" ? -1 : 1;
      }

      const leftRole = getWorkspaceRoleFromTeamMember(
        workspaceMembersByProfileId.get(left.profile_id),
        left.role
      );
      const rightRole = getWorkspaceRoleFromTeamMember(
        workspaceMembersByProfileId.get(right.profile_id),
        right.role
      );

      if (roleRank[leftRole] !== roleRank[rightRole]) {
        return roleRank[leftRole] - roleRank[rightRole];
      }

      const leftName = getProfileName(profilesById.get(left.profile_id));
      const rightName = getProfileName(profilesById.get(right.profile_id));

      return leftName.localeCompare(rightName, "pt-BR");
    })
    .map((member) => {
      const profile = profilesById.get(member.profile_id);
      const workspaceMember = workspaceMembersByProfileId.get(member.profile_id);

      return {
        id: member.id,
        profileId: member.profile_id,
        name: getProfileName(profile),
        email: profile?.email ?? "sem-email@leadi.example",
        role: getWorkspaceRoleFromTeamMember(workspaceMember, member.role),
        status: member.status,
        createdAt: member.created_at,
        teamId: member.team_id,
        teamName: teamsById.get(member.team_id)?.name ?? null,
        adCreationEnabled: Boolean(profile?.ad_creation_enabled)
      };
    });
}

// Membros que ja entraram na organizacao (workspace_members ativo) mas ainda
// nao foram alocados em nenhuma equipe — tipicamente convidados recem-aprovados.
// Sao expostos com teamId null para cair na coluna "Sem Equipe" do organizador.
async function listUnassignedWorkspaceMembers(
  supabase: ServerClient,
  organizationId: string,
  assignedMembers: TeamMember[]
): Promise<TeamMember[]> {
  const assignedProfileIds = new Set(assignedMembers.map((member) => member.profileId));

  const { data: workspaceMemberRows, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", organizationId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  const candidates = (workspaceMemberRows ?? []).filter(
    (member) =>
      !assignedProfileIds.has(member.user_id) && normalizeWorkspaceRole(member.role) !== "owner"
  );

  if (candidates.length === 0) {
    return [];
  }

  const profileIds = candidates.map((member) => member.user_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, full_name, email, ad_creation_enabled")
    .in("id", profileIds);
  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.id, profile]));

  return candidates.map((member) => {
    const profile = profilesById.get(member.user_id);

    return {
      id: `unassigned-${member.user_id}`,
      profileId: member.user_id,
      name: getProfileName(profile),
      email: profile?.email ?? "sem-email@leadi.example",
      role: normalizeWorkspaceRole(member.role),
      status: "active",
      createdAt: member.created_at,
      teamId: null,
      teamName: null,
      adCreationEnabled: Boolean(profile?.ad_creation_enabled)
    };
  });
}

function getProfileName(profile?: Pick<ProfileRow, "full_name" | "email"> | null) {
  if (!profile) {
    return "Vendedor convidado";
  }

  return profile.full_name ?? profile.email.split("@")[0] ?? "Vendedor";
}

function mapInvite(
  invite: InviteRow,
  teamName: string | null = null,
  claimant: { name: string | null; email: string | null } | null = null
): TeamInvite {
  return {
    id: invite.id,
    token: invite.token,
    teamId: invite.team_id,
    teamName,
    invitePath: `/invite/${invite.token}`,
    roleToAssign: normalizeWorkspaceRole(invite.role_to_assign) === "admin" ? "admin" : "seller",
    status: invite.status,
    requiresApproval: invite.requires_approval,
    approvalStatus: invite.approval_status,
    approvedByUserId: invite.approved_by_user_id,
    invitedEmail: invite.invited_email ?? null,
    requestedByUserId: invite.requested_by_user_id ?? null,
    requestedByName: claimant?.name ?? null,
    requestedByEmail: claimant?.email ?? null,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at
  };
}

async function listMemberDeactivationRequestsForCurrentUser(
  supabase: ServerClient,
  organizationId: string,
  teamIds?: string[]
) {
  if (teamIds && teamIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("approval_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("request_type", "member_remove")
    .order("created_at", { ascending: false })
    .limit(8);

  if (teamIds && teamIds.length > 0) {
    query = query.in("team_id", teamIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return mapMemberDeactivationRequests(supabase, data ?? []);
}

async function mapMemberDeactivationRequests(
  supabase: ServerClient,
  requestRows: ApprovalRequestRow[]
): Promise<TeamMemberDeactivationRequest[]> {
  if (requestRows.length === 0) {
    return [];
  }

  const targetProfileIds = requestRows
    .map((request) => getMemberRemovalTargetProfileId(request))
    .filter((value): value is string => Boolean(value));
  const requestedByProfileIds = requestRows.map((request) => request.requested_by_profile_id);
  const teamIds = requestRows
    .map((request) => request.team_id)
    .filter((value): value is string => Boolean(value));
  const profileIds = [...new Set([...targetProfileIds, ...requestedByProfileIds])];
  const uniqueTeamIds = [...new Set(teamIds)];

  let profileRows: Array<Pick<ProfileRow, "id" | "full_name" | "email" | "role">> = [];
  let teamRows: Array<Pick<TeamRow, "id" | "name">> = [];

  if (profileIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", profileIds);

    if (error) {
      throw error;
    }

    profileRows = data ?? [];
  }

  if (uniqueTeamIds.length > 0) {
    const { data, error } = await supabase.from("teams").select("id, name").in("id", uniqueTeamIds);

    if (error) {
      throw error;
    }

    teamRows = data ?? [];
  }

  const profilesById = new Map((profileRows ?? []).map((profile) => [profile.id, profile]));
  const teamsById = new Map((teamRows ?? []).map((team) => [team.id, team]));

  return [...requestRows]
    .sort((left, right) => Number(right.status === "pending") - Number(left.status === "pending"))
    .map((request) => {
      const targetProfileId = getMemberRemovalTargetProfileId(request) ?? "";
      const targetProfile = profilesById.get(targetProfileId);
      const requestedByProfile = profilesById.get(request.requested_by_profile_id);
      const targetName =
        getMetadataString(request.metadata, "targetName") ?? getProfileName(targetProfile);
      const targetEmail =
        getMetadataString(request.metadata, "targetEmail") ??
        targetProfile?.email ??
        "sem-email@leadi.example";
      const requestedByName =
        getMetadataString(request.metadata, "requestedByName") ??
        getProfileName(requestedByProfile);

      return {
        id: request.id,
        status: request.status,
        teamId: request.team_id,
        teamName:
          getMetadataString(request.metadata, "teamName") ?? teamsById.get(request.team_id ?? "")?.name ?? null,
        requestedByProfileId: request.requested_by_profile_id,
        requestedByName,
        targetProfileId,
        targetName,
        targetEmail,
        targetRole: normalizeDeactivationTargetRole(
          getMetadataString(request.metadata, "targetRole") ?? targetProfile?.role ?? "seller"
        ),
        title: request.title,
        description: request.description,
        createdAt: request.created_at,
        reviewedAt: request.reviewed_at
      };
    });
}

async function performMemberDeactivation(
  actor: Extract<TeamActor, { mode: "supabase" }>,
  targetProfileId: string
): Promise<MemberDeactivationExecutionResult> {
  const targetProfile = await getProfileRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    targetProfileId
  );
  const targetWorkspaceMember = await getWorkspaceMemberRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    targetProfile.id
  );
  const targetTeamMembership = await getActiveTeamMembershipForProfile(
    actor.supabase,
    actor.profile.organization_id,
    targetProfile.id
  );

  assertOwnerCanDeactivateMember(actor.profile.id, targetProfile, targetWorkspaceMember);

  const unassignedLeadCount = await countOwnedLeads(
    actor.supabase,
    actor.profile.organization_id,
    targetProfile.id
  );
  await clearLeadOwnership(actor.supabase, actor.profile.organization_id, targetProfile.id);
  await markTeamMembershipInactive(actor.supabase, actor.profile.organization_id, targetProfile.id);
  await removeWorkspaceMember(actor.supabase, targetProfile.id);

  const closedRequestIds = await closePendingMemberRemovalRequests(
    actor.supabase,
    actor.profile.organization_id,
    targetProfile.id,
    actor.profile.id
  );

  return {
    teamId: targetTeamMembership?.team_id ?? null,
    targetName: getProfileName(targetProfile),
    targetRole: normalizeDeactivationTargetRole(targetProfile.role),
    unassignedLeadCount,
    closedRequestIds
  };
}

async function countOwnedLeads(
  supabase: ServerClient,
  organizationId: string,
  targetProfileId: string
) {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("owner_profile_id", targetProfileId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function clearLeadOwnership(
  supabase: ServerClient,
  organizationId: string,
  targetProfileId: string
) {
  const { error } = await supabase
    .from("leads")
    .update({
      owner_profile_id: null
    })
    .eq("organization_id", organizationId)
    .eq("owner_profile_id", targetProfileId);

  if (error) {
    throw error;
  }
}

async function markTeamMembershipInactive(
  supabase: ServerClient,
  organizationId: string,
  targetProfileId: string
) {
  const { error } = await supabase
    .from("team_members")
    .update({
      status: "inactive"
    })
    .eq("organization_id", organizationId)
    .eq("profile_id", targetProfileId)
    .neq("status", "inactive");

  if (error) {
    throw error;
  }
}

async function removeWorkspaceMember(supabase: ServerClient, targetProfileId: string) {
  const { error } = await supabase.rpc("remove_workspace_member", {
    target_profile_id: targetProfileId
  });

  if (error) {
    throw new TeamAccessError(500, "Nao foi possivel concluir a desativacao do membro.");
  }
}

async function listPendingMemberRemovalRequests(
  supabase: ServerClient,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("request_type", "member_remove")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function closePendingMemberRemovalRequests(
  supabase: ServerClient,
  organizationId: string,
  targetProfileId: string,
  reviewedByProfileId: string
) {
  const pendingRequests = await listPendingMemberRemovalRequests(supabase, organizationId);
  const matchingRequestIds = pendingRequests
    .filter((request) => getMemberRemovalTargetProfileId(request) === targetProfileId)
    .map((request) => request.id);

  if (matchingRequestIds.length === 0) {
    return [];
  }

  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: "approved",
      reviewed_by_profile_id: reviewedByProfileId,
      reviewed_at: new Date().toISOString()
    })
    .in("id", matchingRequestIds);

  if (error) {
    throw error;
  }

  return matchingRequestIds;
}

async function updateApprovalRequestStatus(
  supabase: ServerClient,
  requestId: string,
  reviewedByProfileId: string,
  status: "approved" | "rejected"
) {
  const { data, error } = await supabase
    .from("approval_requests")
    .update({
      status,
      reviewed_by_profile_id: reviewedByProfileId,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel revisar a solicitacao agora.");
  }

  return data;
}

async function getApprovalRequestRowForOrganization(
  supabase: ServerClient,
  organizationId: string,
  requestId: string
) {
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new TeamAccessError(404, "Solicitacao de desativacao nao encontrada.");
  }

  return data;
}

async function getProfileRowForOrganization(
  supabase: ServerClient,
  organizationId: string,
  profileId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new TeamAccessError(404, "Membro nao encontrado.");
  }

  return data;
}

async function getWorkspaceMemberRowForOrganization(
  supabase: ServerClient,
  organizationId: string,
  profileId: string
) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", organizationId)
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new TeamAccessError(404, "Membro nao encontrado.");
  }

  return data;
}

async function getActiveTeamMembershipForProfile(
  supabase: ServerClient,
  organizationId: string,
  profileId: string
) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function listScopedTeamRowsForContext(
  supabase: ServerClient,
  context: WorkspaceContext
) {
  if (context.role === "owner") {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("organization_id", context.workspace!.id)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  if (!context.profile) {
    return [];
  }

  const membership = await getActiveTeamMembershipForProfile(
    supabase,
    context.workspace!.id,
    context.profile.id
  );

  if (!membership) {
    return [];
  }

  const team = await getTeamRowForOrganization(supabase, context.workspace!.id, membership.team_id);

  return [team];
}

async function listScopedTeamMembershipRows(
  supabase: ServerClient,
  organizationId: string,
  teamIds: string[]
) {
  if (teamIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("organization_id", organizationId)
    .in("team_id", teamIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function listTeamInvitesForCurrentUser(
  supabase: ServerClient,
  organizationId: string,
  role: WorkspaceRole,
  teamRows: TeamRow[]
) {
  const teamsById = new Map(teamRows.map((team) => [team.id, team.name]));
  let query = supabase
    .from("invites")
    .select("*")
    .eq("workspace_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (role !== "owner") {
    if (teamRows.length === 0) {
      return [];
    }

    query = query.eq("team_id", teamRows[0].id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const inviteRows = data ?? [];
  const claimantIds = [
    ...new Set(
      inviteRows
        .map((invite) => invite.requested_by_user_id)
        .filter((value): value is string => Boolean(value))
    )
  ];

  let claimantsById = new Map<string, Pick<ProfileRow, "id" | "full_name" | "email">>();
  if (claimantIds.length > 0) {
    // O reivindicante ainda nao e membro da org (convite pendente), entao o RLS
    // do owner nao enxerga o perfil dele. Resolvemos nome/email pelo client admin.
    // Escopo seguro: claimantIds vem apenas de convites desta workspace.
    const { data: claimantRows } = hasSupabaseServiceRole()
      ? await createSupabaseAdminClient()
          .from("profiles")
          .select("id, full_name, email")
          .in("id", claimantIds)
      : await supabase.from("profiles").select("id, full_name, email").in("id", claimantIds);
    claimantsById = new Map((claimantRows ?? []).map((profile) => [profile.id, profile]));
  }

  return inviteRows.map((invite) => {
    const claimant = invite.requested_by_user_id
      ? claimantsById.get(invite.requested_by_user_id) ?? null
      : null;

    return mapInvite(
      invite,
      teamsById.get(invite.team_id ?? "") ?? null,
      claimant ? { name: claimant.full_name, email: claimant.email } : null
    );
  });
}

function buildTeamSetupTeams(teamRows: TeamRow[], membershipRows: TeamMemberRow[]): TeamSetupTeam[] {
  const countsByTeamId = new Map<string, { activeMembers: number; pendingMembers: number }>();

  for (const membership of membershipRows) {
    const current = countsByTeamId.get(membership.team_id) ?? {
      activeMembers: 0,
      pendingMembers: 0
    };

    if (membership.status === "active") {
      current.activeMembers += 1;
    }

    if (membership.status === "pending_approval") {
      current.pendingMembers += 1;
    }

    countsByTeamId.set(membership.team_id, current);
  }

  return teamRows.map((team) => {
    const counts = countsByTeamId.get(team.id) ?? {
      activeMembers: 0,
      pendingMembers: 0
    };

    return {
      ...mapWorkspaceTeam(team),
      activeMembers: counts.activeMembers,
      pendingMembers: counts.pendingMembers
    };
  });
}

function getWorkspaceRoleFromTeamMember(
  workspaceMember: Pick<MemberRow, "role"> | undefined,
  teamRole: TeamMemberRow["role"]
): TeamMember["role"] {
  if (workspaceMember) {
    return normalizeWorkspaceRole(workspaceMember.role);
  }

  return teamRole === "supervisor" ? "admin" : "seller";
}

function assertOwnerCanDeactivateMember(
  actorProfileId: string,
  targetProfile: ProfileRow,
  workspaceMember: MemberRow
) {
  if (targetProfile.id === actorProfileId) {
    throw new TeamAccessError(400, "Nao e possivel desativar o proprio usuario.");
  }

  if (targetProfile.role === "owner") {
    throw new TeamAccessError(403, "Nao e possivel desativar o gestor da organizacao.");
  }

  if (workspaceMember.status !== "active") {
    throw new TeamAccessError(400, "Este membro ja nao esta ativo na equipe.");
  }
}

function assertSupervisorCanRequestMemberDeactivation(
  actorProfileId: string,
  targetProfile: ProfileRow,
  actorTeamMembership: TeamMemberRow,
  targetTeamMembership: TeamMemberRow | null,
  workspaceMember: MemberRow
) {
  if (targetProfile.id === actorProfileId) {
    throw new TeamAccessError(400, "Nao e possivel solicitar a propria desativacao.");
  }

  if (targetProfile.role !== "seller") {
    throw new TeamAccessError(403, "Supervisores so podem solicitar desativacao de consultores.");
  }

  if (!targetTeamMembership || targetTeamMembership.role !== "consultant") {
    throw new TeamAccessError(
      403,
      "Supervisores so podem solicitar desativacao de consultores da propria equipe."
    );
  }

  if (targetTeamMembership.team_id !== actorTeamMembership.team_id) {
    throw new TeamAccessError(
      403,
      "Supervisores so podem solicitar desativacao de consultores da propria equipe."
    );
  }

  if (workspaceMember.status !== "active") {
    throw new TeamAccessError(400, "Este membro ja nao esta ativo na equipe.");
  }
}

function getMemberRemovalTargetProfileId(request: ApprovalRequestRow) {
  return getMetadataString(request.metadata, "targetProfileId");
}

function getMetadataString(metadata: Json, key: string) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return null;
  }

  const value = (metadata as Record<string, Json | undefined>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getActorDisplayName(profile: TeamActorProfile) {
  return profile.full_name ?? profile.email.split("@")[0] ?? "Usuario";
}

function normalizeDeactivationTargetRole(value: string) {
  return normalizeWorkspaceRole(value) === "admin" ? "admin" : "seller";
}

async function getCurrentTeamActor(): Promise<TeamActor> {
  if (!isSupabaseConfigured()) {
    return {
      mode: "not-configured",
      role: "owner",
      profile: {
        id: "demo-owner-profile",
        organization_id: "demo-organization",
        role: "owner",
        full_name: "Gestor Demo",
        email: "gestor@leadi.example"
      }
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new TeamAccessError(401, "Usuario nao autenticado.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, full_name, email")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    throw new TeamAccessError(404, "Perfil nao encontrado.");
  }

  return {
    mode: "supabase",
    supabase,
    profile,
    role: normalizeWorkspaceRole(profile.role)
  };
}

async function getTeamRowForOrganization(
  supabase: ServerClient,
  organizationId: string,
  teamId: string
) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new TeamAccessError(404, "Equipe nao encontrada.");
  }

  return data;
}

async function getInviteRowForOrganization(
  supabase: ServerClient,
  organizationId: string,
  inviteId: string
) {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .eq("workspace_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new TeamAccessError(404, "Convite nao encontrado.");
  }

  return data;
}

function assertOwnerTeamAccess(role: WorkspaceRole) {
  if (role !== "owner") {
    throw new TeamAccessError(403, "Somente owners podem gerenciar equipes.");
  }
}

function normalizeTeamId(teamId: string) {
  const normalizedTeamId = teamId.trim();

  if (!normalizedTeamId) {
    throw new TeamAccessError(400, "Equipe nao encontrada.");
  }

  return normalizedTeamId;
}

function normalizeInviteId(inviteId: string) {
  const normalizedInviteId = inviteId.trim();

  if (!normalizedInviteId) {
    throw new TeamAccessError(400, "Convite nao encontrado.");
  }

  return normalizedInviteId;
}

function normalizeInviteDecision(decision: InviteReviewDecision): InviteReviewDecision {
  if (decision === "approved" || decision === "rejected") {
    return decision;
  }

  throw new TeamAccessError(400, "Decisao de aprovacao invalida.");
}

function normalizeApprovalRequestId(requestId: string) {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    throw new TeamAccessError(400, "Solicitacao de desativacao nao encontrada.");
  }

  return normalizedRequestId;
}

function normalizeTargetProfileId(profileId: string) {
  const normalizedProfileId = profileId.trim();

  if (!normalizedProfileId) {
    throw new TeamAccessError(400, "Informe o membro que voce quer desativar.");
  }

  return normalizedProfileId;
}

function normalizeMemberDeactivationDecision(
  decision: MemberDeactivationReviewDecision
): MemberDeactivationReviewDecision {
  if (decision === "approved" || decision === "rejected") {
    return decision;
  }

  throw new TeamAccessError(400, "Decisao de aprovacao invalida.");
}

function normalizeTeamName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new TeamAccessError(400, "Informe o nome da equipe.");
  }

  if (normalizedName.length > 120) {
    throw new TeamAccessError(400, "O nome da equipe pode ter no maximo 120 caracteres.");
  }

  return normalizedName;
}

async function expireInviteIfNeeded(invite: InviteRow, organizationId: string) {
  if (invite.status !== "active" || !hasSupabaseServiceRole()) {
    return;
  }

  const admin = createSupabaseAdminClient();
  await admin
    .from("invites")
    .update({
      status: "expired"
    })
    .eq("id", invite.id)
    .eq("workspace_id", organizationId);
}

function getUnavailableInviteMessage(status: InviteStatus) {
  if (status === "used") {
    return "Este convite ja foi utilizado.";
  }

  if (status === "expired") {
    return "Este convite ja expirou.";
  }

  return "Este convite nao esta disponivel.";
}

export async function reassignTeamMember(input: {
  profileId: string;
  fromTeamId: string | null;
  toTeamId: string | null;
  organizationId: string;
  actorProfileId: string;
}): Promise<void> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);

  if (actor.mode === "not-configured") {
    return;
  }

  const { profileId, fromTeamId, toTeamId, organizationId, actorProfileId } = input;

  if (fromTeamId === toTeamId) {
    return;
  }

  if (fromTeamId) {
    await actor.supabase
      .from("team_members")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("team_id", fromTeamId)
      .eq("profile_id", profileId)
      .eq("organization_id", organizationId)
      .eq("status", "active");
  }

  if (toTeamId) {
    const { error } = await actor.supabase
      .from("team_members")
      .upsert(
        {
          team_id: toTeamId,
          profile_id: profileId,
          organization_id: organizationId,
          role: "consultant",
          status: "active",
          added_by_profile_id: actorProfileId
        },
        { onConflict: "team_id,profile_id" }
      );

    if (error) {
      throw new TeamAccessError(500, "Nao foi possivel reatribuir o membro.");
    }

    // Avisa o supervisor da equipe-destino que o consultor entrou na equipe.
    await notifyTeamSupervisorOfNewMember(
      actor.supabase,
      organizationId,
      toTeamId,
      profileId
    );
  }

  await recordAuditLog({
    organizationId,
    actorProfileId,
    actorRole: "owner",
    teamId: toTeamId,
    action: "member.reassign",
    targetType: "profile",
    targetId: profileId,
    status: "success",
    metadata: {
      fromTeamId,
      toTeamId
    }
  });
}

// Notifica o supervisor ativo da equipe-destino sobre o novo consultor. E
// best-effort: qualquer falha aqui nao deve reverter a reatribuicao ja feita.
async function notifyTeamSupervisorOfNewMember(
  supabase: ServerClient,
  organizationId: string,
  teamId: string,
  memberProfileId: string
): Promise<void> {
  try {
    const { data: supervisorMembership } = await supabase
      .from("team_members")
      .select("profile_id")
      .eq("organization_id", organizationId)
      .eq("team_id", teamId)
      .eq("role", "supervisor")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const supervisorProfileId = supervisorMembership?.profile_id;

    // Sem supervisor, ou o proprio supervisor sendo movido: nada a notificar.
    if (!supervisorProfileId || supervisorProfileId === memberProfileId) {
      return;
    }

    const [{ data: memberProfile }, { data: team }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", memberProfileId).maybeSingle(),
      supabase.from("teams").select("name").eq("id", teamId).maybeSingle()
    ]);

    await createTeamMemberAddedNotification({
      organizationId,
      recipientProfileId: supervisorProfileId,
      memberName: getProfileName(memberProfile),
      teamName: team?.name ?? "sua equipe"
    });
  } catch {
    // Notificacao e best-effort: ignora falhas silenciosamente.
  }
}

export async function promoteToSupervisorForCurrentUser(
  targetProfileId: string
): Promise<void> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedId = normalizeTargetProfileId(targetProfileId);

  if (actor.mode === "not-configured") {
    return;
  }

  const membership = await getActiveTeamMembershipForProfile(
    actor.supabase,
    actor.profile.organization_id,
    normalizedId
  );

  if (!membership) {
    throw new TeamAccessError(400, "Membro nao possui equipe ativa.");
  }

  if (membership.role === "supervisor") {
    throw new TeamAccessError(400, "Este membro ja e supervisor.");
  }

  const { data: existingSupervisors } = await actor.supabase
    .from("team_members")
    .select("id")
    .eq("team_id", membership.team_id)
    .eq("organization_id", actor.profile.organization_id)
    .eq("role", "supervisor")
    .eq("status", "active")
    .limit(1);

  if (existingSupervisors && existingSupervisors.length > 0) {
    throw new TeamAccessError(400, "A equipe ja possui um supervisor. Rebaixe o atual primeiro.");
  }

  await actor.supabase
    .from("team_members")
    .update({ role: "supervisor", updated_at: new Date().toISOString() })
    .eq("id", membership.id);

  await actor.supabase.rpc("update_workspace_member_role", {
    target_profile_id: normalizedId,
    next_role: "admin"
  });

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: membership.team_id,
    action: "member.promote",
    targetType: "profile",
    targetId: normalizedId,
    status: "success",
    metadata: { previousRole: "consultant", newRole: "supervisor" }
  });
}

export async function demoteSupervisorForCurrentUser(
  targetProfileId: string
): Promise<void> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedId = normalizeTargetProfileId(targetProfileId);

  if (actor.mode === "not-configured") {
    return;
  }

  const membership = await getActiveTeamMembershipForProfile(
    actor.supabase,
    actor.profile.organization_id,
    normalizedId
  );

  if (!membership || membership.role !== "supervisor") {
    throw new TeamAccessError(400, "Este membro nao e supervisor.");
  }

  await actor.supabase
    .from("team_members")
    .update({ role: "consultant", updated_at: new Date().toISOString() })
    .eq("id", membership.id);

  await actor.supabase.rpc("update_workspace_member_role", {
    target_profile_id: normalizedId,
    next_role: "seller"
  });

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: membership.team_id,
    action: "member.demote",
    targetType: "profile",
    targetId: normalizedId,
    status: "success",
    metadata: { previousRole: "supervisor", newRole: "consultant" }
  });
}

/**
 * Liga/desliga a permissão do consultor (seller) criar anúncios com IA na própria conta Meta.
 * Apenas o owner pode alterar. Valida que o alvo é um consultor da mesma corretora.
 */
export async function setMemberAdCreationGrantForCurrentUser(input: {
  targetProfileId: string;
  enabled: boolean;
}): Promise<void> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedId = normalizeTargetProfileId(input.targetProfileId);

  if (actor.mode === "not-configured") {
    return;
  }

  // Validação de ownership/escopo via cliente do usuário (RLS). A escrita usa o admin
  // porque o owner não pode atualizar a row de outro perfil pela RLS padrão.
  const { data: target, error: targetError } = await actor.supabase
    .from("profiles")
    .select("id, role, organization_id, ad_creation_enabled")
    .eq("id", normalizedId)
    .eq("organization_id", actor.profile.organization_id)
    .maybeSingle();

  if (targetError) {
    throw new TeamAccessError(500, "Nao foi possivel carregar o consultor.");
  }

  if (!target) {
    throw new TeamAccessError(404, "Consultor nao encontrado nesta corretora.");
  }

  if (normalizeWorkspaceRole(target.role) !== "seller") {
    throw new TeamAccessError(400, "Apenas consultores podem ser liberados para criar anuncios.");
  }

  // Idempotente: se ja esta no estado desejado, nao reescreve nem notifica de novo.
  // Sem isso, clicar "liberar" duas vezes gera notificacoes duplicadas no sino do consultor.
  if (Boolean(target.ad_creation_enabled) === input.enabled) {
    return;
  }

  if (!hasSupabaseServiceRole()) {
    throw new TeamAccessError(503, "Operacao indisponivel: configuracao do servidor ausente.");
  }

  const admin = createSupabaseAdminClient();
  const { error: updateError } = await admin
    .from("profiles")
    .update({ ad_creation_enabled: input.enabled, updated_at: new Date().toISOString() })
    .eq("id", normalizedId)
    .eq("organization_id", actor.profile.organization_id);

  if (updateError) {
    throw new TeamAccessError(500, updateError.message);
  }

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: null,
    action: input.enabled ? "member.ad_creation_grant" : "member.ad_creation_revoke",
    targetType: "profile",
    targetId: normalizedId,
    status: "success",
    metadata: { adCreationEnabled: input.enabled }
  });

  try {
    await createAdCreationGrantNotification({
      organizationId: actor.profile.organization_id,
      recipientProfileId: normalizedId,
      enabled: input.enabled
    });
  } catch (notifyError) {
    // Notificação é best-effort; não falhar a liberação por causa dela.
    console.error("Nao foi possivel notificar a liberacao de anuncios.", notifyError);
  }
}

export async function changeTeamSupervisorForCurrentUser(
  teamId: string,
  newSupervisorProfileId: string
): Promise<void> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedTeamId = normalizeTeamId(teamId);
  const normalizedNewId = normalizeTargetProfileId(newSupervisorProfileId);

  if (actor.mode === "not-configured") {
    return;
  }

  await getTeamRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedTeamId
  );

  const { data: currentSupervisor } = await actor.supabase
    .from("team_members")
    .select("*")
    .eq("team_id", normalizedTeamId)
    .eq("organization_id", actor.profile.organization_id)
    .eq("role", "supervisor")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (currentSupervisor) {
    await actor.supabase
      .from("team_members")
      .update({ role: "consultant", updated_at: new Date().toISOString() })
      .eq("id", currentSupervisor.id);

    await actor.supabase.rpc("update_workspace_member_role", {
      target_profile_id: currentSupervisor.profile_id,
      next_role: "seller"
    });
  }

  const newSupervisorMembership = await actor.supabase
    .from("team_members")
    .select("*")
    .eq("team_id", normalizedTeamId)
    .eq("profile_id", normalizedNewId)
    .eq("organization_id", actor.profile.organization_id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!newSupervisorMembership.data) {
    throw new TeamAccessError(400, "O membro selecionado nao pertence a esta equipe.");
  }

  await actor.supabase
    .from("team_members")
    .update({ role: "supervisor", updated_at: new Date().toISOString() })
    .eq("id", newSupervisorMembership.data.id);

  await actor.supabase.rpc("update_workspace_member_role", {
    target_profile_id: normalizedNewId,
    next_role: "admin"
  });

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: normalizedTeamId,
    action: "team.supervisor.change",
    targetType: "team",
    targetId: normalizedTeamId,
    status: "success",
    metadata: {
      previousSupervisorId: currentSupervisor?.profile_id ?? null,
      newSupervisorId: normalizedNewId
    }
  });
}

export async function reactivateMemberForCurrentUser(
  targetProfileId: string
): Promise<void> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedId = normalizeTargetProfileId(targetProfileId);

  if (actor.mode === "not-configured") {
    return;
  }

  const { data: inactiveMembership } = await actor.supabase
    .from("team_members")
    .select("*")
    .eq("organization_id", actor.profile.organization_id)
    .eq("profile_id", normalizedId)
    .eq("status", "inactive")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inactiveMembership) {
    throw new TeamAccessError(400, "Nenhum membro desativado encontrado com este perfil.");
  }

  const teamRole = inactiveMembership.role === "supervisor" ? "admin" : "seller";

  await actor.supabase.rpc("update_workspace_member_role", {
    target_profile_id: normalizedId,
    next_role: teamRole
  });

  await actor.supabase
    .from("team_members")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", inactiveMembership.id);

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: inactiveMembership.team_id,
    action: "member.reactivate",
    targetType: "profile",
    targetId: normalizedId,
    status: "success",
    metadata: { reactivatedRole: inactiveMembership.role }
  });
}

export async function deactivateTeamWithMembersForCurrentUser(
  teamId: string
): Promise<WorkspaceTeam> {
  const actor = await getCurrentTeamActor();
  assertOwnerTeamAccess(actor.role);
  const normalizedTeamId = normalizeTeamId(teamId);

  if (actor.mode === "not-configured") {
    const team = getMockTeamStore().find((item) => item.id === normalizedTeamId);
    if (!team || team.organization_id !== actor.profile.organization_id) {
      throw new TeamAccessError(404, "Equipe nao encontrada.");
    }
    team.is_active = false;
    team.updated_at = new Date().toISOString();
    return mapWorkspaceTeam(team);
  }

  const existingTeam = await getTeamRowForOrganization(
    actor.supabase,
    actor.profile.organization_id,
    normalizedTeamId
  );

  if (!existingTeam.is_active) {
    return mapWorkspaceTeam(existingTeam);
  }

  await actor.supabase
    .from("team_members")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("team_id", normalizedTeamId)
    .eq("organization_id", actor.profile.organization_id)
    .eq("status", "active");

  const { data, error } = await actor.supabase
    .from("teams")
    .update({ is_active: false })
    .eq("id", existingTeam.id)
    .eq("organization_id", actor.profile.organization_id)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Nao foi possivel desativar a equipe.");
  }

  await recordAuditLog({
    organizationId: actor.profile.organization_id,
    actorProfileId: actor.profile.id,
    actorRole: actor.profile.role,
    teamId: normalizedTeamId,
    action: "team.deactivate",
    targetType: "team",
    targetId: normalizedTeamId,
    status: "success",
    metadata: { teamName: existingTeam.name }
  });

  return mapWorkspaceTeam(data);
}

function mapWorkspaceTeam(team: TeamRow): WorkspaceTeam {
  return {
    id: team.id,
    organizationId: team.organization_id,
    name: team.name,
    createdByProfileId: team.created_by_profile_id,
    isActive: team.is_active,
    createdAt: team.created_at,
    updatedAt: team.updated_at
  };
}

function getMockTeamStore() {
  const globalScope = globalThis as typeof globalThis & {
    __leadHealthTeamsMock?: TeamRow[];
  };

  if (!globalScope.__leadHealthTeamsMock) {
    const now = new Date().toISOString();

    globalScope.__leadHealthTeamsMock = [
      {
        id: "demo-team",
        organization_id: "demo-organization",
        name: "Equipe Demo",
        created_by_profile_id: "demo-owner-profile",
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];
  }

  return globalScope.__leadHealthTeamsMock;
}
