import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import {
  deletePipelineStageForCurrentUser,
  updatePipelineStageForCurrentUser
} from "@/lib/pipeline/stages.server";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    color: z.string().trim().max(24).optional(),
    type: z.enum(["open", "won", "lost"]).optional(),
    wipLimit: z.number().int().min(0).nullable().optional(),
    position: z.number().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar."
  });

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-pipeline-stage-update", suffix: id, limit: 60 },
    async () => {
      const body = await parseJsonBody(request, updateSchema);
      const stage = await updatePipelineStageForCurrentUser(id, body);
      return { stage };
    }
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-pipeline-stage-delete", suffix: id, limit: 30 },
    async () => {
      const reassignToStageId = new URL(request.url).searchParams.get("reassignTo");
      await deletePipelineStageForCurrentUser(id, reassignToStageId);
      return { ok: true };
    }
  );
}
