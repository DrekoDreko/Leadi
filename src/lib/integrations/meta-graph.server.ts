import "server-only";

import { requireIntegrationEnv } from "@/lib/env/server";
import {
  getMetaAppId,
  getMetaAppSecret,
  getMetaGraphApiVersion,
  getMetaOAuthScopes,
  getMetaRedirectUri
} from "@/lib/meta/config";
import {
  recordIntegrationSyncLog,
  saveMetaAssetsSnapshot,
  saveMetaConnectionSnapshot
} from "./repository.server";
import type { IntegrationStatus } from "./types";
import type { MetaOAuthStatePayload } from "./oauth-state.server";
import { MetaGraphError, MetaPermissionError, MetaTokenError } from "@/lib/meta/errors";

type MetaOAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
};

type MetaProfileResponse = {
  id?: string;
  name?: string;
};

type MetaPageResponse = {
  id?: string;
  name?: string;
  category?: string;
  access_token?: string;
};

type MetaAdAccountResponse = {
  id?: string;
  name?: string;
  currency?: string;
  timezone_name?: string;
};

type MetaLeadFormResponse = {
  id?: string;
  name?: string;
  status?: string;
};

export type MetaOAuthExchangeResult = {
  accessToken: string;
  expiresAt: string | null;
  metaUserId: string;
  metaUserName: string;
  scopes: string[];
};

type MetaAssetSyncWarning = {
  scope: string;
  message: string;
};

export type MetaPageSnapshot = {
  metaPageId: string;
  name: string;
  category: string | null;
  pageAccessToken: string | null;
  status: IntegrationStatus;
  lastSyncAt: string | null;
};

export type MetaAdAccountSnapshot = {
  metaAdAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  status: IntegrationStatus;
  lastSyncAt: string | null;
};

export type MetaLeadFormSnapshot = {
  metaFormId: string;
  name: string;
  pageId: string;
  pageName: string;
  status: IntegrationStatus;
  lastLeadSyncAt: string | null;
  lastSyncAt: string | null;
};

export function buildMetaOAuthAuthorizationUrl(input: {
  state: string;
  returnTo: string;
}) {
  requireIntegrationEnv("meta_oauth");

  const clientId = getMetaAppId().trim();
  const appSecret = getMetaAppSecret().trim();

  if (!clientId || !appSecret) {
    throw new Error("META_APP_ID ou META_APP_SECRET nao configurado.");
  }

  // OAuth classico: o parametro `scope` controla as permissoes solicitadas.
  const authUrl = new URL(`https://www.facebook.com/${getMetaGraphApiVersion()}/dialog/oauth`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", getMetaRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", input.state);
  authUrl.searchParams.set("scope", getMetaOAuthScopes().join(","));
  authUrl.searchParams.set("auth_type", "rerequest");
  authUrl.searchParams.set("return_to", input.returnTo);

  return authUrl;
}

