import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { reorderPipelineStagesForCurrentUser } from "@/lib/pipeline/stages.server";

const reorderSchema = z
  .object({ orderedIds: z.array(z.string().trim().min(1)).min(1).max(50) })
  .strict();

export async function POST(request: Request) {
  return handleBoardRoute(request, { keyPrefix: "api-pipeline-stages-reorder", limit: 60 }, async () => {
    const { orderedIds } = await parseJsonBody(request, reorderSchema);
    await reorderPipelineStagesForCurrentUser(orderedIds);
    return { ok: true };
  });
}
