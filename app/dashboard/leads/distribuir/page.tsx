import { redirect } from "next/navigation";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { LeadsWorkspace } from "../leads-workspace";
import {
  getLeadsForCurrentUser,
  listLeadOwnerOptionsForCurrentUser
} from "@/lib/leads/repository.server";
import { parseLeadPaginationParams } from "@/lib/leads/repository";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

import { can } from "@/lib/workspaces/permissions";

type DistribuirLeadsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> & {
    lead?: string | string[];
    panel?: string | string[];
  }>;
};

export default async function DistribuirLeadsPage({ searchParams }: DistribuirLeadsPageProps) {
  const workspaceContext = await requireCompletedProfile();

  if (!workspaceContext.isManager) {
    redirect("/dashboard/leads");
  }

  const resolvedSearchParams = await searchParams;
  const baseFilters = parseLeadUrlFilters(resolvedSearchParams);
  
  // Força o filtro para buscar apenas leads sem responsável
  const leadFilters = {
    ...baseFilters,
    owner: "unassigned"
  };

  const initialLeadId = Array.isArray(resolvedSearchParams?.lead)
    ? resolvedSearchParams?.lead[0]
    : resolvedSearchParams?.lead;
  const initialLeadPanel = Array.isArray(resolvedSearchParams?.panel)
    ? resolvedSearchParams?.panel[0]
    : resolvedSearchParams?.panel;

  const [leadState, createLeadAccess, whatsappTemplates, aiBalance, leadOwnerOptions] = await Promise.all([
    getLeadsForCurrentUser(leadFilters, parseLeadPaginationParams(resolvedSearchParams)),
    getCurrentResourceAccess("lead_creation"),
    getSystemTemplates("whatsapp"),
    getCurrentAiBalance(),
    listLeadOwnerOptionsForCurrentUser()
  ]);

  const canExportLeads = workspaceContext.mode === "supabase" ? can(workspaceContext.role, "export_leads") : true;
  const canImportLeads = workspaceContext.mode === "supabase" ? can(workspaceContext.role, "import_leads") : true;

  return (
    <LeadsWorkspace
      title="Distribuir Leads"
      canExportLeads={canExportLeads}
      canImportLeads={canImportLeads}
      createLeadAccess={createLeadAccess}
      aiBalance={aiBalance}
      initialLeadId={initialLeadId ?? null}
      initialLeadPanel={initialLeadPanel === "message" ? "message" : "details"}
      canManageLeadOwners={workspaceContext.isManager}
      canDistributeToSupervisors={workspaceContext.isOwner}
      leadFilters={leadFilters}
      leadOwnerOptions={leadOwnerOptions}
      leadState={leadState}
      whatsappTemplates={whatsappTemplates}
    />
  );
}