export async function exchangeMetaOAuthCode(input: {
  code: string;
  state: MetaOAuthStatePayload;
}) {
  requireIntegrationEnv("meta_oauth");

  const clientId = getMetaAppId().trim();
  const appSecret = getMetaAppSecret().trim();
  const redirectUri = getMetaRedirectUri();

  if (!clientId || !appSecret) {
    throw new Error("META_APP_ID ou META_APP_SECRET nao configurado.");
  }

  const accessTokenResponse = await fetchMetaJson<MetaOAuthTokenResponse>(
    new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}/oauth/access_token`),
    {
      client_id: clientId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: input.code
    }
  );

  const accessToken = accessTokenResponse.access_token?.trim();
  if (!accessToken) {
    throw new Error("A Meta nao retornou um access_token valido.");
  }

  const profile = await fetchMetaJson<MetaProfileResponse>(
    buildGraphUrl("/me"),
    {
      fields: "id,name"
    },
    accessToken
  );

  return {
    accessToken,
    expiresAt: accessTokenResponse.expires_in
      ? new Date(Date.now() + accessTokenResponse.expires_in * 1000).toISOString()
      : null,
    metaUserId: profile.id?.trim() ?? input.state.profileId,
    metaUserName: profile.name?.trim() ?? "Conta Meta da organizacao",
    scopes: getMetaOAuthScopes()
  } satisfies MetaOAuthExchangeResult;
}

export async function syncMetaOrganizationAssets(input: {
  organizationId: string;
  connectedByProfileId: string;
  accessToken: string;
  metaUserId?: string | null;
  metaUserName?: string | null;
  connectionId?: string | null;
}) {
  const warnings: MetaAssetSyncWarning[] = [];
  const pages = await fetchMetaPagesSafely(input.accessToken, warnings);
  await subscribeMetaPagesToLeadgenSafely(pages, warnings);
  const adAccounts = await fetchMetaAdAccountsSafely(input.accessToken, warnings);
  const leadFormsResult = await fetchMetaLeadFormsForPages(input.accessToken, pages, warnings);
  const leadForms = leadFormsResult.leadForms;

  const connection = await saveMetaConnectionSnapshot({
    organizationId: input.organizationId,
    connectedByProfileId: input.connectedByProfileId,
    accessToken: input.accessToken,
    metaUserId: input.metaUserId ?? null,
    metaUserName: input.metaUserName ?? null,
    scopes: getMetaOAuthScopes(),
    metaAccountId: input.metaUserId ?? null,
    metaAccountName: input.metaUserName ?? null,
    status: "connected"
  });

  if (!connection) {
    throw new Error("Nao foi possivel salvar a conexao da Meta.");
  }

  const snapshot = await saveMetaAssetsSnapshot({
    organizationId: input.organizationId,
    connectedAccountId: connection.id,
    pages,
    adAccounts,
    leadForms,
    connectedByProfileId: input.connectedByProfileId
  });

  await recordIntegrationSyncLog({
    organizationId: input.organizationId,
    provider: "meta",
    connectionId: connection.id,
    assetType: "meta_assets",
    status: warnings.length > 0 ? "warning" : "success",
    title: warnings.length > 0 ? "Ativos Meta sincronizados com avisos" : "Ativos Meta sincronizados",
    message:
      warnings.length > 0
        ? `Sincronizamos ${snapshot.pages.length} paginas, ${snapshot.adAccounts.length} contas de anuncio e ${snapshot.leadForms.length} formularios com avisos.`
        : `Sincronizamos ${snapshot.pages.length} paginas, ${snapshot.adAccounts.length} contas de anuncio e ${snapshot.leadForms.length} formularios.`,
    details: {
      pages: snapshot.pages.length,
      adAccounts: snapshot.adAccounts.length,
      leadForms: snapshot.leadForms.length,
      warnings: warnings.map((warning) => warning.message)
    },
    createdByProfileId: input.connectedByProfileId
  });

  return {
    connection,
    ...snapshot,
    warnings: warnings.map((warning) => warning.message)
  };
}

async function fetchMetaPages(accessToken: string): Promise<MetaPageSnapshot[]> {
  const response = await fetchMetaJson<{ data?: MetaPageResponse[] }>(
    buildGraphUrl("/me/accounts"),
    {
      fields: "id,name,category,access_token"
    },
    accessToken
  );

  return (response.data ?? []).flatMap((page) => {
    const metaPageId = page.id?.trim();
    if (!metaPageId) {
      return [];
    }

    return [
      {
        metaPageId,
        name: page.name?.trim() || "Pagina Meta",
        category: page.category?.trim() ?? null,
        pageAccessToken: page.access_token?.trim() ?? null,
        status: "connected" as const,
        lastSyncAt: new Date().toISOString()
      }
    ];
  });
}

async function fetchMetaAdAccounts(accessToken: string): Promise<MetaAdAccountSnapshot[]> {
  const response = await fetchMetaJson<{ data?: MetaAdAccountResponse[] }>(
    buildGraphUrl("/me/adaccounts"),
    {
      fields: "id,name,currency,timezone_name"
    },
    accessToken
  );

  return (response.data ?? []).flatMap((account) => {
    const metaAdAccountId = account.id?.trim();
    if (!metaAdAccountId) {
      return [];
    }

    return [
      {
        metaAdAccountId,
        name: account.name?.trim() || "Conta de anuncio",
        currency: account.currency?.trim() || "BRL",
        timezone: account.timezone_name?.trim() || "America/Sao_Paulo",
        status: "connected" as const,
        lastSyncAt: new Date().toISOString()
      }
    ];
  });
}

async function fetchMetaLeadFormsForPages(
  accessToken: string,
  pages: MetaPageSnapshot[],
  warnings: MetaAssetSyncWarning[]
): Promise<{ leadForms: MetaLeadFormSnapshot[] }> {
  const formGroups = await Promise.all(
    pages.map(async (page) => {
      if (!page.metaPageId) {
        return [];
      }

      const pageToken = page.pageAccessToken ?? accessToken;

      try {
        const response = await fetchMetaJson<{ data?: MetaLeadFormResponse[] }>(
          buildGraphUrl(`/${page.metaPageId}/leadgen_forms`),
          {
            fields: "id,name,status"
          },
          pageToken
        );

        return (response.data ?? []).flatMap((form) => {
          const metaFormId = form.id?.trim();
          if (!metaFormId) {
            return [];
          }

          return [
            {
              metaFormId,
              name: form.name?.trim() || "Formulario Meta",
              pageId: page.metaPageId,
              pageName: page.name,
              status: mapLeadFormStatus(form.status),
              lastLeadSyncAt: null,
              lastSyncAt: new Date().toISOString()
            }
          ];
        });
      } catch (error) {
        warnings.push({
          scope: `formularios da pagina ${page.name}`,
          message: describeMetaGraphWarning(`formularios da pagina ${page.name}`, error)
        });
        return [];
      }
    })
  );

  return { leadForms: formGroups.flat() };
}

// Inscreve cada pagina conectada no app para receber eventos leadgen em
// tempo real. Requer pages_manage_metadata; sem a permissao a chamada falha
// e o aviso e registrado sem interromper o restante da sincronizacao.
async function subscribeMetaPagesToLeadgenSafely(
  pages: MetaPageSnapshot[],
  warnings: MetaAssetSyncWarning[]
): Promise<void> {
  await Promise.all(
    pages.map(async (page) => {
      if (!page.metaPageId || !page.pageAccessToken) {
        return;
      }

      try {
        await postMetaJson<{ success?: boolean }>(
          buildGraphUrl(`/${page.metaPageId}/subscribed_apps`),
          { subscribed_fields: "leadgen" },
          page.pageAccessToken
        );
      } catch (error) {
        warnings.push({
          scope: `assinatura leadgen da pagina ${page.name}`,
          message: describeMetaGraphWarning(`assinatura leadgen da pagina ${page.name}`, error)
        });
      }
    })
  );
}

async function fetchMetaPagesSafely(
  accessToken: string,
  warnings: MetaAssetSyncWarning[]
): Promise<MetaPageSnapshot[]> {
  try {
    return await fetchMetaPages(accessToken);
  } catch (error) {
    warnings.push({
      scope: "paginas",
      message: describeMetaGraphWarning("paginas", error)
    });
    return [];
  }
}

async function fetchMetaAdAccountsSafely(
  accessToken: string,
  warnings: MetaAssetSyncWarning[]
): Promise<MetaAdAccountSnapshot[]> {
  try {
    return await fetchMetaAdAccounts(accessToken);
  } catch (error) {
    warnings.push({
      scope: "contas de anuncio",
      message: describeMetaGraphWarning("contas de anuncio", error)
    });
    return [];
  }
}

async function fetchMetaJson<T>(
  url: URL,
  params: Record<string, string>,
  accessToken?: string
): Promise<T> {
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (accessToken) {
    url.searchParams.set("access_token", accessToken);
  }

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string; code?: number; error_subcode?: number; type?: string };
  } | null;

  if (!response.ok) {
    const err = payload?.error;
    if (err) {
      if (err.code === 190 || err.code === 102) {
        throw new MetaTokenError(err.message ?? "Token de acesso da Meta invalido ou expirado.");
      }
      if (err.code === 10 || err.code === 200 || err.code === 2500) {
        throw new MetaPermissionError(err.message ?? "Permissao insuficiente na Meta.");
      }
      throw new MetaGraphError(err.message ?? "Erro desconhecido na Meta API.", {
        code: err.code,
        subcode: err.error_subcode,
        type: err.type
      });
    }

    throw new MetaGraphError(`Falha na Meta Graph API: status ${response.status}.`, {
      code: response.status
    });
  }

  return payload as T;
}

async function postMetaJson<T>(
  url: URL,
  params: Record<string, string>,
  accessToken: string
): Promise<T> {
  const body = new URLSearchParams(params);
  body.set("access_token", accessToken);

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string; code?: number; error_subcode?: number; type?: string };
  } | null;

  if (!response.ok) {
    const err = payload?.error;
    if (err) {
      if (err.code === 190 || err.code === 102) {
        throw new MetaTokenError(err.message ?? "Token de acesso da Meta invalido ou expirado.");
      }
      if (err.code === 10 || err.code === 200 || err.code === 2500) {
        throw new MetaPermissionError(err.message ?? "Permissao insuficiente na Meta.");
      }
      throw new MetaGraphError(err.message ?? "Erro desconhecido na Meta API.", {
        code: err.code,
        subcode: err.error_subcode,
        type: err.type
      });
    }

    throw new MetaGraphError(`Falha na Meta Graph API: status ${response.status}.`, {
      code: response.status
    });
  }

  return payload as T;
}

function describeMetaGraphWarning(scope: string, error: unknown) {
  const detail = error instanceof Error && error.message ? error.message : "Falha na Meta Graph API.";
  return `Nao foi possivel sincronizar ${scope} da Meta: ${detail}`;
}

function buildGraphUrl(path: string) {
  return new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}${path}`);
}

function mapLeadFormStatus(value: string | undefined) {
  if (!value) {
    return "pending" as const;
  }

  const normalized = value.toLowerCase();
  if (normalized.includes("draft")) {
    return "pending" as const;
  }

  if (normalized.includes("archiv") || normalized.includes("disabled")) {
    return "disconnected" as const;
  }

  return "connected" as const;
}
