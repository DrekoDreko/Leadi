import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildMetaConnectionDiagnostics,
  buildMetaOperationalSummary,
  MetaOverviewCard
} from "./profile-sections";
import type { ConnectedAccountsState } from "@/lib/integrations/types";

function createConnectedAccountsState(
  overrides: Partial<ConnectedAccountsState> = {}
): ConnectedAccountsState {
  return {
    mode: "supabase",
    organizationId: "org-1",
    organizationName: "Workspace Leadi",
    canManageConnections: true,
    connectedAccounts: [],
    metaConnection: null,
    openAIConnection: null,
    metaPages: [],
    metaAdAccounts: [],
    metaLeadForms: [],
    syncLogs: [],
    ...overrides
  };
}

describe("buildMetaOperationalSummary", () => {
  it("resume a operacao Meta com ativos, alertas e ultimo evento de sync", () => {
    const summary = buildMetaOperationalSummary(
      createConnectedAccountsState({
        metaConnection: {
          id: "meta-1",
          organizationId: "org-1",
          provider: "meta",
          status: "connected",
          connectedByUserId: "user-1",
          connectedAt: "2026-05-21T10:00:00.000Z",
          expiresAt: null,
          lastSyncAt: "2026-05-22T12:00:00.000Z",
          scopes: ["leads_retrieval"],
          accessTokenCiphertext: null,
          accessTokenReference: null,
          tokenLastFour: null,
          tokenPreview: null,
          metaUserId: "meta-user-1",
          metaUserName: "Equipe Meta",
          permissions: ["leads_retrieval", "ads_read"],
          lastError: null,
          connectionStatusLabel: "Conectada"
        },
        metaPages: [
          {
            id: "page-1",
            organizationId: "org-1",
            metaPageId: "100",
            name: "Pagina principal",
            category: "Seguros",
            status: "connected",
            connectedAccountId: "meta-1",
            lastSyncAt: "2026-05-22T11:00:00.000Z"
          }
        ],
        metaAdAccounts: [
          {
            id: "ad-1",
            organizationId: "org-1",
            metaAdAccountId: "act_1",
            name: "Conta principal",
            currency: "BRL",
            timezone: "America/Sao_Paulo",
            status: "error",
            connectedAccountId: "meta-1",
            lastSyncAt: "2026-05-22T10:00:00.000Z"
          }
        ],
        metaLeadForms: [
          {
            id: "form-1",
            organizationId: "org-1",
            metaFormId: "form_1",
            name: "Formulario A",
            pageId: "100",
            pageName: "Pagina principal",
            status: "pending",
            connectedAccountId: "meta-1",
            lastLeadSyncAt: "2026-05-22T09:30:00.000Z",
            lastSyncAt: "2026-05-22T09:30:00.000Z"
          }
        ],
        syncLogs: [
          {
            id: "sync-1",
            organizationId: "org-1",
            provider: "meta",
            connectionId: "meta-1",
            assetType: "meta_assets",
            status: "warning",
            title: "Sincronizacao parcial",
            message: "Um ativo ficou pendente.",
            details: {},
            createdByUserId: "user-1",
            createdAt: "2026-05-22T12:10:00.000Z"
          }
        ]
      })
    );

    expect(summary.connectionTitle).toBe("Conexao ativa");
    expect(summary.totalAssetsCount).toBe(3);
    expect(summary.activeAssetsCount).toBe(1);
    expect(summary.attentionAssetsCount).toBe(2);
    expect(summary.latestSyncStatus).toBe("Sync com alerta");
    expect(summary.lastSyncAt).toBe("2026-05-22T12:10:00.000Z");
  });
});

