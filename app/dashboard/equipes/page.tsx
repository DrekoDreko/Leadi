import { redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { getAccessibleWallets } from "@/lib/ai/wallets.server";
import { TeamOrganizerWorkspace } from "./team-organizer-workspace";

export default async function EquipesPage() {
  const context = await requireCompletedProfile();

  if (!context.isOwner) {
    redirect("/dashboard");
  }

  const [teamSetupData, wallets, inviteAccess] = await Promise.all([
    getTeamSetupData(context),
    getAccessibleWallets(),
    getCurrentResourceAccess("team_invites")
  ]);

  return (
    <TeamOrganizerWorkspace
      teams={teamSetupData.teams}
      members={teamSetupData.members}
      deactivatedMembers={teamSetupData.deactivatedMembers}
      wallets={wallets}
      inviteAccess={inviteAccess}
      workspaceName={teamSetupData.workspaceName}
    />
  );
}
