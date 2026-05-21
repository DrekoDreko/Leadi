import { NextResponse } from "next/server";
import { exchangeMetaOAuthCode, syncMetaOrganizationAssets } from "@/lib/integrations/meta-graph.server";
import { parseMetaOAuthState } from "@/lib/integrations/oauth-state.server";
import { resolveMetaOAuthStateIdentity } from "@/lib/integrations/repository.server";
import { EnvValidationError } from "@/lib/env/server";
import { assertRouteRateLimit, logApiError } from "@/lib/api/route-security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-meta-callback",
    limit: 20,
    windowMs: 60 * 1000
  });
  const returnToFallback = "/dashboard/perfil/meta";

  if (requestUrl.searchParams.has("error")) {
    return redirectBack(requestUrl, returnToFallback, "meta=error");
  }

  const code = requestUrl.searchParams.get("code")?.trim();
  const stateValue = requestUrl.searchParams.get("state")?.trim();

  if (!code || !stateValue) {
    return redirectBack(requestUrl, returnToFallback, "meta=error");
  }

  let state;
  try {
    state = parseMetaOAuthState(stateValue);
  } catch (error) {
    console.error("State OAuth da Meta invalido.", error);
    return redirectBack(requestUrl, returnToFallback, "meta=error");
  }

  try {
    const identity = await resolveMetaOAuthStateIdentity({
      profileId: state.profileId,
      organizationId: state.organizationId
    });

    if (!identity) {
      return redirectBack(requestUrl, state.returnTo || returnToFallback, "meta=forbidden");
    }

    const exchange = await exchangeMetaOAuthCode({ code, state });
    const syncResult = await syncMetaOrganizationAssets({
      organizationId: identity.organization.id,
      connectedByProfileId: identity.profile.id,
      accessToken: exchange.accessToken,
      metaUserId: exchange.metaUserId,
      metaUserName: exchange.metaUserName
    });

    return redirectBack(
      requestUrl,
      state.returnTo || returnToFallback,
      syncResult.warnings.length > 0 ? "meta=connected&sync=partial" : "meta=connected&sync=updated"
    );
  } catch (error) {
    logApiError({
      route: "/api/integrations/meta/callback",
      operation: "HANDLE_META_CALLBACK",
      message: "Falha ao concluir o OAuth da Meta.",
      status: error instanceof EnvValidationError ? 503 : 400,
      error
    });
    if (error instanceof EnvValidationError) {
      return redirectBack(requestUrl, state.returnTo || returnToFallback, "meta=missing");
    }

    return redirectBack(requestUrl, state.returnTo || returnToFallback, "meta=error");
  }
}

function redirectBack(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  for (const part of query.split("&")) {
    const [key, value] = part.split("=");
    if (key) {
      target.searchParams.set(key, value ?? "error");
    }
  }

  return NextResponse.redirect(target);
}
