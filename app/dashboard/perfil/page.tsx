import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Coins,
  Settings,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";
import { IntegrationNotice } from "@/components/dashboard/integration-notice";
import { PageHeading } from "@/components/dashboard/widgets";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { updateBrokerageNameAction } from "./actions";

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
  forbidden:
    "Sua permissao para gerenciar a conexao Meta mudou antes da conclusao do fluxo. Peca para um owner ou admin reconectar a conta.",
  coming_soon:
    "A conta OpenAI própria está em breve. Hoje as gerações usam os Créditos de IA da plataforma.",
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
  const connectedAccounts = await getConnectedAccountsForCurrentUser();
  const aiBalance = await getCurrentAiBalance();
  const integrationFeedback =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    connectedAccounts.message ||
    null;
  const canEditBrokerageName = context.isManager || context.isSoloOwner;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Perfil"
        title="Configuracoes"
        description="Visao resumida do usuario, empresa, Meta e créditos de IA para manter a conta organizada sem excesso de rolagem."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <Settings size={18} aria-hidden="true" />
          {context.role === "owner" ? "Owner" : context.role === "admin" ? "Admin" : "Consultor"}
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
            {connectedAccounts.metaPages.length + connectedAccounts.metaAdAccounts.length} ativos
            visiveis
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

      {integrationFeedback ? <IntegrationNotice message={integrationFeedback} /> : null}

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

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Building2 size={18} className="text-cobalt" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Gerenciar conta</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ManageLinkCard
            cta="Gerenciar créditos"
            description="Compre créditos para gerar campanhas, mensagens e análises com IA."
            href="/dashboard/perfil/creditos"
            icon={<Coins size={20} aria-hidden="true" />}
            title="Créditos de IA"
            statusText={aiBalance > 0 ? `${aiBalance.toLocaleString("pt-BR")} créditos` : "Sem saldo"}
          />
          {connectedAccounts.canManageConnections ? (
            <ManageLinkCard
              cta="Gerenciar Meta"
              description="Gerencie perfil Meta, páginas, formulários, contas de anúncio e permissões."
              href="/dashboard/perfil/meta"
              icon={<ArrowUpRight size={20} aria-hidden="true" />}
              title="Meta e contas conectadas"
              statusText={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
            />
          ) : (
            <ManageDisabledCard
              cta="Acesso restrito"
              description="Owner e admins gerenciam a conexão Meta e os ativos sincronizados do workspace."
              icon={<ArrowUpRight size={20} aria-hidden="true" />}
              title="Meta e contas conectadas"
              statusText={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
            />
          )}
          <ManageLinkCard
            cta="Gerenciar empresa"
            description="Gerencie os dados principais da empresa usados na operação."
            href="/dashboard/perfil/empresa"
            icon={<BriefcaseBusiness size={20} aria-hidden="true" />}
            title="Dados da empresa"
            statusText={context.workspaceType === "team" ? "Equipe" : "Individual"}
          />
          <ManageDisabledCard
            cta="Em breve"
            description="Conexão própria da OpenAI ficará disponível em uma próxima etapa."
            icon={<Sparkles size={20} aria-hidden="true" />}
            title="OpenAI"
            statusText="Em breve"
          />
        </div>
      </section>
    </div>
  );
}

function ManageLinkCard({
  title,
  description,
  cta,
  href,
  icon,
  statusText
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: ReactNode;
  statusText?: string;
}) {
  return (
    <Link
      className="group glass flex h-full flex-col justify-between rounded-[34px] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(18,23,33,0.14)]"
      href={href}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-cobalt">{title}</p>
              {statusText && (
                <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-cobalt shadow-[0_4px_12px_rgba(18,23,33,0.02)] transition-all duration-300 group-hover:bg-white group-hover:scale-105">
                  {statusText}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
          </div>
          <span className="rounded-full bg-white/70 p-3 text-ink transition-all duration-300 group-hover:scale-110 group-hover:bg-white">{icon}</span>
        </div>
      </div>
      <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-ink/90 group-hover:shadow-[0_12px_24px_rgba(18,23,33,0.12)]">
        {cta}
        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}

function ManageDisabledCard({
  title,
  description,
  cta,
  icon,
  statusText
}: {
  title: string;
  description: string;
  cta: string;
  icon: ReactNode;
  statusText?: string;
}) {
  return (
    <div className="glass flex h-full flex-col justify-between rounded-[34px] p-6 text-left opacity-80 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-cobalt">{title}</p>
              {statusText && (
                <span className="inline-flex items-center rounded-full bg-lagoon/12 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-lagoon">
                  {statusText}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
          </div>
          <span className="rounded-full bg-white/70 p-3 text-ink/60">{icon}</span>
        </div>
      </div>
      <button
        className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink/62 cursor-not-allowed"
        disabled
        type="button"
      >
        {cta}
      </button>
    </div>
  );
}

function normalizeWebhookStatusFilter(value?: string) {
  return value === "processed" || value === "failed" ? value : "all";
}
