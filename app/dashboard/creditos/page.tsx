import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getBillingSnapshot } from "@/lib/billing/admin";
import { buildDemoBillingSnapshot } from "@/lib/billing/usage.server";
import { isBillingConfigured } from "@/lib/billing/config";
import { CreditsWorkspace } from "./credits-workspace";

export default async function CreditsPage() {
  const context = await requireCompletedProfile();
  const liveBillingEnabled = isBillingConfigured();
  const snapshot = liveBillingEnabled
    ? (await getBillingSnapshot(context.workspace?.id ?? context.profile?.organization_id ?? "")) ??
      buildDemoBillingSnapshot()
    : buildDemoBillingSnapshot();

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Créditos"
        title="Créditos e compras"
        description="Acompanhe o saldo, veja os últimos movimentos e abra o checkout do Mercado Pago para ampliar o uso da IA."
      />
      <CreditsWorkspace
        liveCheckoutEnabled={liveBillingEnabled}
        modeLabel={liveBillingEnabled ? "Ambiente conectado" : "Ambiente de demonstração"}
        snapshot={snapshot}
      />
    </div>
  );
}
