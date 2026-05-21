import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";

vi.mock("server-only", () => ({}));

const redirectMock = vi.hoisted(() =>
  vi.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  })
);

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/integrations/repository.server", () => ({
  getConnectedAccountsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  getCurrentAiBalance: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("Perfil Page (/dashboard/perfil)", () => {
  it("renderiza a visão resumida do perfil e os cards de gerenciamento", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      mode: "supabase",
      workspace: { id: "org-1" },
      workspaceName: "Aliança Corretora",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Gabriel",
      profile: { email: "gabriel@alianca.example" },
      profileSetupCompleted: true,
      brokerageName: "Aliança Corretora"
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getConnectedAccountsForCurrentUser).mockResolvedValue({
      message: null,
      metaConnection: null,
      metaPages: [],
      metaAdAccounts: [],
      metaLeadForms: [],
      canManageConnections: true,
      openAIConnection: { status: "connected" }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getCurrentAiBalance).mockResolvedValue(12);

    const Page = await PerfilPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Configuracoes")).toBeInTheDocument();
    expect(screen.getByText("Usuario")).toBeInTheDocument();
    expect(screen.getByText("Empresa")).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getAllByText("Créditos de IA").length).toBeGreaterThan(0);
    expect(screen.getByText("Nome usado com clientes")).toBeInTheDocument();
    expect(screen.getByText("Gerenciar conta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gerenciar créditos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gerenciar Meta/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Gerenciar empresa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Em breve" })).toBeDisabled();
    expect(screen.queryByText("Saldo de IA")).not.toBeInTheDocument();
    expect(screen.queryByText("Conta OpenAI própria")).not.toBeInTheDocument();
    expect(screen.queryByText("Empresa e contas conectadas")).not.toBeInTheDocument();
    expect(screen.queryByText("Operacao da conta")).not.toBeInTheDocument();
  });

  it("redireciona filtros antigos de webhookStatus para a nova tela tecnica", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      mode: "supabase",
      workspace: { id: "org-1" },
      workspaceName: "Aliança Corretora",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Gabriel",
      profile: { email: "gabriel@alianca.example" },
      profileSetupCompleted: true
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getCurrentAiBalance).mockResolvedValue(0);

    await expect(
      PerfilPage({ searchParams: Promise.resolve({ webhookStatus: "processed" }) })
    ).rejects.toThrow("redirect:/dashboard/integracoes/webhook-leads?webhookStatus=processed#logs");

    expect(redirectMock).toHaveBeenCalledWith(
      "/dashboard/integracoes/webhook-leads?webhookStatus=processed#logs"
    );
  });

  it("mostra aviso quando a Meta ainda nao esta configurada", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      mode: "supabase",
      workspace: { id: "org-1" },
      workspaceName: "Aliança Corretora",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Gabriel",
      profile: { email: "gabriel@alianca.example" },
      profileSetupCompleted: true,
      brokerageName: "Aliança Corretora"
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getConnectedAccountsForCurrentUser).mockResolvedValue({
      message: null,
      metaConnection: null,
      metaPages: [],
      metaAdAccounts: [],
      metaLeadForms: [],
      canManageConnections: true,
      openAIConnection: { status: "connected" }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getCurrentAiBalance).mockResolvedValue(12);

    const Page = await PerfilPage({ searchParams: Promise.resolve({ meta: "missing" }) });
    render(Page);

    expect(screen.getByText(/META_APP_ID e META_APP_SECRET/i)).toBeInTheDocument();
    expect(
      screen.getByText(/o botão Conectar Meta não consegue iniciar o OAuth/i)
    ).toBeInTheDocument();
  });
});
