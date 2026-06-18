import { redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { SupervisorCreditsWorkspace } from "./supervisor-credits-workspace";
import { loadSupervisedTeamsWithCredits } from "./supervised-teams.server";

export default async function SupervisorCreditsPage() {
  const context = await requireCompletedProfile();

  if (!context.workspace?.id || !context.profile?.id) {
    redirect("/dashboard");
  }

  // Owner distribui pela tela de Organizador de Equipes; consultor não distribui.
  if (context.role !== "admin") {
    redirect(context.isOwner ? "/dashboard/equipes" : "/dashboard");
  }

  const teams = await loadSupervisedTeamsWithCredits(context.workspace.id, context.profile.id);

  return <SupervisorCreditsWorkspace teams={teams} />;
}
