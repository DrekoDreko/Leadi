"use client";

import { useFormStatus } from "react-dom";
import { updateOrganizationProfileAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white transition hover:bg-cobalt/90 disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar dados"}
    </button>
  );
}

type Props = {
  canEdit: boolean;
  orgName: string;
  brokerageName: string;
  cnpj: string | null;
  description: string | null;
};

export function CompanyIdentityForm({
  canEdit,
  orgName,
  brokerageName,
  cnpj,
  description,
}: Props) {
  if (!canEdit) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Nome da empresa" value={orgName} />
        <ReadOnlyField label="Nome comercial" value={brokerageName} />
        <ReadOnlyField label="CNPJ" value={cnpj} />
        <ReadOnlyField label="Descrição" value={description} span2 />
      </div>
    );
  }

  return (
    <form action={updateOrganizationProfileAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Nome da empresa">
          <input
            className="liquid-input bg-white/30 cursor-not-allowed"
            value={orgName}
            disabled
            readOnly
          />
          <p className="mt-1 text-xs text-ink/40">Editável nas configurações do workspace.</p>
        </FieldGroup>

        <FieldGroup label="Nome comercial">
          <input
            className="liquid-input bg-white/30 cursor-not-allowed"
            value={brokerageName}
            disabled
            readOnly
          />
          <p className="mt-1 text-xs text-ink/40">Editável no perfil principal.</p>
        </FieldGroup>

        <FieldGroup label="CNPJ">
          <input
            className="liquid-input"
            name="cnpj"
            defaultValue={cnpj ?? ""}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </FieldGroup>

        <FieldGroup label="Descrição curta" span2>
          <textarea
            className="liquid-input min-h-[80px] resize-none"
            name="description"
            defaultValue={description ?? ""}
            placeholder="Breve descrição da empresa..."
            maxLength={300}
            rows={3}
          />
        </FieldGroup>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function FieldGroup({
  label,
  children,
  span2,
}: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold text-ink/60">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  span2,
}: {
  label: string;
  value: string | null;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <p className="mb-1.5 text-xs font-semibold text-ink/60">{label}</p>
      <div className="rounded-[18px] border border-white/44 bg-white/36 px-4 py-3 text-sm text-ink/70">
        {value || "—"}
      </div>
    </div>
  );
}
