import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { SalesFunnelWorkspace } from "./sales-funnel-workspace";

type SalesFunnelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalesFunnelPage({ searchParams }: SalesFunnelPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadFilters = parseLeadUrlFilters(resolvedSearchParams);
  const [leadState, createLeadAccess] = await Promise.all([
    getLeadsForCurrentUser(leadFilters),
    getCurrentResourceAccess("lead_creation")
  ]);

  return <SalesFunnelWorkspace createLeadAccess={createLeadAccess} leadState={leadState} />;
}
