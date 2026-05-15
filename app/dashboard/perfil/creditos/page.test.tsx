import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerfilCreditosPage from "./page";
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getAiBalance } from "@/lib/ai/credits";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  getAiBalance: vi.fn()
}));

describe("Perfil Créditos Page (/dashboard/perfil/creditos)", () => {
  it("renderiza o saldo e o CTA de compra em breve", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getAiBalance).mockResolvedValue(42);

    const Page = await PerfilCreditosPage();
    render(Page);

    expect(screen.getAllByText("Créditos de IA").length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo de IA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comprar créditos - em breve/i })).toBeDisabled();
  });
});
