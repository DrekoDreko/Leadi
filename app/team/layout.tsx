import { DashboardShell } from "@/components/dashboard/shell";
import { requireSupervisor } from "@/lib/workspaces/context";

export default async function TeamLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireSupervisor();

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
