export type LeadFollowUpEventType =
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "not_completed";

export type LeadFollowUpEvent = {
  id: string;
  leadId: string;
  organizationId: string;
  authorProfileId: string;
  authorName: string;
  authorEmail: string;
  eventType: LeadFollowUpEventType;
  previousNextContactAt: string | null;
  nextContactAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
