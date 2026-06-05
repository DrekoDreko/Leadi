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
      {pending ? "Salvando..." : "Salvar contato"}
    </button>
  );
}

type Props = {
  canEdit: boolean;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
};

export function CompanyContactForm({
  canEdit,
  email,
  phone,
  website,
  instagram,
  linkedin,
}: Props) {
  if (!canEdit) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Email principal" value={email} />
        <ReadOnlyField label="Telefone" value={phone} />
        <ReadOnlyField label="Site" value={website} />
        <ReadOnlyField label="Instagram" value={instagram} />
        <ReadOnlyField label="LinkedIn" value={linkedin} />
      </div>
    );
  }

  return (
    <form action={updateOrganizationProfileAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Email principal">
          <input
            className="liquid-input"
            name="email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="contato@empresa.com.br"
          />
        </FieldGroup>

        <FieldGroup label="Telefone">
          <input
            className="liquid-input"
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            placeholder="(11) 99999-9999"
          />
        </FieldGroup>

        <FieldGroup label="Site">
          <input
            className="liquid-input"
            name="website"
            type="url"
            defaultValue={website ?? ""}
            placeholder="https://empresa.com.br"
          />
        </FieldGroup>

        <FieldGroup label="Instagram">
          <input
            className="liquid-input"
            name="instagram"
            defaultValue={instagram ?? ""}
            placeholder="@empresa"
          />
        </FieldGroup>

        <FieldGroup label="LinkedIn">
          <input
            className="liquid-input"
            name="linkedin"
            defaultValue={linkedin ?? ""}
            placeholder="https://linkedin.com/company/empresa"
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink/60">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-ink/60">{label}</p>
      <div className="rounded-[18px] border border-white/44 bg-white/36 px-4 py-3 text-sm text-ink/70">
        {value || "—"}
      </div>
    </div>
  );
}
