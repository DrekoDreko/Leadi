import { z } from "zod";
import { handleBoardRoute } from "@/lib/api/board-route";
import { parseJsonBody } from "@/lib/api/route-security";
import {
  createChecklistForLead,
  listChecklistsForLead
} from "@/lib/pipeline/cards.server";

type RouteContext = { params: Promise<{ id: string }> };

const createSchema = z
  .object({ title: z.string().trim().max(120).optional() })
  .strict();

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-lead-checklists-list", suffix: id, readOnly: true },
    async () => {
      const checklists = await listChecklistsForLead(id);
      return { checklists };
    }
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleBoardRoute(
    request,
    { keyPrefix: "api-lead-checklists-create", suffix: id, limit: 60 },
    async () => {
      const { title } = await parseJsonBody(request, createSchema);
      const checklist = await createChecklistForLead(id, title ?? "Checklist");
      return { checklist };
    }
  );
}
