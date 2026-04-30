import type { WhatsAppMessageOutput } from "@/lib/openai";

export type WhatsAppStage = "new" | "qualification" | "proposal" | "negotiation" | "won" | "lost";

export type WhatsAppGenerationForm = {
  leadId?: string | null;
  leadName: string;
  brokerageName: string;
  leadContext: string;
  stage: WhatsAppStage;
  objective: string;
  tone: string;
  product: string;
};

export type WhatsAppHistoryItem = {
  id: string;
  organizationId: string;
  createdByProfileId: string;
  leadId: string | null;
  leadName: string;
  leadContext: string;
  stage: WhatsAppStage;
  objective: string;
  tone: string;
  product: string;
  input: WhatsAppGenerationForm;
  result: WhatsAppMessageOutput;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppListState = {
  messages: WhatsAppHistoryItem[];
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export type WhatsAppSaveInput = {
  form: WhatsAppGenerationForm;
  message: WhatsAppMessageOutput;
};
