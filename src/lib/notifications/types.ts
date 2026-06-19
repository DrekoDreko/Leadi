export const notificationTypes = ["campaign_approved", "campaign_rejected"] as const;

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
