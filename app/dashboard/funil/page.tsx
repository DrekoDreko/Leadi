import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getLeadsForCurrentUser, listLeadOwnerOptionsForCurrentUser } from "@/lib/leads/repository.server";
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
  const [leadState, createLeadAccess, aiBalance, whatsappTemplates, leadOwnerOptions] = await Promise.all([
    getLeadsForCurrentUser(leadFilters),
    getCurrentResourceAccess("lead_creation"),
    getCurrentAiBalance(),
    getSystemTemplates("whatsapp"),
    listLeadOwnerOptionsForCurrentUser()
  ]);

  return (
    <SalesFunnelWorkspace
      aiBalance={aiBalance}
      canManageLeadOwners={workspaceContext.isManager}
      canReorderLeads={!workspaceContext.isOwner}
      createLeadAccess={createLeadAccess}
      leadState={leadState}
      leadFilters={leadFilters}
      leadOwnerOptions={leadOwnerOptions}
      whatsappTemplates={whatsappTemplates}
    />
  );
}
