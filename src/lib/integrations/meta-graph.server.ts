import "server-only";

import { requireIntegrationEnv } from "@/lib/env/server";
import { getMetaAppId, getMetaAppSecret, getMetaGraphApiVersion, getMetaOAuthScopes, getMetaRedirectUri } from "@/lib/meta/config";
import {
  recordIntegrationSyncLog,
  saveMetaAssetsSnapshot,
  saveMetaConnectionSnapshot
} from "./repository.server";
import type { IntegrationStatus } from "./types";
import type { MetaOAuthStatePayload } from "./oauth-state.server";

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
  pages: MetaPageSnapshot[];
  adAccounts: MetaAdAccountSnapshot[];
  leadForms: MetaLeadFormSnapshot[];
  scopes: string[];
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

  const pages = await fetchMetaPages(accessToken);
  const adAccounts = await fetchMetaAdAccounts(accessToken);
  const leadForms = await fetchMetaLeadFormsForPages(accessToken, pages);

  return {
    accessToken,
    expiresAt: accessTokenResponse.expires_in
      ? new Date(Date.now() + accessTokenResponse.expires_in * 1000).toISOString()
      : null,
    metaUserId: profile.id?.trim() ?? input.state.profileId,
    metaUserName: profile.name?.trim() ?? "Conta Meta da organizacao",
    pages,
    adAccounts,
    leadForms,
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
  const pages = await fetchMetaPages(input.accessToken);
  const adAccounts = await fetchMetaAdAccounts(input.accessToken);
  const leadForms = await fetchMetaLeadFormsForPages(input.accessToken, pages);

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
    status: "success",
    title: "Ativos Meta sincronizados",
    message: `Sincronizamos ${snapshot.pages.length} paginas, ${snapshot.adAccounts.length} contas de anuncio e ${snapshot.leadForms.length} formularios.`,
    details: {
      pages: snapshot.pages.length,
      adAccounts: snapshot.adAccounts.length,
      leadForms: snapshot.leadForms.length
    },
    createdByProfileId: input.connectedByProfileId
  });

  return {
    connection,
    ...snapshot
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
  pages: MetaPageSnapshot[]
): Promise<MetaLeadFormSnapshot[]> {
  const formGroups = await Promise.all(
    pages.map(async (page) => {
      if (!page.metaPageId) {
        return [];
      }

      const pageToken = page.pageAccessToken ?? accessToken;
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
    })
  );

  return formGroups.flat();
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
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message
        ? `Falha na Meta Graph API: ${payload.error.message}`
        : `Falha na Meta Graph API: status ${response.status}.`
    );
  }

  return payload as T;
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
