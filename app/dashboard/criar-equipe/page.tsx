import { UserPlus } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireSoloSeller } from "@/lib/workspaces/context";

export default async function CriarEquipePage() {
  await requireSoloSeller();

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Equipe"
        title="Criar equipe"
        description="Transforme seu workspace individual em uma operacao com vendedores convidados."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <UserPlus size={18} aria-hidden="true" />
          Em breve
        </span>
      </PageHeading>

      <section className="glass-strong rounded-[34px] p-6">
        <h2 className="text-2xl font-semibold">Estrutura preparada</h2>
        <p className="mt-3 max-w-2xl leading-7 text-ink/62">
          A criacao de equipe para vendedores solo ficara disponivel em breve. Nesta primeira
          versao, deixamos o ponto de entrada pronto sem implementar cobranca ou planos.
        </p>
      </section>
    </div>
  );
}
