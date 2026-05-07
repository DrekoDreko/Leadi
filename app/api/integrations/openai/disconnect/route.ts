import { NextResponse } from "next/server";
import {
  getOpenAIConnectionForOrganization,
  markOpenAIConnectionDisconnected,
  recordIntegrationSyncLog,
  resolveCurrentIdentity
} from "@/lib/integrations/repository.server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData().catch(() => null);
  const returnTo = getReturnTo(formData);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  if (!identity.canManageConnections) {
    return redirectBack(requestUrl, returnTo, "openai=error");
  }

  const connection = await getOpenAIConnectionForOrganization(identity.organization.id);
  if (!connection) {
    return redirectBack(requestUrl, returnTo, "openai=disconnected");
  }

  try {
    await markOpenAIConnectionDisconnected({
      organizationId: identity.organization.id
    });

    await recordIntegrationSyncLog({
      organizationId: identity.organization.id,
      provider: "openai",
      connectionId: connection.id,
      assetType: "openai_key",
      status: "success",
      title: "OpenAI desconectada",
      message: "A chave OpenAI da empresa foi desconectada.",
      details: {
        route: "api/integrations/openai/disconnect"
      },
      createdByProfileId: identity.profile.id
    });

    return redirectBack(requestUrl, returnTo, "openai=disconnected");
  } catch (error) {
    console.error("Falha ao desconectar a OpenAI.", error);

    try {
      await recordIntegrationSyncLog({
        organizationId: identity.organization.id,
        provider: "openai",
        connectionId: connection.id,
        assetType: "openai_key",
        status: "failed",
        title: "Falha ao desconectar OpenAI",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel desconectar a OpenAI agora.",
        details: {
          route: "api/integrations/openai/disconnect"
        },
        createdByProfileId: identity.profile.id
      });
    } catch (logError) {
      console.error("Nao foi possivel registrar o log de falha da OpenAI.", logError);
    }

    return redirectBack(requestUrl, returnTo, "openai=error");
  }
}

function getReturnTo(formData: FormData | null) {
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
