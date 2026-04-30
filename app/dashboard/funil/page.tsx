import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { SalesFunnelWorkspace } from "./sales-funnel-workspace";

type SalesFunnelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalesFunnelPage({ searchParams }: SalesFunnelPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadFilters = parseLeadUrlFilters(resolvedSearchParams);
  const leadState = await getLeadsForCurrentUser(leadFilters);

  return <SalesFunnelWorkspace leadState={leadState} />;
}
