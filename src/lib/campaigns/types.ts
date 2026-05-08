export type CampaignPublishMode = "draft" | "manual_review" | "scheduled" | "paused";

export type CampaignPublicationStatus =
  | "not_connected"
  | "ready_to_prepare"
  | "draft_created"
  | "pending_review"
  | "published"
  | "paused"
  | "failed";

export type CampaignGenerationForm = {
  brokerageName: string;
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
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
  metaCampaignId: string | null;
  metaAdSetId: string | null;
  metaAdId: string | null;
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

export type CampaignSaveInput = {
  form: CampaignGenerationForm;
  campaign: CampaignTextOutput;
  status?: CampaignStatus;
};
