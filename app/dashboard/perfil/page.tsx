import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Link2,
  RefreshCw,
  Settings,
  ShieldCheck,
  Unplug
} from "lucide-react";
import { AiCreditsPanel, OpenAIComingSoonCard } from "@/components/dashboard/ai-credits-panel";
import { IntegrationNotice } from "@/components/dashboard/integration-notice";
import { PageHeading } from "@/components/dashboard/widgets";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import type { ConnectedAccountsState } from "@/lib/integrations/types";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getAiBalance } from "@/lib/ai/credits";
import { updateBrokerageNameAction } from "./actions";

const PROFILE_COMPANY_SECTION_HREF = "/dashboard/perfil?section=empresa";

const brokerageFeedbackMessages: Record<string, string> = {
  failed: "Nao foi possivel salvar o nome da corretora agora.",
  missing: "Informe o nome da corretora ou o seu proprio nome comercial.",
  permission: "Apenas o owner ou os admins da equipe podem alterar o nome da corretora.",
  "schema-missing":
    "O banco conectado ainda nao recebeu a migration de nome da corretora. Aplique a migration mais recente e tente novamente.",
  updated: "Nome comercial atualizado para as proximas mensagens e campanhas."
};

const integrationFeedbackMessages: Record<string, string> = {
  connected: "Conta Meta conectada com sucesso.",
  disconnected: "Conta Meta desconectada com sucesso.",
  coming_soon: "A conta OpenAI própria está em breve. Hoje as gerações usam os Créditos de IA da plataforma.",
  success: "Sincronizacao concluida com sucesso.",
  partial: "Sincronizacao concluida com avisos.",
  error: "Nao foi possivel concluir a atualizacao das contas conectadas.",
  missing:
    "Este ambiente ainda não tem META_APP_ID e META_APP_SECRET. Sem essas variáveis, o botão Conectar Meta não consegue iniciar o OAuth."
};

