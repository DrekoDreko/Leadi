import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import {
  deleteChecklistItemForCurrentUser,
  updateChecklistItemForCurrentUser
} from "@/lib/pipeline/cards.server";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z
  .object({
    text: z.string().trim().max(500).optional(),
    done: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar o item."
  });

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-checklist-item-update", suffix: id, limit: 200 },
    async () => {
      const body = await parseJsonBody(request, updateSchema);
      await updateChecklistItemForCurrentUser(id, body);
      return { ok: true };
    }
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-checklist-item-delete", suffix: id, limit: 120 },
    async () => {
      await deleteChecklistItemForCurrentUser(id);
      return { ok: true };
    }
  );
}
