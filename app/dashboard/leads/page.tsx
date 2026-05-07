import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { LeadsWorkspace } from "./leads-workspace";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { parseLeadPaginationParams } from "@/lib/leads/repository";
import { parseLeadUrlFilters } from "@/lib/leads/filters";

type LeadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadFilters = parseLeadUrlFilters(resolvedSearchParams);
  const [leadState, createLeadAccess] = await Promise.all([
    getLeadsForCurrentUser(leadFilters, parseLeadPaginationParams(resolvedSearchParams)),
    getCurrentResourceAccess("lead_creation")
  ]);

  return (
    <LeadsWorkspace
      createLeadAccess={createLeadAccess}
      leadFilters={leadFilters}
      leadState={leadState}
    />
  );
}
