import { IntegrationNotice } from "@/components/dashboard/integration-notice";
import { PageHeading } from "@/components/dashboard/widgets";
import { getManagedConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { requireWorkspaceManager } from "@/lib/workspaces/context";
import { MetaConnectedAccountsSection, MetaOverviewCard } from "../profile-sections";

const integrationFeedbackMessages: Record<string, string> = {
  connected: "Conta Meta conectada com sucesso.",
  disconnected: "Conta Meta desconectada com sucesso.",
  forbidden:
    "Sua permissao para gerenciar a conexao Meta mudou antes da conclusao do fluxo. Reconecte com um owner ou admin valido.",
  coming_soon:
    "A conta OpenAI própria está em breve. Hoje as gerações usam os Créditos de IA da plataforma.",
  success: "Sincronizacao concluida com sucesso.",
  partial: "Sincronizacao concluida com avisos.",
  error: "Nao foi possivel concluir a atualizacao das contas conectadas.",
  missing:
    "Este ambiente ainda não tem META_APP_ID e META_APP_SECRET. Sem essas variáveis, o botão Conectar Meta não consegue iniciar o OAuth."
};

export default async function PerfilMetaPage({
  searchParams
}: {
  searchParams?: Promise<{
    meta?: string;
    openai?: string;
    sync?: string;
  }>;
}) {
  const context = await requireWorkspaceManager();
  const params = await searchParams;
  const connectedAccounts = await getManagedConnectedAccountsForCurrentUser();

  const companyMessage =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    connectedAccounts.message ||
    null;
  const isMetaConfigurationMissing = params?.meta === "missing";

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Empresa e contas conectadas"
        title="Meta e contas conectadas"
        description="Gerencie o perfil Meta, páginas, formulários, contas de anúncio e permissões da operação."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          {context.workspaceName}
        </span>
      </PageHeading>

      {isMetaConfigurationMissing && companyMessage ? (
        <IntegrationNotice
          message={companyMessage}
          title="Integração Meta não configurada"
          tone="warning"
        />
      ) : companyMessage ? (
        <IntegrationNotice message={companyMessage} />
      ) : null}

      <section className="space-y-4">
        <MetaOverviewCard
          formsCount={connectedAccounts.metaLeadForms.length}
          metaStatus={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
          pagesCount={connectedAccounts.metaPages.length}
          workspaceName={context.workspaceName}
        />
        <MetaConnectedAccountsSection connectedAccounts={connectedAccounts} />
      </section>
    </div>
  );
}
