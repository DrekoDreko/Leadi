import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import { buildMetaOAuthAuthorizationUrl } from "@/lib/integrations/meta-graph.server";
import { createMetaOAuthState } from "@/lib/integrations/oauth-state.server";
import {
  assertRouteRateLimit,
  normalizeReturnTo
} from "@/lib/api/route-security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-meta-connect",
    limit: 20,
    windowMs: 60 * 1000
  });
  const returnTo = normalizeReturnTo(requestUrl.searchParams.get("returnTo"), "/dashboard/perfil/meta");

  if (!isSupabaseConfigured()) {
    return redirectToReturnPath(requestUrl, returnTo, "meta=missing");
  }

  const identity = await resolveCurrentIdentity();
  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  if (!identity.canManageConnections) {
    return redirectToReturnPath(requestUrl, returnTo, "meta=forbidden");
  }

  try {
    const state = createMetaOAuthState({
      organizationId: identity.organization.id,
      profileId: identity.profile.id,
      returnTo
    });
    const authUrl = buildMetaOAuthAuthorizationUrl({ state, returnTo });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Falha ao iniciar OAuth da Meta.", error);
    return redirectToReturnPath(requestUrl, returnTo, "meta=missing");
  }
}

function redirectToReturnPath(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
