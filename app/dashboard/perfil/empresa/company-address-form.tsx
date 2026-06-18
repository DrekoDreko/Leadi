"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
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
      {pending ? "Salvando..." : "Salvar endereço"}
    </button>
  );
}

type AddressData = {
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
};

type Props = {
  canEdit: boolean;
} & AddressData;

export function CompanyAddressForm({
  canEdit,
  address_cep,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  address_city,
  address_state,
}: Props) {
  const [street, setStreet] = useState(address_street ?? "");
  const [neighborhood, setNeighborhood] = useState(address_neighborhood ?? "");
  const [city, setCity] = useState(address_city ?? "");
  const [state, setState] = useState(address_state ?? "");
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const handleCepBlur = useCallback(async (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch {
      // ViaCEP indisponível — permite preencher manualmente
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  if (!canEdit) {
    const fullAddress = [
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city && address_state ? `${address_city} - ${address_state}` : address_city,
      address_cep,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink/60">Endereço completo</p>
        <div className="rounded-[18px] border border-border bg-surface-elevated px-4 py-3 text-sm text-ink/70">
          {fullAddress || "Endereço não cadastrado."}
        </div>
      </div>
    );
  }

  return (
    <form action={updateOrganizationProfileAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FieldGroup label="CEP">
          <div className="relative">
            <input
              className="liquid-input"
              name="address_cep"
              defaultValue={address_cep ?? ""}
              placeholder="00000-000"
              maxLength={9}
              onBlur={handleCepBlur}
            />
            {isFetchingCep && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-cobalt" />
              </span>
            )}
          </div>
        </FieldGroup>

        <FieldGroup label="Rua" span2>
          <input
            className="liquid-input"
            name="address_street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Rua, avenida..."
          />
        </FieldGroup>

        <FieldGroup label="Número">
          <input
            className="liquid-input"
            name="address_number"
            defaultValue={address_number ?? ""}
            placeholder="123"
          />
        </FieldGroup>

        <FieldGroup label="Complemento">
          <input
            className="liquid-input"
            name="address_complement"
            defaultValue={address_complement ?? ""}
            placeholder="Sala 101"
          />
        </FieldGroup>

        <FieldGroup label="Bairro">
          <input
            className="liquid-input"
            name="address_neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Bairro"
          />
        </FieldGroup>

        <FieldGroup label="Cidade">
          <input
            className="liquid-input"
            name="address_city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="São Paulo"
          />
        </FieldGroup>

        <FieldGroup label="Estado">
          <input
            className="liquid-input"
            name="address_state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="SP"
            maxLength={2}
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
