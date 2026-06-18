"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, Clock3, Loader2, X } from "lucide-react";
import type { DashboardReminderItem, DashboardReminderPreset } from "@/lib/dashboard-reminders/types";
import { buildLocalDateTimeIso, getClientTimezoneOffsetMinutes } from "@/lib/date/client-time";

type ReminderCreateResponse = {
  reminder?: DashboardReminderItem;
  error?: string;
};

const DASHBOARD_REMINDERS_UPDATED_EVENT = "dashboard-reminders:updated";

const weekdayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long"
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit"
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long"
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit"
});

export function RemindersCalendarCard({
  initialReminders = []
}: {
  initialReminders?: DashboardReminderItem[];
}) {
  const [reminders, setReminders] = useState(initialReminders);
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [preset, setPreset] = useState<DashboardReminderPreset | "">("");
  const [time24h, setTime24h] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const todayDate = formatLocalDate(now);
  const monthLabel = capitalize(monthFormatter.format(new Date(year, monthIndex, 1)));
  const remindersByDate = groupRemindersByDate(reminders);
  const calendarDays = buildCalendarDays(year, monthIndex, remindersByDate);
  const selectedDayReminders = [...(remindersByDate[selectedDate] ?? [])].sort((left, right) =>
    left.remindAt.localeCompare(right.remindAt)
  );
  const isTodaySelected = selectedDate === todayDate;
  const dynamicPreset =
    now.getHours() < 12
      ? { value: "this_afternoon" as const, label: "Lembre-me esta tarde" }
      : { value: "this_evening" as const, label: "Lembre-me esta noite" };
  const upcomingReminder = [...reminders]
    .filter((item) => !item.completed && new Date(item.remindAt).getTime() >= now.getTime())
    .sort((left, right) => left.remindAt.localeCompare(right.remindAt))[0];

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isSubmitting]);

  const fetchReminders = async () => {
    try {
      const response = await fetch("/api/dashboard-reminders");
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.reminders)) {
          setReminders(data.reminders);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar lembretes:", err);
    }
  };

  useEffect(() => {
    const handleRemindersUpdated = () => {
      void fetchReminders();
    };

    window.addEventListener(DASHBOARD_REMINDERS_UPDATED_EVENT, handleRemindersUpdated);
    return () => {
      window.removeEventListener(DASHBOARD_REMINDERS_UPDATED_EVENT, handleRemindersUpdated);
    };
  }, []);

  function openDay(date: string) {
    setSelectedDate(date);
    setMessage("");
    setTime24h("");
    setError("");
    setSuccessMessage("");
    setPreset(date === todayDate ? "one_hour" : "custom");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    const manualTime = time24h.trim();
    const currentNow = new Date();
    const timezoneOffsetMinutes = getClientTimezoneOffsetMinutes(currentNow);

    if (!trimmedMessage) {
      setError("Informe do que voce quer ser lembrado.");
      return;
    }

    if (preset === "custom" && !manualTime) {
      setError("Informe um horario em 24 horas para o lembrete.");
      return;
    }

    if (manualTime && isTodaySelected) {
      const [hours, minutes] = manualTime.split(":").map(Number);
      const selectedAt = new Date(
        currentNow.getFullYear(),
        currentNow.getMonth(),
        currentNow.getDate(),
        hours,
        minutes,
        0,
        0
      );

      if (selectedAt.getTime() <= currentNow.getTime()) {
        setError("Escolha um horario futuro para o lembrete de hoje.");
        return;
      }
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const remindAtIso = manualTime
      ? buildLocalDateTimeIso(selectedDate, manualTime)
      : isTodaySelected && preset
        ? resolvePresetRemindAtIso(selectedDate, preset, currentNow)
        : null;

    try {
      const payload: Record<string, string | number> = {
        date: selectedDate,
        message: trimmedMessage,
        timezoneOffsetMinutes,
        clientNowIso: currentNow.toISOString()
      };

      if (manualTime) {
        payload.time24h = manualTime;
      } else if (isTodaySelected && preset) {
        payload.preset = preset;
      }

      if (remindAtIso) {
        payload.remindAtIso = remindAtIso;
      }

      const response = await fetch("/api/dashboard-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json().catch(() => null)) as ReminderCreateResponse | null;

      if (!response.ok || !data?.reminder) {
        throw new Error(data?.error ?? "Nao foi possivel salvar o lembrete.");
      }

      const nextReminders = [...reminders, data.reminder!].sort((left, right) =>
        left.remindAt.localeCompare(right.remindAt)
      );

      setReminders(nextReminders);
      setMessage("");
      setTime24h("");
      setPreset(isTodaySelected ? "one_hour" : "");
      setSuccessMessage("Lembrete salvo no calendario.");

      window.dispatchEvent(
        new CustomEvent(DASHBOARD_REMINDERS_UPDATED_EVENT, {
          detail: { count: nextReminders.length }
        })
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar o lembrete.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="surface-card rounded-[34px] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-muted-soft text-sm">Calendario</p>
            <h2 className="mt-1 text-2xl font-semibold">{monthLabel}</h2>
          </div>
          <span className="surface-pill flex h-11 w-11 items-center justify-center rounded-full text-cobalt">
            <CalendarDays size={20} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2 text-center">
          {weekdayLabels.map((label, index) => (
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/42" key={`${label}-${index}`}>
              {label}
            </span>
          ))}

          {calendarDays.map((day, index) =>
            day ? (
              <button
                aria-label={`Abrir lembretes de ${fullDateFormatter.format(day.date)}`}
                className={`relative flex aspect-square items-center justify-center rounded-[18px] text-sm font-semibold transition ${
                  day.dateString === todayDate
                    ? "bg-cobalt text-white shadow-[0_14px_28px_rgba(52,98,238,0.28)]"
                    : "bg-surface-elevated/82 text-foreground hover:bg-surface-elevated"
                }`}
                key={day.dateString}
                onClick={() => openDay(day.dateString)}
                type="button"
              >
                {day.day}
                {day.dateString === selectedDate && isModalOpen ? (
                  <span className="absolute inset-0 rounded-[18px] ring-2 ring-cobalt/34" />
                ) : null}
                {day.reminderCount > 0 ? (
                  <span
                    className={`absolute bottom-2 h-1.5 w-1.5 rounded-full ${
                      day.dateString === todayDate ? "bg-surface-elevated" : "bg-cobalt"
                    }`}
                  />
                ) : null}
              </button>
            ) : (
              <span className="aspect-square" key={`blank-${index}`} />
            )
          )}
        </div>

        <div className="surface-card-muted mt-5 rounded-[24px] p-4">
          <p className="text-sm font-semibold text-ink">
            {reminders.length === 0
              ? "Nenhum lembrete salvo neste mes"
              : reminders.length === 1
                ? "1 lembrete salvo neste mes"
                : `${reminders.length} lembretes salvos neste mes`}
          </p>
          <p className="text-muted-soft mt-2 text-sm leading-6">
            {upcomingReminder
              ? `${fullDateFormatter.format(new Date(upcomingReminder.remindAt))} as ${timeFormatter.format(
                  new Date(upcomingReminder.remindAt)
                )}: ${upcomingReminder.message}`
              : "Clique em uma data para registrar o proximo lembrete da operacao."}
          </p>
        </div>
      </section>

      {isModalOpen ? (
        <div
          aria-labelledby="dashboard-reminder-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
          onClick={closeModal}
          role="dialog"
        >
          <section
            className="surface-modal mx-auto w-full max-w-xl rounded-[32px] p-4 shadow-glass sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
              <div>
                <p className="text-sm font-medium text-cobalt">Calendario</p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl" id="dashboard-reminder-title">
                  {fullDateFormatter.format(new Date(`${selectedDate}T12:00:00`))}
                </h2>
              </div>
              <button className="icon-button shrink-0" onClick={closeModal} type="button" title="Fechar">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="pt-5" onSubmit={(event) => void handleSubmit(event)}>
              {error ? (
                <div className="mb-4 rounded-[22px] border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              ) : null}
              {successMessage ? (
                <div className="mb-4 flex items-center gap-2 rounded-[22px] border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {successMessage}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink/72">Do que voce quer ser lembrado</span>
                <textarea
                  className="liquid-input min-h-[118px] resize-y"
                  disabled={isSubmitting}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ex.: revisar a copy antes de subir a campanha."
                  value={message}
                />
              </label>

              <div className="mt-4 space-y-4">
                <p className="text-sm font-medium text-ink/72">Quando voce quer ser lembrado</p>

                <label className="block space-y-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                    <Clock3 size={14} aria-hidden="true" />
                    Atalho rapido
                  </span>
                  <select
                    className="liquid-input"
                    disabled={isSubmitting}
                    onChange={(event) => setPreset(event.target.value as typeof preset)}
                    value={preset}
                  >
                    {isTodaySelected && (
                      <>
                        <option value="one_hour">Lembre-me em uma hora</option>
                        <option value="two_hours">Lembre-me em duas horas</option>
                        <option value={dynamicPreset.value}>{dynamicPreset.label}</option>
                      </>
                    )}
                    <option value="custom">Personalizar</option>
                  </select>
                </label>

                {preset === "custom" && (
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                      Horario do lembrete (24 horas)
                    </span>
                    <input
                      className="liquid-input"
                      disabled={isSubmitting}
                      onChange={(event) => setTime24h(event.target.value)}
                      placeholder="14:30"
                      type="time"
                      value={time24h}
                    />
                  </label>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 size={18} aria-hidden="true" />
                  )}
                  {isSubmitting ? "Salvando" : "Salvar lembrete"}
                </button>
              </div>
            </form>

            <div className="mt-5 rounded-[24px] bg-surface-elevated p-4">
              <p className="text-sm font-semibold text-ink">Lembretes desta data</p>
              {selectedDayReminders.length === 0 ? (
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Nenhum lembrete salvo para este dia ainda.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedDayReminders.map((reminder) => (
                    <article
                      className={`rounded-[20px] bg-surface-elevated px-4 py-3 transition-opacity ${
                        reminder.completed ? "opacity-60" : ""
                      }`}
                      key={reminder.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-semibold text-ink ${reminder.completed ? "line-through text-ink/48" : ""}`}>
                          {timeFormatter.format(new Date(reminder.remindAt))}
                        </p>
                        {reminder.completed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={12} className="text-emerald-600" aria-hidden="true" />
                            Concluído
                          </span>
                        ) : (
                          <span className="rounded-full bg-cobalt/10 px-2.5 py-1 text-[11px] font-semibold text-cobalt">
                            lembrete
                          </span>
                        )}
                      </div>
                      <p className={`mt-2 text-sm leading-6 text-ink/68 ${reminder.completed ? "line-through text-ink/48" : ""}`}>
                        {reminder.message}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function buildCalendarDays(
  year: number,
  monthIndex: number,
  remindersByDate: Record<string, DashboardReminderItem[]>
) {
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const days: Array<
    | null
    | {
        date: Date;
        dateString: string;
        day: string;
        reminderCount: number;
      }
  > = Array.from({ length: startWeekday }, () => null);

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, monthIndex, day, 12, 0, 0, 0);
    const dateString = formatCalendarDate(year, monthIndex, day);

    days.push({
      date,
      dateString,
      day: dayFormatter.format(date),
      reminderCount: remindersByDate[dateString]?.filter((item) => !item.completed).length ?? 0
    });
  }

  return days;
}

function groupRemindersByDate(reminders: DashboardReminderItem[]) {
  const grouped: Record<string, DashboardReminderItem[]> = {};

  for (const reminder of reminders) {
    grouped[reminder.reminderDate] ??= [];
    grouped[reminder.reminderDate].push(reminder);
  }

  return grouped;
}

function formatCalendarDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatLocalDate(date: Date) {
  return formatCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function resolvePresetRemindAtIso(date: string, preset: DashboardReminderPreset, currentNow: Date) {
  if (preset === "one_hour") {
    return new Date(currentNow.getTime() + 60 * 60 * 1000).toISOString();
  }

  if (preset === "two_hours") {
    return new Date(currentNow.getTime() + 2 * 60 * 60 * 1000).toISOString();
  }

  const presetTime = preset === "this_afternoon" ? "15:00" : "20:00";
  return buildLocalDateTimeIso(date, presetTime);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
