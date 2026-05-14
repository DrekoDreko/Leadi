import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { listLeadWebhookLogsByOrganization, type WebhookLogFilter } from "@/lib/leads/webhook-events.repository";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getRequestOrigin } from "@/lib/site/config";
import { WebhookLogsCard } from "../../perfil/webhook-logs-card";
import { WebhookSetupCard } from "../../perfil/webhook-setup-card";

export default async function WebhookLeadsPage({
  searchParams
}: {
  searchParams?: Promise<{
    webhookStatus?: string;
  }>;
}) {
  const context = await requireCompletedProfile();
  const params = await searchParams;
  const webhookFilter = normalizeWebhookStatusFilter(params?.webhookStatus);
  const webhookUrl = await getLeadWebhookUrl();

  const webhookLogs =
    context.mode === "supabase" && context.workspace
      ? await listLeadWebhookLogsByOrganization({
          organizationId: context.workspace.id,
          filter: webhookFilter
        })
      : [];

  const canManageToken = context.isManager || context.isSoloOwner;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Integrações"
        title="Configuração do Webhook de Leads"
        description="Use esta área para conectar ferramentas externas ao LeadHealth. Depois de configurado, todo lead enviado para esta URL será cadastrado automaticamente no CRM."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white/78"
          href="/dashboard/perfil"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar ao perfil
        </Link>
      </PageHeading>

      <WebhookSetupCard
        canManageToken={canManageToken}
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
  const requestOrigin = getRequestOrigin(headerStore);

  return `${requestOrigin}/api/webhooks/leads`;
}

function normalizeWebhookStatusFilter(value?: string): WebhookLogFilter {
  return value === "processed" || value === "failed" ? value : "all";
}
