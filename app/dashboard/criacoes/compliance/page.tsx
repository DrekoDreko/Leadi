import { redirect } from "next/navigation";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { ComplianceValidator } from "../../compliance/compliance-validator";

export default async function CriacoesCompliancePage() {
  const context = await requireCompletedProfile();
  if (context.isTeamSeller) {
    redirect("/dashboard/criacoes");
  }
  const aiBalance = await getCurrentAiBalance();

  return (
    <ComplianceValidator
      aiBalance={aiBalance}
      description="Revise textos de anuncio, formulario e mensagem antes de publicar ou enviar."
      eyebrow="Criações"
      title="Validador de texto"
    />
  );
}
