import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { PageHeading } from "@/components/dashboard/widgets";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { requireImportPermission } from "@/lib/workspaces/context";
import { listLeadOwnerOptionsForCurrentUser } from "@/lib/leads/repository.server";
import { CsvImportWorkspace } from "./csv-import-workspace";

export default async function ImportarLeadsPage() {
  const [context, createLeadAccess, connectionState, leadOwnerOptions] = await Promise.all([
    requireImportPermission(),
    getCurrentResourceAccess("lead_creation"),
    getConnectedAccountsForCurrentUser(),
    listLeadOwnerOptionsForCurrentUser()
  ]);
  const description = context.isManager
    ? "Importe uma base para a equipe e distribua os leads entre consultores."
    : "Importe leads apenas para a sua propria carteira comercial.";

  return (
    <div className="space-y-4">
      <PageHeading eyebrow="Importacao" title="Importar leads" description={description} />
      {!createLeadAccess.allowed ? <SubscriptionAccessBanner notice={createLeadAccess} /> : null}

      <CsvImportWorkspace
        canCreateMetaAdsLeads={Boolean(connectionState.metaConnection)}
        metaConnectedAccountId={connectionState.metaConnection?.id ?? null}
        createLeadAccess={createLeadAccess}
        canDistribute={context.isManager}
        canDistributeToSupervisors={context.isOwner}
        leadOwnerOptions={leadOwnerOptions}
      />
    </div>
  );
}
