import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { LeadsWorkspace } from "./leads-workspace";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { parseLeadPaginationParams } from "@/lib/leads/repository";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getSystemTemplates } from "@/lib/templates/repository.server";

type LeadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> & {
    lead?: string | string[];
    panel?: string | string[];
  }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadFilters = parseLeadUrlFilters(resolvedSearchParams);
  const initialLeadId = Array.isArray(resolvedSearchParams?.lead)
    ? resolvedSearchParams?.lead[0]
    : resolvedSearchParams?.lead;
  const initialLeadPanel = Array.isArray(resolvedSearchParams?.panel)
    ? resolvedSearchParams?.panel[0]
    : resolvedSearchParams?.panel;
  const [leadState, createLeadAccess, connectedAccounts, whatsappTemplates] = await Promise.all([
    getLeadsForCurrentUser(leadFilters, parseLeadPaginationParams(resolvedSearchParams)),
    getCurrentResourceAccess("lead_creation"),
    getConnectedAccountsForCurrentUser(),
    getSystemTemplates("whatsapp")
  ]);

  return (
    <LeadsWorkspace
      createLeadAccess={createLeadAccess}
      hasOpenAIConnection={Boolean(connectedAccounts.openAIConnection)}
      initialLeadId={initialLeadId ?? null}
      initialLeadPanel={initialLeadPanel === "message" ? "message" : "details"}
      leadFilters={leadFilters}
      leadState={leadState}
      whatsappTemplates={whatsappTemplates}
    />
  );
}
