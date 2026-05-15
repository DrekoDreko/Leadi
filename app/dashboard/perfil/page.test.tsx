import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getAiBalance } from "@/lib/ai/credits";

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
  getAiBalance: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("Perfil Page (/dashboard/perfil)", () => {
  it("renderiza os cards de perfil, corretora, créditos e operação sem webhook", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      mode: "supabase",
      workspace: { id: "org-1" },
      workspaceName: "Corretora Demo",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Lucas",
      profile: { email: "lucas@leadi.example" },
      profileSetupCompleted: true,
      brokerageName: "Corretora Demo"
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

    vi.mocked(getAiBalance).mockResolvedValue(12);

    const Page = await PerfilPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByText("Perfil")).toBeInTheDocument();
    expect(screen.getByText("Configuracoes")).toBeInTheDocument();
    expect(screen.getByText("Nome usado com clientes")).toBeInTheDocument();
    expect(screen.getAllByText("Créditos de IA").length).toBeGreaterThan(1);
    expect(screen.getByText("Saldo de IA")).toBeInTheDocument();
    expect(screen.getByText("Conta OpenAI própria")).toBeInTheDocument();
    expect(screen.getByText(/^Em breve$/, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Disponível em breve/i })).toBeDisabled();
    expect(screen.getByText("Empresa e contas conectadas")).toBeInTheDocument();
    expect(screen.getByText("Operacao da conta")).toBeInTheDocument();
    expect(screen.getAllByText("Corretora Demo").length).toBeGreaterThan(1);
    expect(screen.queryByText("Webhook de Leads")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Configurar integração/i })).not.toBeInTheDocument();
  });

  it("redireciona filtros antigos de webhookStatus para a nova tela tecnica", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      mode: "supabase",
      workspace: { id: "org-1" },
      workspaceName: "Corretora Demo",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Lucas",
      profile: { email: "lucas@leadi.example" },
      profileSetupCompleted: true
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getAiBalance).mockResolvedValue(0);

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
      workspaceName: "Corretora Demo",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Lucas",
      profile: { email: "lucas@leadi.example" },
      profileSetupCompleted: true,
      brokerageName: "Corretora Demo"
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

    vi.mocked(getAiBalance).mockResolvedValue(12);

    const Page = await PerfilPage({ searchParams: Promise.resolve({ meta: "missing" }) });
    render(Page);

    expect(screen.getByText("Integração Meta não configurada")).toBeInTheDocument();
    expect(
      screen.getByText(/META_APP_ID e META_APP_SECRET/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/o botão Conectar Meta não consegue iniciar o OAuth/i)
    ).toBeInTheDocument();
  });
});
