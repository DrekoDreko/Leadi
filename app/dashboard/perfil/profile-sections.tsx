import { ArrowUpRight, CheckCircle2, CircleAlert, RefreshCw, TimerReset, Unplug } from "lucide-react";
import type { ConnectedAccountsState } from "@/lib/integrations/types";

const PROFILE_META_SECTION_HREF = "/dashboard/perfil/meta";
const META_CONNECT_HREF = `/api/integrations/meta/connect?returnTo=${encodeURIComponent(
  PROFILE_META_SECTION_HREF
)}`;
const META_ACTIVE_STATUSES = new Set(["connected", "active"]);
const META_ATTENTION_STATUSES = new Set(["pending", "expired", "error", "disconnected", "inactive", "revoked"]);

type MetaSyncFeedItem = {
  id: string;
  assetTypeLabel: string;
  createdAt: string;
  message: string;
  status: string;
  title: string;
};

type MetaOperationalSummary = {
  activeAssetsCount: number;
  adAccountsCount: number;
  attentionAssetsCount: number;
  connectionDescription: string;
  connectionTone: "connected" | "warning" | "pending";
  connectionTitle: string;
  formsCount: number;
  hasConnection: boolean;
  lastSyncAt: string | null;
  latestSyncStatus: string;
  pagesCount: number;
  permissionsCount: number;
  recentSyncItems: MetaSyncFeedItem[];
  totalAssetsCount: number;
};

type MetaConnectionDiagnosisTone = "connected" | "warning" | "pending";

type MetaConnectionDiagnosisCheck = {
  id: string;
  label: string;
  stateLabel: string;
  description: string;
  tone: MetaConnectionDiagnosisTone;
};

type MetaConnectionDiagnostics = {
  categoryLabel: string;
  title: string;
  summary: string;
  nextStep: string;
  tone: MetaConnectionDiagnosisTone;
  checks: MetaConnectionDiagnosisCheck[];
};

type MetaOverviewCardProps = {
  billingNotice?: {
    actionLabel: string;
    message: string;
    title: string;
  } | null;
  connectedAccounts: ConnectedAccountsState;
  metaParam?: string | null;
  missingMetaOAuthEnvKeys?: string[];
  missingMetaSyncEnvKeys?: string[];
  syncParam?: string | null;
  workspaceName: string;
};

type MetaConnectionStatusValue = NonNullable<ConnectedAccountsState["metaConnection"]>["status"] | null;

export function MetaHeaderActions({
  canManage,
  isConnected
}: {
  canManage: boolean;
  isConnected: boolean;
}) {
  if (!canManage) {
    return (
      <span className="surface-pill inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold text-ink/62">
        Apenas owner e admins podem gerenciar.
      </span>
    );
  }

  return (
    <>
      {isConnected ? (
        <form action="/api/integrations/meta/sync" method="post">
          <input name="returnTo" type="hidden" value={PROFILE_META_SECTION_HREF} />
          <button
            className="surface-action-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-ink transition hover:brightness-105"
            type="submit"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Sincronizar
          </button>
        </form>
      ) : null}
      <a
        className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90"
        href={META_CONNECT_HREF}
      >
        {isConnected ? "Gerenciar conexão" : "Conectar Meta"}
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
    </>
  );
}

