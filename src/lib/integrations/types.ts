import type { Json } from "@/lib/supabase/database.types";

export type IntegrationProvider = "meta" | "openai";
export type IntegrationStatus = "connected" | "disconnected" | "expired" | "pending";
export type IntegrationConnectionStatus = IntegrationStatus;
export type IntegrationSyncStatus = "success" | "warning" | "failed" | "running";
export type CampaignPublishMode = "draft" | "manual_review" | "scheduled" | "paused";
export type CampaignPublicationStatus =
  | "not_connected"
  | "ready_to_prepare"
  | "draft_created"
  | "pending_review"
  | "published"
  | "paused"
  | "failed";

export type ConnectedAccountSummary = {
  id: string;
  provider: IntegrationProvider;
  label: string;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  description: string;
};

export type MetaConnection = {
  id: string;
  organizationId: string;
  provider: "meta";
  status: IntegrationStatus;
  connectedByUserId: string | null;
  connectedAt: string | null;
  expiresAt: string | null;
  lastSyncAt: string | null;
  scopes: string[];
  accessTokenCiphertext: string | null;
  accessTokenReference: string | null;
  tokenLastFour: string | null;
  metaUserId: string | null;
  metaUserName: string | null;
  lastError: string | null;
  connectionStatusLabel: string;
};

export type MetaPage = {
  id: string;
  organizationId: string;
  metaPageId: string;
  name: string;
  category: string | null;
  status: IntegrationStatus;
  connectedAccountId: string;
  lastSyncAt: string | null;
};

export type MetaAdAccount = {
  id: string;
  organizationId: string;
  metaAdAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  status: IntegrationStatus;
  connectedAccountId: string;
  lastSyncAt: string | null;
};

export type MetaLeadForm = {
  id: string;
  organizationId: string;
  metaFormId: string;
  name: string;
  pageId: string;
  pageName: string;
  status: IntegrationStatus;
  connectedAccountId: string;
  lastLeadSyncAt: string | null;
  lastSyncAt: string | null;
};

export type OpenAIConnection = {
  id: string;
  organizationId: string;
  provider: "openai";
  status: IntegrationStatus;
  apiKeyCiphertext: string | null;
  apiKeyReference: string | null;
  keyPreview: string;
  keyLastFour: string | null;
  connectedAt: string | null;
  lastValidatedAt: string | null;
  connectedByUserId: string | null;
  lastError: string | null;
};

export type SyncLogEntry = {
  id: string;
  organizationId: string;
  provider: IntegrationProvider;
  connectionId: string | null;
  assetType: string;
  status: IntegrationSyncStatus;
  title: string;
  message: string;
  details: Record<string, unknown>;
  createdByUserId: string | null;
  createdAt: string;
};

export type ConnectedAccountsState = {
  mode: "supabase" | "demo" | "not-configured" | "unauthenticated" | "error";
  organizationId: string | null;
  organizationName: string | null;
  canManageConnections: boolean;
  connectedAccounts: ConnectedAccountSummary[];
  metaConnection: MetaConnection | null;
  openAIConnection: OpenAIConnection | null;
  metaPages: MetaPage[];
  metaAdAccounts: MetaAdAccount[];
  metaLeadForms: MetaLeadForm[];
  syncLogs: SyncLogEntry[];
  message?: string;
};

export type MetaConnectionRow = {
  id: string;
  organization_id: string;
  connected_by_profile_id: string | null;
  connected_at: string | null;
  expires_at: string | null;
  meta_user_id: string | null;
  meta_user_name: string | null;
  meta_account_id: string | null;
  meta_account_name: string | null;
  access_token_ciphertext: string | null;
  access_token_reference: string | null;
  token_last_four: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  connection_status?: IntegrationStatus | null;
  status: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type MetaPageRow = {
  id: string;
  organization_id: string;
  integration_id: string;
  connected_account_id: string | null;
  page_id: string;
  page_name: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  category?: string | null;
};

export type MetaFormRow = {
  id: string;
  organization_id: string;
  page_connection_id: string;
  connected_account_id: string | null;
  page_id: string;
  page_name: string;
  form_id: string;
  form_name: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MetaAdAccountRow = {
  id: string;
  organization_id: string;
  connected_account_id: string;
  meta_ad_account_id: string;
  name: string;
  currency: string;
  timezone: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OpenAIConnectionRow = {
  id: string;
  organization_id: string;
  connected_by_profile_id: string | null;
  provider: IntegrationProvider;
  status: string;
  api_key_ciphertext: string | null;
  api_key_reference: string | null;
  key_preview: string | null;
  key_last_four: string | null;
  connected_at: string | null;
  last_validated_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationSyncLogRow = {
  id: string;
  organization_id: string;
  provider: IntegrationProvider;
  connection_id: string | null;
  asset_type: string;
  status: string;
  title: string;
  message: string;
  details: Json | null;
  created_by_profile_id: string | null;
  created_at: string;
};
