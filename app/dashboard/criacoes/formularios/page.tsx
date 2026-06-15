import { redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { LeadFormBuilder } from "./lead-form-builder";

export default async function CriarFormularioPage() {
  const context = await requireCompletedProfile();
  if (!context.isOwner) {
    redirect("/dashboard/criacoes");
  }

  const connectedAccounts = await getConnectedAccountsForCurrentUser();
  const pages = connectedAccounts.metaPages.map((page) => ({
    id: page.metaPageId,
    name: page.name
  }));

  return <LeadFormBuilder pages={pages} />;
}
