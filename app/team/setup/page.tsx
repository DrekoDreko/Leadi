import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { requireSupervisor } from "@/lib/workspaces/context";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { TeamSetupClient } from "./team-setup-client";

export default async function TeamSetupPage() {
  const [context, inviteAccess] = await Promise.all([
    requireSupervisor(),
    getCurrentResourceAccess("team_invites")
  ]);
  const teamData = await getTeamSetupData(context);

  return (
    <TeamSetupClient
      initialInvites={teamData.invites}
      initialWorkspaceName={teamData.workspaceName}
      inviteAccess={inviteAccess}
      members={teamData.members}
    />
  );
}
