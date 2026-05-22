export type LeadCommentType = "comment" | "contact";

export type LeadComment = {
  id: string;
  leadId: string;
  authorProfileId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  type?: LeadCommentType;
  createdAt: string;
  updatedAt: string;
};
