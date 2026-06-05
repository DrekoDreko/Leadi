import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilEmpresaPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

describe("Perfil Empresa Page (/dashboard/perfil/empresa)", () => {
  it("renderiza as seções do perfil da empresa", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspaceName: "Gabriel Seguros",
      workspaceType: "team",
      brokerageName: "Gabriel Seguros",
      role: "owner",
      isSoloOwner: false,
      workspace: {
        id: "org-1",
        name: "Gabriel Seguros",
        type: "team",
        logo_url: null,
        email: null,
        phone: null,
        website: null,
        cnpj: null,
        description: null,
        instagram: null,
        linkedin: null,
        address_cep: null,
        address_street: null,
        address_number: null,
        address_complement: null,
        address_neighborhood: null,
        address_city: null,
        address_state: null,
        plan_type: null,
        plan_status: null,
      }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const Page = await PerfilEmpresaPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByText("Dados da empresa")).toBeInTheDocument();
    expect(screen.getByText("Identidade da empresa")).toBeInTheDocument();
    expect(screen.getByText("Contato")).toBeInTheDocument();
    expect(screen.getByText("Endereço")).toBeInTheDocument();
  });
});
