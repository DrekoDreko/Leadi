import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

const mockSetTheme = vi.fn();
let mockResolvedTheme: "light" | "dark" = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme
  })
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockResolvedTheme = "light";
    mockSetTheme.mockReset();
  });

  afterEach(() => {
    mockSetTheme.mockReset();
  });

  it("solicita a troca para o tema escuro ao clicar no botao", async () => {
    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Alternar tema" });
    expect(button).toHaveAttribute("title", "Ativar modo escuro");

    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("sincroniza o estado inicial quando a pagina ja abre em modo escuro", async () => {
    mockResolvedTheme = "dark";

    render(<ThemeToggle />);

    const button = await screen.findByRole("button", { name: "Alternar tema" });

    expect(button).toHaveAttribute("title", "Ativar modo claro");
  });
});
