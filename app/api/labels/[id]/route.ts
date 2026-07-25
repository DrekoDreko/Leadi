import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { deleteLabelForCurrentUser, updateLabelForCurrentUser } from "@/lib/pipeline/cards.server";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z
  .object({
    name: z.string().trim().max(40).optional(),
    color: z.string().trim().max(24).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar a etiqueta."
  });

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(request, { keyPrefix: "api-label-update", suffix: id, limit: 60 }, async () => {
    const body = await parseJsonBody(request, updateSchema);
    const label = await updateLabelForCurrentUser(id, body);
    return { label };
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(request, { keyPrefix: "api-label-delete", suffix: id, limit: 40 }, async () => {
    await deleteLabelForCurrentUser(id);
    return { ok: true };
  });
}
