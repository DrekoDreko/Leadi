import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exchangeMetaOAuthCode,
  syncMetaOrganizationAssets
} from "./meta-graph.server";
import type { MetaOAuthStatePayload } from "./oauth-state.server";

vi.mock("server-only", () => ({}));

vi.mock("./repository.server", () => ({
  recordIntegrationSyncLog: vi.fn(async () => null),
  saveMetaAssetsSnapshot: vi.fn(async (input) => ({
    pages: input.pages,
    adAccounts: input.adAccounts,
    leadForms: input.leadForms
  })),
  saveMetaConnectionSnapshot: vi.fn(async (input) => ({
    id: "meta-connection-1",
    organizationId: input.organizationId,
    provider: "meta",
    status: "connected",
    connectedByUserId: null,
    connectedAt: new Date().toISOString(),
    expiresAt: null,
    lastSyncAt: new Date().toISOString(),
    scopes: input.scopes ?? [],
    label: "Conta Meta conectada",
    description: "",
    accessTokenCiphertext: null,
    accessTokenReference: null,
    tokenLastFour: null,
    tokenPreview: null,
    metaUserId: input.metaUserId ?? null,
    metaUserName: input.metaUserName ?? null,
    permissions: [],
    lastError: null,
    connectionStatusLabel: "Conectada"
  }))
}));

describe("Meta Graph sync helpers", () => {
  const originalEnv = {
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_GRAPH_API_VERSION: process.env.META_GRAPH_API_VERSION
  };

  beforeEach(() => {
    process.env.META_APP_ID = "app-123";
    process.env.META_APP_SECRET = "secret-123";
    process.env.META_GRAPH_API_VERSION = "v22.0";
  });

  afterEach(() => {
    process.env.META_APP_ID = originalEnv.META_APP_ID;
    process.env.META_APP_SECRET = originalEnv.META_APP_SECRET;
    process.env.META_GRAPH_API_VERSION = originalEnv.META_GRAPH_API_VERSION;
    vi.restoreAllMocks();
  });

  it("exchangeMetaOAuthCode only exchanges the code and loads the profile", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | Request | URL) => {
      const rawUrl =
        input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url;
      const url = new URL(rawUrl);

      if (url.pathname.endsWith("/oauth/access_token")) {
        return new Response(
          JSON.stringify({ access_token: "token-1", expires_in: 3600 }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        );
      }

      if (url.pathname.endsWith("/me")) {
        return new Response(JSON.stringify({ id: "user-1", name: "Conta Teste" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      throw new Error(`Unexpected fetch: ${url.toString()}`);
    });

    const result = await exchangeMetaOAuthCode({
      code: "code-123",
      state: {
        organizationId: "org-1",
        profileId: "profile-1",
        returnTo: "/dashboard/perfil"
      } as MetaOAuthStatePayload
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      accessToken: "token-1",
      metaUserId: "user-1",
      metaUserName: "Conta Teste"
    });
  });

  it("syncMetaOrganizationAssets keeps syncing when ad accounts fail", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | Request | URL) => {
      const rawUrl =
        input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url;
      const url = new URL(rawUrl);

      if (url.pathname.endsWith("/me/accounts")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "page-1",
                name: "Pagina 1",
                category: "Insurance",
                access_token: "page-token-1"
              }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        );
      }

      if (url.pathname.endsWith("/me/adaccounts")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Unsupported get request. Please read the Graph API documentation"
            }
          }),
          {
            status: 400,
            headers: { "content-type": "application/json" }
          }
        );
      }

      if (url.pathname.endsWith("/page-1/leadgen_forms")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: "form-1",
                name: "Formulario 1",
                status: "ACTIVE"
              }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        );
      }

      throw new Error(`Unexpected fetch: ${url.toString()}`);
    });

    const result = await syncMetaOrganizationAssets({
      organizationId: "org-1",
      connectedByProfileId: "profile-1",
      accessToken: "token-1",
      metaUserId: "user-1",
      metaUserName: "Conta Teste"
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.warnings).toHaveLength(1);
    expect(result.pages).toHaveLength(1);
    expect(result.adAccounts).toHaveLength(0);
    expect(result.leadForms).toHaveLength(1);
  });
});
