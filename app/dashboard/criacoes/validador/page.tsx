import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCreativeRequestsForCurrentUser } from "@/lib/creative-requests/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { PedidosWorkspace } from "../../pedidos/pedidos-workspace";

export default async function CriacoesValidadorPage() {
  const [context, requestState, createRequestAccess] = await Promise.all([
    requireCompletedProfile(),
    getCreativeRequestsForCurrentUser(),
    getCurrentResourceAccess("creative_requests")
  ]);

  return (
    <PedidosWorkspace
      createRequestAccess={createRequestAccess}
      initialRequests={requestState.requests}
      listMessage={requestState.message}
      listMode={requestState.mode}
      showAdminLink={context.isPlatformAdmin}
      workspaceName={context.workspaceName}
      workspaceVariant="validator"
    />
  );
}
