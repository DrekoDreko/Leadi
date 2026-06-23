import { getCurrentAiBalance } from "@/lib/ai/credits";
import { requireAiFeature } from "@/lib/workspaces/context";
import { SolicitarCriativoClient } from "./solicitar-criativo-client";

export default async function SolicitarCriativoPage() {
  // Planos sem IA (ex.: Essencial) sao redirecionados para o dashboard.
  await requireAiFeature();
  const availableCredits = await getCurrentAiBalance();

  return <SolicitarCriativoClient availableCredits={availableCredits} />;
}
