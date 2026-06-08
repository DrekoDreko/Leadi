import { UserPlus } from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireSoloOwner } from "@/lib/workspaces/context";

export default async function CriarEquipePage() {
  await requireSoloOwner();

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Equipe"
        title="Criar equipe"
        description="Transforme seu workspace individual em uma operacao com supervisores e consultores convidados."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <UserPlus size={18} aria-hidden="true" />
          Workspace individual
        </span>
      </PageHeading>

      <section className="glass-strong rounded-[34px] p-6">
        <h2 className="text-2xl font-semibold">Estrutura preparada</h2>
        <p className="mt-3 max-w-2xl leading-7 text-ink/62">
          A criacao de equipe começa no fluxo de onboarding do workspace de equipe. Aqui,
          deixamos a entrada para o workspace individual sem bloquear o restante do CRM.
        </p>
      </section>
    </div>
  );
}
