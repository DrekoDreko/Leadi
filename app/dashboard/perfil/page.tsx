import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, BriefcaseBusiness, Settings } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import {
  listLeadWebhookLogsByOrganization,
  type WebhookLogFilter
} from "@/lib/leads/webhook-events.repository";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { updateBrokerageNameAction } from "./actions";
import { WebhookLogsCard } from "./webhook-logs-card";
import { WebhookSetupCard } from "./webhook-setup-card";

const brokerageFeedbackMessages: Record<string, string> = {
  failed: "Nao foi possivel salvar o nome da corretora agora.",
  missing: "Informe o nome da corretora ou o seu proprio nome comercial.",
  permission: "Apenas o supervisor da equipe pode alterar o nome da corretora.",
  "schema-missing":
    "O banco conectado ainda nao recebeu a migration de nome da corretora. Aplique a migration mais recente e tente novamente.",
  updated: "Nome comercial atualizado para as proximas mensagens e campanhas."
};

export default async function PerfilPage({
  searchParams
}: {
  searchParams?: Promise<{ brokerage?: string; webhookStatus?: string }>;
}) {
  const context = await requireCompletedProfile();
  const params = await searchParams;
  const brokerageFeedback = params?.brokerage
    ? brokerageFeedbackMessages[params.brokerage] ?? null
    : null;
  const canEditBrokerageName = context.isSupervisor || context.isSoloSeller;
  const canManageWebhookToken = context.isSupervisor || context.isSoloSeller;
  const webhookFilter = normalizeWebhookStatusFilter(params?.webhookStatus);
  const webhookLogs =
    context.mode === "supabase" && context.workspace
      ? await listLeadWebhookLogsByOrganization({
          organizationId: context.workspace.id,
          filter: webhookFilter
        })
      : [];
  const webhookUrl = await getLeadWebhookUrl();

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Perfil"
        title="Configuracoes"
        description="Dados do usuario, nome comercial e logs do webhook. As conexoes da empresa ficam em Empresa."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <Settings size={18} aria-hidden="true" />
          {context.role === "supervisor" ? "Supervisor" : "Vendedor"}
        </span>
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard/empresa"
        >
          Abrir Empresa
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </PageHeading>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="glass-strong rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Usuario</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.displayName}</h2>
          <p className="mt-3 text-sm text-ink/58">{context.profile?.email ?? "Modo demonstracao"}</p>
        </article>

        <article className="glass rounded-[34px] p-6">
          <p className="text-sm font-medium text-cobalt">Nome comercial</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.brokerageName}</h2>
          <p className="mt-3 text-sm text-ink/58">
            {context.workspaceType === "team" ? "Equipe" : "Individual"}
          </p>
        </article>
      </section>

      {brokerageFeedback ? (
        <p className="rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {brokerageFeedback}
        </p>
      ) : null}

      <section className="glass-strong rounded-[34px] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cobalt">Corretora</p>
            <h2 className="mt-2 text-2xl font-semibold">Nome usado com clientes</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
              Esse nome assina mensagens de WhatsApp, campanhas e novas geracoes via API.
              Se voce atua sozinho e nao tem uma corretora por tras, use seu proprio nome.
              As contas conectadas da empresa ficam na area Empresa.
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
              placeholder={context.isSoloSeller ? context.displayName : "Nome da corretora"}
              required
              type="text"
            />
            <button
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              type="submit"
            >
              Salvar nome
            </button>
            {context.isSoloSeller ? (
              <p className="text-sm text-ink/56 md:col-span-2">
                Sugestao para corretor solo: {context.displayName}.
              </p>
            ) : null}
          </form>
        ) : (
          <div className="rounded-[24px] border border-white/44 bg-white/36 p-4 text-sm leading-6 text-ink/64">
            Voce esta em uma equipe. O supervisor configura o nome comercial que todos os
            vendedores usam no contato com clientes.
          </div>
        )}
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

async function getLeadWebhookUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000/api/webhooks/leads";
  }

  return `${protocol}://${host}/api/webhooks/leads`;
}

function normalizeWebhookStatusFilter(value?: string): WebhookLogFilter {
  return value === "processed" || value === "failed" ? value : "all";
}
