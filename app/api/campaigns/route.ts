import { NextResponse } from "next/server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";

export async function GET() {
  const state = await getCampaignsForCurrentUser();

  if (state.mode === "unauthenticated") {
    return NextResponse.json(
      { error: "Sua sessao expirou. Entre novamente para carregar campanhas." },
      { status: 401 }
    );
  }

  return NextResponse.json(state);
}
