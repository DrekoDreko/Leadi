import { NextResponse } from "next/server";
import {
  getOpenAIConnectionForOrganization,
  markOpenAIConnectionValidated,
  recordIntegrationSyncLog,
  resolveCurrentIdentity,
  resolveOpenAIKeyForOrganization
} from "@/lib/integrations/repository.server";

const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = await getReturnTo(request);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  const connection = await getOpenAIConnectionForOrganization(identity.organization.id);
  const apiKey = await resolveOpenAIKeyForOrganization(identity.organization.id);

  if (!connection || !apiKey) {
    return redirectBack(requestUrl, returnTo, "openai=missing");
  }

  try {
    const response = await fetch(OPENAI_MODELS_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      throw new Error(
        payload?.error?.message || "A chave OpenAI nao respondeu como esperado no teste."
      );
    }

    await markOpenAIConnectionValidated({
      organizationId: identity.organization.id
    });

    await recordIntegrationSyncLog({
      organizationId: identity.organization.id,
      provider: "openai",
      connectionId: connection.id,
      assetType: "openai_key",
      status: "success",
      title: "Chave OpenAI validada",
      message: "A chave OpenAI respondeu corretamente ao teste de conexão.",
      details: {
        route: "api/integrations/openai/test"
      },
      createdByProfileId: identity.profile.id
    });

    return redirectBack(requestUrl, returnTo, "openai=tested");
  } catch (error) {
    console.error("Falha ao testar a chave OpenAI.", error);

    try {
      await markOpenAIConnectionValidated({
        organizationId: identity.organization.id,
        lastError:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel validar a chave OpenAI."
      });
    } catch (validationError) {
      console.error("Nao foi possivel atualizar o status da chave OpenAI.", validationError);
    }

    try {
      await recordIntegrationSyncLog({
        organizationId: identity.organization.id,
        provider: "openai",
        connectionId: connection.id,
        assetType: "openai_key",
        status: "failed",
        title: "Falha ao testar chave OpenAI",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel testar a chave OpenAI agora.",
        details: {
          route: "api/integrations/openai/test"
        },
        createdByProfileId: identity.profile.id
      });
    } catch (logError) {
      console.error("Nao foi possivel registrar o log de falha da OpenAI.", logError);
    }

    return redirectBack(requestUrl, returnTo, "openai=invalid");
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
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
