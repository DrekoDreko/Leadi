import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getWhatsAppMessagesForCurrentUser } from "@/lib/whatsapp/repository.server";
import { WhatsAppWorkspace } from "./whatsapp-workspace";

type WhatsAppPageProps = {
  searchParams?: Promise<{
    lead?: string | string[];
  }>;
};

export default async function WhatsAppPage({ searchParams }: WhatsAppPageProps) {
  const [context, leadState, historyState, generateAccess] = await Promise.all([
    requireCompletedProfile(),
    getLeadsForCurrentUser(),
    getWhatsAppMessagesForCurrentUser(4),
    getCurrentResourceAccess("whatsapp_generation")
  ]);
  const resolvedSearchParams = await searchParams;
  const leadId = Array.isArray(resolvedSearchParams?.lead)
    ? resolvedSearchParams?.lead[0]
    : resolvedSearchParams?.lead;

  return (
    <WhatsAppWorkspace
      historyMessage={historyState.message}
      historyMode={historyState.mode}
      initialLeadId={leadId ?? null}
      initialMessages={historyState.messages}
      brokerageName={context.brokerageName}
      generateAccess={generateAccess}
      leads={leadState.leads}
    />
  );
}
