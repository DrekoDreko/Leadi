import { requireSupervisor } from "@/lib/workspaces/context";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { TeamSetupClient } from "./team-setup-client";

export default async function TeamSetupPage() {
  const context = await requireSupervisor();
  const teamData = await getTeamSetupData(context);

  return (
    <TeamSetupClient
      initialInvites={teamData.invites}
      initialWorkspaceName={teamData.workspaceName}
      members={teamData.members}
    />
  );
}
