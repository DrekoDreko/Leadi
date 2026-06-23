import { isBillingDisabledForTests } from "@/lib/billing/config";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { requireWorkspaceManager } from "@/lib/workspaces/context";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { InvitePageClient } from "./invite-page-client";

export default async function InvitePage() {
  const [context, inviteAccess] = await Promise.all([
    requireWorkspaceManager(),
    getCurrentResourceAccess("team_invites")
  ]);
  const teamData = await getTeamSetupData(context);

  return (
    <InvitePageClient
      currentRole={context.role}
      inviteAccess={inviteAccess}
      invites={teamData.invites}
      teams={teamData.teams}
      workspaceType={context.workspaceType}
      billingDisabled={isBillingDisabledForTests()}
    />
  );
}
