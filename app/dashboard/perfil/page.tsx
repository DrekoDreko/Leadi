import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Settings,
  Sparkles,
  UserPlus
} from "lucide-react";
import type { ReactNode } from "react";
import { IntegrationNotice } from "@/components/dashboard/integration-notice";
import { PageHeading } from "@/components/dashboard/widgets";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { getCurrentBillingSnapshot } from "@/lib/billing/admin";
import { getCurrentBillingPlanOverview } from "@/lib/billing/subscription-limits.server";
import { PlanBillingCard } from "@/components/dashboard/plan-billing-card";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { countPendingFirstContactLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { updateBrokerageNameAction } from "./actions";
import { ProfileAvatarUpload } from "./profile-avatar-upload";

const brokerageFeedbackMessages: Record<string, string> = {
  failed: "Nao foi possivel salvar o nome da corretora agora.",
  missing: "Informe o nome da corretora ou o seu proprio nome comercial.",
  permission: "Apenas o owner ou os supervisores da equipe podem alterar o nome da corretora.",
  "schema-missing":
    "O banco conectado ainda nao recebeu a migration de nome da corretora. Aplique a migration mais recente e tente novamente.",
  updated: "Nome comercial atualizado para as proximas mensagens e campanhas."
};

const avatarFeedbackMessages: Record<string, string> = {
  updated: "Foto de perfil atualizada com sucesso.",
  "no-file": "Selecione uma imagem para enviar.",
  "invalid-type": "Formato inválido. Use JPG, PNG ou WebP.",
  "too-large": "A imagem deve ter no máximo 2 MB.",
  "upload-failed": "Não foi possível enviar a imagem agora.",
};

const integrationFeedbackMessages: Record<string, string> = {
  connected: "Conta Meta conectada com sucesso.",
  disconnected: "Conta Meta desconectada com sucesso.",
  forbidden:
    "Sua permissao para gerenciar a conexao Meta mudou antes da conclusao do fluxo. Peca para o owner reconectar a conta.",
  coming_soon:
    "A conta OpenAI própria está em breve. Hoje as gerações usam os Créditos de IA da plataforma.",
  success: "Sincronizacao concluida com sucesso.",
  partial: "Sincronizacao concluida com avisos.",
  error: "Nao foi possivel concluir a atualizacao das contas conectadas.",
  missing:
    "Este ambiente ainda não tem META_APP_ID e META_APP_SECRET. Sem essas variáveis, o botão Conectar Meta não consegue iniciar o OAuth."
};

const profileActionClassName =
  "rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90";

type CardTone = "cobalt" | "lagoon" | "ink";

const cardToneStyles: Record<
  CardTone,
  { title: string; badge: string; icon: string; cta: string; ctaHoverShadow: string }
> = {
  cobalt: {
    title: "text-cobalt",
    badge: "bg-cobalt/10 text-cobalt",
    icon: "bg-cobalt/10 text-cobalt",
    cta: "bg-cobalt text-white hover:bg-cobalt/90",
    ctaHoverShadow: "group-hover:shadow-[0_12px_24px_rgba(52,98,238,0.24)]"
  },
  lagoon: {
    title: "text-lagoon",
    badge: "bg-lagoon/12 text-lagoon",
    icon: "bg-lagoon/12 text-lagoon",
    cta: "bg-lagoon text-white hover:bg-lagoon/90",
    ctaHoverShadow: "group-hover:shadow-[0_12px_24px_rgba(0,150,136,0.22)]"
  },
  ink: {
    title: "text-ink/80",
    badge: "bg-ink/8 text-ink/70",
    icon: "bg-ink/8 text-ink/60",
    cta: "bg-ink/10 text-ink/60 cursor-not-allowed",
    ctaHoverShadow: ""
  }
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
    avatar?: string;
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
  const [connectedAccounts, aiBalance, pendingFirstContactCount] = await Promise.all([
    getConnectedAccountsForCurrentUser(),
    getCurrentAiBalance(),
    countPendingFirstContactLeadsForCurrentUser()
  ]);
  const integrationFeedback =
    (params?.meta && integrationFeedbackMessages[params.meta]) ||
    (params?.openai && integrationFeedbackMessages[params.openai]) ||
    (params?.sync && integrationFeedbackMessages[params.sync]) ||
    connectedAccounts.message ||
    null;
  const avatarFeedback = params?.avatar
    ? avatarFeedbackMessages[params.avatar] ?? null
    : null;
  const canEditBrokerageName = context.isManager || context.isSoloOwner;

  const [billingOverview, billingSnapshot] = context.isOwner
    ? await Promise.all([getCurrentBillingPlanOverview(), getCurrentBillingSnapshot()])
    : [null, null];

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Perfil"
        title="Configuracoes"
        description="Visao resumida do usuario, empresa, Meta e créditos de IA para manter a conta organizada sem excesso de rolagem."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink">
          <Settings size={18} aria-hidden="true" />
          {context.role === "owner" ? "Owner" : context.role === "admin" ? "Supervisor" : "Consultor"}
        </span>
      </PageHeading>

      {avatarFeedback ? (
        <p className="rounded-[22px] bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink">
          {avatarFeedback}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="glass-strong rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Usuario</p>
          <div className="mt-3 flex items-center gap-3">
            <ProfileAvatarUpload
              currentAvatarUrl={context.profile?.avatar_url ?? null}
              displayName={context.displayName}
            />
            <div>
              <h2 className="text-2xl font-semibold">{context.displayName}</h2>
              <p className="mt-1 text-sm text-ink/58">{context.profile?.email ?? "Modo demonstracao"}</p>
            </div>
          </div>
        </article>

        <article className="glass-strong rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Empresa</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.workspaceName}</h2>
          <p className="mt-3 text-sm text-ink/58">
            {context.workspaceType === "team" ? "Equipe" : "Individual"}
          </p>
        </article>

        <article className="glass-strong rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Meta</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
          </h2>
          <p className="mt-3 text-sm text-ink/58">
            {connectedAccounts.metaPages.length + connectedAccounts.metaAdAccounts.length} ativos
            visiveis
          </p>
        </article>

        <article className="glass-strong rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Créditos de IA</p>
          <h2 className="mt-2 text-2xl font-semibold">{aiBalance.toLocaleString("pt-BR")}</h2>
          <p className="mt-3 text-sm text-ink/58">
            {aiBalance > 0
              ? `Você possui ${aiBalance.toLocaleString("pt-BR")} créditos de IA disponíveis.`
              : "Seu saldo de IA acabou. Adicione créditos ou atualize seu plano para continuar usando recursos de IA."}
          </p>
        </article>
      </section>

      <Link
        className="group flex items-center justify-between gap-4 glass-strong rounded-[34px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(18,23,33,0.14)]"
        href="/dashboard/leads"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
            <UserPlus size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-cobalt">Leads novos</p>
            <h2 className="mt-1 text-2xl font-semibold">{pendingFirstContactCount}</h2>
            <p className="mt-1 text-sm text-ink/58">
              {pendingFirstContactCount > 0
                ? `${pendingFirstContactCount} lead${pendingFirstContactCount === 1 ? "" : "s"} aguardando primeiro contato.`
                : "Todos os leads já receberam o primeiro contato."}
            </p>
          </div>
        </div>
        <ArrowRight size={18} className="text-cobalt transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </Link>

      {brokerageFeedback ? (
        <p className="rounded-[22px] bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink">
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
              className={profileActionClassName}
              type="submit"
            >
              Salvar nome
            </button>
          </form>
        ) : (
          <div className="rounded-[24px] border border-border bg-surface-elevated p-4 text-sm leading-6 text-ink/64">
            Voce esta em uma equipe. O owner ou os supervisores configuram o nome comercial usado no
            contato com clientes.
          </div>
        )}
      </section>

      <section className="glass-strong space-y-5 rounded-[34px] p-6">
        <div className="flex items-center gap-3">
          <Building2 size={18} className="text-cobalt" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Gerenciar conta</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {connectedAccounts.canManageConnections ? (
            <ManageLinkCard
              cta="Gerenciar Meta"
              description="Gerencie perfil Meta, páginas, formulários, contas de anúncio e permissões."
              href="/dashboard/perfil/meta"
              icon={<ArrowUpRight size={20} aria-hidden="true" />}
              title="Meta e contas conectadas"
              statusText={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
              nested
              tone="cobalt"
            />
          ) : (
            <ManageDisabledCard
              cta="Acesso restrito"
              description="Somente o owner gerencia a conexão Meta e os ativos sincronizados do workspace."
              icon={<ArrowUpRight size={20} aria-hidden="true" />}
              title="Meta e contas conectadas"
              statusText={connectedAccounts.metaConnection?.connectionStatusLabel ?? "Pendente"}
              nested
              tone="cobalt"
            />
          )}
          <ManageLinkCard
            cta="Gerenciar empresa"
            description="Gerencie os dados principais da empresa usados na operação."
            href="/dashboard/perfil/empresa"
            icon={<BriefcaseBusiness size={20} aria-hidden="true" />}
            title="Dados da empresa"
            statusText={context.workspaceType === "team" ? "Equipe" : "Individual"}
            nested
            tone="lagoon"
          />
          <ManageDisabledCard
            cta="Em breve"
            description="Conexão própria da OpenAI ficará disponível em uma próxima etapa."
            icon={<Sparkles size={20} aria-hidden="true" />}
            title="OpenAI"
            statusText="Em breve"
            nested
            tone="ink"
          />
        </div>
      </section>

      {context.isOwner ? (
        <PlanBillingCard
          overview={billingOverview}
          snapshot={billingSnapshot}
          manageHref="/dashboard/perfil/creditos"
        />
      ) : null}
    </div>
  );
}

function ManageLinkCard({
  title,
  description,
  cta,
  href,
  icon,
  statusText,
  nested,
  tone = "cobalt"
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: ReactNode;
  statusText?: string;
  nested?: boolean;
  tone?: CardTone;
}) {
  const t = cardToneStyles[tone];
  return (
    <Link
      className={`group flex h-full flex-col justify-between p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(18,23,33,0.14)] ${nested ? "rounded-[24px] glass-strong" : "glass rounded-[34px]"}`}
      href={href}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold ${t.title}`}>{title}</p>
              {statusText && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 group-hover:scale-105 ${t.badge}`}>
                  {statusText}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
          </div>
          <span className={`rounded-full p-3 transition-all duration-300 group-hover:scale-110 ${t.icon}`}>
            {icon}
          </span>
        </div>
      </div>
      <span
        className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 ${t.cta} ${t.ctaHoverShadow}`}
      >
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
  statusText,
  nested,
  tone = "cobalt"
}: {
  title: string;
  description: string;
  cta: string;
  icon: ReactNode;
  statusText?: string;
  nested?: boolean;
  tone?: CardTone;
}) {
  const t = cardToneStyles[tone];
  return (
    <div className={`flex h-full flex-col justify-between p-6 text-left opacity-80 transition-all duration-300 ${nested ? "rounded-[24px] glass-strong" : "glass rounded-[34px]"}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-semibold ${t.title}`}>{title}</p>
              {statusText && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${t.badge}`}>
                  {statusText}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p>
          </div>
          <span className={`rounded-full p-3 ${t.icon}`}>{icon}</span>
        </div>
      </div>
      <button
        className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${t.cta}`}
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
