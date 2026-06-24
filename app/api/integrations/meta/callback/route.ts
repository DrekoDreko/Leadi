import { NextResponse } from "next/server";
import { exchangeMetaOAuthCode, syncMetaOrganizationAssets } from "@/lib/integrations/meta-graph.server";
import { parseMetaOAuthState, type MetaOAuthStatePayload } from "@/lib/integrations/oauth-state.server";
import { resolveMetaOAuthStateIdentity } from "@/lib/integrations/repository.server";
import { MetaPermissionError, MetaTokenError } from "@/lib/meta/errors";
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

  const stateValue = requestUrl.searchParams.get("state")?.trim();
  let state: MetaOAuthStatePayload | undefined;

  if (stateValue) {
    try {
      state = parseMetaOAuthState(stateValue);
    } catch (error) {
      console.error("State OAuth da Meta invalido.", error);
    }
  }

  const returnTo = state?.returnTo || returnToFallback;

  if (requestUrl.searchParams.has("error")) {
    const errorReason = requestUrl.searchParams.get("error_reason");
    const errorDesc = requestUrl.searchParams.get("error_description");

    if (errorReason === "user_denied") {
      return redirectBack(requestUrl, returnTo, "meta=user_denied");
    }

    logApiError({
      route: "/api/integrations/meta/callback",
      operation: "HANDLE_META_CALLBACK_ERROR",
      message: `Meta OAuth retornou erro: ${errorReason || requestUrl.searchParams.get("error")}`,
      status: 400,
      error: new Error(errorDesc || "Erro desconhecido retornado pela Meta")
    });

    return redirectBack(requestUrl, returnTo, "meta=error");
  }

  const code = requestUrl.searchParams.get("code")?.trim();

  if (!code || !stateValue || !state) {
    return redirectBack(requestUrl, returnToFallback, "meta=invalid_request");
  }

  try {
    const identity = await resolveMetaOAuthStateIdentity({
      profileId: state.profileId,
      organizationId: state.organizationId,
      scope: state.scope
    });

    if (!identity) {
      return redirectBack(requestUrl, returnTo, "meta=forbidden");
    }

    // Conexão pessoal do consultor é vinculada ao perfil dele; a da corretora fica org-level.
    const ownerProfileId = state.scope === "personal" ? identity.profile.id : null;

    const exchange = await exchangeMetaOAuthCode({ code, state });
    const syncResult = await syncMetaOrganizationAssets({
      organizationId: identity.organization.id,
      connectedByProfileId: identity.profile.id,
      ownerProfileId,
      accessToken: exchange.accessToken,
      metaUserId: exchange.metaUserId,
      metaUserName: exchange.metaUserName
    });

    return redirectBack(
      requestUrl,
      returnTo,
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
      return redirectBack(requestUrl, returnTo, "meta=missing");
    }
    if (error instanceof MetaTokenError) {
      return redirectBack(requestUrl, returnTo, "meta=token_expired");
    }
    if (error instanceof MetaPermissionError) {
      return redirectBack(requestUrl, returnTo, "meta=missing_permissions");
    }

    return redirectBack(requestUrl, returnTo, "meta=error");
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
