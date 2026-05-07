import type {
  ConnectedAccountsState,
  ConnectedAccountSummary,
  MetaAdAccount,
  MetaConnection,
  MetaLeadForm,
  MetaPage,
  OpenAIConnection
} from "./types";

const DEMO_ORGANIZATION_ID = "demo-organization";
const DEMO_ORGANIZATION_NAME = "Corretora Demo";
const DEMO_PROFILE_ID = "demo-profile";

export function getDemoConnectedAccountsState(): ConnectedAccountsState {
  const metaConnection = buildDemoMetaConnection();
  const openAIConnection = buildDemoOpenAIConnection();
  const metaPages = buildDemoMetaPages(metaConnection.id);
  const metaAdAccounts = buildDemoMetaAdAccounts(metaConnection.id);
  const metaLeadForms = buildDemoMetaLeadForms(metaConnection.id, metaPages);
  const syncLogs = buildDemoSyncLogs(metaConnection.id, openAIConnection.id);

  return {
    mode: "demo",
    organizationId: DEMO_ORGANIZATION_ID,
    organizationName: DEMO_ORGANIZATION_NAME,
    canManageConnections: true,
    connectedAccounts: [
      buildSummary(metaConnection),
      buildOpenAISummary(openAIConnection)
    ],
    metaConnection,
    openAIConnection,
    metaPages,
    metaAdAccounts,
    metaLeadForms,
    syncLogs,
    message:
      "Modo de demonstracao ativo. Conecte Supabase e as credenciais da Meta/OpenAI para operar com dados reais."
  };
}

function buildDemoMetaConnection(): MetaConnection {
  const now = new Date();

  return {
    id: "demo-meta-connection",
    organizationId: DEMO_ORGANIZATION_ID,
    provider: "meta",
    status: "connected",
    connectedByUserId: DEMO_PROFILE_ID,
    connectedAt: isoMinutesAgo(now, 34),
    expiresAt: isoDaysFromNow(now, 50),
    lastSyncAt: isoMinutesAgo(now, 12),
    scopes: [
      "business_management",
      "leads_retrieval",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "ads_read",
      "ads_management"
    ],
    accessTokenCiphertext: "demo-ciphertext",
    accessTokenReference: null,
    tokenLastFour: "Wxyz",
    metaUserId: "1000000001",
    metaUserName: "Lucas LeadHealth",
    lastError: null,
    connectionStatusLabel: "Conectada"
  };
}

function buildDemoOpenAIConnection(): OpenAIConnection {
  const now = new Date();

  return {
    id: "demo-openai-connection",
    organizationId: DEMO_ORGANIZATION_ID,
    provider: "openai",
    status: "connected",
    apiKeyCiphertext: "demo-openai-ciphertext",
    apiKeyReference: null,
    keyPreview: "sk-...Wxyz",
    keyLastFour: "Wxyz",
    connectedAt: isoMinutesAgo(now, 58),
    lastValidatedAt: isoMinutesAgo(now, 6),
    connectedByUserId: DEMO_PROFILE_ID,
    lastError: null
  };
}

function buildDemoMetaPages(connectedAccountId: string): MetaPage[] {
  const now = new Date();

  return [
    {
      id: "demo-meta-page-1",
      organizationId: DEMO_ORGANIZATION_ID,
      metaPageId: "page_123456",
      name: "LeadHealth Corretora",
      category: "Insurance company",
      status: "connected",
      connectedAccountId,
      lastSyncAt: isoMinutesAgo(now, 12)
    },
    {
      id: "demo-meta-page-2",
      organizationId: DEMO_ORGANIZATION_ID,
      metaPageId: "page_789012",
      name: "LeadHealth Saúde Empresarial",
      category: "Product/service",
      status: "connected",
      connectedAccountId,
      lastSyncAt: isoMinutesAgo(now, 18)
    }
  ];
}

