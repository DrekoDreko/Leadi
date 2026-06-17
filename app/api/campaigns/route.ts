import { NextResponse } from "next/server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { RateLimitError } from "@/lib/rate-limit";
import { assertRouteRateLimit } from "@/lib/api/route-security";

export async function GET(request: Request) {
  try {
    await assertRouteRateLimit({
      request,
      keyPrefix: "api-campaigns-get",
      limit: 60,
      windowMs: 60 * 1000
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const state = await getCampaignsForCurrentUser();

  if (state.mode === "unauthenticated") {
    return NextResponse.json(
      { error: "Sua sessao expirou. Entre novamente para carregar campanhas." },
      { status: 401 }
    );
  }

  return NextResponse.json(state);
}
