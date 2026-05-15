import { ArrowUpRight, Building2 } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";

export default async function PerfilEmpresaPage() {
  const context = await requireCompletedProfile();

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Conta"
        title="Dados da empresa"
        description="Resumo leve dos dados principais da empresa usados na operação do SaaS."
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white/58 px-5 py-3 text-sm font-semibold text-ink">
          <Building2 size={18} aria-hidden="true" />
          {context.workspaceName}
        </span>
      </PageHeading>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-strong rounded-[34px] p-5 md:p-6">
          <p className="text-sm font-medium text-cobalt">Empresa</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.workspaceName}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Nome principal usado na operação e nos resumos internos.
          </p>
        </article>

        <article className="glass rounded-[34px] p-5 md:p-6">
          <p className="text-sm font-medium text-cobalt">Tipo de workspace</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {context.workspaceType === "team" ? "Equipe" : "Individual"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Define a experiência de navegação e permissões do dashboard.
          </p>
        </article>

        <article className="glass rounded-[34px] p-5 md:p-6">
          <p className="text-sm font-medium text-cobalt">Nome comercial</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.brokerageName}</h2>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Usado nas mensagens e campanhas quando você trabalha como corretora ou marca.
          </p>
        </article>
      </section>

      <section className="glass-strong rounded-[34px] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-cobalt">Atalho</p>
            <h2 className="mt-2 text-2xl font-semibold">Configurações avançadas</h2>
            <p className="mt-3 text-sm leading-6 text-ink/62">
              As integrações detalhadas ficam na área da Meta para evitar repetição nesta tela.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
            href="/dashboard/perfil/meta"
          >
            Gerenciar Meta
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
