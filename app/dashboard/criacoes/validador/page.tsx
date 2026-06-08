import { redirect } from "next/navigation";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCreativeRequestsForCurrentUser } from "@/lib/creative-requests/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { PedidosWorkspace } from "../../pedidos/pedidos-workspace";

type CriacoesValidadorPageProps = {
  searchParams?: Promise<{
    compose?: string | string[] | undefined;
  }>;
};

export default async function CriacoesValidadorPage({ searchParams }: CriacoesValidadorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [context, requestState, createRequestAccess] = await Promise.all([
    requireCompletedProfile(),
    getCreativeRequestsForCurrentUser(),
    getCurrentResourceAccess("creative_requests")
  ]);

  if (!context.isOwner) {
    redirect("/dashboard/criacoes");
  }

  return (
    <PedidosWorkspace
      createRequestAccess={createRequestAccess}
      initialRequests={requestState.requests}
      listMessage={requestState.message}
      listMode={requestState.mode}
      initialComposeOpen={resolvedSearchParams?.compose === "1"}
      showAdminLink={context.isPlatformAdmin}
      workspaceName={context.workspaceName}
      workspaceVariant="validator"
    />
  );
}