export function MetaOnboardingCard({
  connectedAccounts,
  billingNotice,
  metaParam,
  missingMetaOAuthEnvKeys = [],
  missingMetaSyncEnvKeys = [],
  syncParam
}: MetaOverviewCardProps) {
  const diagnostics = buildMetaConnectionDiagnostics(connectedAccounts, {
    billingNotice,
    metaParam,
    missingMetaOAuthEnvKeys,
    missingMetaSyncEnvKeys,
    syncParam
  });
  const missingEnvKeys = Array.from(new Set([...missingMetaOAuthEnvKeys, ...missingMetaSyncEnvKeys]));
  const blockedByEnv = missingEnvKeys.length > 0;
  const blockedByPermission = !connectedAccounts.canManageConnections || metaParam === "forbidden";
  const canConnect = !blockedByEnv && !blockedByPermission;

  const steps = [
    {
      title: "Conectar a conta",
      description: "Autorize o login da Meta para vincular o perfil da empresa a este workspace."
    },
    {
      title: "Sincronizar ativos",
      description: "Traga páginas, formulários e contas de anúncio autorizados na Meta."
    },
    {
      title: "Importar leads",
      description: "Use os formulários conectados para importar leads direto no CRM."
    }
  ];

  return (
    <section className="glass-strong rounded-[34px] p-6 md:p-8">
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-500/12 px-3 py-1.5 text-xs font-semibold text-slate-700">
        <Unplug size={14} aria-hidden="true" />
        Conexão não iniciada
      </span>
      <h3 className="mt-4 text-2xl font-semibold md:text-3xl">Conecte a conta Meta da empresa</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/62">
        Vincule o perfil Meta para importar páginas, formulários e contas de anúncio e preparar a
        importação de leads no CRM. Leva menos de um minuto.
      </p>

      <div className="mt-6">
        {canConnect ? (
          <a
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cloud transition hover:bg-ink/90"
            href={META_CONNECT_HREF}
          >
            Conectar Meta
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        ) : (
          <div className="flex items-start gap-3 rounded-[22px] bg-amber-500/12 px-4 py-3 text-sm leading-6 text-amber-900">
            <CircleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              {blockedByEnv
                ? diagnostics.summary
                : "Apenas owner e admins podem conectar a Meta. Entre com um perfil autorizado para continuar."}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div className="surface-card-muted rounded-[24px] p-5" key={step.title}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-cloud">
              {index + 1}
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-ink/62">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MetaConnectedAccountsSection({
  connectedAccounts
}: {
  connectedAccounts: ConnectedAccountsState;
}) {
  const hasAssets =
    connectedAccounts.metaPages.length > 0 ||
    connectedAccounts.metaAdAccounts.length > 0 ||
    connectedAccounts.metaLeadForms.length > 0;

  return (
    <section className="rounded-[34px] p-6 glass-strong">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cobalt">Ativos sincronizados</p>
          <h3 className="mt-1 text-2xl font-semibold">Páginas, formulários e contas de anúncio</h3>
          <p className="mt-1 text-sm text-ink/62">Ativos prontos para importar leads no CRM.</p>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-cloud transition hover:bg-ink/90"
          href="/dashboard/leads"
          title="Importar leads no CRM"
        >
          Importar leads
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="mt-6 flex flex-col gap-5">
          {!hasAssets ? (
            <p className="surface-card-muted rounded-[24px] px-4 py-5 text-sm leading-6 text-ink/62">
              Nenhum ativo Meta sincronizado ainda. Use “Sincronizar” no topo da página depois de conectar sua conta.
            </p>
          ) : (
            <>
              {connectedAccounts.metaPages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-ink">Páginas e Formulários</h4>
                  <div className="surface-card-muted overflow-hidden rounded-[24px]">
                    <div className="hidden grid-cols-[1.1fr_180px_150px] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid">
                      <span>Ativo</span>
                      <span>ID externo</span>
                      <span>Status</span>
                    </div>
                    {connectedAccounts.metaPages.map((page) => {
                      const forms = connectedAccounts.metaLeadForms.filter(
                        (f) => f.pageId === page.metaPageId
                      );
                      return (
                        <div className="border-b border-ink/8 last:border-0" key={`page-${page.id}`}>
                          <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1.1fr_180px_150px] md:items-center">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cobalt">
                                  Página
                               </span>
                                <p className="font-semibold text-ink">{page.name}</p>
                              </div>
                              <p className="mt-1 text-xs text-ink/46">
                                Sincronizado em {formatDateTime(page.lastSyncAt)}
                              </p>
                            </div>
                            <span className="font-mono text-xs text-ink/58">{page.metaPageId}</span>
                            <span className="w-fit surface-pill rounded-full px-3 py-1.5 text-xs font-semibold text-ink">
                              {formatMetaAssetStatus(page.status)}
                            </span>
                          </div>

                          {forms.length > 0 ? (
                            <div className="bg-foreground/[0.02]">
                              {forms.map((form) => (
                                <div
                                  className="grid gap-2 border-t border-ink/4 px-4 py-3 pl-5 text-sm md:grid-cols-[1.1fr_180px_150px] md:items-center md:pl-8"
                                  key={`form-${form.id}`}
                                >
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-lagoon">
                                        Formulário
                                     </span>
                                      <p className="font-medium text-ink">{form.name}</p>
                                    </div>
                                    <p className="mt-1 text-xs text-ink/46">
                                      Sincronizado em{" "}
                                      {formatDateTime(form.lastSyncAt ?? form.lastLeadSyncAt)}
                                    </p>
                                  </div>
                                  <span className="font-mono text-xs text-ink/58">
                                    {form.metaFormId}
                                  </span>
                                  <span className="w-fit surface-pill rounded-full px-3 py-1.5 text-xs font-semibold text-ink">
                                    {formatMetaAssetStatus(form.status)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border-t border-ink/4 px-5 py-3 text-xs text-ink/50 md:pl-8">
                              Nenhum formulário sincronizado para esta página.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {connectedAccounts.metaLeadForms.filter(
                (f) => !connectedAccounts.metaPages.some((p) => p.metaPageId === f.pageId)
              ).length > 0 && (
                <div className="mt-2 space-y-3">
                  <h4 className="text-sm font-semibold text-ink">Outros Formulários</h4>
                  <div className="surface-card-muted overflow-hidden rounded-[24px]">
                    {connectedAccounts.metaLeadForms
                      .filter((f) => !connectedAccounts.metaPages.some((p) => p.metaPageId === f.pageId))
                      .map((form) => (
                        <div
                          className="grid gap-2 border-b border-ink/8 px-4 py-3 text-sm last:border-0 md:grid-cols-[1.1fr_180px_150px] md:items-center"
                          key={`form-${form.id}`}
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-lagoon/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-lagoon">
                                Formulário
                             </span>
                              <p className="font-medium text-ink">{form.name}</p>
                            </div>
                            <p className="mt-1 text-xs text-ink/46">
                              Sincronizado em{" "}
                              {formatDateTime(form.lastSyncAt ?? form.lastLeadSyncAt)}
                            </p>
                          </div>
                          <span className="font-mono text-xs text-ink/58">{form.metaFormId}</span>
                          <span className="w-fit surface-pill rounded-full px-3 py-1.5 text-xs font-semibold text-ink">
                            {formatMetaAssetStatus(form.status)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {connectedAccounts.metaAdAccounts.length > 0 && (
                <div className="mt-2 space-y-3">
                  <h4 className="text-sm font-semibold text-ink">Contas de Anúncio</h4>
                  <div className="surface-card-muted overflow-hidden rounded-[24px]">
                    <div className="hidden grid-cols-[1.1fr_180px_150px] gap-3 border-b border-ink/8 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-ink/42 md:grid">
                      <span>Ativo</span>
                      <span>ID externo</span>
                      <span>Status</span>
                    </div>
                    {connectedAccounts.metaAdAccounts.map((account) => (
                      <div
                        className="grid gap-2 border-b border-ink/8 px-4 py-3 text-sm last:border-0 md:grid-cols-[1.1fr_180px_150px] md:items-center"
                        key={`ad-${account.id}`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink">
                              Conta de anúncio
                           </span>
                            <p className="font-semibold text-ink">{account.name}</p>
                          </div>
                          <p className="mt-1 text-xs text-ink/46">
                            Sincronizado em {formatDateTime(account.lastSyncAt)}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-ink/58">
                          {account.metaAdAccountId}
                        </span>
                        <span className="w-fit surface-pill rounded-full px-3 py-1.5 text-xs font-semibold text-ink">
                          {formatMetaAssetStatus(account.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </section>
  );
}

export function MetaOverviewCard({
  connectedAccounts,
  billingNotice,
  metaParam,
  missingMetaOAuthEnvKeys = [],
  missingMetaSyncEnvKeys = [],
  syncParam
}: MetaOverviewCardProps) {
  const connection = connectedAccounts.metaConnection;
  const summary = buildMetaOperationalSummary(connectedAccounts);
  const diagnostics = buildMetaConnectionDiagnostics(connectedAccounts, {
    billingNotice,
    metaParam,
    missingMetaOAuthEnvKeys,
    missingMetaSyncEnvKeys,
    syncParam
  });
  const connectionTone = getMetaConnectionToneStyles(summary.connectionTone);
  const diagnosisTone = getMetaConnectionToneStyles(diagnostics.tone);
  const diagnosticsOpenByDefault = diagnostics.tone !== "connected";

  return (
    <article className="glass-strong rounded-[34px] p-6">
      {/* Hero: fonte de verdade da conexão */}
      <div className="max-w-2xl">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${connectionTone.badgeClassName}`}
        >
          {connectionTone.icon}
          {summary.connectionTitle}
        </span>
        <h3 className="mt-3 text-2xl font-semibold">{connection?.metaUserName ?? "Conta Meta"}</h3>
        <p className="mt-1 text-sm text-ink/58">
          ID {connection?.metaUserId ?? "—"} · Última sincronização {formatDateTime(summary.lastSyncAt)}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink/62">{summary.connectionDescription}</p>
      </div>

      {/* Próximo passo em destaque */}
      <div className="surface-card-muted mt-5 rounded-[24px] px-4 py-3 text-sm leading-6 text-ink/64">
        <span className="font-semibold text-ink">Próximo passo:</span> {diagnostics.nextStep}
      </div>

      {/* Faixa de números consolidada */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Páginas" value={String(summary.pagesCount)} />
        <InfoTile label="Formulários" value={String(summary.formsCount)} />
        <InfoTile label="Contas de anúncio" value={String(summary.adAccountsCount)} />
        <InfoTile label="Permissões" value={String(summary.permissionsCount)} />
      </div>
      <p className="mt-2 px-1 text-xs text-ink/50">
        {summary.activeAssetsCount} pronto(s) · {summary.attentionAssetsCount} com alerta ·{" "}
        {summary.totalAssetsCount} no total
      </p>

      {/* Últimas sincronizações */}
      <article className="surface-card-muted mt-5 rounded-[28px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cobalt">Últimas sincronizações</p>
            <p className="mt-1 text-sm text-ink/62">
              Eventos recentes para identificar sucesso, alerta ou erro sem sair da área Meta.
            </p>
          </div>
          <TimerReset size={20} aria-hidden="true" className="text-cobalt" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {summary.recentSyncItems.length ? (
            summary.recentSyncItems.map((item) => {
              const syncTone = getMetaSyncToneStyles(item.status);

              return (
                <div className="surface-card-muted rounded-[22px] px-4 py-3" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${syncTone.badgeClassName}`}
                      >
                        {syncTone.icon}
                        {syncTone.label}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">
                        {item.assetTypeLabel}
                      </span>
                    </div>
                    <span className="text-xs text-ink/46">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/62">{item.message}</p>
                </div>
              );
            })
          ) : (
            <div className="surface-card-muted rounded-[22px] px-4 py-3 text-sm leading-6 text-ink/62">
              Ainda não existem eventos recentes de sincronização Meta neste workspace.
            </div>
          )}
        </div>
      </article>

      {/* Diagnóstico técnico e permissões (recolhível) */}
      <details
        className="surface-card-muted mt-5 rounded-[28px] p-5"
        open={diagnosticsOpenByDefault}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink">Diagnóstico técnico e permissões</span>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${diagnosisTone.badgeClassName}`}
          >
            {diagnosisTone.icon}
            {diagnostics.categoryLabel}
          </span>
        </summary>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {diagnostics.checks.map((check) => {
            const checkTone = getMetaConnectionToneStyles(check.tone);

            return (
              <div className="surface-card-muted rounded-[22px] px-4 py-3" key={check.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">
                    {check.label}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${checkTone.badgeClassName}`}
                  >
                    {checkTone.icon}
                    {check.stateLabel}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/64">{check.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">
            Permissões concedidas
          </p>
          <div className="mt-2 surface-card-muted rounded-[22px] p-4">
            {connection?.permissions.length ? (
              <div className="flex flex-wrap gap-2">
                {connection.permissions.map((permission) => (
                  <span
                    className="surface-pill rounded-full px-3 py-1.5 text-xs font-semibold text-ink/70"
                    key={permission}
                  >
                    {permission}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/58">Permissões ainda não disponíveis.</p>
            )}
          </div>
        </div>
      </details>
    </article>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card-muted rounded-[22px] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function formatOpenAIStatus(status: string) {
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

export function formatMetaAssetStatus(status: string) {
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

export function formatDateTime(value?: string | null) {
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

export function buildMetaOperationalSummary(
  connectedAccounts: ConnectedAccountsState
): MetaOperationalSummary {
  const metaConnection = connectedAccounts.metaConnection;
  const assets = [
    ...connectedAccounts.metaPages.map((page) => ({
      status: page.status,
      lastSyncAt: page.lastSyncAt
    })),
    ...connectedAccounts.metaAdAccounts.map((account) => ({
      status: account.status,
      lastSyncAt: account.lastSyncAt
    })),
    ...connectedAccounts.metaLeadForms.map((form) => ({
      status: form.status,
      lastSyncAt: form.lastSyncAt ?? form.lastLeadSyncAt
    }))
  ];
  const activeAssetsCount = assets.filter((asset) => META_ACTIVE_STATUSES.has(asset.status)).length;
  const attentionAssetsCount = assets.filter((asset) => META_ATTENTION_STATUSES.has(asset.status)).length;
  const recentSyncItems = connectedAccounts.syncLogs
    .filter((log) => log.provider === "meta")
    .slice(0, 4)
    .map((log) => ({
      id: log.id,
      assetTypeLabel: formatMetaAssetType(log.assetType),
      createdAt: log.createdAt,
      message: log.message,
      status: log.status,
      title: log.title
    }));
  const latestSyncStatus = recentSyncItems[0]
    ? getMetaSyncToneStyles(recentSyncItems[0].status).label
    : metaConnection?.lastSyncAt
      ? "Conexao registrada"
      : "Aguardando primeira sync";

  return {
    activeAssetsCount,
    adAccountsCount: connectedAccounts.metaAdAccounts.length,
    attentionAssetsCount,
    connectionDescription: getMetaConnectionDescription(metaConnection?.status ?? null, attentionAssetsCount),
    connectionTone: getMetaConnectionTone(metaConnection?.status ?? null),
    connectionTitle: getMetaConnectionTitle(metaConnection?.status ?? null),
    formsCount: connectedAccounts.metaLeadForms.length,
    hasConnection: Boolean(metaConnection),
    lastSyncAt: resolveLatestMetaSyncAt(connectedAccounts),
    latestSyncStatus,
    pagesCount: connectedAccounts.metaPages.length,
    permissionsCount: metaConnection?.permissions.length ?? 0,
    recentSyncItems,
    totalAssetsCount: assets.length
  };
}

export function buildMetaConnectionDiagnostics(
  connectedAccounts: ConnectedAccountsState,
  options: {
    billingNotice?: MetaOverviewCardProps["billingNotice"];
    metaParam?: string | null;
    missingMetaOAuthEnvKeys?: string[];
    missingMetaSyncEnvKeys?: string[];
    syncParam?: string | null;
  } = {}
): MetaConnectionDiagnostics {
  const metaConnection = connectedAccounts.metaConnection;
  const missingMetaOAuthEnvKeys = options.missingMetaOAuthEnvKeys ?? [];
  const missingMetaSyncEnvKeys = options.missingMetaSyncEnvKeys ?? [];
  const missingEnvKeys = Array.from(
    new Set([...missingMetaOAuthEnvKeys, ...missingMetaSyncEnvKeys])
  );
  const latestMetaSyncLog = connectedAccounts.syncLogs.find((log) => log.provider === "meta") ?? null;
  const hasAnyMetaAssets =
    connectedAccounts.metaPages.length > 0 ||
    connectedAccounts.metaAdAccounts.length > 0 ||
    connectedAccounts.metaLeadForms.length > 0;
  const billingNotice = options.billingNotice ?? null;

  const checks: MetaConnectionDiagnosisCheck[] = [
    buildEnvironmentDiagnosisCheck(missingEnvKeys),
    buildConnectionDiagnosisCheck(connectedAccounts, options.metaParam ?? null),
    buildSyncDiagnosisCheck(connectedAccounts, options.syncParam ?? null),
    buildBillingDiagnosisCheck(billingNotice)
  ];

  if (missingEnvKeys.length > 0) {
    return {
      categoryLabel: "Ambiente",
      title: "Ambiente da Meta ainda incompleto",
      summary: `O servidor ainda nao consegue sustentar todo o fluxo da Meta porque faltam ${formatEnvKeyList(missingEnvKeys)}.`,
      nextStep:
        "Configure essas variaveis no servidor, publique novamente o ambiente e tente conectar a Meta de novo.",
      tone: "warning",
      checks
    };
  }

  if (connectedAccounts.mode === "error") {
    return {
      categoryLabel: "Codigo ou infraestrutura",
      title: "Leitura da integracao falhou antes do diagnostico completo",
      summary:
        connectedAccounts.message ??
        "Nao foi possivel carregar o estado da integracao Meta para este workspace.",
      nextStep:
        "Revise os logs do servidor e a configuracao do Supabase admin antes de repetir a sincronizacao.",
      tone: "warning",
      checks
    };
  }

  if ((options.metaParam ?? null) === "forbidden" || !connectedAccounts.canManageConnections) {
    return {
      categoryLabel: "Acesso",
      title: "A conexao Meta depende de permissao de gerenciamento",
      summary:
        "Este workspace exige um owner ou admin valido para iniciar OAuth, reconectar a conta e rodar novas sincronizacoes.",
      nextStep:
        "Entre com um owner/admin ou peca para alguem com essa permissao revisar a conexao Meta.",
      tone: "pending",
      checks
    };
  }

  if (!metaConnection) {
    return {
      categoryLabel: "Conexao",
      title: "Nenhuma conta Meta conectada ainda",
      summary:
        "O ambiente parece pronto, mas ainda nao existe token Meta salvo para este workspace.",
      nextStep:
        "Use o botao Conectar Meta, conclua o OAuth e depois rode a primeira sincronizacao dos ativos.",
      tone: "pending",
      checks
    };
  }

  if (metaConnection.status === "expired") {
    return {
      categoryLabel: "Conexao",
      title: "O token da Meta expirou",
      summary:
        metaConnection.lastError ??
        "A conta Meta perdeu validade para continuar sincronizando paginas, formularios e contas de anuncio.",
      nextStep:
        "Reconecte a conta Meta para renovar o token e repita a sincronizacao dos ativos.",
      tone: "warning",
      checks
    };
  }

  if (metaConnection.status === "disconnected" || metaConnection.status === "error") {
    return {
      categoryLabel: "Conexao",
      title: "A conexao Meta precisa de revisao",
      summary:
        metaConnection.lastError ??
        "A conta segue registrada, mas a conexao atual nao esta saudavel para operar com seguranca.",
      nextStep:
        "Gerencie a conexao, valide as permissoes concedidas na Meta e sincronize novamente apos reconectar.",
      tone: "warning",
      checks
    };
  }

  if (
    (options.syncParam ?? null) === "failed" ||
    latestMetaSyncLog?.status === "failed" ||
    latestMetaSyncLog?.status === "error"
  ) {
    return {
      categoryLabel: "Sincronizacao",
      title: "A ultima sincronizacao Meta falhou",
      summary:
        latestMetaSyncLog?.message ??
        "A conta esta conectada, mas a ultima tentativa de atualizar ativos nao concluiu com sucesso.",
      nextStep:
        "Revise o erro da ultima sync, confirme se a conta Meta ainda tem acesso aos ativos e sincronize novamente.",
      tone: "warning",
      checks
    };
  }

  if (latestMetaSyncLog?.status === "warning") {
    return {
      categoryLabel: "Sincronizacao",
      title: "A sincronizacao concluiu com alerta",
      summary:
        latestMetaSyncLog.message ??
        "Parte dos ativos da Meta ainda pede revisao antes de a operacao ficar totalmente pronta.",
      nextStep:
        "Revise os ativos com alerta, confira paginas e formularios liberados na Meta e rode uma nova sync se necessario.",
      tone: "warning",
      checks
    };
  }

  if (!hasAnyMetaAssets || !metaConnection.lastSyncAt) {
    return {
      categoryLabel: "Sincronizacao",
      title: "A conexao existe, mas a operacao ainda espera a primeira sync util",
      summary:
        "Ja existe conta Meta vinculada, porem a tela ainda nao recebeu ativos suficientes para uso operacional.",
      nextStep:
        "Sincronize novamente e confirme se a conta conectada tem paginas, formularios e contas de anuncio autorizados.",
      tone: "pending",
      checks
    };
  }

  if (billingNotice) {
    return {
      categoryLabel: "Billing",
      title: "A conexao parece saudavel, mas o billing pede atencao",
      summary: billingNotice.message,
      nextStep: `${billingNotice.actionLabel} para evitar bloqueios operacionais depois da conexao Meta.`,
      tone: "warning",
      checks
    };
  }

  return {
    categoryLabel: "Operacao pronta",
    title: "Conexao Meta pronta para uso operacional",
    summary:
      "Ambiente, token e sincronizacao principal parecem consistentes para seguir com paginas, formularios e contas de anuncio deste workspace.",
    nextStep:
      "Mantenha a sincronizacao em dia sempre que houver mudanca de permissao, pagina ou formulario na Meta.",
    tone: "connected",
    checks
  };
}

function buildEnvironmentDiagnosisCheck(missingEnvKeys: string[]): MetaConnectionDiagnosisCheck {
  if (!missingEnvKeys.length) {
    return {
      id: "environment",
      label: "Ambiente do servidor",
      stateLabel: "Configurado",
      description: "Nao ha ausencia conhecida de env para OAuth e sincronizacao Meta neste ambiente.",
      tone: "connected"
    };
  }

  return {
    id: "environment",
    label: "Ambiente do servidor",
    stateLabel: "Ajuste necessario",
    description: `Faltam ${formatEnvKeyList(missingEnvKeys)} para sustentar OAuth e sincronizacao Meta com seguranca.`,
    tone: "warning"
  };
}

function buildConnectionDiagnosisCheck(
  connectedAccounts: ConnectedAccountsState,
  metaParam: string | null
): MetaConnectionDiagnosisCheck {
  if (metaParam === "forbidden" || !connectedAccounts.canManageConnections) {
    return {
      id: "connection",
      label: "Conta e permissao",
      stateLabel: "Acesso restrito",
      description: "Somente owner e admin podem conectar, reconectar ou sincronizar a integracao Meta.",
      tone: "warning"
    };
  }

  if (!connectedAccounts.metaConnection) {
    return {
      id: "connection",
      label: "Conta e token",
      stateLabel: "Nao conectado",
      description: "Ainda nao existe uma conta Meta autorizada para este workspace.",
      tone: "pending"
    };
  }

  const metaConnection = connectedAccounts.metaConnection;

  if (metaConnection.status === "connected") {
    return {
      id: "connection",
      label: "Conta e token",
      stateLabel: "Conectado",
      description: metaConnection.metaUserName
        ? `A conta ${metaConnection.metaUserName} esta vinculada com ${metaConnection.permissions.length} permissao(oes) registradas.`
        : "Existe uma conta Meta vinculada e pronta para novas sincronizacoes.",
      tone: "connected"
    };
  }

  return {
    id: "connection",
    label: "Conta e token",
    stateLabel: getMetaConnectionTitle(metaConnection.status),
    description:
      metaConnection.lastError ??
      "A conta Meta foi registrada, mas o token ou o status atual ainda pede revisao antes da proxima sync.",
    tone: metaConnection.status === "pending" ? "pending" : "warning"
  };
}

function buildSyncDiagnosisCheck(
  connectedAccounts: ConnectedAccountsState,
  syncParam: string | null
): MetaConnectionDiagnosisCheck {
  const latestMetaSyncLog = connectedAccounts.syncLogs.find((log) => log.provider === "meta") ?? null;
  const totalAssets =
    connectedAccounts.metaPages.length +
    connectedAccounts.metaAdAccounts.length +
    connectedAccounts.metaLeadForms.length;

  if (syncParam === "failed" || latestMetaSyncLog?.status === "failed" || latestMetaSyncLog?.status === "error") {
    return {
      id: "sync",
      label: "Ultima sincronizacao",
      stateLabel: "Com erro",
      description:
        latestMetaSyncLog?.message ??
        "A tentativa mais recente de sincronizar os ativos Meta nao concluiu com sucesso.",
      tone: "warning"
    };
  }

  if (latestMetaSyncLog?.status === "warning") {
    return {
      id: "sync",
      label: "Ultima sincronizacao",
      stateLabel: "Com alerta",
      description:
        latestMetaSyncLog.message ??
        "A sincronizacao terminou com pendencias e precisa de revisao operacional.",
      tone: "warning"
    };
  }

  if (!connectedAccounts.metaConnection?.lastSyncAt || totalAssets === 0) {
    return {
      id: "sync",
      label: "Ultima sincronizacao",
      stateLabel: "Pendente",
      description: "A tela ainda nao registrou uma sync util com ativos suficientes para uso operacional.",
      tone: "pending"
    };
  }

  return {
    id: "sync",
    label: "Ultima sincronizacao",
    stateLabel: "Em dia",
    description: latestMetaSyncLog?.message
      ? `Ultimo evento registrado: ${latestMetaSyncLog.message}`
      : `Os ativos Meta deste workspace ja tiveram pelo menos uma sincronizacao em ${formatDateTime(
          connectedAccounts.metaConnection.lastSyncAt
        )}.`,
    tone: "connected"
  };
}

function buildBillingDiagnosisCheck(
  billingNotice: MetaOverviewCardProps["billingNotice"]
): MetaConnectionDiagnosisCheck {
  if (!billingNotice) {
    return {
      id: "billing",
      label: "Billing e operacao",
      stateLabel: "Sem bloqueio",
      description:
        "Nao existe alerta atual de assinatura para este workspace na camada de operacao comercial.",
      tone: "connected"
    };
  }

  return {
    id: "billing",
    label: "Billing e operacao",
    stateLabel: "Revisar assinatura",
    description: billingNotice.message,
    tone: "warning"
  };
}

function formatEnvKeyList(keys: string[]) {
  if (keys.length === 1) {
    return `a variavel ${keys[0]}`;
  }

  if (keys.length === 2) {
    return `as variaveis ${keys[0]} e ${keys[1]}`;
  }

  return `as variaveis ${keys.slice(0, -1).join(", ")} e ${keys[keys.length - 1]}`;
}

function getMetaConnectionTitle(status: MetaConnectionStatusValue) {
  switch (status) {
    case "connected":
      return "Conexao ativa";
    case "error":
      return "Conexao com alerta";
    case "expired":
      return "Conexao expirada";
    case "disconnected":
      return "Conexao desconectada";
    case "pending":
      return "Conexao pendente";
    default:
      return "Conexao nao iniciada";
  }
}

function getMetaConnectionDescription(
  status: MetaConnectionStatusValue,
  attentionAssetsCount: number
) {
  switch (status) {
    case "connected":
      return attentionAssetsCount
        ? `A conta Meta esta conectada, mas ${attentionAssetsCount} ativo(s) ainda pedem revisao operacional.`
        : "A conta Meta esta conectada e pronta para listar paginas, formularios e contas de anuncio.";
    case "error":
      return "A conta Meta segue vinculada, mas a operacao registrou erro recente e pede revisao antes da proxima sync.";
    case "expired":
      return "O acesso Meta expirou. A operacao precisa reconectar a conta para retomar sincronizacoes e importacoes.";
    case "disconnected":
      return "A conta Meta foi desconectada. Reconecte o workspace para voltar a sincronizar ativos.";
    case "pending":
      return "A conexao Meta foi iniciada, mas ainda nao ha uma sincronizacao suficiente para uso operacional.";
    default:
      return "Conecte a conta Meta da empresa para importar paginas, formularios e preparar campanhas com os ativos autorizados.";
  }
}

function getMetaConnectionTone(status: MetaConnectionStatusValue): MetaOperationalSummary["connectionTone"] {
  switch (status) {
    case "connected":
      return "connected";
    case "error":
    case "expired":
      return "warning";
    default:
      return "pending";
  }
}

function resolveLatestMetaSyncAt(connectedAccounts: ConnectedAccountsState) {
  const timestamps = [
    connectedAccounts.metaConnection?.lastSyncAt ?? null,
    ...connectedAccounts.metaPages.map((page) => page.lastSyncAt),
    ...connectedAccounts.metaAdAccounts.map((account) => account.lastSyncAt),
    ...connectedAccounts.metaLeadForms.map((form) => form.lastSyncAt ?? form.lastLeadSyncAt),
    ...connectedAccounts.syncLogs
      .filter((log) => log.provider === "meta")
      .map((log) => log.createdAt)
  ].filter(Boolean) as string[];

  if (!timestamps.length) {
    return null;
  }

  return timestamps
    .slice()
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
}

function formatMetaAssetType(assetType: string) {
  switch (assetType) {
    case "meta_connection":
      return "Conexao";
    case "meta_assets":
      return "Ativos";
    case "meta_pages":
      return "Paginas";
    case "meta_lead_forms":
      return "Formularios";
    case "meta_ad_accounts":
      return "Contas de anuncio";
    case "meta_ad_image":
      return "Criativos";
    default:
      return "Meta";
  }
}

function getMetaConnectionToneStyles(tone: MetaOperationalSummary["connectionTone"]) {
  switch (tone) {
    case "connected":
      return {
        badgeClassName: "bg-emerald-500/12 text-emerald-700",
        icon: <CheckCircle2 size={14} aria-hidden="true" />
      };
    case "warning":
      return {
        badgeClassName: "bg-amber-500/14 text-amber-800",
        icon: <CircleAlert size={14} aria-hidden="true" />
      };
    default:
      return {
        badgeClassName: "bg-slate-500/12 text-slate-700",
        icon: <Unplug size={14} aria-hidden="true" />
      };
  }
}

function getMetaSyncToneStyles(status: string) {
  switch (status) {
    case "success":
      return {
        badgeClassName: "bg-emerald-500/12 text-emerald-700",
        icon: <CheckCircle2 size={12} aria-hidden="true" />,
        label: "Sync concluida"
      };
    case "warning":
      return {
        badgeClassName: "bg-amber-500/14 text-amber-800",
        icon: <CircleAlert size={12} aria-hidden="true" />,
        label: "Sync com alerta"
      };
    case "running":
      return {
        badgeClassName: "bg-sky-500/12 text-sky-700",
        icon: <RefreshCw size={12} aria-hidden="true" />,
        label: "Sync em andamento"
      };
    case "failed":
    case "error":
    default:
      return {
        badgeClassName: "bg-rose-500/12 text-rose-700",
        icon: <CircleAlert size={12} aria-hidden="true" />,
        label: "Sync com erro"
      };
  }
}
