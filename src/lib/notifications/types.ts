export const notificationTypes = [
  "campaign_approved",
  "campaign_rejected",
  "invite_pending",
  "team_member_added",
  "ad_creation_enabled",
  "meta_connection_required",
  // Mudança 7: alertas de entrega pós-publicação.
  "campaign_underdelivery",
  "campaign_no_leads",
  "campaign_frequency_saturation",
  "campaign_optimization_upgrade"
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  linkUrl: string | null;
  campaignId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListState = {
  notifications: NotificationItem[];
  unreadCount: number;
};
