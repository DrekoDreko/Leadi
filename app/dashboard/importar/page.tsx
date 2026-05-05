import { PageHeading } from "@/components/dashboard/widgets";
import { requireImportPermission } from "@/lib/workspaces/context";
import { CsvImportWorkspace } from "./csv-import-workspace";

export default async function ImportarLeadsPage() {
  const context = await requireImportPermission();
  const description = context.isSupervisor
    ? "Importe uma base para a equipe e distribua os leads entre vendedores."
    : "Importe leads apenas para a sua propria carteira comercial.";

  return (
    <div className="space-y-4">
      <PageHeading eyebrow="Importacao" title="Importar leads" description={description} />

      <CsvImportWorkspace canCreateMetaAdsLeads={context.isSupervisor} />
    </div>
  );
}
