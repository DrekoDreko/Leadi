import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardHome } from "../dashboard/dashboard-home";

export default function PreviewPage() {
  return (
    <DashboardShell
      displayName="Preview"
      navVariant="owner-team"
      preview
      workspaceName="LeadHealth Preview"
    >
      <DashboardHome preview showCreateTeamCard={false} />
    </DashboardShell>
  );
}
