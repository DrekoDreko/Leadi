import { NextResponse } from "next/server";
import {
  markMetaConnectionDisconnected,
  getMetaConnectionForOrganization,
  recordIntegrationSyncLog,
  resolveCurrentIdentity
} from "@/lib/integrations/repository.server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = await getReturnTo(request);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return redirectBack(requestUrl, returnTo, "meta=disconnected");
  }

  const connection = await getMetaConnectionForOrganization(identity.organization.id);
  if (!connection) {
    return redirectBack(requestUrl, returnTo, "meta=disconnected");
  }

  try {
    await markMetaConnectionDisconnected({
      organizationId: identity.organization.id
    });

    const admin = createSupabaseAdminClient();
    await Promise.all([
      admin
        .from("meta_pages")
        .update({ status: "inactive" })
        .eq("organization_id", identity.organization.id),
      admin
        .from("meta_forms")
        .update({ status: "inactive" })
        .eq("organization_id", identity.organization.id),
      admin
        .from("meta_ad_accounts")
        .update({ status: "disconnected" })
        .eq("organization_id", identity.organization.id)
    ]);

    await recordIntegrationSyncLog({
      organizationId: identity.organization.id,
      provider: "meta",
      connectionId: connection.id,
      assetType: "meta_connection",
      status: "success",
      title: "Conexão Meta desconectada",
      message: "A conexão Meta foi desconectada pelo cliente.",
      details: {
        route: "api/integrations/meta/disconnect"
      },
      createdByProfileId: identity.profile.id
    });
  } catch (error) {
    console.error("Falha ao desconectar a Meta.", error);

    try {
      await recordIntegrationSyncLog({
        organizationId: identity.organization.id,
        provider: "meta",
        connectionId: connection.id,
        assetType: "meta_connection",
        status: "failed",
        title: "Falha ao desconectar Meta",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel desconectar a Meta agora.",
        details: {
          route: "api/integrations/meta/disconnect"
        },
        createdByProfileId: identity.profile.id
      });
    } catch (logError) {
      console.error("Nao foi possivel registrar o log de falha ao desconectar Meta.", logError);
    }

    return redirectBack(requestUrl, returnTo, "meta=error");
  }

  return redirectBack(requestUrl, returnTo, "meta=disconnected");
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
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
