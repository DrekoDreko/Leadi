import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilCreditosPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getCurrentAiBalanceDetails, listActiveAiCreditPackages } from "@/lib/ai/credits";
import { getAiCreditPurchaseEligibilityForOrganization } from "@/lib/ai/credit-orders.server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  getCurrentAiBalanceDetails: vi.fn(),
  listActiveAiCreditPackages: vi.fn()
}));

vi.mock("@/lib/ai/credit-orders.server", () => ({
  getAiCreditPurchaseEligibilityForOrganization: vi.fn(),
  getLatestAiCreditOrderForUser: vi.fn().mockResolvedValue(null),
  getAiCreditOrderPixDetails: vi.fn().mockReturnValue(null),
  isAiCreditOrderPixExpired: vi.fn().mockReturnValue(false),
  wasAiCreditOrderExpiryNotified: vi.fn().mockReturnValue(false),
  updateAiCreditOrder: vi.fn().mockResolvedValue(null)
}));

describe("Perfil Créditos Page (/dashboard/perfil/creditos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza saldo, pacotes visíveis e a área de consumo", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" }
    } as never);
    vi.mocked(getCurrentAiBalanceDetails).mockResolvedValue({
      orgId: "org-1",
      availableCredits: 42,
      includedCredits: 25,
      purchasedCredits: 17,
      currentPeriodStart: "2026-05-01T00:00:00.000Z",
      currentPeriodEnd: "2026-05-31T23:59:59.000Z",
      createdAt: null,
      updatedAt: null
    });
    vi.mocked(listActiveAiCreditPackages).mockResolvedValue([
      {
        id: "pkg-1",
        slug: "essencial",
        name: "100 créditos",
        credits: 100,
        priceCents: 3000,
        currency: "BRL",
        description: "Recarga enxuta para continuar usando a IA no dia a dia.",
        approximateUses: ["Créditos liberados para a organização após a confirmação do pagamento."],
        featured: false,
        isActive: true
      },
      {
        id: "pkg-2",
        slug: "campanhas",
        name: "300 créditos",
        credits: 300,
        priceCents: 7000,
        currency: "BRL",
        description: "Mais volume com custo por crédito melhor para uso recorrente.",
        approximateUses: ["Boa faixa para times que usam IA com frequência na rotina."],
        featured: false,
        isActive: true
      }
    ]);
    vi.mocked(getAiCreditPurchaseEligibilityForOrganization).mockResolvedValue({
      allowed: true,
      reason: "allowed",
      message: "",
      subscriptionStatus: "active"
    });

    const Page = await PerfilCreditosPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getAllByText("Créditos de IA").length).toBeGreaterThan(0);
    expect(screen.getByText("Total disponível: 42 créditos")).toBeInTheDocument();
    expect(screen.getByText("Saldo")).toBeInTheDocument();
    expect(screen.getByText("Saudável")).toBeInTheDocument();
    expect(screen.getAllByText("42 créditos").length).toBeGreaterThan(0);
    expect(screen.getByText("Créditos inclusos disponíveis")).toBeInTheDocument();
    expect(screen.getByText("Créditos avulsos disponíveis")).toBeInTheDocument();
    expect(screen.getByText("25 créditos")).toBeInTheDocument();
    expect(screen.getByText("17 créditos")).toBeInTheDocument();
    expect(screen.getByText("Pacotes de créditos")).toBeInTheDocument();
    expect(screen.getByText("100 créditos")).toBeInTheDocument();
    expect(screen.getByText("300 créditos")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Os créditos inclusos são usados primeiro em cada geração. Quando a franquia do plano termina, o consumo passa automaticamente para os créditos extras comprados."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Os créditos serão adicionados ao saldo da organização após a confirmação do pagamento."
      )
    ).not.toBeInTheDocument();
    expect(screen.getByText("Consumo por ação")).toBeInTheDocument();
    expect(screen.getByText("Mensagem com IA")).toBeInTheDocument();
    expect(screen.getByText("Campanha completa")).toBeInTheDocument();
    expect(screen.getByText("Revisão de anúncio")).toBeInTheDocument();
    expect(screen.getByText("Imagem de anúncio")).toBeInTheDocument();
    expect(screen.getByText("50 créditos por geração")).toBeInTheDocument();
    expect(screen.getByText("10 créditos por análise")).toBeInTheDocument();
    expect(screen.queryByText("Texto de anúncio")).not.toBeInTheDocument();
    expect(screen.queryByText("50 créditos")).not.toBeInTheDocument();
  });

  it("mostra aviso de compra pendente", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" }
    } as never);
    vi.mocked(getCurrentAiBalanceDetails).mockResolvedValue({
      orgId: "org-1",
      availableCredits: 0,
      includedCredits: 0,
      purchasedCredits: 0,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: null,
      updatedAt: null
    });
    vi.mocked(listActiveAiCreditPackages).mockResolvedValue([]);
    vi.mocked(getAiCreditPurchaseEligibilityForOrganization).mockResolvedValue({
      allowed: false,
      reason: "inactive_subscription",
      message: "Sua organizacao precisa estar com a assinatura ativa ou em trial para comprar créditos de IA.",
      subscriptionStatus: "past_due"
    });

    const Page = await PerfilCreditosPage({
      searchParams: Promise.resolve({ purchase: "pending", showPackages: "1" })
    });
    render(Page);

    expect(screen.getByText(/Pagamento pendente/i)).toBeInTheDocument();
    expect(screen.getByText(/assinatura ativa ou em trial/i)).toBeInTheDocument();
  });

  it("mostra aviso visual quando o saldo acabou", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" }
    } as never);
    vi.mocked(getCurrentAiBalanceDetails).mockResolvedValue({
      orgId: "org-1",
      availableCredits: 0,
      includedCredits: 0,
      purchasedCredits: 0,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: null,
      updatedAt: null
    });
    vi.mocked(listActiveAiCreditPackages).mockResolvedValue([]);
    vi.mocked(getAiCreditPurchaseEligibilityForOrganization).mockResolvedValue({
      allowed: true,
      reason: "allowed",
      message: "",
      subscriptionStatus: "active"
    });

    const Page = await PerfilCreditosPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByText("Sem saldo")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Você não tem créditos suficientes para esta ação. Compre créditos para continuar usando as rotinas de IA."
      )
    ).toBeInTheDocument();
  });

  it("mantém os pacotes visíveis mesmo quando o fluxo chega com showPackages=1", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" }
    } as never);
    vi.mocked(getCurrentAiBalanceDetails).mockResolvedValue({
      orgId: "org-1",
      availableCredits: 42,
      includedCredits: 30,
      purchasedCredits: 12,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: null,
      updatedAt: null
    });
    vi.mocked(listActiveAiCreditPackages).mockResolvedValue([
      {
        id: "pkg-1",
        slug: "essencial",
        name: "100 créditos",
        credits: 100,
        priceCents: 3000,
        currency: "BRL",
        description: "Recarga enxuta para continuar usando a IA no dia a dia.",
        approximateUses: ["Créditos liberados para a organização após a confirmação do pagamento."],
        featured: false,
        isActive: true
      }
    ]);
    vi.mocked(getAiCreditPurchaseEligibilityForOrganization).mockResolvedValue({
      allowed: true,
      reason: "allowed",
      message: "",
      subscriptionStatus: "active"
    });

    const Page = await PerfilCreditosPage({
      searchParams: Promise.resolve({ showPackages: "1" })
    });
    render(Page);

    expect(screen.getByText("100 créditos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comprar 100 créditos/i })).toBeInTheDocument();
  });

  it("usa pacotes padrao sem erro generico quando a compra esta bloqueada", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" }
    } as never);
    vi.mocked(getCurrentAiBalanceDetails).mockResolvedValue({
      orgId: "org-1",
      availableCredits: 0,
      includedCredits: 0,
      purchasedCredits: 0,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: null,
      updatedAt: null
    });
    vi.mocked(listActiveAiCreditPackages).mockRejectedValue(new Error("db down"));
    vi.mocked(getAiCreditPurchaseEligibilityForOrganization).mockResolvedValue({
      allowed: false,
      reason: "inactive_subscription",
      message: "Sua organizacao precisa estar com a assinatura ativa ou em trial para comprar créditos de IA.",
      subscriptionStatus: "past_due"
    });

    const Page = await PerfilCreditosPage({
      searchParams: Promise.resolve({ showPackages: "1" })
    });
    render(Page);

    expect(screen.getByText("Compra de créditos")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Para comprar créditos, sua organização precisa ter uma assinatura ativa ou estar em período de teste."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/Nao foi possivel carregar os pacotes agora/i)).not.toBeInTheDocument();
    expect(screen.getByText("100 créditos")).toBeInTheDocument();
    expect(screen.getByText("300 créditos")).toBeInTheDocument();
    expect(screen.getByText("1000 créditos")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ativar assinatura/i }).length).toBeGreaterThan(0);
    expect(vi.mocked(listActiveAiCreditPackages)).not.toHaveBeenCalled();
  });
});
