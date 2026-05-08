import { NextResponse } from "next/server";
import {
  recordIntegrationSyncLog,
  resolveCurrentIdentity,
  saveOpenAIConnectionSnapshot
} from "@/lib/integrations/repository.server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData().catch(() => null);
  const returnTo = getReturnTo(formData);
  const identity = await resolveCurrentIdentity();

  if (!isSupabaseConfigured()) {
    return redirectBack(requestUrl, returnTo, "openai=missing");
  }

  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  if (!identity.canManageConnections) {
    return redirectBack(requestUrl, returnTo, "openai=error");
  }

  const apiKey = String(formData?.get("apiKey") ?? "").trim();

  if (!apiKey) {
    return redirectBack(requestUrl, returnTo, "openai=missing");
  }

  try {
    const connection = await saveOpenAIConnectionSnapshot({
      organizationId: identity.organization.id,
      connectedByProfileId: identity.profile.id,
      apiKey
    });

    await recordIntegrationSyncLog({
      organizationId: identity.organization.id,
      provider: "openai",
      connectionId: connection.id,
      assetType: "openai_key",
      status: "success",
      title: "Chave OpenAI salva",
      message: "A chave OpenAI da organizacao foi salva com segurança.",
      details: {
        route: "api/integrations/openai/save"
      },
      createdByProfileId: identity.profile.id
    });

    return redirectBack(requestUrl, returnTo, "openai=saved");
  } catch (error) {
    console.error("Falha ao salvar a chave OpenAI.", error);

    try {
      await recordIntegrationSyncLog({
        organizationId: identity.organization.id,
        provider: "openai",
        connectionId: null,
        assetType: "openai_key",
        status: "failed",
        title: "Falha ao salvar chave OpenAI",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel salvar a chave OpenAI agora.",
        details: {
          route: "api/integrations/openai/save"
        },
        createdByProfileId: identity.profile.id
      });
    } catch (logError) {
      console.error("Nao foi possivel registrar o log de falha da OpenAI.", logError);
    }

    return redirectBack(requestUrl, returnTo, "openai=invalid");
  }
}

function getReturnTo(formData: FormData | null) {
  const returnTo = formData?.get("returnTo");

  if (typeof returnTo === "string" && returnTo.startsWith("/")) {
    return returnTo;
  }

  return "/dashboard/perfil?section=empresa";
}

function redirectBack(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
