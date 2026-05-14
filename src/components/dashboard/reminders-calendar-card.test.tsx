import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemindersCalendarCard } from "./reminders-calendar-card";

describe("RemindersCalendarCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renderiza o mes atual e mostra lembretes salvos no dia", async () => {
    vi.setSystemTime(new Date("2026-05-13T10:00:00.000Z"));

    render(
      <RemindersCalendarCard
        initialReminders={[
          {
            id: "reminder-1",
            reminderDate: "2026-05-13",
            remindAt: "2026-05-13T14:00:00.000Z",
            message: "Revisar copy da campanha",
            createdAt: "2026-05-13T09:00:00.000Z",
            updatedAt: "2026-05-13T09:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getByText("Maio")).toBeInTheDocument();
    expect(screen.getByText("1 lembrete salvo neste mes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Abrir lembretes de 13 de maio/i }));

    expect(screen.getByText("Do que voce quer ser lembrado")).toBeInTheDocument();
    expect(screen.getByText("Revisar copy da campanha")).toBeInTheDocument();
  });

  it("mostra atalho de tarde pela manha e de noite pela tarde", () => {
    vi.setSystemTime(new Date("2026-05-13T10:00:00.000Z"));
    const { rerender } = render(<RemindersCalendarCard initialReminders={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /Abrir lembretes de 13 de maio/i }));
    expect(screen.getByRole("option", { name: "Lembre-me esta tarde" })).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Fechar"));

    vi.setSystemTime(new Date("2026-05-13T15:00:00.000Z"));
    rerender(<RemindersCalendarCard initialReminders={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /Abrir lembretes de 13 de maio/i }));
    expect(screen.getByRole("option", { name: "Lembre-me esta noite" })).toBeInTheDocument();
  });

  it("prioriza horario manual no envio de hoje", async () => {
    vi.setSystemTime(new Date("2026-05-13T10:00:00.000Z"));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reminder: {
          id: "reminder-2",
          reminderDate: "2026-05-13",
          remindAt: "2026-05-13T14:30:00.000Z",
          message: "Confirmar campanha",
          createdAt: "2026-05-13T10:00:00.000Z",
          updatedAt: "2026-05-13T10:00:00.000Z"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const futureTime = formatTimeValue(new Date(Date.now() + 4 * 60 * 60 * 1000));

    render(<RemindersCalendarCard initialReminders={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /Abrir lembretes de 13 de maio/i }));
    fireEvent.change(screen.getByLabelText("Do que voce quer ser lembrado"), {
      target: { value: "Confirmar campanha" }
    });
    fireEvent.change(screen.getByLabelText("Ou defina o horario (24 horas)"), {
      target: { value: futureTime }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar lembrete" }));

    await Promise.resolve();

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);

    expect(requestBody.time24h).toBe(futureTime);
    expect(requestBody.preset).toBeUndefined();
  });

  it("bloqueia horario passado para hoje", () => {
    vi.setSystemTime(new Date("2026-05-13T15:00:00.000Z"));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const pastTime = formatTimeValue(new Date(Date.now() - 60 * 60 * 1000));

    render(<RemindersCalendarCard initialReminders={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /Abrir lembretes de 13 de maio/i }));
    fireEvent.change(screen.getByLabelText("Do que voce quer ser lembrado"), {
      target: { value: "Retornar para cliente" }
    });
    fireEvent.change(screen.getByLabelText("Ou defina o horario (24 horas)"), {
      target: { value: pastTime }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar lembrete" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Escolha um horario futuro para o lembrete de hoje.")).toBeInTheDocument();
  });

  it("exige horario manual para outro dia do mes", async () => {
    vi.setSystemTime(new Date("2026-05-13T10:00:00.000Z"));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reminder: {
          id: "reminder-3",
          reminderDate: "2026-05-20",
          remindAt: "2026-05-20T09:30:00.000Z",
          message: "Aprovar arte",
          createdAt: "2026-05-13T10:00:00.000Z",
          updatedAt: "2026-05-13T10:00:00.000Z"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RemindersCalendarCard initialReminders={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /Abrir lembretes de 20 de maio/i }));
    fireEvent.change(screen.getByLabelText("Do que voce quer ser lembrado"), {
      target: { value: "Aprovar arte" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar lembrete" }));
    expect(screen.getByText("Informe um horario em 24 horas para lembretes em outros dias.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Horario do lembrete (24 horas)"), {
      target: { value: "09:30" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar lembrete" }));

    await Promise.resolve();

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.date).toBe("2026-05-20");
    expect(requestBody.time24h).toBe("09:30");
  });
});

function formatTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
