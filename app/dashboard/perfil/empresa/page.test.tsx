import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilEmpresaPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

describe("Perfil Empresa Page (/dashboard/perfil/empresa)", () => {
  it("renderiza um resumo simples da empresa", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspaceName: "Lucas Seguros",
      workspaceType: "team",
      brokerageName: "Lucas Seguros",
      isSoloOwner: false
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const Page = await PerfilEmpresaPage();
    render(Page);

    expect(screen.getByText("Dados da empresa")).toBeInTheDocument();
    expect(screen.getAllByText("Lucas Seguros").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Gerenciar Meta/i })).toBeInTheDocument();
  });
});
