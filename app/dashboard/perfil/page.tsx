import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  KeyRound,
  Link2,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Unplug,
  UserPlus,
  UsersRound
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import {
  listLeadWebhookLogsByOrganization,
  type WebhookLogFilter
} from "@/lib/leads/webhook-events.repository";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { updateBrokerageNameAction } from "./actions";
import { WebhookLogsCard } from "./webhook-logs-card";
import { WebhookSetupCard } from "./webhook-setup-card";
import { getSiteUrl } from "@/lib/site/config";

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
  saved: "Chave OpenAI salva com sucesso.",
  tested: "Conexao OpenAI validada com sucesso.",
  removed: "Chave OpenAI removida com sucesso.",
  success: "Sincronizacao concluida com sucesso.",
  partial: "Sincronizacao concluida com avisos.",
  error: "Nao foi possivel concluir a atualizacao das contas conectadas."
};

const statusLabels: Record<string, string> = {
  connected: "Conectada",
  disconnected: "Desconectada",
  error: "Com erro",
  expired: "Expirada",
  pending: "Pendente"
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
  const brokerageFeedback = params?.brokerage
    ? brokerageFeedbackMessages[params.brokerage] ?? null
    : null;
  const integrationFeedback =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    null;
  const canEditBrokerageName = context.isManager || context.isSoloOwner;
  const canManageWebhookToken = context.isManager || context.isSoloOwner;
  const webhookFilter = normalizeWebhookStatusFilter(params?.webhookStatus);
  const webhookLogs =
    context.mode === "supabase" && context.workspace
      ? await listLeadWebhookLogsByOrganization({
          organizationId: context.workspace.id,
          filter: webhookFilter
        })
      : [];
  const webhookUrl = await getLeadWebhookUrl();
  const connectedAccounts = await getConnectedAccountsForCurrentUser();
  const isCompanySectionFocused = params?.section === "empresa";
  const highlightOpenAI = params?.highlight === "openai";
  const companyMessage = integrationFeedback ?? connectedAccounts.message ?? null;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Perfil"
        title="Configuracoes"
        description="Dados do usuario, nome comercial, empresa e contas conectadas em um unico lugar para a operacao ficar mais organizada."
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
          <p className="text-sm font-medium text-cobalt">OpenAI</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {connectedAccounts.openAIConnection
              ? statusLabels[connectedAccounts.openAIConnection.status] ?? "Conectada"
              : "Pendente"}
          </h2>
          <p className="mt-3 text-sm text-ink/58">
            {connectedAccounts.openAIConnection?.keyPreview ?? "Cadastre a chave da empresa"}
          </p>
        </article>
      </section>

      {brokerageFeedback ? (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {brokerageFeedback}
        </p>
      ) : null}

      {companyMessage ? (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {companyMessage}
        </p>
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
          <form action={updateBrokerageNameAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
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
            Voce esta em uma equipe. O owner ou os admins configuram o nome comercial usado no contato com clientes.
          </div>
        )}
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
              Aqui ficam os dados da empresa, as conexoes de Meta/OpenAI e a base para futuras integracoes com Facebook e Instagram.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-semibold text-ink">
            <Building2 size={16} aria-hidden="true" />
            {context.workspaceName}
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            <article className="rounded-[28px] bg-white/46 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">Meta</p>
                  <h3 className="mt-2 text-xl font-semibold">Conta conectada</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    Conecte a conta Meta da empresa para importar paginas, formularios e preparar campanhas com os ativos autorizados.
                  </p>
                </div>
                <Link2 size={20} aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoTile
                  label="Status"
                  value={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
                />
                <InfoTile
                  label="Paginas"
                  value={String(connectedAccounts.metaPages.length)}
                />
                <InfoTile
                  label="Formularios"
                  value={String(connectedAccounts.metaLeadForms.length)}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {connectedAccounts.canManageConnections ? (
                  <>
                    <Link
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white ${
                        connectedAccounts.metaConnection ? "bg-cobalt" : "bg-ink"
                      }`}
                      href={`/api/integrations/meta/connect?returnTo=${encodeURIComponent(PROFILE_COMPANY_SECTION_HREF)}`}
                    >
                      {connectedAccounts.metaConnection ? "Reconectar Meta" : "Conectar Meta"}
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
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

            <article className={`rounded-[28px] bg-white/46 p-5 ${highlightOpenAI ? "ring-2 ring-lagoon/28" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">OpenAI / API Key</p>
                  <h3 className="mt-2 text-xl font-semibold">Conta do cliente</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    O cliente usa a propria chave OpenAI para gerar mensagens e campanhas. Nao ha compra de creditos nesta fase.
                  </p>
                </div>
                <KeyRound size={20} aria-hidden="true" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoTile
                  label="Status"
                  value={
                    connectedAccounts.openAIConnection
                      ? statusLabels[connectedAccounts.openAIConnection.status] ?? "Conectada"
                      : "Pendente"
                  }
                />
                <InfoTile
                  label="Chave"
                  value={connectedAccounts.openAIConnection?.keyPreview ?? "Nao cadastrada"}
                />
                <InfoTile
                  label="Modo"
                  value="Conta do cliente"
                />
              </div>

              {connectedAccounts.canManageConnections ? (
                <div className="mt-5 space-y-3">
                  <form action="/api/integrations/openai/save" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" method="post">
                    <input name="returnTo" type="hidden" value={PROFILE_COMPANY_SECTION_HREF} />
                    <input
                      className="liquid-input"
                      name="apiKey"
                      placeholder="sk-..."
                      type="password"
                    />
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                      type="submit"
                    >
                      <Sparkles size={18} aria-hidden="true" />
                      {connectedAccounts.openAIConnection ? "Atualizar chave" : "Salvar chave"}
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    <form action="/api/integrations/openai/test" method="post">
                      <input name="returnTo" type="hidden" value={PROFILE_COMPANY_SECTION_HREF} />
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                        type="submit"
                      >
                        <ShieldCheck size={18} aria-hidden="true" />
                        Testar conexao
                      </button>
                    </form>
                    {connectedAccounts.openAIConnection ? (
                      <form action="/api/integrations/openai/disconnect" method="post">
                        <input name="returnTo" type="hidden" value={PROFILE_COMPANY_SECTION_HREF} />
                        <button
                          className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                          type="submit"
                        >
                          <Unplug size={18} aria-hidden="true" />
                          Remover chave
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] bg-white/50 p-4 text-sm leading-6 text-ink/64">
                  Apenas owner e admins podem salvar a chave OpenAI da empresa.
                </div>
              )}
            </article>
          </div>

          <div className="space-y-4">
            <article className="rounded-[28px] bg-white/46 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">Integracoes futuras</p>
                  <h3 className="mt-2 text-xl font-semibold">Meta, Facebook e Instagram</h3>
                </div>
                <ShieldCheck size={20} aria-hidden="true" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Facebook e Instagram vao usar a base de permissoes da Meta conectada aqui.",
                  "As contas conectadas passam a ser a origem de anuncios, formularios e futuras automacoes.",
                  "O perfil empresa concentra as configuracoes da operacao sem espalhar botoes no menu."
                ].map((item) => (
                  <div className="rounded-[22px] bg-white/60 px-4 py-3 text-sm leading-6 text-ink/64" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] bg-white/46 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-cobalt">Equipe</p>
                  <h3 className="mt-2 text-xl font-semibold">Convidar para a equipe</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    Em breve o supervisor podera gerar um link para convidar vendedores que entram automaticamente no modo simples da empresa.
                  </p>
                </div>
                <UsersRound size={20} aria-hidden="true" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink/10 px-4 py-3 text-sm font-semibold text-ink/62"
                  disabled
                  type="button"
                >
                  <UserPlus size={18} aria-hidden="true" />
                  Em breve
                </button>
                {(context.isManager || context.isSoloOwner) ? (
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/80"
                    href="/team/setup"
                  >
                    Ver equipe atual
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      </section>

      <WebhookSetupCard
        canManageToken={canManageWebhookToken}
        isSupabaseMode={context.mode === "supabase"}
        webhookUrl={webhookUrl}
      />

      <WebhookLogsCard
        filter={webhookFilter}
        isSupabaseMode={context.mode === "supabase"}
        logs={webhookLogs}
      />
    </div>
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

async function getLeadWebhookUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return `${getSiteUrl()}/api/webhooks/leads`;
  }

  return `${protocol}://${host}/api/webhooks/leads`;
}

function normalizeWebhookStatusFilter(value?: string): WebhookLogFilter {
  return value === "processed" || value === "failed" ? value : "all";
}
