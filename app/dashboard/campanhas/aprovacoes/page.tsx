import { requirePermission } from "@/lib/workspaces/context";
import { getPendingCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { AdApprovalWorkspace } from "./ad-approval-workspace";

export default async function AdApprovalsPage() {
  await requirePermission("approve_ad");

  const pendingCampaignsState = await getPendingCampaignsForCurrentUser();

  return (
    <AdApprovalWorkspace
      initialCampaigns={pendingCampaignsState.campaigns}
      mode={pendingCampaignsState.mode}
      message={pendingCampaignsState.message}
    />
  );
}
