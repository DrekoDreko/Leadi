import { redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getTeamSetupData } from "@/lib/workspaces/team";
import {
  getAccessibleWallets,
  getOrCreateOrganizationWallet,
  getOrgPoolBalance
} from "@/lib/ai/wallets.server";
import { TeamOrganizerWorkspace } from "./team-organizer-workspace";

export default async function EquipesPage() {
  const context = await requireCompletedProfile();

  if (!context.isOwner || !context.workspace?.id) {
    redirect("/dashboard");
  }

  const orgId = context.workspace.id;

  const [teamSetupData, wallets, inviteAccess, orgWalletRow, orgPoolBalance] = await Promise.all([
    getTeamSetupData(context),
    getAccessibleWallets(),
    getCurrentResourceAccess("team_invites"),
    getOrCreateOrganizationWallet(orgId),
    getOrgPoolBalance(orgId)
  ]);

  // Garante a carteira-org na lista e exibe o saldo real do pool
  // (org_ai_balances) como origem de distribuição do gestor.
  const walletsWithPool = (
    wallets.some((w) => w.id === orgWalletRow.id) ? wallets : [...wallets, orgWalletRow]
  ).map((w) =>
    w.walletType === "organization" ? { ...w, availableCredits: orgPoolBalance } : w
  );

  return (
    <TeamOrganizerWorkspace
      teams={teamSetupData.teams}
      members={teamSetupData.members}
      deactivatedMembers={teamSetupData.deactivatedMembers}
      wallets={walletsWithPool}
      inviteAccess={inviteAccess}
      workspaceName={teamSetupData.workspaceName}
    />
  );
}