export default async function PerfilPage({
  searchParams
}: {
  searchParams?: Promise<{
    brokerage?: string;
    webhookStatus?: string;
    section?: string;
    highlight?: string;
    meta?: string;
    openai?: string;
    sync?: string;
  }>;
}) {
  const context = await requireCompletedProfile();
  const params = await searchParams;

  if (params?.webhookStatus) {
    const normalizedWebhookStatus = normalizeWebhookStatusFilter(params.webhookStatus);
    const webhookQuery =
      normalizedWebhookStatus === "all"
        ? ""
        : `?webhookStatus=${encodeURIComponent(normalizedWebhookStatus)}`;

    redirect(`/dashboard/integracoes/webhook-leads${webhookQuery}#logs`);
  }

  const brokerageFeedback = params?.brokerage
    ? brokerageFeedbackMessages[params.brokerage] ?? null
    : null;
  const integrationFeedback =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    null;
  const canEditBrokerageName = context.isManager || context.isSoloOwner;
  const connectedAccounts = await getConnectedAccountsForCurrentUser();
  const aiBalance = await getAiBalance(context.workspace?.id ?? "");
  const isCompanySectionFocused = params?.section === "empresa";
  const highlightOpenAI = params?.highlight === "openai";
  const companyMessage = integrationFeedback ?? connectedAccounts.message ?? null;
  const isMetaConfigurationMissing = params?.meta === "missing";

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Perfil"
        title="Configuracoes"
        description="Dados do usuario, nome comercial, créditos de IA e operação da empresa em um unico lugar para manter a conta organizada."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <Settings size={18} aria-hidden="true" />
          {context.role === "owner" ? "Owner" : context.role === "admin" ? "Admin" : "Vendedor"}
        </span>
      </PageHeading>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="glass-strong rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Usuario</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.displayName}</h2>
          <p className="mt-3 text-sm text-ink/58">{context.profile?.email ?? "Modo demonstracao"}</p>
        </article>

        <article className="glass rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Empresa</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.workspaceName}</h2>
          <p className="mt-3 text-sm text-ink/58">
            {context.workspaceType === "team" ? "Equipe" : "Individual"}
          </p>
        </article>

        <article className="glass rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Meta</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
          </h2>
          <p className="mt-3 text-sm text-ink/58">
            {connectedAccounts.metaPages.length + connectedAccounts.metaAdAccounts.length} ativos visiveis
          </p>
        </article>

        <article className="glass rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Créditos de IA</p>
          <h2 className="mt-2 text-2xl font-semibold">{aiBalance.toLocaleString("pt-BR")}</h2>
          <p className="mt-3 text-sm text-ink/58">
            {aiBalance > 0
              ? `Você possui ${aiBalance.toLocaleString("pt-BR")} créditos de IA disponíveis.`
              : "Seu saldo de IA acabou. Adicione créditos ou atualize seu plano para continuar usando recursos de IA."}
          </p>
        </article>
      </section>

      {brokerageFeedback ? (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {brokerageFeedback}
        </p>
      ) : null}

      {isMetaConfigurationMissing && companyMessage ? (
        <IntegrationNotice
          message={companyMessage}
          title="Integração Meta não configurada"
          tone="warning"
        />
      ) : companyMessage ? (
        <IntegrationNotice message={companyMessage} />
      ) : null}

      <section className="glass-strong rounded-[34px] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Corretora</p>
            <h2 className="mt-2 text-2xl font-semibold">Nome usado com clientes</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
              Esse nome assina mensagens, campanhas e novos atendimentos. Se voce atua sozinho,
              pode usar o proprio nome comercial.
            </p>
          </div>
          <BriefcaseBusiness size={22} aria-hidden="true" />
        </div>

        {canEditBrokerageName ? (
          <form
            action={updateBrokerageNameAction}
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <input
              className="liquid-input"
              defaultValue={context.brokerageName}
              maxLength={80}
              name="brokerageName"
              placeholder={context.isSoloOwner ? context.displayName : "Nome da corretora"}
              required
              type="text"
            />
            <button
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              type="submit"
            >
              Salvar nome
            </button>
          </form>
        ) : (
          <div className="rounded-[24px] border border-white/44 bg-white/36 p-4 text-sm leading-6 text-ink/64">
            Voce esta em uma equipe. O owner ou os admins configuram o nome comercial usado no
            contato com clientes.
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AiCreditsPanel balance={aiBalance} />
        <OpenAIComingSoonCard highlight={highlightOpenAI} />
      </section>

      <section
        className={`rounded-[34px] p-6 ${
          isCompanySectionFocused
            ? "glass-strong ring-2 ring-cobalt/22 ring-offset-0"
            : "glass"
        }`}
        id="empresa-e-contas"
      >
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-cobalt">Empresa e contas conectadas</p>
            <h2 className="mt-2 text-2xl font-semibold">Operacao da conta</h2>
            <p className="mt-3 text-sm leading-7 text-ink/62">
              Aqui ficam os dados da empresa e o estado das contas que sustentam a operação,
              principalmente Meta e a futura conta OpenAI própria.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-semibold text-ink">
            <Building2 size={16} aria-hidden="true" />
            {context.workspaceName}
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <article className="rounded-[28px] bg-white/46 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cobalt">Meta</p>
                <h3 className="mt-2 text-xl font-semibold">Conta conectada</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Conecte a conta Meta da empresa para importar paginas, formularios e preparar
                  campanhas com os ativos autorizados.
                </p>
              </div>
              <Link2 size={20} aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoTile
                label="Status"
                value={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
              />
              <InfoTile label="Paginas" value={String(connectedAccounts.metaPages.length)} />
              <InfoTile
                label="Formularios"
                value={String(connectedAccounts.metaLeadForms.length)}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {connectedAccounts.canManageConnections ? (
                <>
                  <a
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white ${
                      connectedAccounts.metaConnection ? "bg-cobalt" : "bg-ink"
                    }`}
                    href={`/api/integrations/meta/connect?returnTo=${encodeURIComponent(PROFILE_COMPANY_SECTION_HREF)}`}
                  >
                    {connectedAccounts.metaConnection ? "Reconectar Meta" : "Conectar Meta"}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                  <form action="/api/integrations/meta/sync" method="post">
                    <input name="returnTo" type="hidden" value={PROFILE_COMPANY_SECTION_HREF} />
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                      type="submit"
                    >
                      <RefreshCw size={18} aria-hidden="true" />
                      Sincronizar ativos
                    </button>
                  </form>
                  {connectedAccounts.metaConnection ? (
                    <form action="/api/integrations/meta/disconnect" method="post">
                      <input name="returnTo" type="hidden" value={PROFILE_COMPANY_SECTION_HREF} />
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                        type="submit"
                      >
                        <Unplug size={18} aria-hidden="true" />
                        Desconectar
                      </button>
                    </form>
                  ) : null}
                </>
              ) : (
                <span className="rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink/62">
                  Apenas owner e admins podem mudar conexoes.
                </span>
              )}
            </div>
          </article>

          <article className="rounded-[28px] bg-white/46 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cobalt">Operação da conta</p>
                <h3 className="mt-2 text-xl font-semibold">Empresa e conexões principais</h3>
              </div>
              <ShieldCheck size={20} aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-3">
              <InfoTile label="Empresa" value={context.workspaceName} />
              <InfoTile
                label="Meta"
                value={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
              />
              <InfoTile
                label="OpenAI"
                value={
                  connectedAccounts.openAIConnection
                    ? formatOpenAIStatus(connectedAccounts.openAIConnection.status)
                    : "Em breve"
                }
              />
            </div>

            <p className="mt-5 text-sm leading-6 text-ink/64">
              O perfil concentra o nome da empresa, a conexão com Meta e o andamento da conta
              OpenAI para manter a operação centralizada.
            </p>
          </article>
        </div>

        <MetaConnectedAccountsSection connectedAccounts={connectedAccounts} />
      </section>
    </div>
  );
}

function MetaConnectedAccountsSection({
  connectedAccounts
}: {
  connectedAccounts: ConnectedAccountsState;
}) {
  const connection = connectedAccounts.metaConnection;
  const connectedAssets = [
    ...connectedAccounts.metaPages.map((page) => ({
      id: page.id,
      name: page.name,
      type: "Página",
      externalId: page.metaPageId,
      status: formatMetaAssetStatus(page.status),
      lastSyncedAt: page.lastSyncAt
    })),
    ...connectedAccounts.metaAdAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: "Conta de anúncio",
      externalId: account.metaAdAccountId,
      status: formatMetaAssetStatus(account.status),
      lastSyncedAt: account.lastSyncAt
    })),
    ...connectedAccounts.metaLeadForms.map((form) => ({
      id: form.id,
      name: form.name,
      type: "Formulário",
      externalId: form.metaFormId,
      status: formatMetaAssetStatus(form.status),
      lastSyncedAt: form.lastSyncAt ?? form.lastLeadSyncAt
    }))
  ];

  return (
    <section className="mt-5 rounded-[30px] border border-white/50 bg-white/38 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-cobalt">Contas Meta conectadas</p>
          <h3 className="mt-2 text-2xl font-semibold">
            {connection?.metaUserName ?? "Nenhuma conta Meta conectada"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">
            Ativos disponíveis para páginas, formulários, contas de anúncio e importação manual
            de leads históricos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {connectedAccounts.canManageConnections ? (
            <>
              <form action="/api/integrations/meta/sync" method="post">
                <input name="returnTo" type="hidden" value={PROFILE_COMPANY_SECTION_HREF} />
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-white/68 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                  type="submit"
                >
                  <RefreshCw size={18} aria-hidden="true" />
                  Sincronizar novamente
                </button>
              </form>
              <a
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                href={`/api/integrations/meta/connect?returnTo=${encodeURIComponent(PROFILE_COMPANY_SECTION_HREF)}`}
              >
                Gerenciar conexão
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </>
          ) : (
            <span className="rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink/62">
              Apenas owner e admins podem gerenciar.
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Perfil Meta" value={connection?.metaUserName ?? "Não conectado"} />
        <InfoTile label="ID do perfil" value={connection?.metaUserId ?? "Não informado"} />
        <InfoTile
          label="Status"
          value={connection?.connectionStatusLabel ?? "Pendente"}
        />
        <InfoTile
          label="Última sincronização"
          value={formatDateTime(connection?.lastSyncAt)}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoTile label="Páginas conectadas" value={String(connectedAccounts.metaPages.length)} />
        <InfoTile
          label="Contas de anúncio"
          value={String(connectedAccounts.metaAdAccounts.length)}
        />
        <InfoTile
          label="Formulários de lead"
          value={String(connectedAccounts.metaLeadForms.length)}
        />
      </div>

      <div className="mt-5 rounded-[24px] bg-white/48 p-4">
        <p className="text-sm font-semibold text-ink">Permissões concedidas</p>
        {connection?.permissions.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {connection.permissions.map((permission) => (
              <span
                className="rounded-full bg-white/76 px-3 py-1.5 text-xs font-semibold text-ink/70"
                key={permission}
              >
                {permission}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink/58">Permissões ainda não disponíveis.</p>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-white/50 bg-white/30">
        <div className="hidden grid-cols-[1.1fr_150px_180px_150px] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid">
          <span>Ativo</span>
          <span>Tipo</span>
          <span>ID externo</span>
          <span>Status</span>
        </div>

        {connectedAssets.length ? (
          connectedAssets.map((asset) => (
            <div
              className="grid gap-2 border-b border-ink/8 px-4 py-3 text-sm last:border-0 md:grid-cols-[1.1fr_150px_180px_150px] md:items-center"
              key={`${asset.type}-${asset.id}`}
            >
              <div>
                <p className="font-semibold text-ink">{asset.name}</p>
                <p className="mt-1 text-xs text-ink/46">
                  Sincronizado em {formatDateTime(asset.lastSyncedAt)}
                </p>
              </div>
              <span className="text-ink/64">{asset.type}</span>
              <span className="font-mono text-xs text-ink/58">{asset.externalId}</span>
              <span className="rounded-full bg-white/72 px-3 py-1.5 text-xs font-semibold text-ink">
                {asset.status}
              </span>
            </div>
          ))
        ) : (
          <p className="px-4 py-5 text-sm leading-6 text-ink/62">
            Nenhum ativo Meta sincronizado ainda. Use “Sincronizar novamente” depois de conectar
            sua conta.
          </p>
        )}
      </div>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/58 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function normalizeWebhookStatusFilter(value?: string) {
  return value === "processed" || value === "failed" ? value : "all";
}

function formatOpenAIStatus(status: string) {
  switch (status) {
    case "connected":
      return "Conectada";
    case "disconnected":
      return "Desconectada";
    case "expired":
      return "Expirada";
    case "error":
      return "Com erro";
    case "pending":
    default:
      return "Pendente";
  }
}

function formatMetaAssetStatus(status: string) {
  switch (status) {
    case "connected":
    case "active":
      return "Conectado";
    case "pending":
      return "Pendente";
    case "expired":
      return "Expirado";
    case "error":
      return "Erro";
    case "disconnected":
    case "inactive":
    case "revoked":
      return "Desconectado";
    default:
      return "Pendente";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
