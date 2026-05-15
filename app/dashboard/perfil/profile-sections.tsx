import { ArrowUpRight, Link2, RefreshCw } from "lucide-react";
import type { ConnectedAccountsState } from "@/lib/integrations/types";

const PROFILE_META_SECTION_HREF = "/dashboard/perfil/meta";

export function MetaConnectedAccountsSection({
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
    <section className="rounded-[34px] p-6 glass-strong">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-cobalt">Contas Meta conectadas</p>
          <h3 className="mt-2 text-2xl font-semibold">
            {connection?.metaUserName ?? "Nenhuma conta Meta conectada"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">
            Ativos disponíveis para páginas, formulários, contas de anúncio e importação manual de
            leads históricos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {connectedAccounts.canManageConnections ? (
            <>
              <form action="/api/integrations/meta/sync" method="post">
                <input name="returnTo" type="hidden" value={PROFILE_META_SECTION_HREF} />
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
                href={`/api/integrations/meta/connect?returnTo=${encodeURIComponent(PROFILE_META_SECTION_HREF)}`}
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
        <InfoTile label="Status" value={connection?.connectionStatusLabel ?? "Pendente"} />
        <InfoTile label="Última sincronização" value={formatDateTime(connection?.lastSyncAt)} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoTile label="Páginas conectadas" value={String(connectedAccounts.metaPages.length)} />
        <InfoTile
          label="Contas de anúncio"
          value={String(connectedAccounts.metaAdAccounts.length)}
        />
        <InfoTile label="Formulários de lead" value={String(connectedAccounts.metaLeadForms.length)} />
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

export function MetaOverviewCard({
  workspaceName,
  metaStatus,
  pagesCount,
  formsCount
}: {
  workspaceName: string;
  metaStatus: string;
  pagesCount: number;
  formsCount: number;
}) {
  return (
    <article className="rounded-[28px] bg-white/46 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cobalt">Meta</p>
          <h3 className="mt-2 text-xl font-semibold">Conta conectada</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            Conecte a conta Meta da empresa para importar paginas, formularios e preparar campanhas
            com os ativos autorizados.
          </p>
        </div>
        <Link2 size={20} aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoTile label="Status" value={metaStatus} />
        <InfoTile label="Paginas" value={String(pagesCount)} />
        <InfoTile label="Formularios" value={String(formsCount)} />
      </div>

      <div className="mt-5 rounded-[24px] bg-white/48 px-4 py-3 text-sm leading-6 text-ink/64">
        A conta Meta do workspace <strong className="text-ink">{workspaceName}</strong> sustenta a
        operação das páginas, formulários e contas de anúncio.
      </div>
    </article>
  );
}

export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/58 px-4 py-3">
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
