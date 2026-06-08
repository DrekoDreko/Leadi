import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Json, MetaConnectionStatus } from "@/lib/supabase/database.types";
import { normalizeWorkspaceRole } from "@/lib/workspaces/permissions";
import { getDemoConnectedAccountsState } from "./demo";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
  maskIntegrationSecretPreview
} from "./crypto.server";
import type {
  ConnectedAccountsState,
  ConnectedAccountSummary,
  IntegrationConnectionStatus,
  IntegrationProvider,
  IntegrationSyncStatus,
  MetaAdAccount,
  MetaConnection,
  MetaConnectionRow,
  MetaAdAccountRow,
  MetaFormRow,
  MetaLeadForm,
  MetaPage,
  MetaPageRow,
  OpenAIConnection,
  OpenAIConnectionRow,
  SyncLogEntry,
  IntegrationSyncLogRow
} from "./types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

type MutationIdentity = {
  profile: ProfileRow;
  organization: OrganizationRow;
  canManageConnections: boolean;
};

type ConnectedAccountsLoadOptions = {
  includeOpenAIConnection: boolean;
  includeSyncLogs: boolean;
};

const DEMO_STATE = getDemoConnectedAccountsState();
const PUBLIC_META_CONNECTION_COLUMNS = [
  "id",
  "organization_id",
  "connected_by_profile_id",
  "connected_at",
  "expires_at",
  "meta_user_id",
  "meta_user_name",
  "meta_account_id",
  "meta_account_name",
  "token_expires_at",
  "scopes",
  "connection_status",
  "status",
  "last_synced_at",
  "last_error",
  "created_at",
  "updated_at"
].join(",");
const PUBLIC_OPENAI_CONNECTION_COLUMNS = [
  "id",
  "organization_id",
  "connected_by_profile_id",
  "provider",
  "status",
  "connected_at",
  "last_validated_at",
  "last_error",
  "created_at",
  "updated_at"
].join(",");

export async function getConnectedAccountsForCurrentUser(): Promise<ConnectedAccountsState> {
  if (!isSupabaseConfigured()) {
    return DEMO_STATE;
  }

  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return buildUnauthenticatedConnectedAccountsState();
  }

  return loadConnectedAccountsState(identity, {
    includeOpenAIConnection: false,
    includeSyncLogs: false
  });
}

export async function getManagedConnectedAccountsForCurrentUser(): Promise<ConnectedAccountsState> {
  if (!isSupabaseConfigured()) {
    return DEMO_STATE;
  }

  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return buildUnauthenticatedConnectedAccountsState();
  }

  return loadConnectedAccountsState(identity, {
    includeOpenAIConnection: true,
    includeSyncLogs: true
  });
}

