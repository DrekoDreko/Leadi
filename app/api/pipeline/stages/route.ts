import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import {
  createPipelineStageForCurrentUser,
  listPipelineStagesForCurrentUser
} from "@/lib/pipeline/stages.server";

const createSchema = z
  .object({
    name: z.string().trim().min(1, "Informe um nome para a coluna.").max(60),
    color: z.string().trim().max(24).optional(),
    type: z.enum(["open", "won", "lost"]).optional()
  })
  .strict();

export async function GET(request: Request) {
  return handleBoardRoute(request, { keyPrefix: "api-pipeline-stages-list", readOnly: true }, async () => {
    const stages = await listPipelineStagesForCurrentUser();
    return { stages };
  });
}

export async function POST(request: Request) {
  return handleBoardRoute(request, { keyPrefix: "api-pipeline-stages-create", limit: 30 }, async () => {
    const body = await parseJsonBody(request, createSchema);
    const stage = await createPipelineStageForCurrentUser(body);
    return { stage };
  });
}
