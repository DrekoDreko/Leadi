import {
  Building2,
  IdCard,
  Mail,
  MapPin,
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { CompanyAddressForm } from "./company-address-form";
import { CompanyContactForm } from "./company-contact-form";
import { CompanyIdentityForm } from "./company-identity-form";
import { CompanyLogoUpload } from "./company-logo-upload";
import { CompanyPlanSection } from "./company-plan-section";

const feedbackMessages: Record<string, string> = {
  updated: "Dados da empresa atualizados com sucesso.",
  "logo-updated": "Logo da empresa atualizado com sucesso.",
  failed: "Não foi possível salvar os dados agora. Tente novamente.",
  permission: "Apenas o gestor (owner) pode editar os dados da empresa.",
  "no-file": "Selecione uma imagem para enviar.",
  "invalid-type": "Formato inválido. Use JPG, PNG ou WebP.",
  "too-large": "A imagem deve ter no máximo 2 MB.",
  "upload-failed": "Não foi possível enviar a imagem agora. Tente novamente.",
  demo: "Modo demonstração — as alterações não são persistidas.",
};

export default async function PerfilEmpresaPage({
  searchParams,
}: {
  searchParams?: Promise<{ feedback?: string }>;
}) {
  const context = await requireCompletedProfile();
  const params = await searchParams;
  const feedback = params?.feedback ? feedbackMessages[params.feedback] ?? null : null;
  const canEdit = context.role === "owner";
  const org = context.workspace;

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Conta"
        title="Dados da empresa"
        description={
          canEdit
            ? "Gerencie o perfil completo da sua empresa. Essas informações são usadas na operação do SaaS."
            : "Visualize os dados da empresa. Apenas o gestor pode editar estas informações."
        }
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-sm font-semibold text-ink">
          <Building2 size={18} aria-hidden="true" />
          {context.workspaceName}
        </span>
      </PageHeading>

      {feedback && (
        <p className="rounded-[22px] bg-surface-elevated px-4 py-3 text-sm font-semibold text-ink">
          {feedback}
        </p>
      )}

      {/* Identidade */}
      <section className="glass-strong rounded-[34px] p-5 md:p-6 space-y-5">
        <SectionHeader
          icon={<IdCard size={18} />}
          title="Identidade da empresa"
        />
        <CompanyLogoUpload
          currentLogoUrl={org?.logo_url ?? null}
          canEdit={canEdit}
        />
        <CompanyIdentityForm
          canEdit={canEdit}
          orgName={context.workspaceName}
          brokerageName={context.brokerageName}
          cnpj={org?.cnpj ?? null}
          description={org?.description ?? null}
        />
      </section>

      {/* Contato */}
      <section className="glass-strong rounded-[34px] p-5 md:p-6 space-y-5">
        <SectionHeader
          icon={<Mail size={18} />}
          title="Contato"
        />
        <CompanyContactForm
          canEdit={canEdit}
          email={org?.email ?? null}
          phone={org?.phone ?? null}
          website={org?.website ?? null}
          instagram={org?.instagram ?? null}
          linkedin={org?.linkedin ?? null}
        />
      </section>

      {/* Endereço */}
      <section className="glass-strong rounded-[34px] p-5 md:p-6 space-y-5">
        <SectionHeader
          icon={<MapPin size={18} />}
          title="Endereço"
        />
        <CompanyAddressForm
          canEdit={canEdit}
          address_cep={org?.address_cep ?? null}
          address_street={org?.address_street ?? null}
          address_number={org?.address_number ?? null}
          address_complement={org?.address_complement ?? null}
          address_neighborhood={org?.address_neighborhood ?? null}
          address_city={org?.address_city ?? null}
          address_state={org?.address_state ?? null}
        />
      </section>

      {/* Plano e Pagamento — somente Owner */}
      {canEdit && (
        <section className="glass-strong rounded-[34px] p-5 md:p-6">
          <CompanyPlanSection />
        </section>
      )}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-cobalt">{icon}</span>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}
