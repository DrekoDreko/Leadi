import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { requireWorkspaceManager } from "@/lib/workspaces/context";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { TeamSetupClient } from "./team-setup-client";

export default async function TeamSetupPage() {
  const [context, inviteAccess] = await Promise.all([
    requireWorkspaceManager(),
    getCurrentResourceAccess("team_invites")
  ]);
  const teamData = await getTeamSetupData(context);

  return (
    <TeamSetupClient
      initialDeactivationRequests={teamData.deactivationRequests}
      initialInvites={teamData.invites}
      initialSelectedTeamId={teamData.initialSelectedTeamId}
      initialWorkspaceName={teamData.workspaceName}
      inviteAccess={inviteAccess}
      isRestrictedToSingleTeam={teamData.isRestrictedToSingleTeam}
      members={teamData.members}
      currentProfileId={context.profile?.id ?? ""}
      currentRole={context.role}
      teams={teamData.teams}
      workspaceType={context.workspaceType}
    />
  );
}
