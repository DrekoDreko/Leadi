export type TemplateType = 'campaign' | 'whatsapp';

export interface SystemTemplate {
  id: string;
  templateType: TemplateType;
  category: string;
  title: string;
  description: string;
  content: CampaignTemplateContent | WhatsAppTemplateContent;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignTemplateContent {
  audience: string;
  offer: string;
  region: string;
  differentiator: string;
  tone: string;
  notes: string;
}

export interface WhatsAppTemplateContent {
  openingMessage: string;
  followUpMessage: string;
  objectionReply: string;
}
