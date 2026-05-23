import type { WhatsAppMessageOutput } from "@/lib/openai";
import type {
  WhatsAppDeliveryProvider as DatabaseWhatsAppDeliveryProvider,
  WhatsAppDeliveryStatus as DatabaseWhatsAppDeliveryStatus
} from "@/lib/supabase/database.types";

export type WhatsAppDeliveryProvider = DatabaseWhatsAppDeliveryProvider;
export type WhatsAppDeliveryStatus = DatabaseWhatsAppDeliveryStatus;

export type WhatsAppStage =
  | "new"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "new_lead"
  | "first_contact"
  | "awaiting_response"
  | "reactivation"
  | "closing"
  | "post_service"
  | "objection_follow_up";

export type WhatsAppGenerationForm = {
  leadId?: string | null;
  leadName: string;
  brokerageName: string;
  leadContext: string;
  stage: WhatsAppStage;
  objective: string;
  tone: string;
  product: string;
  objectionReason?: string;
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
  delivery: WhatsAppDeliverySummary;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppDeliverySummary = {
  provider: WhatsAppDeliveryProvider | null;
  status: WhatsAppDeliveryStatus;
  attemptedAt: string | null;
  sentAt: string | null;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: WhatsAppDeliveryAttempt[];
};

export type WhatsAppDeliveryAttempt = {
  id: string;
  status: WhatsAppDeliveryStatus;
  provider: WhatsAppDeliveryProvider | null;
  attemptedAt: string;
  sentAt: string | null;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type WhatsAppDeliveryProviderKind = WhatsAppDeliveryProvider;

export type WhatsAppDeliveryConfiguration = {
  organizationId: string;
  provider: WhatsAppDeliveryProviderKind;
  sendingEnabled: boolean;
  optInConfirmedAt: string | null;
  optInConfirmedByProfileId: string | null;
  providerConfig: Record<string, unknown>;
  lastConfigurationCheckAt: string | null;
  lastConfigurationError: string | null;
  credentialsConfigured: boolean;
  missingCredentials: string[];
};

export type WhatsAppProviderFactoryResult = {
  provider: import("./providers/types").WhatsAppProvider | null;
  configuration: WhatsAppDeliveryConfiguration;
};

export type WhatsAppSendRequest = {
  messageId: string;
  leadId?: string | null;
  recipientPhone?: string | null;
};

export type WhatsAppSendResult = {
  messageId: string;
  status: WhatsAppDeliveryStatus;
  provider: WhatsAppDeliveryProvider | null;
  providerMessageId: string | null;
  attemptedAt: string;
  sentAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
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
