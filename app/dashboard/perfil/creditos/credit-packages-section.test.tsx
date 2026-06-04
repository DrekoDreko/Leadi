import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreditPackagesSection } from "./credit-packages-section";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

const packages = [
  {
    id: "pkg-1",
    slug: "essencial" as const,
    name: "100 créditos",
    credits: 100,
    priceCents: 3000,
    currency: "BRL" as const,
    description: "Recarga enxuta para continuar usando a IA no dia a dia.",
    approximateUses: [
      "Créditos liberados para a organização após a confirmação do pagamento.",
      "Uso flexível em mensagens, textos, campanhas e imagens."
    ],
    featured: false,
    isActive: true
  },
  {
    id: "pkg-2",
    slug: "campanhas" as const,
    name: "300 créditos",
    credits: 300,
    priceCents: 7000,
    currency: "BRL" as const,
    description: "Mais volume com custo por crédito melhor para uso recorrente.",
    approximateUses: [
      "Boa faixa para times que usam IA com frequência na rotina.",
      "Menor custo por crédito do que a recarga inicial."
    ],
    featured: false,
    isActive: true
  },
  {
    id: "pkg-3",
    slug: "criativos" as const,
    name: "1000 créditos",
    credits: 1000,
    priceCents: 15000,
    currency: "BRL" as const,
    description: "Maior volume com o menor custo por crédito da vitrine.",
    approximateUses: [
      "Pensado para equipes com uso intenso de IA no workspace.",
      "Melhor custo por crédito entre os pacotes disponíveis."
    ],
    badge: "Melhor valor",
    featured: true,
    isActive: true
  }
];

describe("CreditPackagesSection", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("renderiza os três pacotes com preços simples e economia progressiva", () => {
    render(<CreditPackagesSection canPurchase packages={packages} />);

    expect(screen.getByText("100 créditos")).toBeInTheDocument();
    expect(screen.getByText("300 créditos")).toBeInTheDocument();
    expect(screen.getByText("1000 créditos")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,300/crédito")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,233/crédito")).toBeInTheDocument();
    expect(screen.getByText("R$ 0,150/crédito")).toBeInTheDocument();
    expect(screen.getByText("22% mais econômico por crédito")).toBeInTheDocument();
    expect(screen.getByText("50% mais econômico por crédito")).toBeInTheDocument();
    expect(screen.getByText("Melhor valor")).toBeInTheDocument();
  });

  it("usa CTA de ativar assinatura quando a organização ainda não pode comprar", () => {
    render(
      <CreditPackagesSection
        canPurchase={false}
        disabledMessage="Sua organização precisa estar com a assinatura ativa ou em trial para comprar créditos de IA."
        packages={packages}
      />
    );

    const buttons = screen.getAllByRole("button", { name: "Ativar assinatura" });

    expect(buttons).toHaveLength(3);

    fireEvent.click(buttons[0]);

    expect(pushMock).toHaveBeenCalledWith("/checkout?plan=profissional&cycle=monthly");
  });

  it("usa CTA de comprar créditos quando a organização já tem assinatura ou trial", () => {
    render(<CreditPackagesSection canPurchase packages={packages} />);

    fireEvent.click(screen.getByRole("button", { name: "Comprar 300 créditos" }));

    expect(pushMock).toHaveBeenCalledWith("/checkout?mode=ai_credits&package=campanhas");
  });

  it("mostra loading ao iniciar a abertura do pagamento", () => {
    render(<CreditPackagesSection canPurchase packages={packages} />);

    fireEvent.click(screen.getByRole("button", { name: "Comprar 100 créditos" }));

    expect(screen.getByRole("button", { name: "Abrindo pagamento..." })).toBeDisabled();
  });

  it("mostra mensagem amigável quando falha ao abrir o fluxo", async () => {
    pushMock.mockImplementation(() => {
      throw new Error("navigation failed");
    });

    render(<CreditPackagesSection canPurchase packages={packages} />);

    fireEvent.click(screen.getByRole("button", { name: "Comprar 100 créditos" }));

    expect(
      await screen.findByText("Não foi possível abrir o pagamento agora. Tente novamente em instantes.")
    ).toBeInTheDocument();
  });
});
