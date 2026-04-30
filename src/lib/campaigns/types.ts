export type CampaignGenerationForm = {
  brokerageName: string;
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
  tone: string;
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