function buildDemoMetaAdAccounts(connectedAccountId: string): MetaAdAccount[] {
  const now = new Date();

  return [
    {
      id: "demo-meta-ad-account-1",
      organizationId: DEMO_ORGANIZATION_ID,
      metaAdAccountId: "act_123456789",
      name: "LeadHealth Principal",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      status: "connected",
      connectedAccountId,
      lastSyncAt: isoMinutesAgo(now, 14)
    },
    {
      id: "demo-meta-ad-account-2",
      organizationId: DEMO_ORGANIZATION_ID,
      metaAdAccountId: "act_987654321",
      name: "LeadHealth Testes",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      status: "connected",
      connectedAccountId,
      lastSyncAt: isoMinutesAgo(now, 28)
    }
  ];
}

function buildDemoMetaLeadForms(
  connectedAccountId: string,
  pages: MetaPage[]
): MetaLeadForm[] {
  const now = new Date();

  return [
    {
      id: "demo-meta-form-1",
      organizationId: DEMO_ORGANIZATION_ID,
      metaFormId: "form_445566",
      name: "Cotacao empresarial - principal",
      pageId: pages[0]?.metaPageId ?? "page_123456",
      pageName: pages[0]?.name ?? "LeadHealth Corretora",
      status: "connected",
      connectedAccountId,
      lastLeadSyncAt: isoMinutesAgo(now, 9),
      lastSyncAt: isoMinutesAgo(now, 11)
    },
    {
      id: "demo-meta-form-2",
      organizationId: DEMO_ORGANIZATION_ID,
      metaFormId: "form_778899",
      name: "Analise consultiva - interior",
      pageId: pages[1]?.metaPageId ?? "page_789012",
      pageName: pages[1]?.name ?? "LeadHealth Saúde Empresarial",
      status: "pending",
      connectedAccountId,
      lastLeadSyncAt: null,
      lastSyncAt: isoMinutesAgo(now, 19)
    }
  ];
}

function buildDemoSyncLogs(
  metaConnectionId: string,
  openAIConnectionId: string
): ConnectedAccountsState["syncLogs"] {
  const now = new Date();

  return [
    {
      id: "demo-sync-1",
      organizationId: DEMO_ORGANIZATION_ID,
      provider: "meta",
      connectionId: metaConnectionId,
      assetType: "meta_lead_forms",
      status: "success",
      title: "Formularios Meta sincronizados",
      message: "2 formularios encontrados na pagina principal conectada.",
      details: {
        forms: 2,
        pages: 2
      },
      createdByUserId: DEMO_PROFILE_ID,
      createdAt: isoMinutesAgo(now, 9)
    },
    {
      id: "demo-sync-2",
      organizationId: DEMO_ORGANIZATION_ID,
      provider: "meta",
      connectionId: metaConnectionId,
      assetType: "meta_ad_accounts",
      status: "warning",
      title: "Conta de anuncios revisada",
      message: "1 conta de anuncios estava com aviso de permissao e foi mantida em monitoramento.",
      details: {
        accounts: 2
      },
      createdByUserId: DEMO_PROFILE_ID,
      createdAt: isoMinutesAgo(now, 16)
    },
    {
      id: "demo-sync-3",
      organizationId: DEMO_ORGANIZATION_ID,
      provider: "openai",
      connectionId: openAIConnectionId,
      assetType: "openai_key",
      status: "success",
      title: "Chave OpenAI validada",
      message: "A chave do cliente respondeu corretamente ao teste de conexao.",
      details: {
        model: "gpt-4o-mini"
      },
      createdByUserId: DEMO_PROFILE_ID,
      createdAt: isoMinutesAgo(now, 6)
    }
  ];
}

function buildSummary(connection: MetaConnection): ConnectedAccountSummary {
  return {
    id: connection.id,
    provider: connection.provider,
    label: connection.metaUserName || "Conta Meta conectada",
    status: connection.status,
    lastSyncAt: connection.lastSyncAt,
    description: "Página, contas de anúncio e formulários sincronizados."
  };
}

function buildOpenAISummary(connection: OpenAIConnection): ConnectedAccountSummary {
  return {
    id: connection.id,
    provider: connection.provider,
    label: "OpenAI do cliente",
    status: connection.status,
    lastSyncAt: connection.lastValidatedAt,
    description: "Chave cadastrada pelo cliente e validada para uso na IA."
  };
}

function isoMinutesAgo(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000).toISOString();
}

function isoDaysFromNow(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
