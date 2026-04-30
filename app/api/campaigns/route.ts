import { NextResponse } from "next/server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";

export async function GET() {
  const state = await getCampaignsForCurrentUser();

  return NextResponse.json(state);
}
