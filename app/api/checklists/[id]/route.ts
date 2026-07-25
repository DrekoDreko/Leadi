import { handleBoardRoute } from "@/lib/api/board-route";
import { deleteChecklistForCurrentUser } from "@/lib/pipeline/cards.server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(request, { keyPrefix: "api-checklist-delete", suffix: id, limit: 60 }, async () => {
    await deleteChecklistForCurrentUser(id);
    return { ok: true };
  });
}
