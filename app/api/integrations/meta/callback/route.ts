import { NextResponse } from "next/server";
import { exchangeMetaOAuthCode, syncMetaOrganizationAssets } from "@/lib/integrations/meta-graph.server";
import { parseMetaOAuthState } from "@/lib/integrations/oauth-state.server";
import { EnvValidationError } from "@/lib/env/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnToFallback = "/dashboard/empresa";

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
    const exchange = await exchangeMetaOAuthCode({ code, state });
    await syncMetaOrganizationAssets({
      organizationId: state.organizationId,
      connectedByProfileId: state.profileId,
      accessToken: exchange.accessToken,
      metaUserId: exchange.metaUserId,
      metaUserName: exchange.metaUserName
    });

    return redirectBack(requestUrl, state.returnTo || returnToFallback, "meta=connected&sync=updated");
  } catch (error) {
    console.error("Falha ao concluir o OAuth da Meta.", error);
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
