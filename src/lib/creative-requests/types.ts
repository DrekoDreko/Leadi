import type {
  CreativeRequestCommentVisibility,
  CreativeRequestPriority,
  CreativeRequestStatus,
  CreativeRequestType
} from "@/lib/supabase/database.types";

export const creativeRequestWorkflowStatuses = [
  "requested",
  "in_progress",
  "in_review",
  "approved",
  "delivered"
] as const;

export type CreativeRequestAttachmentItem = {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type CreativeRequestCommentItem = {
  id: string;
  creativeRequestId: string;
  authorProfileId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  visibility: CreativeRequestCommentVisibility;
  createdAt: string;
  updatedAt: string;
};

export type CreativeRequestItem = {
  id: string;
  type: CreativeRequestType;
  title: string;
  objective: string;
  briefing: string;
  notes: string;
  status: CreativeRequestStatus;
  priority: CreativeRequestPriority;
  dueAt: string | null;
  files: CreativeRequestAttachmentItem[];
  comments: CreativeRequestCommentItem[];
  createdAt: string;
  updatedAt: string;
};

export type CreativeRequestAdminItem = CreativeRequestItem & {
  organizationId: string;
  organizationName: string;
  requesterProfileId: string;
  requesterName: string;
  requesterEmail: string;
};

export type CreativeRequestListState = {
  requests: CreativeRequestItem[];
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export type CreativeRequestAdminListState = {
  requests: CreativeRequestAdminItem[];
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export type CreativeRequestCreateInput = {
  type?: unknown;
  title?: unknown;
  objective?: unknown;
  briefing?: unknown;
  due_at?: unknown;
  notes?: unknown;
};

export type CreativeRequestStatusUpdateInput = {
  status?: unknown;
};

export type CreativeRequestCommentCreateInput = {
  body?: unknown;
};

export type CreativeRequestAdminCommentCreateInput = {
  body?: unknown;
  visibility?: unknown;
};
