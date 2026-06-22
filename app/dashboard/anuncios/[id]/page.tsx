import { notFound, redirect } from "next/navigation";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCampaignByIdForCurrentUser } from "@/lib/campaigns/repository.server";
import { CampaignControlsSection } from "./campaign-controls-section";
import { RevisarPublicarSection } from "./revisar-publicar-section";

type RevisarPublicarPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RevisarPublicarPage({ params }: RevisarPublicarPageProps) {
  const { id } = await params;
  const context = await requireCompletedProfile();

  if (!context.isOwner) {
    redirect("/dashboard/anuncios");
  }

  const campaign = await getCampaignByIdForCurrentUser(id);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <CampaignControlsSection campaign={campaign} />
      <RevisarPublicarSection campaign={campaign} />
    </div>
  );
}
