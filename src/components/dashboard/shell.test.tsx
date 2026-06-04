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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reminders: []
      })
    }));
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

  it("mostra o contador de notificacoes e atualiza quando um lembrete novo e salvo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reminders: [
          { id: "1", remindAt: "2026-05-20T10:00:00Z", message: "A", reminderDate: "2026-05-20", createdAt: "", updatedAt: "" },
          { id: "2", remindAt: "2026-05-20T11:00:00Z", message: "B", reminderDate: "2026-05-20", createdAt: "", updatedAt: "" },
          { id: "3", remindAt: "2026-05-20T12:00:00Z", message: "C", reminderDate: "2026-05-20", createdAt: "", updatedAt: "" },
          { id: "4", remindAt: "2026-05-20T13:00:00Z", message: "D", reminderDate: "2026-05-20", createdAt: "", updatedAt: "" }
        ]
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <DashboardShell notificationCount={2}>
        <div>Conteudo</div>
      </DashboardShell>
    );

    expect(screen.getByLabelText("2 notificações de lembrete")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("dashboard-reminders:updated", {
          detail: { count: 4 }
        })
      );
    });

    expect(screen.getByLabelText("4 notificações de lembrete")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("abre o menu de notificacoes ao clicar no sino e busca lembretes", async () => {
    const remindersMock = [
      {
        id: "reminder-1",
        reminderDate: "2026-05-20",
        remindAt: "2026-05-20T14:30:00.000Z",
        message: "Ligar para o lead Kleber",
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z"
      }
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reminders: remindersMock
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <DashboardShell notificationCount={1}>
        <div>Conteudo</div>
      </DashboardShell>
    );

    const bellButton = screen.getByRole("button", { name: "1 notificações de lembrete" });
    
    const dropdown = screen.getByText("Lembretes e Notificações").closest(".absolute");
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveClass("invisible");
    expect(dropdown).toHaveClass("opacity-0");
    expect(dropdown).toHaveClass("max-h-0");

    await act(async () => {
      fireEvent.click(bellButton);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/dashboard-reminders");
    expect(dropdown).toHaveClass("visible");
    expect(dropdown).toHaveClass("opacity-100");
    expect(dropdown).toHaveClass("max-h-[420px]");
    expect(screen.getByText("Ligar para o lead Kleber")).toBeInTheDocument();
    expect(screen.queryByText("Ver calendário completo")).not.toBeInTheDocument();
  });

  it("mostra os botoes inline de +1h e Amanha ao clicar em Adiar e permite adiar", async () => {
    const remindersMock = [
      {
        id: "reminder-snooze-test",
        reminderDate: "2026-05-20",
        remindAt: "2026-05-20T14:30:00.000Z",
        message: "Lembrete teste snooze",
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z"
      }
    ];

    const fetchMock = vi.fn().mockImplementation((url, init) => {
      if (url === "/api/dashboard-reminders" && init?.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            reminder: {
              ...remindersMock[0],
              remindAt: "2026-05-20T15:30:00.000Z"
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          reminders: remindersMock
        })
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <DashboardShell notificationCount={1}>
        <div>Conteudo</div>
      </DashboardShell>
    );

    const bellButton = screen.getByRole("button", { name: "1 notificações de lembrete" });
    await act(async () => {
      fireEvent.click(bellButton);
    });

    expect(screen.getByRole("button", { name: "Adiar" })).toBeInTheDocument();

    // Click "Adiar" button to transform
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Adiar" }));
    });

    // Check that the dropdown transformed into "+1h" and "Amanhã" and "Cancelar" buttons
    expect(screen.queryByRole("button", { name: "Adiar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+1h" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Amanhã" })).toBeInTheDocument();

    // Click "+1h" button
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "+1h" }));
    });

    // Verify that PATCH api call is made
    const patchCall = fetchMock.mock.calls.find(([url, init]) => url === "/api/dashboard-reminders" && init?.method === "PATCH");
    expect(patchCall).toBeDefined();
    const payload = JSON.parse(patchCall[1].body);
    expect(payload.id).toBe("reminder-snooze-test");
    expect(payload.action).toBe("snooze");
    expect(payload.snoozeType).toBe("one_hour");
  });
});

describe("DashboardShell permissions", () => {
  it("não exibe link de Configurações para supervisor", () => {
    render(
      <DashboardShell navVariant="supervisor-team">
        <div>Conteudo</div>
      </DashboardShell>
    );

    expect(screen.queryAllByLabelText("Configurações")).toHaveLength(0);
  });

  it("exibe todos os links para o gestor", () => {
    render(
      <DashboardShell navVariant="owner-team">
        <div>Conteudo</div>
      </DashboardShell>
    );

    expect(screen.getAllByLabelText("Configurações").length).toBeGreaterThan(0);
  });
});
