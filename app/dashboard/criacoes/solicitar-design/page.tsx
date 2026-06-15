import { redirect } from "next/navigation";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { SolicitarDesignClient } from "./solicitar-design-client";

export default async function CriacoesSolicitarDesignPage() {
  const [context, createRequestAccess] = await Promise.all([
    requireCompletedProfile(),
    getCurrentResourceAccess("creative_requests")
  ]);

  if (!context.isOwner) {
    redirect("/dashboard/criacoes");
  }

  return (
    <SolicitarDesignClient
      createRequestAccess={createRequestAccess}
      workspaceName={context.workspaceName}
    />
  );
}