async function loadConnectedAccountsState(
  identity: MutationIdentity,
  options: ConnectedAccountsLoadOptions
): Promise<ConnectedAccountsState> {
  const admin = createSupabaseAdminClient();

  try {
    const [metaConnections, openAIConnection, metaPages, metaAdAccounts, metaLeadForms, syncLogs] =
      await Promise.all([
        admin
          .from("meta_integrations")
          .select(PUBLIC_META_CONNECTION_COLUMNS)
          .eq("organization_id", identity.organization.id)
          .order("created_at", { ascending: false }),
        options.includeOpenAIConnection
          ? admin
              .from("openai_connections")
              .select(PUBLIC_OPENAI_CONNECTION_COLUMNS)
              .eq("organization_id", identity.organization.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        admin
          .from("meta_pages")
          .select("*")
          .eq("organization_id", identity.organization.id)
          .order("created_at", { ascending: false }),
        admin
          .from("meta_ad_accounts")
          .select("*")
          .eq("organization_id", identity.organization.id)
          .order("created_at", { ascending: false }),
        admin
          .from("meta_forms")
          .select("*")
          .eq("organization_id", identity.organization.id)
          .order("created_at", { ascending: false }),
        options.includeSyncLogs
          ? admin
              .from("integration_sync_logs")
              .select("*")
              .eq("organization_id", identity.organization.id)
              .order("created_at", { ascending: false })
              .limit(8)
          : Promise.resolve({ data: [], error: null })
      ]);

    if (
      metaConnections.error ||
      openAIConnection.error ||
      metaPages.error ||
      metaAdAccounts.error ||
      metaLeadForms.error ||
      syncLogs.error
    ) {
      throw buildIntegrationQueryError(
        metaConnections.error?.message ??
          openAIConnection.error?.message ??
          metaPages.error?.message ??
          metaAdAccounts.error?.message ??
          metaLeadForms.error?.message ??
          syncLogs.error?.message ??
          "Nao foi possivel carregar as contas conectadas."
      );
    }

    const metaConnection = mapMetaConnectionRow(
      (metaConnections.data?.[0] ?? null) as unknown as MetaConnectionRow | null
    );
    const openAiConnection = mapOpenAIConnectionRow(
      (openAIConnection.data ?? null) as unknown as OpenAIConnectionRow | null
    );
    const mappedMetaPages = mapMetaPageRows(metaPages.data ?? []);
    const mappedMetaAdAccounts = mapMetaAdAccountRows(metaAdAccounts.data ?? []);
    const mappedMetaLeadForms = mapMetaLeadFormRows(metaLeadForms.data ?? [], mappedMetaPages);
    const mappedSyncLogs = mapSyncLogRows(syncLogs.data ?? []);
    const connectedAccounts = buildConnectedAccountSummaries(metaConnection, openAiConnection);

    return {
      mode: "supabase",
      organizationId: identity.organization.id,
      organizationName: identity.organization.name,
      canManageConnections: identity.canManageConnections,
      connectedAccounts,
      metaConnection,
      openAIConnection: openAiConnection,
      metaPages: mappedMetaPages,
      metaAdAccounts: mappedMetaAdAccounts,
      metaLeadForms: mappedMetaLeadForms,
      syncLogs: mappedSyncLogs
    };
  } catch (error) {
    return {
      mode: "error",
      organizationId: identity.organization.id,
      organizationName: identity.organization.name,
      canManageConnections: identity.canManageConnections,
      connectedAccounts: [],
      metaConnection: null,
      openAIConnection: null,
      metaPages: [],
      metaAdAccounts: [],
      metaLeadForms: [],
      syncLogs: [],
      message:
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel carregar as contas conectadas."
    };
  }
}

export async function resolveCurrentIdentity(): Promise<MutationIdentity | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  if (organizationError || !organization) {
    return null;
  }

  return {
    profile,
    organization,
    canManageConnections: canManageConnections(profile, organization)
  };
}

export async function resolveMetaOAuthStateIdentity(input: {
  profileId: string;
  organizationId: string;
}): Promise<MutationIdentity | null> {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const [{ data: profile, error: profileError }, { data: organization, error: organizationError }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", input.profileId).maybeSingle(),
      admin.from("organizations").select("*").eq("id", input.organizationId).maybeSingle()
    ]);

  if (profileError || organizationError || !profile || !organization) {
    return null;
  }

  if (profile.organization_id !== organization.id) {
    return null;
  }

  const identity = {
    profile,
    organization,
    canManageConnections: canManageConnections(profile, organization)
  };

  return identity.canManageConnections ? identity : null;
}

