export type LeadDuplicateReason = "meta_lead_id" | "phone_e164" | "email";
export type MetaLeadImportSourceType = "campaign" | "ad" | "form";
export type MetaLeadImportSourceStatus = "active" | "paused" | "ended" | "unknown";

export type MetaLeadImportSource = {
  id: string;
  type: MetaLeadImportSourceType;
  name: string;
  status: MetaLeadImportSourceStatus;
  parentName?: string | null;
  pageId?: string | null;
  pageName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  adAccountId?: string | null;
  adAccountName?: string | null;
  availableLeadCount: number | null;
  hasAvailableLeads: boolean | null;
  lastCollectedAt?: string | null;
};

export type MetaLeadImportSourcesState = {
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  hasConnection: boolean;
  canImport: boolean;
  sources: MetaLeadImportSource[];
  message?: string;
};

export type MetaLeadImportSummary = {
  totalFound: number;
  imported: number;
  duplicates: number;
  archived: number;
  errors: number;
};

export type MetaLeadImportItem = {
  externalLeadId?: string | null;
  leadId?: string | null;
  duplicateOfLeadId?: string | null;
  status: "imported" | "duplicate" | "archived" | "error";
  duplicateReason?: LeadDuplicateReason | null;
  message?: string;
};

export type MetaLeadImportResponse = {
  success: boolean;
  summary: MetaLeadImportSummary;
  items: MetaLeadImportItem[];
  mode: "supabase" | "not-configured";
  message?: string;
};
