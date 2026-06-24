import { redirect } from "next/navigation";
import { IntegrationNotice } from "@/components/dashboard/integration-notice";
import { PageHeading } from "@/components/dashboard/widgets";
import { getCurrentSubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import { getMissingEnvForIntegration } from "@/lib/env/server";
import {
  getManagedConnectedAccountsForCurrentUser,
  getOwnMetaConnectedAccountsForCurrentUser
} from "@/lib/integrations/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  MetaConnectedAccountsSection,
  MetaHeaderActions,
  MetaOnboardingCard,
  MetaOverviewCard
} from "../profile-sections";

const integrationFeedbackMessages: Record<string, string> = {
  connected: "Conta Meta conectada com sucesso.",
  disconnected: "Conta Meta desconectada com sucesso.",
  forbidden:
    "Sua permissao para gerenciar a conexao Meta mudou antes da conclusao do fluxo. Reconecte com o owner.",
  invalid_request:
    "O retorno do OAuth da Meta chegou incompleto. Tente conectar novamente para reiniciar a autorizacao.",
  coming_soon:
    "A conta OpenAI própria está em breve. Hoje as gerações usam os Créditos de IA da plataforma.",
  success: "Sincronizacao concluida com sucesso.",
  updated: "Sincronizacao concluida com sucesso.",
  partial: "Sincronizacao concluida com avisos.",
  error: "Nao foi possivel concluir a atualizacao das contas conectadas.",
  failed: "Nao foi possivel sincronizar os ativos Meta agora.",
  user_denied: "A autorizacao da Meta foi cancelada antes da conclusao da conexao.",
  missing:
    "Este ambiente ainda não tem META_APP_ID e META_APP_SECRET. Sem essas variáveis, o botão Conectar Meta não consegue iniciar o OAuth.",
  token_expired: "O token de acesso expirou. Refaça a conexão com a Meta.",
  missing_permissions: "Permissões insuficientes. Conecte novamente garantindo todos os acessos solicitados."
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
  const context = await requireCompletedProfile();
  // Owner gerencia a conexão da corretora; consultor liberado gerencia a própria conexão Meta.
  const isPersonalView = !context.isOwner && context.canManageOwnMetaConnection;
  if (!context.isOwner && !context.canManageOwnMetaConnection) {
    redirect("/dashboard");
  }

  const [params, connectedAccounts, billingNotice] = await Promise.all([
    searchParams,
    isPersonalView
      ? getOwnMetaConnectedAccountsForCurrentUser()
      : getManagedConnectedAccountsForCurrentUser(),
    getCurrentSubscriptionNotice()
  ]);
  const missingMetaOAuthEnvKeys = getMissingEnvForIntegration("meta_oauth");
  const missingMetaSyncEnvKeys = getMissingEnvForIntegration("meta_lead_sync");

  const companyMessage =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    connectedAccounts.message ||
    null;
  const isMetaConfigurationMissing = params?.meta === "missing";
  const isConnected = Boolean(connectedAccounts.metaConnection);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={isPersonalView ? "Minha conta Meta" : "Empresa e contas conectadas"}
        title={isPersonalView ? "Minha conexão Meta" : "Meta e contas conectadas"}
        description={
          isPersonalView
            ? "Conecte sua própria conta Meta (página, perfil e conta de anúncios) para criar anúncios com IA. Os leads caem no CRM da corretora atribuídos a você."
            : "Gerencie o perfil Meta, páginas, formulários, contas de anúncio e permissões da operação."
        }
      >
        <span className="surface-pill-strong inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-ink">
          {context.workspaceName}
        </span>
        <MetaHeaderActions
          canManage={connectedAccounts.canManageConnections}
          isConnected={isConnected}
        />
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

      {isConnected ? (
        <section className="space-y-4">
          <MetaOverviewCard
            billingNotice={billingNotice}
            connectedAccounts={connectedAccounts}
            missingMetaOAuthEnvKeys={missingMetaOAuthEnvKeys}
            missingMetaSyncEnvKeys={missingMetaSyncEnvKeys}
            metaParam={params?.meta ?? null}
            syncParam={params?.sync ?? null}
            workspaceName={context.workspaceName}
          />
          <MetaConnectedAccountsSection connectedAccounts={connectedAccounts} />
        </section>
      ) : (
        <MetaOnboardingCard
          billingNotice={billingNotice}
          connectedAccounts={connectedAccounts}
          missingMetaOAuthEnvKeys={missingMetaOAuthEnvKeys}
          missingMetaSyncEnvKeys={missingMetaSyncEnvKeys}
          metaParam={params?.meta ?? null}
          syncParam={params?.sync ?? null}
          workspaceName={context.workspaceName}
        />
      )}
    </div>
  );
}
