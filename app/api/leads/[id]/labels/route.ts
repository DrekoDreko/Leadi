import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { setLeadLabelForCurrentUser } from "@/lib/pipeline/cards.server";

type RouteContext = { params: Promise<{ id: string }> };

const toggleSchema = z
  .object({
    labelId: z.string().trim().min(1).max(80),
    attached: z.boolean()
  })
  .strict();

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-lead-labels", suffix: id, limit: 120 },
    async () => {
      const { labelId, attached } = await parseJsonBody(request, toggleSchema);
      await setLeadLabelForCurrentUser(id, labelId, attached);
      return { ok: true };
    }
  );
}
