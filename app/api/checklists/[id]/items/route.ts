import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { addChecklistItemForCurrentUser } from "@/lib/pipeline/cards.server";

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z
  .object({
    leadId: z.string().trim().min(1).max(80),
    text: z.string().trim().min(1, "Informe o texto do item.").max(500)
  })
  .strict();

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-checklist-item-create", suffix: id, limit: 120 },
    async () => {
      const { leadId, text } = await parseJsonBody(request, createSchema);
      await addChecklistItemForCurrentUser({ checklistId: id, leadId, text });
      return { ok: true };
    }
  );
}
