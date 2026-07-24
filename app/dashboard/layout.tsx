import { DashboardShell } from "@/components/dashboard/shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { getDashboardRemindersForCurrentUser } from "@/lib/dashboard-reminders/repository.server";
import { getCurrentSubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [context, subscriptionNotice, reminderState] = await Promise.all([
    requireCompletedProfile(),
    getCurrentSubscriptionNotice(),
    getDashboardRemindersForCurrentUser()
  ]);

  return (
    <QueryProvider>
      <DashboardShell
        displayName={context.displayName}
        avatarUrl={context.profile?.avatar_url ?? null}
        notificationCount={reminderState.reminders.length}
        navVariant={context.navVariant}
        canCreateAd={context.canCreateAd}
        subscriptionNotice={subscriptionNotice}
        workspaceName={context.workspaceName}
      >
        {children}
      </DashboardShell>
    </QueryProvider>
  );
}
