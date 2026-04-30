import { DashboardShell } from "@/components/dashboard/shell";
import { requireCompletedProfile } from "@/lib/workspaces/context";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireCompletedProfile();

  return (
    <DashboardShell
      displayName={context.displayName}
      navVariant={context.navVariant}
      workspaceName={context.workspaceName}
    >
      {children}
    </DashboardShell>
  );
}
