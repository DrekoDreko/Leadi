import { DashboardShell } from "@/components/dashboard/shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { requireWorkspaceManager } from "@/lib/workspaces/context";

export default async function TeamLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireWorkspaceManager();

  return (
    // DashboardShell usa hooks do React Query (useQueryClient/useQuery no sino de
    // notificacoes); sem este provider a shell lanca "No QueryClient set" e a
    // rota /team inteira cai no error boundary. Mesmo wrapper do layout do dashboard.
    <QueryProvider>
      <DashboardShell
        displayName={context.displayName}
        avatarUrl={context.profile?.avatar_url ?? null}
        navVariant={context.navVariant}
        workspaceName={context.workspaceName}
      >
        {children}
      </DashboardShell>
    </QueryProvider>
  );
}
