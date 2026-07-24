import { DashboardShell } from "@/components/dashboard/shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { DashboardHome } from "../dashboard/dashboard-home";

export default function PreviewPage() {
  return (
    <QueryProvider>
      <DashboardShell
        displayName="Preview"
        navVariant="owner-team"
        preview
        workspaceName="Leadi Preview"
      >
        <DashboardHome preview showCreateTeamCard={false} />
      </DashboardShell>
    </QueryProvider>
  );
}
