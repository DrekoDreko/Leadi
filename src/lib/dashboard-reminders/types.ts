export const dashboardReminderPresets = [
  "one_hour",
  "two_hours",
  "this_afternoon",
  "this_evening",
  "custom"
] as const;

export type DashboardReminderPreset = (typeof dashboardReminderPresets)[number];

export type DashboardReminderItem = {
  id: string;
  reminderDate: string;
  remindAt: string;
  message: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardReminderListState = {
  reminders: DashboardReminderItem[];
  mode: "supabase" | "not-configured" | "unauthenticated" | "error";
  message?: string;
};

export type DashboardReminderCreateInput = {
  date?: unknown;
  message?: unknown;
  preset?: unknown;
  time24h?: unknown;
  timezoneOffsetMinutes?: unknown;
  clientNowIso?: unknown;
};
