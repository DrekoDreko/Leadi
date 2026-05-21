import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { LeadsWorkspace } from "../leads-workspace";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { parseLeadPaginationParams } from "@/lib/leads/repository";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

type ArchivedLeadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> & {
    lead?: string | string[];
    panel?: string | string[];
  }>;
};

export default async function ArchivedLeadsPage({ searchParams }: ArchivedLeadsPageProps) {
  await requireCompletedProfile();
  const resolvedSearchParams = await searchParams;
  const leadFilters = {
    ...parseLeadUrlFilters(resolvedSearchParams),
    archived: true
  };
  const initialLeadId = Array.isArray(resolvedSearchParams?.lead)
    ? resolvedSearchParams?.lead[0]
    : resolvedSearchParams?.lead;
  const initialLeadPanel = Array.isArray(resolvedSearchParams?.panel)
    ? resolvedSearchParams?.panel[0]
    : resolvedSearchParams?.panel;
    
  const [leadState, createLeadAccess, whatsappTemplates, aiBalance] = await Promise.all([
    getLeadsForCurrentUser(leadFilters, parseLeadPaginationParams(resolvedSearchParams)),
    getCurrentResourceAccess("lead_creation"),
    getSystemTemplates("whatsapp"),
    getCurrentAiBalance()
  ]);

  return (
    <LeadsWorkspace
      createLeadAccess={createLeadAccess}
      aiBalance={aiBalance}
      initialLeadId={initialLeadId ?? null}
      initialLeadPanel={initialLeadPanel === "message" ? "message" : "details"}
      leadFilters={leadFilters}
      leadState={leadState}
      whatsappTemplates={whatsappTemplates}
      title="Leads Arquivados"
    />
  );
}
