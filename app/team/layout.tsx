import { DashboardShell } from "@/components/dashboard/shell";
import { requireTeamManagement } from "@/lib/workspaces/context";

export default async function TeamLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireTeamManagement();

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
