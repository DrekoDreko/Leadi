import { getCurrentAiBalance } from "@/lib/ai/credits";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { SolicitarCriativoClient } from "./solicitar-criativo-client";

export default async function SolicitarCriativoPage() {
  await requireCompletedProfile();
  const availableCredits = await getCurrentAiBalance();

  return <SolicitarCriativoClient availableCredits={availableCredits} />;
}
