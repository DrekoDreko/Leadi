import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { getBillingSnapshot } from "@/lib/billing/admin";
import { buildDemoBillingSnapshot } from "@/lib/billing/usage.server";
import { isBillingConfigured } from "@/lib/billing/config";
import { DashboardHome } from "./dashboard-home";

export default async function DashboardPage() {
  const context = await requireCompletedProfile();
  const leadState = await getLeadsForCurrentUser();
  const billingSnapshot = isBillingConfigured()
    ? (await getBillingSnapshot(context.workspace?.id ?? context.profile?.organization_id ?? "")) ??
      buildDemoBillingSnapshot()
    : buildDemoBillingSnapshot();

  return (
    <DashboardHome
      creditBalance={billingSnapshot.wallet.balance}
      leads={leadState.leads}
      showCreateTeamCard={context.isSoloSeller}
    />
  );
}
