import { NextResponse } from "next/server";
import {
  markMetaConnectionDisconnected,
  getMetaConnectionForOrganization,
  recordIntegrationSyncLog,
  resolveCurrentIdentity
} from "@/lib/integrations/repository.server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  logApiError,
  normalizeReturnTo
} from "@/lib/api/route-security";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-meta-disconnect",
    limit: 10,
    windowMs: 60 * 1000
  });
  const returnTo = await getReturnTo(request);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return redirectBack(requestUrl, returnTo, "meta=disconnected");
  }

  if (!identity.canManageConnections) {
    return redirectBack(requestUrl, returnTo, "meta=forbidden");
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
    logApiError({
      route: "/api/integrations/meta/disconnect",
      operation: "DISCONNECT_META",
      message: "Falha ao desconectar a Meta.",
      status: 400,
      error,
      data: {
        organizationId: identity.organization.id
      }
    });

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
  return normalizeReturnTo(
    typeof formData?.get("returnTo") === "string" ? (formData?.get("returnTo") as string) : null,
    "/dashboard/perfil/meta"
  );
}

function redirectBack(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
