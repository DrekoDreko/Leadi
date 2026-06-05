export type CampaignPublishMode = "draft" | "manual_review" | "scheduled" | "paused";

export type CampaignPublicationStatus =
  | "not_connected"
  | "ready_to_prepare"
  | "draft_created"
  | "pending_review"
  | "published"
  | "paused"
  | "failed";

export type CampaignApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "needs_adjustment";

export type CampaignGenerationForm = {
  brokerageName: string;
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
  objections: string | null;
  contractType: string | null;
  notes: string;
  tone: string;
  creativeAssetType: string | null;
  creativeBrief: string | null;
  creativeRequestMode: string | null;
  creativeFileNames: string[];
  connectedAccountId: string | null;
  metaPageId: string | null;
  metaAdAccountId: string | null;
  metaLeadFormId: string | null;
  publishMode: CampaignPublishMode;
  publicationStatus: CampaignPublicationStatus;
  approvalStatus: CampaignApprovalStatus;
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
  dailyBudget: number | null;
};

export type CampaignStatus = "generated" | "archived";

export type CampaignTextOutput = {
  campaignName: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  suggestedAudience: string;
  variants: string[];
  complianceNotes: string[];
};

export const CAMPAIGN_GENERATION_PAYLOAD_VERSION = 2;

export type CampaignStoredInputPayload = {
  version: typeof CAMPAIGN_GENERATION_PAYLOAD_VERSION;
  context: {
    product: string;
    brokerageName: string;
    notes: string;
  };
  brief: {
    audience: string;
    offer: string;
    region: string;
    differentiator: string;
    objections: string | null;
    contractType: string | null;
    tone: string;
  };
  creative: {
    assetType: string | null;
    brief: string | null;
    requestMode: string | null;
    fileNames: string[];
  };
  integrations: {
    connectedAccountId: string | null;
    metaPageId: string | null;
    metaAdAccountId: string | null;
    metaLeadFormId: string | null;
  };
  publication: {
    publishMode: CampaignPublishMode;
    publicationStatus: CampaignPublicationStatus;
    approvalStatus: CampaignApprovalStatus;
    metaCampaignId: string | null;
    metaAdSetId: string | null;
    metaAdId: string | null;
    dailyBudget: number | null;
  };
};

export type CampaignStoredResultPayload = {
  version: typeof CAMPAIGN_GENERATION_PAYLOAD_VERSION;
  strategy: {
    campaignName: string;
    suggestedAudience: string;
    callToAction: string;
  };
  copy: {
    primaryText: string;
    headline: string;
    description: string;
    variants: string[];
  };
  compliance: {
    notes: string[];
  };
};

export type CampaignHistoryItem = {
  id: string;
  organizationId: string;
  createdByProfileId: string;
  status: CampaignStatus;
  product: string;
  connectedAccountId: string | null;
  metaPageId: string | null;
  metaAdAccountId: string | null;
  metaLeadFormId: string | null;
  publishMode: CampaignPublishMode;
  publicationStatus: CampaignPublicationStatus;
  approvalStatus: CampaignApprovalStatus;
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
  campaignName: string;
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
  tone: string;
  input: CampaignGenerationForm;
  result: CampaignTextOutput;
  createdAt: string;
  updatedAt: string;
};

export type CampaignListState = {
  campaigns: CampaignHistoryItem[];
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export type CampaignActivitySummary = {
  activeCount: number;
  readyCount: number;
  pausedCount: number;
  campaigns: Array<{
    id: string;
    campaignName: string;
    publicationStatus: CampaignPublicationStatus;
    approvalStatus: CampaignApprovalStatus;
    publishMode: CampaignPublishMode;
  }>;
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export type CampaignSaveInput = {
  form: CampaignGenerationForm;
  campaign: CampaignTextOutput;
  status?: CampaignStatus;
};
