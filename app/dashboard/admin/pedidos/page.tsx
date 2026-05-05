import { getCreativeRequestsForAdmin } from "@/lib/creative-requests/repository.server";
import { requirePlatformAdmin } from "@/lib/workspaces/context";
import { AdminPedidosWorkspace } from "./workspace";

export default async function AdminPedidosPage() {
  await requirePlatformAdmin();
  const requestState = await getCreativeRequestsForAdmin();

  return (
    <AdminPedidosWorkspace
      initialRequests={requestState.requests}
      listMessage={requestState.message}
      listMode={requestState.mode}
    />
  );
}
