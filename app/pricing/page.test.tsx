import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PricingPage from "./page";

vi.mock("@/components/brand-mark", () => ({
  BrandMark: () => <div data-testid="brand-mark" />,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Alternar tema" type="button" />,
}));

describe("Pricing Page (/pricing)", () => {
  it("renderiza os tres cards principais e o destaque do plano profissional", () => {
    render(<PricingPage />);

    expect(screen.getByRole("heading", { name: /Escolha o plano ideal para sua operação/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Essencial$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Profissional$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Equipe$/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Mais escolhido/i).length).toBeGreaterThan(0);
  });

  it("exibe os preços mensais iniciais e alterna para o anual", () => {
    render(<PricingPage />);

    const essentialCard = screen.getByRole("heading", { name: /^Essencial$/i }).closest("article");
    const professionalCard = screen.getByRole("heading", { name: /^Profissional$/i }).closest("article");
    const teamCard = screen.getByRole("heading", { name: /^Equipe$/i }).closest("article");

    expect(essentialCard).not.toBeNull();
    expect(professionalCard).not.toBeNull();
    expect(teamCard).not.toBeNull();

    expect(within(essentialCard as HTMLElement).getByText("R$ 59")).toBeInTheDocument();
    expect(within(professionalCard as HTMLElement).getByText("R$ 119")).toBeInTheDocument();
    expect(within(teamCard as HTMLElement).getByText("R$ 249")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Anual/i }));

    expect(within(essentialCard as HTMLElement).getByText("R$ 49")).toBeInTheDocument();
    expect(within(professionalCard as HTMLElement).getByText("R$ 89")).toBeInTheDocument();
    expect(within(teamCard as HTMLElement).getByText("R$ 199")).toBeInTheDocument();
  });

  it("mantem os links de contratar com ciclo mensal e alterna o ciclo anual no checkout", () => {
    render(<PricingPage />);

    const essentialCard = screen.getByRole("heading", { name: /^Essencial$/i }).closest("article");
    const professionalCard = screen.getByRole("heading", { name: /^Profissional$/i }).closest("article");
    const teamCard = screen.getByRole("heading", { name: /^Equipe$/i }).closest("article");

    expect(within(essentialCard as HTMLElement).getByRole("link", { name: /Contratar/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dessencial%26cycle%3Dmonthly"
    );
    expect(within(professionalCard as HTMLElement).getByRole("link", { name: /Contratar/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dprofissional%26cycle%3Dmonthly"
    );
    expect(within(teamCard as HTMLElement).getByRole("link", { name: /Contratar/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dequipe%26cycle%3Dmonthly"
    );

    fireEvent.click(screen.getByRole("button", { name: /Anual/i }));

    expect(within(teamCard as HTMLElement).getByRole("link", { name: /Contratar/i })).toHaveAttribute(
      "href",
      "/login?mode=signup&next=%2Fcheckout%3Fplan%3Dequipe%26cycle%3Dannual"
    );
  });

  it("exibe a comparação completa, a seção de créditos extras e o aviso sobre consumo", () => {
    render(<PricingPage />);

    expect(screen.getByText(/Compare os planos em detalhes/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Veja o que está incluso em cada plano antes de escolher/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^CRM de leads$/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Operação$/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Compre créditos avulsos quando a franquia do plano terminar/i })).toBeInTheDocument();
    expect(screen.getByText(/100 créditos/i)).toBeInTheDocument();
    expect(screen.getByText(/300 créditos/i)).toBeInTheDocument();
    expect(screen.getByText(/1000 créditos/i)).toBeInTheDocument();
    expect(screen.getByText(/o sistema sempre consome primeiro a franquia do plano/i)).toBeInTheDocument();
  });

  it("mantem a seção com vantagens do Leadi abaixo do pricing", () => {
    render(<PricingPage />);

    expect(
      screen.getByRole("heading", { name: /Mais clareza, velocidade e consistência para vender melhor/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Tenha seus leads, responsáveis e próximos passos no mesmo lugar/i).length
    ).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Mostrar vantagem anterior/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mostrar próxima vantagem/i })).toBeInTheDocument();
  });
});
