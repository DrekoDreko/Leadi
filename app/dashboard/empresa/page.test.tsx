import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmpresaPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getAiBalance } from "@/lib/ai/credits";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/integrations/repository.server", () => ({
  getConnectedAccountsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  getAiBalance: vi.fn()
}));

describe("Empresa Page (/dashboard/empresa)", () => {
  it("renderiza a area de Meta com acao de conexao", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspaceName: "Lucas Seguros",
      isManager: true,
      isSoloOwner: false
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getConnectedAccountsForCurrentUser).mockResolvedValue({
      canManageConnections: true,
      connectedAccounts: [],
      metaConnection: null,
      metaPages: [{ id: "page-1" }, { id: "page-2" }],
      metaAdAccounts: [],
      metaLeadForms: [{ id: "form-1" }],
      message: null
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getAiBalance).mockResolvedValue(24);

    const Page = await EmpresaPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByText("Operacao da conta")).toBeInTheDocument();
    expect(screen.getByText("Conta conectada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Conectar Meta/i })).toBeInTheDocument();
    expect(screen.getByText("Paginas")).toBeInTheDocument();
    expect(screen.getByText("Formularios")).toBeInTheDocument();
    expect(screen.getAllByText("Créditos de IA").length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo de IA")).toBeInTheDocument();
    expect(screen.getByText("Conta OpenAI própria")).toBeInTheDocument();
    expect(screen.getByText(/^Em breve$/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Disponível em breve/i })).toBeDisabled();
  });
});
