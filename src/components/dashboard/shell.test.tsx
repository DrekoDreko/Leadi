import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "./shell";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn()
  })
}));

vi.mock("@/components/brand-mark", () => ({
  BrandMark: () => <div>Leadi</div>
}));

describe("DashboardShell", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    pushMock.mockReset();
  });

  it("busca leads automaticamente a partir de 3 caracteres e abre o lead selecionado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mode: "supabase",
        leads: [
          {
            id: "lead-kleber",
            name: "Kleber Martins",
            owner: "Gabriel",
            stage: "Novo lead",
            source: "Cadastro manual",
            phone: "(11) 99999-0000",
            email: "kleber@empresa.com.br",
            createdAt: "19 mai 2026",
            budget: "R$ 4k",
            interest: "Plano PME",
            lastInteraction: "Primeiro contato",
            notes: "Lead quente"
          }
        ]
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <DashboardShell>
        <div>Conteudo</div>
      </DashboardShell>
    );

    const searchInput = screen.getByRole("searchbox", { name: "Buscar leads do CRM" });

    fireEvent.change(searchInput, { target: { value: "kl" } });
    await act(async () => {
      vi.advanceTimersByTime(260);
    });

    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(searchInput, { target: { value: "kle" } });
    await act(async () => {
      vi.advanceTimersByTime(260);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/leads?search=kle&limit=6");
    expect(screen.getByRole("button", { name: "Abrir lead Kleber Martins" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir lead Kleber Martins" }));

    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/leads?lead=lead-kleber&panel=details&search=kle"
    );
  });
});
