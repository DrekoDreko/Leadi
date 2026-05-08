import { NextResponse } from "next/server";
import {
  getCommercialAgendaForCurrentUser,
  parseCommercialAgendaQuery
} from "@/lib/leads/agenda.server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = parseCommercialAgendaQuery(searchParams);
  const state = await getCommercialAgendaForCurrentUser({
    filters: query,
    limit: query.limit
  });

  return NextResponse.json(state);
}