export async function getMetaConnectionForOrganization(organizationId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("meta_integrations")
    .select(PUBLIC_META_CONNECTION_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapMetaConnectionRow(data as unknown as MetaConnectionRow);
}

export async function getOpenAIConnectionForOrganization(organizationId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("openai_connections")
    .select(PUBLIC_OPENAI_CONNECTION_COLUMNS)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapOpenAIConnectionRow(data as unknown as OpenAIConnectionRow);
}

async function getMetaConnectionSecretForOrganization(organizationId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("meta_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getOpenAIConnectionSecretForOrganization(organizationId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("openai_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function resolveMetaAccessTokenForOrganization(organizationId: string) {
  const connection = await getMetaConnectionSecretForOrganization(organizationId);

  if (!connection) {
    return null;
  }

  const status = mapMetaConnectionStatus(connection);
  if (status === "disconnected" || status === "expired") {
    return null;
  }

  if (connection.access_token_ciphertext) {
    try {
      return decryptIntegrationSecret(connection.access_token_ciphertext);
    } catch (error) {
      console.error("Falha ao descriptografar o token da Meta.", error);
      return null;
    }
  }

  return null;
}

export async function resolveOpenAIKeyForOrganization(organizationId: string) {
  const connection = await getOpenAIConnectionSecretForOrganization(organizationId);

  if (!connection) {
    return null;
  }

  const status = mapIntegrationStatus(connection.status);
  if (status === "disconnected" || status === "expired") {
    return null;
  }

  if (connection.api_key_ciphertext) {
    try {
      return decryptIntegrationSecret(connection.api_key_ciphertext);
    } catch (error) {
      console.error("Falha ao descriptografar a chave OpenAI.", error);
      return null;
    }
  }

  return null;
}

export async function saveMetaConnectionSnapshot(input: {
  organizationId: string;
  connectedByProfileId: string;
  accessToken: string;
  tokenExpiresAt?: string | null;
  metaUserId?: string | null;
  metaUserName?: string | null;
  scopes?: string[];
  metaAccountId?: string | null;
  metaAccountName?: string | null;
  status?: IntegrationConnectionStatus;
  connectedAt?: string | null;
}): Promise<MetaConnection> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const encryptedToken = encryptIntegrationSecret(input.accessToken);
  const connectedAt = input.connectedAt ?? new Date().toISOString();
  const status = input.status ?? "connected";

  const { data, error } = await admin
    .from("meta_integrations")
    .upsert(
      {
        organization_id: input.organizationId,
        connected_by_profile_id: input.connectedByProfileId,
        connected_at: connectedAt,
        expires_at: input.tokenExpiresAt ?? null,
        meta_user_id: input.metaUserId ?? null,
        meta_user_name: input.metaUserName ?? null,
        meta_account_id: input.metaAccountId ?? input.metaUserId ?? null,
        meta_account_name: input.metaAccountName ?? input.metaUserName ?? null,
        access_token_ciphertext: encryptedToken,
        access_token_reference: null,
        token_last_four: input.accessToken.slice(-4),
        token_expires_at: input.tokenExpiresAt ?? null,
        scopes: input.scopes ?? [],
        connection_status: status,
        status: status === "connected" ? "active" : status === "disconnected" ? "inactive" : "error",
        last_synced_at: new Date().toISOString(),
        last_error: null
      },
      {
        onConflict: "organization_id,meta_account_id"
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel salvar a conexao Meta.");
  }

  const connection = mapMetaConnectionRow(data);
  if (!connection) {
    throw new Error("Nao foi possivel normalizar a conexao Meta salva.");
  }

  return connection;
}

export async function markMetaConnectionDisconnected(input: {
  organizationId: string;
  lastError?: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("meta_integrations")
    .update({
      connection_status: "disconnected",
      status: "inactive",
      last_error: input.lastError ?? null,
      expires_at: new Date().toISOString()
    })
    .eq("organization_id", input.organizationId)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapMetaConnectionRow(data) : null;
}

export async function saveMetaAssetsSnapshot(input: {
  organizationId: string;
  connectedAccountId: string;
  pages: Array<{
    metaPageId: string;
    name: string;
    category?: string | null;
    status?: IntegrationConnectionStatus;
    lastSyncAt?: string | null;
  }>;
  adAccounts: Array<{
    metaAdAccountId: string;
    name: string;
    currency: string;
    timezone: string;
    status?: IntegrationConnectionStatus;
    lastSyncAt?: string | null;
  }>;
  leadForms: Array<{
    metaFormId: string;
    name: string;
    pageId: string;
    pageName: string;
    status?: IntegrationConnectionStatus;
    lastLeadSyncAt?: string | null;
    lastSyncAt?: string | null;
  }>;
  connectedByProfileId?: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const metaPageRows = input.pages.map((page) => ({
    organization_id: input.organizationId,
    integration_id: input.connectedAccountId,
    connected_account_id: input.connectedAccountId,
    page_id: page.metaPageId,
    page_name: page.name,
    category: page.category ?? null,
    status: mapIntegrationStatusToMetaConnectionStatus(page.status ?? "connected"),
    last_synced_at: page.lastSyncAt ?? now
  }));

  const adAccountRows = input.adAccounts.map((account) => ({
    organization_id: input.organizationId,
    connected_account_id: input.connectedAccountId,
    meta_ad_account_id: account.metaAdAccountId,
    name: account.name,
    currency: account.currency,
    timezone: account.timezone,
    status: account.status ?? "connected",
    last_synced_at: account.lastSyncAt ?? now
  }));

  const pageConnectionMap = new Map<string, string>();
  const { data: insertedPages, error: pagesError } = metaPageRows.length
    ? await admin.from("meta_pages").upsert(metaPageRows, { onConflict: "organization_id,page_id" }).select("*")
    : { data: [], error: null };

  if (pagesError) {
    throw new Error(pagesError.message);
  }

  for (const page of insertedPages ?? []) {
    pageConnectionMap.set(page.page_id, page.id);
  }

  const formsToUpsert = await Promise.all(
    input.leadForms.map(async (form) => {
      const pageConnectionId =
        pageConnectionMap.get(form.pageId) ??
        (await resolveMetaPageConnectionId(admin, input.organizationId, form.pageId));

      if (!pageConnectionId) {
        throw new Error(
          `Nao foi possivel localizar a pagina Meta ${form.pageId} para o formulario ${form.metaFormId}.`
        );
      }

      return {
        organization_id: input.organizationId,
        page_connection_id: pageConnectionId,
        connected_account_id: input.connectedAccountId,
        page_id: form.pageId,
        page_name: form.pageName,
        form_id: form.metaFormId,
        form_name: form.name,
        status: mapIntegrationStatusToMetaConnectionStatus(form.status ?? "connected"),
        last_synced_at: form.lastSyncAt ?? form.lastLeadSyncAt ?? now
      };
    })
  );

  const { error: adAccountsError } = adAccountRows.length
    ? await admin.from("meta_ad_accounts").upsert(adAccountRows, { onConflict: "organization_id,meta_ad_account_id" })
    : { error: null };

  if (adAccountsError) {
    throw new Error(adAccountsError.message);
  }

  const { error: formsError } = formsToUpsert.length
    ? await admin.from("meta_forms").upsert(formsToUpsert, { onConflict: "organization_id,form_id" })
    : { error: null };

  if (formsError) {
    throw new Error(formsError.message);
  }

  return {
    pages: insertedPages ? insertedPages.map(mapMetaPageRow) : [],
    adAccounts: adAccountRows.length ? await loadMetaAdAccounts(admin, input.organizationId) : [],
    leadForms: formsToUpsert.length ? await loadMetaLeadForms(admin, input.organizationId) : []
  };
}

export async function saveOpenAIConnectionSnapshot(input: {
  organizationId: string;
  connectedByProfileId: string;
  apiKey: string;
  status?: IntegrationConnectionStatus;
  lastValidatedAt?: string | null;
}): Promise<OpenAIConnection> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const encryptedKey = encryptIntegrationSecret(input.apiKey);
  const { data, error } = await admin
    .from("openai_connections")
    .upsert(
      {
        organization_id: input.organizationId,
        connected_by_profile_id: input.connectedByProfileId,
        provider: "openai",
        status: input.status ?? "connected",
        api_key_ciphertext: encryptedKey,
        api_key_reference: null,
        key_preview: maskIntegrationSecretPreview(input.apiKey),
        key_last_four: input.apiKey.slice(-4),
        connected_at: new Date().toISOString(),
        last_validated_at: input.lastValidatedAt ?? new Date().toISOString(),
        last_error: null
      },
      { onConflict: "organization_id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel salvar a chave OpenAI.");
  }

  const connection = mapOpenAIConnectionRow(data);
  if (!connection) {
    throw new Error("Nao foi possivel normalizar a chave OpenAI salva.");
  }

  return connection;
}

export async function markOpenAIConnectionValidated(input: {
  organizationId: string;
  lastError?: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("openai_connections")
    .update({
      status: input.lastError ? "error" : "connected",
      last_validated_at: new Date().toISOString(),
      last_error: input.lastError ?? null
    })
    .eq("organization_id", input.organizationId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapOpenAIConnectionRow(data) : null;
}

export async function markOpenAIConnectionDisconnected(input: {
  organizationId: string;
  lastError?: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("openai_connections")
    .update({
      status: "disconnected",
      last_error: input.lastError ?? null
    })
    .eq("organization_id", input.organizationId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapOpenAIConnectionRow(data) : null;
}

export async function recordIntegrationSyncLog(input: {
  organizationId: string;
  provider: IntegrationProvider;
  connectionId?: string | null;
  assetType: string;
  status: IntegrationSyncStatus;
  title: string;
  message: string;
  details?: Json;
  createdByProfileId?: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("integration_sync_logs")
    .insert({
      organization_id: input.organizationId,
      provider: input.provider,
      connection_id: input.connectionId ?? null,
      asset_type: input.assetType,
      status: input.status,
      title: input.title,
      message: input.message,
      details: input.details ?? {},
      created_by_profile_id: input.createdByProfileId ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel registrar o log de sincronizacao.");
  }

  return mapSyncLogRow(data);
}

export async function saveMetaFormsForPages(input: {
  organizationId: string;
  connectedAccountId: string;
  forms: Array<{
    pageConnectionId: string;
    pageId: string;
    pageName: string;
    metaFormId: string;
    name: string;
    status?: IntegrationConnectionStatus;
    lastLeadSyncAt?: string | null;
    lastSyncAt?: string | null;
  }>;
}) {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("meta_forms").upsert(
    await Promise.all(
      input.forms.map(async (form) => {
        const pageConnectionId =
          (await resolveMetaPageConnectionId(admin, input.organizationId, form.pageConnectionId)) ??
          form.pageConnectionId;

        return {
          organization_id: input.organizationId,
          page_connection_id: pageConnectionId,
          connected_account_id: input.connectedAccountId,
          page_id: form.pageId,
          page_name: form.pageName,
          form_id: form.metaFormId,
          form_name: form.name,
          status: mapIntegrationStatusToMetaConnectionStatus(form.status ?? "connected"),
          last_synced_at: form.lastSyncAt ?? form.lastLeadSyncAt ?? new Date().toISOString()
        };
      })
    ),
    { onConflict: "organization_id,form_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMetaConnectionAccessTokenForWebhook(event: {
  formId: string | null;
  pageId: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    return null;
  }

  const admin = createSupabaseAdminClient();

  if (event.formId) {
    const { data, error } = await admin
      .from("meta_forms")
      .select("organization_id, connected_account_id, page_connection_id")
      .eq("form_id", event.formId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return resolveMetaAccessTokenForOrganization(data.organization_id);
  }

  if (event.pageId) {
    const { data, error } = await admin
      .from("meta_pages")
      .select("organization_id")
      .eq("page_id", event.pageId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return resolveMetaAccessTokenForOrganization(data.organization_id);
  }

  return null;
}

function buildConnectedAccountSummaries(
  metaConnection: MetaConnection | null,
  openAIConnection: OpenAIConnection | null
): ConnectedAccountSummary[] {
  return [
    metaConnection
      ? {
          id: metaConnection.id,
          organizationId: metaConnection.organizationId,
          provider: metaConnection.provider,
          label: metaConnection.metaUserName || "Conta Meta conectada",
          status: metaConnection.status,
          connectedByUserId: metaConnection.connectedByUserId,
          connectedAt: metaConnection.connectedAt,
          expiresAt: metaConnection.expiresAt,
          lastSyncAt: metaConnection.lastSyncAt,
          scopes: metaConnection.scopes,
          description: "Páginas, contas de anúncio e formulários sincronizados."
        }
      : null,
    openAIConnection
      ? {
          id: openAIConnection.id,
          organizationId: openAIConnection.organizationId,
          provider: openAIConnection.provider,
          label: "OpenAI da organizacao",
          status: openAIConnection.status,
          connectedByUserId: openAIConnection.connectedByUserId,
          connectedAt: openAIConnection.connectedAt,
          expiresAt: openAIConnection.expiresAt,
          lastSyncAt: openAIConnection.lastValidatedAt,
          scopes: openAIConnection.scopes,
          description: "Chave cadastrada pelo cliente e validada para uso na IA."
        }
      : null
  ].filter(Boolean) as ConnectedAccountSummary[];
}

function mapMetaConnectionRow(row: MetaConnectionRow | null): MetaConnection | null {
  if (!row) {
    return null;
  }

  const status = mapMetaConnectionStatus(row);

  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: "meta",
    status,
    connectedByUserId: row.connected_by_profile_id,
    connectedAt: row.connected_at ?? row.created_at,
    expiresAt: row.expires_at ?? row.token_expires_at,
    lastSyncAt: row.last_synced_at,
    scopes: row.scopes ?? [],
    accessTokenCiphertext: null,
    accessTokenReference: null,
    tokenLastFour: null,
    tokenPreview: null,
    metaUserId: row.meta_user_id ?? row.meta_account_id,
    metaUserName: row.meta_user_name ?? row.meta_account_name,
    permissions: row.scopes ?? [],
    lastError: row.last_error,
    connectionStatusLabel: getIntegrationStatusLabel(status)
  };
}

function mapMetaPageRow(row: MetaPageRow): MetaPage {
  return {
    id: row.id,
    organizationId: row.organization_id,
    metaPageId: row.page_id,
    name: row.page_name,
    category: row.category ?? null,
    status: mapMetaTableStatus(row.status),
    connectedAccountId: row.connected_account_id ?? row.integration_id,
    lastSyncAt: row.last_synced_at
  };
}

function mapMetaAdAccountRow(row: MetaAdAccountRow): MetaAdAccount {
  return {
    id: row.id,
    organizationId: row.organization_id,
    metaAdAccountId: row.meta_ad_account_id,
    name: row.name,
    currency: row.currency,
    timezone: row.timezone,
    status: mapIntegrationStatus(row.status),
    connectedAccountId: row.connected_account_id,
    lastSyncAt: row.last_synced_at
  };
}

function mapMetaFormRow(row: MetaFormRow): MetaLeadForm {
  return {
    id: row.id,
    organizationId: row.organization_id,
    metaFormId: row.form_id,
    name: row.form_name,
    pageId: row.page_id,
    pageName: row.page_name,
    status: mapMetaTableStatus(row.status),
    connectedAccountId: row.connected_account_id ?? row.page_connection_id,
    lastLeadSyncAt: row.last_synced_at,
    lastSyncAt: row.last_synced_at
  };
}

function mapOpenAIConnectionRow(row: OpenAIConnectionRow | null): OpenAIConnection | null {
  if (!row) {
    return null;
  }

  const status = mapIntegrationStatus(row.status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: "openai",
    status,
    apiKeyCiphertext: null,
    apiKeyReference: null,
    keyPreview: "Chave cadastrada",
    keyLastFour: null,
    connectedAt: row.connected_at,
    expiresAt: null,
    lastSyncAt: row.last_validated_at,
    scopes: [],
    lastValidatedAt: row.last_validated_at,
    connectedByUserId: row.connected_by_profile_id,
    lastError: row.last_error,
    usageMode: "customer_key"
  };
}

function mapSyncLogRow(row: IntegrationSyncLogRow): SyncLogEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: row.provider,
    connectionId: row.connection_id,
    assetType: row.asset_type,
    status: mapSyncStatus(row.status),
    title: row.title,
    message: row.message,
    details: (row.details ?? {}) as Record<string, unknown>,
    createdByUserId: row.created_by_profile_id,
    createdAt: row.created_at
  };
}

function mapMetaPageRows(rows: MetaPageRow[]) {
  return rows.map(mapMetaPageRow);
}

function mapMetaLeadFormRows(rows: MetaFormRow[], pages: MetaPage[]) {
  const pageNameByPageId = new Map(pages.map((page) => [page.metaPageId, page.name] as const));

  return rows.map((row) => ({
    ...mapMetaFormRow(row),
    pageName: pageNameByPageId.get(row.page_id) ?? row.page_name
  }));
}

function mapMetaAdAccountRows(rows: MetaAdAccountRow[]) {
  return rows.map(mapMetaAdAccountRow);
}

function mapSyncLogRows(rows: IntegrationSyncLogRow[]) {
  return rows.map(mapSyncLogRow);
}

async function loadMetaAdAccounts(admin: ReturnType<typeof createSupabaseAdminClient>, organizationId: string) {
  const { data, error } = await admin
    .from("meta_ad_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return mapMetaAdAccountRows(data ?? []);
}

async function loadMetaLeadForms(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string
) {
  const { data, error } = await admin
    .from("meta_forms")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapMetaFormRow);
}

async function resolveMetaPageConnectionId(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  value: string
) {
  const byId = await admin
    .from("meta_pages")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", value)
    .maybeSingle();

  if (byId.error) {
    throw new Error(byId.error.message);
  }

  if (byId.data?.id) {
    return byId.data.id;
  }

  const byPageId = await admin
    .from("meta_pages")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("page_id", value)
    .maybeSingle();

  if (byPageId.error) {
    throw new Error(byPageId.error.message);
  }

  return byPageId.data?.id ?? null;
}

function mapMetaConnectionStatus(row: MetaConnectionRow): IntegrationConnectionStatus {
  if (row.status === "error") {
    return "error";
  }

  if (row.connection_status) {
    return row.connection_status;
  }

  if (row.status === "active") {
    return "connected";
  }

  if (row.status === "revoked" || row.status === "inactive") {
    return "disconnected";
  }

  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) {
    return "expired";
  }

  return row.access_token_ciphertext || row.access_token_reference ? "pending" : "disconnected";
}

function mapMetaTableStatus(value: string): IntegrationConnectionStatus {
  if (value === "active") {
    return "connected";
  }

  if (value === "error") {
    return "error";
  }

  if (value === "inactive" || value === "revoked") {
    return "disconnected";
  }

  return "expired";
}

function mapIntegrationStatus(value: string): IntegrationConnectionStatus {
  if (
    value === "connected" ||
    value === "disconnected" ||
    value === "expired" ||
    value === "pending" ||
    value === "error"
  ) {
    return value;
  }

  return "pending";
}

function mapIntegrationStatusToMetaConnectionStatus(
  status: IntegrationConnectionStatus
): MetaConnectionStatus {
  if (status === "connected") {
    return "active";
  }

  if (status === "disconnected") {
    return "inactive";
  }

  if (status === "error") {
    return "error";
  }

  return "error";
}

function mapSyncStatus(value: string): IntegrationSyncStatus {
  if (
    value === "success" ||
    value === "warning" ||
    value === "failed" ||
    value === "error" ||
    value === "running"
  ) {
    return value;
  }

  return "failed";
}

function getIntegrationStatusLabel(status: IntegrationConnectionStatus) {
  return {
    connected: "Conectada",
    disconnected: "Desconectada",
    expired: "Expirada",
    pending: "Pendente",
    error: "Com erro"
  }[status];
}

function canManageConnections(profile: ProfileRow, organization: OrganizationRow) {
  const normalizedRole = normalizeWorkspaceRole(profile.role);

  return (
    organization.type === "solo" ||
    normalizedRole === "owner"
  );
}

function buildUnauthenticatedConnectedAccountsState(): ConnectedAccountsState {
  return {
    mode: "unauthenticated",
    organizationId: null,
    organizationName: null,
    canManageConnections: false,
    connectedAccounts: [],
    metaConnection: null,
    openAIConnection: null,
    metaPages: [],
    metaAdAccounts: [],
    metaLeadForms: [],
    syncLogs: [],
    message: "Usuario nao autenticado."
  };
}

function buildIntegrationQueryError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("relation") || normalized.includes("does not exist") || normalized.includes("column")) {
    return new Error(
      "As migrations de contas conectadas ainda nao foram aplicadas. Rode a migration mais recente e tente novamente."
    );
  }

  return new Error(message);
}
