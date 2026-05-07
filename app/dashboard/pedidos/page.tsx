import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCreativeRequestsForCurrentUser } from "@/lib/creative-requests/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { PedidosWorkspace } from "./pedidos-workspace";

export default async function PedidosPage() {
  const [context, requestState, createRequestAccess] = await Promise.all([
    requireCompletedProfile(),
    getCreativeRequestsForCurrentUser(),
    getCurrentResourceAccess("creative_requests")
  ]);

  return (
    <PedidosWorkspace
      initialRequests={requestState.requests}
      listMessage={requestState.message}
      listMode={requestState.mode}
      createRequestAccess={createRequestAccess}
      showAdminLink={context.isPlatformAdmin}
      workspaceName={context.workspaceName}
    />
  );
}
