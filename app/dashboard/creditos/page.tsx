import { AiCreditsPanel } from "@/components/dashboard/ai-credits-panel";
import { PageHeading } from "@/components/dashboard/widgets";
import { getAiBalance } from "@/lib/ai/credits";
import { requireCompletedProfile } from "@/lib/workspaces/context";

export default async function CreditsPage() {
  const context = await requireCompletedProfile();
  const aiBalance = await getAiBalance(context.workspace?.id ?? "");

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Conta"
        title="Créditos de IA"
        description="Saldo interno da plataforma para campanhas, mensagens, copies e análises com IA. Sem checkout ativo por enquanto."
      />
      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <AiCreditsPanel balance={aiBalance} />
        <p className="mt-5 text-sm leading-6 text-ink/64">
          A compra real de créditos ainda não está ativa. Quando essa etapa entrar no produto, o
          fluxo será disponibilizado aqui sem expor integrações técnicas ao cliente.
        </p>
      </section>
    </div>
  );
}
