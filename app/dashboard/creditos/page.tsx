import { PageHeading } from "@/components/dashboard/widgets";

export default async function CreditsPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Conta"
        title="Créditos inativos"
        description="O LeadHealth não usa créditos internos neste momento. Os fluxos de IA funcionam com a chave OpenAI conectada no Perfil da empresa."
      />
      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-white/46 bg-white/34 p-5">
            <p className="text-sm font-medium text-cobalt">OpenAI da empresa</p>
            <h2 className="mt-2 text-2xl font-semibold">Use sua própria conta conectada</h2>
            <p className="mt-3 text-sm leading-6 text-ink/66">
              Para gerar campanhas, mensagens e perguntas, conecte a chave OpenAI da empresa em
              Perfil. O consumo acontece pela conta do cliente, sem carteira de créditos dentro do
              app.
            </p>
          </article>
          <article className="rounded-[28px] border border-dashed border-cobalt/24 bg-cobalt/8 p-5">
            <p className="text-sm font-medium text-cobalt">Status atual</p>
            <h2 className="mt-2 text-2xl font-semibold">Checkout e saldo em pausa</h2>
            <p className="mt-3 text-sm leading-6 text-ink/66">
              Esta área foi mantida apenas como referência temporária. Compras de créditos e saldo
              interno não fazem parte do fluxo atual do produto.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
