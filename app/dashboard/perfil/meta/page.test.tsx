import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilMetaPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/integrations/repository.server", () => ({
  getConnectedAccountsForCurrentUser: vi.fn()
}));

describe("Perfil Meta Page (/dashboard/perfil/meta)", () => {
  it("renderiza a area detalhada de Meta e os ativos conectados", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspaceName: "Aliança Corretora"
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getConnectedAccountsForCurrentUser).mockResolvedValue({
      message: null,
      canManageConnections: true,
      metaConnection: {
        metaUserName: "Aliança Corretora Meta",
        metaUserId: "meta-1",
        connectionStatusLabel: "Conectada",
        lastSyncAt: "2026-05-15T12:00:00.000Z",
        permissions: ["pages_read_engagement", "leads_retrieval"]
      },
      metaPages: [
        {
          id: "page-1",
          name: "Aliança Corretora Empresarial",
          metaPageId: "meta-page-1",
          status: "connected",
          lastSyncAt: "2026-05-15T12:00:00.000Z"
        }
      ],
      metaAdAccounts: [],
      metaLeadForms: [
        {
          id: "form-1",
          name: "Formulario Principal",
          metaFormId: "meta-form-1",
          status: "active",
          lastSyncAt: "2026-05-15T12:10:00.000Z",
          lastLeadSyncAt: "2026-05-15T12:10:00.000Z"
        }
      ],
      openAIConnection: null
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const Page = await PerfilMetaPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByText("Meta e contas conectadas")).toBeInTheDocument();
    expect(screen.getByText("Conta conectada")).toBeInTheDocument();
    expect(screen.getByText("Contas Meta conectadas")).toBeInTheDocument();
    expect(screen.getByText("Permissões concedidas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gerenciar conexão/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sincronizar novamente/i })).toBeInTheDocument();
    expect(screen.getByText("Aliança Corretora Empresarial")).toBeInTheDocument();
    expect(screen.getByText("Formulario Principal")).toBeInTheDocument();
  });
});

