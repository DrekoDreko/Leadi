import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentSubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [context, subscriptionNotice] = await Promise.all([
    requireCompletedProfile(),
    getCurrentSubscriptionNotice()
  ]);

  return (
    <DashboardShell
      displayName={context.displayName}
      navVariant={context.navVariant}
      subscriptionNotice={subscriptionNotice}
      workspaceName={context.workspaceName}
    >
      {children}
    </DashboardShell>
  );
}
