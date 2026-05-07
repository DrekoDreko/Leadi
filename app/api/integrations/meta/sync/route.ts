import { NextResponse } from "next/server";
import {
  getMetaConnectionForOrganization,
  recordIntegrationSyncLog,
  resolveCurrentIdentity,
  resolveMetaAccessTokenForOrganization
} from "@/lib/integrations/repository.server";
import { syncMetaOrganizationAssets } from "@/lib/integrations/meta-graph.server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = await getReturnTo(request);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return redirectBack(requestUrl, returnTo, "sync=failed");
  }

  const accessToken = await resolveMetaAccessTokenForOrganization(identity.organization.id);
  const metaConnection = await getMetaConnectionForOrganization(identity.organization.id);
  if (!accessToken || !identity.profile.id || !metaConnection) {
    return redirectBack(requestUrl, returnTo, "meta=missing&sync=failed");
  }

  try {
    await syncMetaOrganizationAssets({
      organizationId: identity.organization.id,
      connectedByProfileId: identity.profile.id,
      accessToken,
      metaUserId: metaConnection.metaUserId,
      metaUserName: metaConnection.metaUserName,
      connectionId: metaConnection.id
    });

    return redirectBack(requestUrl, returnTo, "sync=updated");
  } catch (error) {
    console.error("Falha ao sincronizar ativos Meta.", error);

    try {
      await recordIntegrationSyncLog({
        organizationId: identity.organization.id,
        provider: "meta",
        connectionId: metaConnection.id,
        assetType: "meta_assets",
        status: "failed",
        title: "Falha ao sincronizar ativos Meta",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel sincronizar os ativos Meta agora.",
        details: {
          route: "api/integrations/meta/sync"
        },
        createdByProfileId: identity.profile.id
      });
    } catch (logError) {
      console.error("Nao foi possivel registrar o log de falha da Meta.", logError);
    }

    return redirectBack(requestUrl, returnTo, "sync=failed");
  }
}

async function getReturnTo(request: Request) {
  const formData = await request.formData().catch(() => null);
  const returnTo = formData?.get("returnTo");

  if (typeof returnTo === "string" && returnTo.startsWith("/")) {
    return returnTo;
  }

  return "/dashboard/empresa";
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
