import { isBillingDisabledForTests } from "@/lib/billing/config";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { pricingPlans } from "@/data/pricing";
import { requireWorkspaceManager } from "@/lib/workspaces/context";
import { getTeamSetupData } from "@/lib/workspaces/team";
import { InvitePageClient } from "./invite-page-client";

// Convites inclusos no plano Equipe (alem do gestor/dono). Ate esse numero de
// usuarios convidados, o convite e gratuito; a partir do proximo passa a cobrar.
const FREE_TEAM_INVITES =
  pricingPlans.find((plan) => plan.slug === "equipe")?.includedUsers ?? 3;

export default async function InvitePage() {
  const [context, inviteAccess] = await Promise.all([
    requireWorkspaceManager(),
    getCurrentResourceAccess("team_invites")
  ]);
  const teamData = await getTeamSetupData(context);

  // Vagas ja consumidas = membros convidados (todos menos o dono) + convites
  // ativos pendentes. O gestor/dono nao conta na cota gratuita.
  const seatsConsumed =
    teamData.members.filter((member) => member.role !== "owner").length +
    teamData.invites.filter((invite) => invite.status === "active").length;

  return (
    <InvitePageClient
      currentRole={context.role}
      inviteAccess={inviteAccess}
      invites={teamData.invites}
      teams={teamData.teams}
      workspaceType={context.workspaceType}
      billingDisabled={isBillingDisabledForTests()}
      freeInviteTotal={FREE_TEAM_INVITES}
      seatsConsumed={seatsConsumed}
    />
  );
}
