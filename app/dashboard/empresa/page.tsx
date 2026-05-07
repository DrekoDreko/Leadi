import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Link2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unplug,
  WandSparkles
} from "lucide-react";
import { PageHeading, Metric } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";

const statusFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  year: "numeric"
});

const statusLabels: Record<string, string> = {
  connected: "Conectada",
  disconnected: "Desconectada",
  expired: "Expirada",
  pending: "Pendente",
  success: "Concluida",
  warning: "Com aviso",
  failed: "Falha",
  running: "Em andamento"
};

const statusToneClasses: Record<string, string> = {
  connected: "bg-lagoon text-white",
  disconnected: "bg-white/58 text-ink",
  expired: "bg-signal text-ink",
  pending: "bg-white/58 text-ink/72",
  success: "bg-lagoon text-white",
  warning: "bg-signal text-ink",
  failed: "bg-ink text-white",
  running: "bg-cobalt text-white"
};

export default async function EmpresaPage({
  searchParams
}: {
  searchParams?: Promise<{
    meta?: string;
    openai?: string;
    sync?: string;
  }>;
}) {
  const [context, state, params] = await Promise.all([
    requireCompletedProfile(),
    getConnectedAccountsForCurrentUser(),
    searchParams
  ]);

  const metaMessage = params?.meta ? getMetaFeedback(params.meta) : null;
  const openAIMessage = params?.openai ? getOpenAIFeedback(params.openai) : null;
  const syncMessage = params?.sync ? getSyncFeedback(params.sync) : null;
  const combinedMessage = metaMessage ?? openAIMessage ?? syncMessage ?? state.message ?? null;
  const lastSyncAt = pickLatestTimestamp([
    state.metaConnection?.lastSyncAt,
    state.openAIConnection?.lastValidatedAt,
    state.syncLogs[0]?.createdAt
  ]);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Empresa"
        title="Contas conectadas"
        description="Conecte sua conta Meta e sua chave OpenAI para que a LeadHealth importe ativos, prepare campanhas e ajude no acompanhamento comercial com mais contexto."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-sm font-semibold text-ink">
          <ShieldCheck size={18} aria-hidden="true" />
          {context.workspaceName}
        </span>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard/perfil"
        >
          Ver perfil
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      {combinedMessage ? (
        <div className="rounded-[28px] border border-white/58 bg-white/54 px-4 py-3 text-sm font-medium text-ink shadow-soft">
          {combinedMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Meta"
          value={state.metaConnection?.connectionStatusLabel ?? "Pendente"}
          note={state.metaConnection?.connectionStatusLabel ?? "Conecte a conta do cliente"}
          tone={state.metaConnection?.status === "connected" ? "teal" : "yellow"}
        />
        <Metric
          label="OpenAI"
          value={state.openAIConnection?.status ? statusLabels[state.openAIConnection.status] : "Pendente"}
          note={
            state.openAIConnection?.status === "connected"
              ? "Chave validada"
              : state.openAIConnection
                ? "Revise a chave do cliente"
                : "Cadastre a chave do cliente"
          }
          tone={state.openAIConnection?.status === "connected" ? "blue" : "yellow"}
        />
        <Metric
          label="Ativos Meta"
          value={String(state.metaPages.length + state.metaAdAccounts.length + state.metaLeadForms.length)}
          note="Páginas, contas e formulários"
          tone="dark"
        />
        <Metric
          label="Última sync"
          value={lastSyncAt ? "Atualizado" : "Sem dados"}
          note={lastSyncAt ? formatDateTime(lastSyncAt) : "Aguardando primeira sincronização"}
          tone="blue"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-strong rounded-[34px] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt text-white">
                  <Link2 size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-cobalt">Meta</p>
                  <h2 className="text-2xl font-semibold">Conta do cliente</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink/64">
                Conecte a conta Meta da empresa para que a LeadHealth consiga importar leads,
                ler páginas, acompanhar formulários e preparar campanhas com revisão antes da
                publicação.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {state.canManageConnections ? (
                <>
                  <Link
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white ${
                      state.metaConnection?.status === "connected" ? "bg-cobalt" : "bg-ink"
                    }`}
                    href="/api/integrations/meta/connect?returnTo=/dashboard/empresa"
                  >
                    {state.metaConnection ? "Reconectar Meta" : "Conectar Meta"}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                  <form action="/api/integrations/meta/sync" method="post">
                    <input name="returnTo" type="hidden" value="/dashboard/empresa" />
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-white/56 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/72"
                      type="submit"
                    >
                      <RefreshCw size={18} aria-hidden="true" />
                      Sincronizar ativos
                    </button>
                  </form>
                  {state.metaConnection ? (
                    <form action="/api/integrations/meta/disconnect" method="post">
                      <input name="returnTo" type="hidden" value="/dashboard/empresa" />
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-white/56 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/72"
                        type="submit"
                      >
                        <Unplug size={18} aria-hidden="true" />
                        Desconectar
                      </button>
                    </form>
                  ) : null}
                </>
              ) : (
                <div className="rounded-full bg-white/56 px-4 py-3 text-sm font-semibold text-ink/64">
                  Apenas a conta administradora pode alterar conexões.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <InfoChip label="Status" value={state.metaConnection ? statusLabels[state.metaConnection.status] : "Pendente"} />
            <InfoChip
              label="Conta"
              value={state.metaConnection?.metaUserName ?? "Ainda não conectada"}
            />
            <InfoChip
              label="Conectada em"
              value={state.metaConnection?.connectedAt ? formatDateTime(state.metaConnection.connectedAt) : "Aguardando"}
            />
            <InfoChip
              label="Última sync"
              value={state.metaConnection?.lastSyncAt ? formatDateTime(state.metaConnection.lastSyncAt) : "Sem dados"}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(state.metaConnection?.scopes ?? []).length > 0 ? (
              state.metaConnection?.scopes.map((scope) => (
                <span
                  className="rounded-full bg-white/54 px-3 py-1.5 text-xs font-semibold text-ink/70"
                  key={scope}
                >
                  {scope}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-white/54 px-3 py-1.5 text-xs font-semibold text-ink/54">
                Nenhuma permissão sincronizada ainda
              </span>
            )}
          </div>
        </article>

        <article className="glass rounded-[34px] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink">
              <WandSparkles size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-cobalt">OpenAI</p>
              <h2 className="text-2xl font-semibold">Chave do cliente</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-ink/64">
            O cliente cadastra a própria chave da OpenAI. A LeadHealth não exibe a chave completa
            e usa o preview apenas para confirmar visualmente qual credencial está ativa.
          </p>

          <div className="mt-6 space-y-3">
            <InfoChip
              label="Status"
              value={state.openAIConnection ? statusLabels[state.openAIConnection.status] : "Pendente"}
            />
            <InfoChip
              label="Preview"
              value={state.openAIConnection?.keyPreview ?? "sk-..."}
            />
            <InfoChip
              label="Validada em"
              value={state.openAIConnection?.lastValidatedAt ? formatDateTime(state.openAIConnection.lastValidatedAt) : "Aguardando"}
            />
          </div>

          <form action="/api/integrations/openai/save" className="mt-6 space-y-3" method="post">
            <input name="returnTo" type="hidden" value="/dashboard/empresa" />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/74">Salvar ou atualizar chave</span>
              <input
                className="liquid-input"
                name="apiKey"
                placeholder="sk-..."
                type="password"
                autoComplete="off"
                spellCheck="false"
                required
              />
            </label>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              type="submit"
            >
              <Sparkles size={18} aria-hidden="true" />
              Salvar chave
            </button>
          </form>

          <form action="/api/integrations/openai/test" className="mt-3" method="post">
            <input name="returnTo" type="hidden" value="/dashboard/empresa" />
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/56 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white/72"
              type="submit"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              Testar conexão OpenAI
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <AssetPanel
          title="Páginas do Facebook"
          eyebrow="Meta"
          emptyLabel="Nenhuma página conectada"
          icon={<ShieldCheck size={18} aria-hidden="true" />}
          items={state.metaPages.map((page) => ({
            title: page.name,
            meta: page.category ?? page.metaPageId,
            badge: statusLabels[page.status],
            tone: page.status,
            subtitle: page.lastSyncAt ? `Sincronizada em ${formatDateTime(page.lastSyncAt)}` : "Sem sync"
          }))}
        />

        <AssetPanel
          title="Contas de anúncio"
          eyebrow="Meta"
          emptyLabel="Nenhuma conta de anúncio conectada"
          icon={<Sparkles size={18} aria-hidden="true" />}
          items={state.metaAdAccounts.map((account) => ({
            title: account.name,
            meta: `${account.currency} • ${account.timezone}`,
            badge: statusLabels[account.status],
            tone: account.status,
            subtitle: account.lastSyncAt ? `Sincronizada em ${formatDateTime(account.lastSyncAt)}` : "Sem sync"
          }))}
        />

        <AssetPanel
          title="Formulários de Lead Ads"
          eyebrow="Meta"
          emptyLabel="Nenhum formulário encontrado"
          icon={<Clock3 size={18} aria-hidden="true" />}
          items={state.metaLeadForms.map((form) => ({
            title: form.name,
            meta: form.pageName,
            badge: statusLabels[form.status],
            tone: form.status,
            subtitle: form.lastLeadSyncAt
              ? `Último lead em ${formatDateTime(form.lastLeadSyncAt)}`
              : "Aguardando leads"
          }))}
        />
      </section>

      <section className="glass-strong rounded-[34px] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Logs</p>
            <h2 className="mt-2 text-2xl font-semibold">Sincronizações recentes</h2>
          </div>
          <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold text-ink/62">
            {state.syncLogs.length} registros
          </span>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-white/48 bg-white/28">
          {state.syncLogs.length === 0 ? (
            <div className="px-5 py-8 text-sm font-medium text-ink/56">
              Nenhum log de sincronização ainda. Use o botão de sincronizar quando a conta estiver conectada.
            </div>
          ) : (
            <div className="divide-y divide-ink/8">
              {state.syncLogs.map((log) => (
                <div className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_160px_1fr_auto]" key={log.id}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">
                      {log.provider}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-ink">{log.title}</h3>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusToneClasses[log.status]}`}>
                      {statusLabels[log.status]}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-ink/62">{log.message}</p>
                  <time className="text-sm text-ink/48" dateTime={log.createdAt}>
                    {formatDateTime(log.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {state.metaConnection?.lastError || state.openAIConnection?.lastError ? (
        <section className="glass rounded-[30px] p-5">
          <p className="text-sm font-medium text-cobalt">Alertas</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/64">
            {state.metaConnection?.lastError ? <li>Meta: {state.metaConnection.lastError}</li> : null}
            {state.openAIConnection?.lastError ? <li>OpenAI: {state.openAIConnection.lastError}</li> : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function AssetPanel({
  eyebrow,
  title,
  icon,
  emptyLabel,
  items
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  emptyLabel: string;
  items: Array<{
    title: string;
    meta: string;
    badge: string;
    tone: string;
    subtitle: string;
  }>;
}) {
  return (
    <article className="glass-strong rounded-[34px] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cobalt">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/58 text-ink">
          {icon}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[24px] bg-white/44 p-4 text-sm font-medium text-ink/56">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div className="rounded-[24px] bg-white/44 p-4" key={`${title}-${item.title}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm text-ink/58">{item.meta}</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusToneClasses[item.tone]}`}>
                  {item.badge}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink/54">{item.subtitle}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white/44 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/44">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function pickLatestTimestamp(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function formatDateTime(value: string) {
  try {
    return statusFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function getMetaFeedback(value: string) {
  const feedback: Record<string, string> = {
    connected: "Meta conectada com sucesso.",
    disconnected: "Meta desconectada com segurança.",
    synced: "Ativos Meta sincronizados.",
    missing: "Conecte sua conta Meta para importar leads e preparar campanhas.",
    error: "Nao foi possivel concluir a ação da Meta agora. Tente novamente."
  };

  return feedback[value] ?? null;
}

function getOpenAIFeedback(value: string) {
  const feedback: Record<string, string> = {
    saved: "Chave OpenAI salva com segurança.",
    tested: "A chave OpenAI respondeu corretamente.",
    invalid: "A chave OpenAI nao foi validada. Revise o valor e tente novamente.",
    missing: "Cadastre a chave OpenAI do cliente para usar a IA."
  };

  return feedback[value] ?? null;
}

function getSyncFeedback(value: string) {
  const feedback: Record<string, string> = {
    updated: "Sincronização concluída.",
    empty: "Nenhum ativo novo foi encontrado na sincronização.",
    failed: "A sincronização não foi concluída. Revise a conexão."
  };

  return feedback[value] ?? null;
}
