import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { updateLeadCardForCurrentUser } from "@/lib/pipeline/board.server";

type RouteContext = { params: Promise<{ id: string }> };

const coverSchema = z
  .object({
    color: z.string().trim().max(24).nullable().optional(),
    imageUrl: z.string().trim().max(2000).nullable().optional()
  })
  .strict()
  .nullable();

const cardSchema = z
  .object({
    dueAt: z.string().trim().max(40).nullable().optional(),
    cover: coverSchema.optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar o card."
  });

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-lead-card", suffix: id, limit: 80 },
    async () => {
      const body = await parseJsonBody(request, cardSchema);
      await updateLeadCardForCurrentUser(id, body);
      return { ok: true };
    }
  );
}
