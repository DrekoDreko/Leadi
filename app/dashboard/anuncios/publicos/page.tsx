import { redirect } from "next/navigation";
import { PageHeading } from "@/components/dashboard/widgets";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { listWalletAudiencesForOrg } from "@/lib/meta/custom-audience.server";
import { PublicosClient } from "./publicos-client";

export default async function PublicosPage() {
  const connected = await getConnectedAccountsForCurrentUser();

  // Só owner/admin gerenciam ativos da conexão Meta (públicos personalizados).
  if (!connected.canManageConnections) {
    redirect("/dashboard/anuncios");
  }

  const audiences = connected.organizationId
    ? await listWalletAudiencesForOrg(connected.organizationId)
    : [];

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Anúncios"
        title="Públicos personalizados"
        description="Suba sua carteira de clientes para o Leadi criar um público na Meta e um Semelhante (Lookalike) — o alvo mais forte para plano de saúde. Os contatos são convertidos em código (hash) antes do envio e a lista bruta não é guardada."
      />
      <PublicosClient
        adAccounts={connected.metaAdAccounts.map((account) => ({
          id: account.metaAdAccountId,
          name: account.name
        }))}
        initialAudiences={audiences}
      />
    </div>
  );
}
