import { getCreativeRequestsForCurrentUser } from "@/lib/creative-requests/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { PedidosWorkspace } from "./pedidos-workspace";

export default async function PedidosPage() {
  const [context, requestState] = await Promise.all([
    requireCompletedProfile(),
    getCreativeRequestsForCurrentUser()
  ]);

  return (
    <PedidosWorkspace
      initialRequests={requestState.requests}
      listMessage={requestState.message}
      listMode={requestState.mode}
      showAdminLink={context.isPlatformAdmin}
      workspaceName={context.workspaceName}
    />
  );
}
