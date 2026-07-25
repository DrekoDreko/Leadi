import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import { createLabelForCurrentUser, listLabelsForCurrentUser } from "@/lib/pipeline/cards.server";

const createSchema = z
  .object({
    name: z.string().trim().max(40).optional(),
    color: z.string().trim().max(24).optional()
  })
  .strict();

export async function GET(request: Request) {
  return handleBoardRoute(request, { keyPrefix: "api-labels-list", readOnly: true }, async () => {
    const labels = await listLabelsForCurrentUser();
    return { labels };
  });
}

export async function POST(request: Request) {
  return handleBoardRoute(request, { keyPrefix: "api-labels-create", limit: 40 }, async () => {
    const body = await parseJsonBody(request, createSchema);
    const label = await createLabelForCurrentUser({ name: body.name ?? "", color: body.color });
    return { label };
  });
}
