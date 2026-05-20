import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createDashboardReminderForCurrentUser } from "@/lib/dashboard-reminders/repository.server";

vi.mock("@/lib/dashboard-reminders/repository.server", () => ({
  createDashboardReminderForCurrentUser: vi.fn()
}));

describe("Dashboard Reminders API - /api/dashboard-reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria um lembrete com sucesso", async () => {
    const reminder = {
      id: "reminder-1",
      reminderDate: "2026-05-13",
      remindAt: "2026-05-13T14:00:00.000Z",
      message: "Revisar campanha",
      createdAt: "2026-05-13T10:00:00.000Z",
      updatedAt: "2026-05-13T10:00:00.000Z"
    };

    vi.mocked(createDashboardReminderForCurrentUser).mockResolvedValue(reminder);

    const response = await POST(
      new Request("http://localhost:3000/api/dashboard-reminders", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-13",
          message: "Revisar campanha",
          preset: "one_hour"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.reminder).toEqual(reminder);
  });

  it("retorna erro de validacao do horario", async () => {
    vi.mocked(createDashboardReminderForCurrentUser).mockRejectedValue(
      new Error("Informe um horario valido no formato 24 horas.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/dashboard-reminders", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-20",
          message: "Follow-up",
          time24h: "25:99"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Informe um horario valido no formato 24 horas.");
  });

  it("retorna erro de sessao expirada", async () => {
    vi.mocked(createDashboardReminderForCurrentUser).mockRejectedValue(
      new Error("Usuario nao autenticado.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/dashboard-reminders", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-13",
          message: "Revisar campanha",
          preset: "one_hour"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Sua sessao expirou. Entre novamente para salvar lembretes.");
  });

  it("expõe erro de validacao do lembrete manual para hoje", async () => {
    vi.mocked(createDashboardReminderForCurrentUser).mockRejectedValue(
      new Error("Escolha um horario manual para este lembrete.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/dashboard-reminders", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-20",
          message: "Ligar para João",
          preset: "one_hour"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Escolha um horario manual para este lembrete.");
  });

  it("retorna erro amigavel quando o perfil nao pode salvar por RLS", async () => {
    vi.mocked(createDashboardReminderForCurrentUser).mockRejectedValue(
      new Error('new row violates row-level security policy for table "dashboard_reminders"')
    );

    const response = await POST(
      new Request("http://localhost:3000/api/dashboard-reminders", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-20",
          message: "Ligar para João",
          preset: "one_hour"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Seu perfil nao tem permissao para salvar lembretes. Recarregue a pagina ou refaca o login.");
  });

  it("retorna erro claro quando falta horario manual em outro dia", async () => {
    vi.mocked(createDashboardReminderForCurrentUser).mockRejectedValue(
      new Error("Informe um horario em 24 horas para lembretes em outros dias.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/dashboard-reminders", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-05-21",
          message: "Ligar para João",
          preset: ""
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Informe um horario em 24 horas para lembretes em outros dias.");
  });
});
