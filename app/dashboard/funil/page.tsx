import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { listLeadOwnerOptionsForCurrentUser } from "@/lib/leads/repository.server";
import { getSalesBoardForCurrentUser } from "@/lib/pipeline/board.server";
import { listLabelsForCurrentUser } from "@/lib/pipeline/cards.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { SalesFunnelWorkspace } from "./sales-funnel-workspace";

type SalesFunnelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalesFunnelPage({ searchParams }: SalesFunnelPageProps) {
  const workspaceContext = await requireCompletedProfile();
  const resolvedSearchParams = await searchParams;
  const leadFilters = parseLeadUrlFilters(resolvedSearchParams);
  const [board, createLeadAccess, aiBalance, whatsappTemplates, leadOwnerOptions, boardLabels] =
    await Promise.all([
      getSalesBoardForCurrentUser(leadFilters),
      getCurrentResourceAccess("lead_creation"),
      getCurrentAiBalance(),
      getSystemTemplates("whatsapp"),
      listLeadOwnerOptionsForCurrentUser(),
      listLabelsForCurrentUser()
    ]);

  return (
    <SalesFunnelWorkspace
      aiBalance={aiBalance}
      canManageLeadOwners={workspaceContext.isManager}
      canManageColumns={workspaceContext.isManager}
      canReorderLeads={!workspaceContext.isOwner}
      createLeadAccess={createLeadAccess}
      leadState={board.leadState}
      leadFilters={leadFilters}
      leadOwnerOptions={leadOwnerOptions}
      whatsappTemplates={whatsappTemplates}
      stages={board.stages}
      boardLabels={boardLabels}
      organizationId={workspaceContext.profile?.organization_id ?? null}
    />
  );
}
