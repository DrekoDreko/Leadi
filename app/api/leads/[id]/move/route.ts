import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { moveLeadOnBoardForCurrentUser } from "@/lib/pipeline/board.server";

type RouteContext = { params: Promise<{ id: string }> };

const moveSchema = z
  .object({
    stageId: z.string().trim().min(1, "Coluna de destino obrigatória.").max(80),
    position: z.number()
  })
  .strict();

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-lead-move", suffix: id, limit: 120 },
    async () => {
      const body = await parseJsonBody(request, moveSchema);
      await moveLeadOnBoardForCurrentUser(id, body);
      return { ok: true };
    }
  );
}