describe("MetaOverviewCard", () => {
  it("mostra o estado operacional e o feed recente da Meta", () => {
    render(
      <MetaOverviewCard
        connectedAccounts={createConnectedAccountsState({
          metaConnection: {
            id: "meta-1",
            organizationId: "org-1",
            provider: "meta",
            status: "connected",
            connectedByUserId: "user-1",
            connectedAt: "2026-05-21T10:00:00.000Z",
            expiresAt: null,
            lastSyncAt: "2026-05-22T12:00:00.000Z",
            scopes: ["leads_retrieval"],
            accessTokenCiphertext: null,
            accessTokenReference: null,
            tokenLastFour: null,
            tokenPreview: null,
            metaUserId: "meta-user-1",
            metaUserName: "Equipe Meta",
            permissions: ["leads_retrieval", "ads_read"],
            lastError: null,
            connectionStatusLabel: "Conectada"
          },
          metaPages: [
            {
              id: "page-1",
              organizationId: "org-1",
              metaPageId: "100",
              name: "Pagina principal",
              category: "Seguros",
              status: "connected",
              connectedAccountId: "meta-1",
              lastSyncAt: "2026-05-22T11:00:00.000Z"
            }
          ],
          metaLeadForms: [
            {
              id: "form-1",
              organizationId: "org-1",
              metaFormId: "form_1",
              name: "Formulario A",
              pageId: "100",
              pageName: "Pagina principal",
              status: "connected",
              connectedAccountId: "meta-1",
              lastLeadSyncAt: "2026-05-22T09:30:00.000Z",
              lastSyncAt: "2026-05-22T09:30:00.000Z"
            }
          ],
          metaAdAccounts: [
            {
              id: "ad-1",
              organizationId: "org-1",
              metaAdAccountId: "act_1",
              name: "Conta principal",
              currency: "BRL",
              timezone: "America/Sao_Paulo",
              status: "connected",
              connectedAccountId: "meta-1",
              lastSyncAt: "2026-05-22T10:00:00.000Z"
            }
          ],
          syncLogs: [
            {
              id: "sync-1",
              organizationId: "org-1",
              provider: "meta",
              connectionId: "meta-1",
              assetType: "meta_assets",
              status: "success",
              title: "Ativos sincronizados",
              message: "Paginas, formularios e contas atualizados.",
              details: {},
              createdByUserId: "user-1",
              createdAt: "2026-05-22T12:10:00.000Z"
            }
          ]
        })}
        missingMetaOAuthEnvKeys={[]}
        missingMetaSyncEnvKeys={[]}
        workspaceName="Workspace Leadi"
      />
    );

    expect(screen.getByText("Status operacional da Meta")).toBeInTheDocument();
    expect(screen.getByText("Diagnostico rapido da conexao")).toBeInTheDocument();
    expect(screen.getByText("Conexao ativa")).toBeInTheDocument();
    expect(screen.getByText("Ultimas sincronizacoes")).toBeInTheDocument();
    expect(screen.getByText("Ativos sincronizados")).toBeInTheDocument();
    expect(screen.getByText("Paginas, formularios e contas atualizados.")).toBeInTheDocument();
    expect(screen.getByText("Contas de anuncio")).toBeInTheDocument();
  });
});

describe("buildMetaConnectionDiagnostics", () => {
  it("prioriza env ausente quando o servidor nao consegue sustentar a integracao", () => {
    const diagnostics = buildMetaConnectionDiagnostics(createConnectedAccountsState(), {
      missingMetaOAuthEnvKeys: ["META_APP_ID", "META_APP_SECRET"],
      missingMetaSyncEnvKeys: ["SUPABASE_SERVICE_ROLE_KEY"]
    });

    expect(diagnostics.categoryLabel).toBe("Ambiente");
    expect(diagnostics.title).toBe("Ambiente da Meta ainda incompleto");
    expect(diagnostics.summary).toContain("META_APP_ID");
    expect(diagnostics.summary).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("aponta falha de sincronizacao quando a conta esta conectada mas a ultima sync falhou", () => {
    const diagnostics = buildMetaConnectionDiagnostics(
      createConnectedAccountsState({
        metaConnection: {
          id: "meta-1",
          organizationId: "org-1",
          provider: "meta",
          status: "connected",
          connectedByUserId: "user-1",
          connectedAt: "2026-05-21T10:00:00.000Z",
          expiresAt: null,
          lastSyncAt: "2026-05-22T12:00:00.000Z",
          scopes: ["leads_retrieval"],
          accessTokenCiphertext: null,
          accessTokenReference: null,
          tokenLastFour: null,
          tokenPreview: null,
          metaUserId: "meta-user-1",
          metaUserName: "Equipe Meta",
          permissions: ["leads_retrieval", "ads_read"],
          lastError: null,
          connectionStatusLabel: "Conectada"
        },
        syncLogs: [
          {
            id: "sync-1",
            organizationId: "org-1",
            provider: "meta",
            connectionId: "meta-1",
            assetType: "meta_assets",
            status: "failed",
            title: "Falha ao sincronizar ativos Meta",
            message: "Token rejeitado pela Meta.",
            details: {},
            createdByUserId: "user-1",
            createdAt: "2026-05-22T12:10:00.000Z"
          }
        ]
      })
    );

    expect(diagnostics.categoryLabel).toBe("Sincronizacao");
    expect(diagnostics.title).toBe("A ultima sincronizacao Meta falhou");
    expect(diagnostics.summary).toContain("Token rejeitado pela Meta.");
  });
});
