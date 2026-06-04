import { requireCompletedProfile } from "@/lib/workspaces/context";
import { PricingSimulatorPrototype } from "@/components/dashboard/pricing-simulator-prototype";

export default async function ConfiguracoesPage() {
  const context = await requireCompletedProfile();

  return (
    <PricingSimulatorPrototype 
      workspaceName={context.workspaceName}
      brokerageName={context.brokerageName}
    />
  );
}
