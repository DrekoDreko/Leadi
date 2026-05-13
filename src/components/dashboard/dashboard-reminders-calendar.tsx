"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Flag,
  Plus,
  X
} from "lucide-react";

type ReminderPreset = "1h" | "2h" | "tonight" | "tomorrow_morning" | "custom";

export type DashboardReminder = {
  id: string;
  date: string;
  title: string;
  preset: ReminderPreset;
  time?: string;
  urgent: boolean;
};

const reminderPresets: Array<{ value: ReminderPreset; label: string }> = [
  { value: "1h", label: "Em uma hora" },
  { value: "2h", label: "Em duas horas" },
  { value: "tonight", label: "Hoje de noite" },
  { value: "tomorrow_morning", label: "Amanha de manha" },
  { value: "custom", label: "Personalizado" }
];

const calendarFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric"
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short"
});

const STORAGE_KEY = "leadhealth-dashboard-reminders";

export function DashboardRemindersCalendar() {
  const [currentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reminders, setReminders] = useState<DashboardReminder[]>([]);
  const [title, setTitle] = useState("");
  const [preset, setPreset] = useState<ReminderPreset>("1h");
  const [customTime, setCustomTime] = useState("13:00");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);

      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(storedValue) as DashboardReminder[];
      setReminders(Array.isArray(parsedValue) ? parsedValue : []);
    } catch {
      setReminders([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDate]);

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const remindersForSelectedDate = reminders.filter((reminder) => reminder.date === selectedDate);

  function openDate(date: string) {
    setSelectedDate(date);
    setTitle("");
    setPreset("1h");
    setCustomTime("13:00");
    setUrgent(false);
  }

  function closeModal() {
    setSelectedDate(null);
  }

  function saveReminder() {
    if (!selectedDate || !title.trim()) {
      return;
    }

    setReminders((currentReminders) => [
      {
        id: crypto.randomUUID(),
        date: selectedDate,
        title: title.trim(),
        preset,
        time: preset === "custom" ? customTime : undefined,
        urgent
      },
      ...currentReminders
    ]);

    setTitle("");
    setPreset("1h");
    setCustomTime("13:00");
    setUrgent(false);
  }

  function removeReminder(reminderId: string) {
    setReminders((currentReminders) =>
      currentReminders.filter((reminder) => reminder.id !== reminderId)
    );
  }

  return (
    <>
      <section className="glass rounded-[34px] p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <button className="min-w-0 text-left" onClick={() => openDate(toDateKey(new Date()))} type="button">
            <h2 className="font-semibold">Agenda da equipe</h2>
            <p className="mt-1 text-sm text-ink/54">
              Clique em uma data para criar lembretes rapidos da operacao.
            </p>
          </button>
          <CalendarDays size={20} aria-hidden="true" />
        </div>

        <div className="mb-6 flex items-center justify-center border-y border-ink/5 py-3">
          <p className="text-sm font-bold uppercase tracking-widest text-cobalt">
            {calendarFormatter.format(currentMonth)}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.weekdays.map((weekday) => (
            <span
              className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-ink/30"
              key={weekday}
            >
              {weekday}
            </span>
          ))}

          {calendarDays.days.map((day, index) => {
            const dayKey = toDateKey(day.date);
            const dayReminders = reminders.filter((reminder) => reminder.date === dayKey);
            const isCurrentMonth = day.inCurrentMonth;
            const isToday = dayKey === toDateKey(new Date());

            if (!isCurrentMonth) {
              return <div key={`empty-${index}`} className="h-full w-full" />;
            }

            return (
              <button
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition-all duration-200 ${
                  isToday
                    ? "border-cobalt/40 bg-cobalt/5 text-cobalt shadow-sm"
                    : "border-white/40 bg-white/30 hover:border-cobalt/20 hover:bg-white/50"
                }`}
                key={dayKey}
                onClick={() => openDate(dayKey)}
                type="button"
              >
                <span className={`text-sm font-semibold ${isToday ? "text-cobalt" : "text-ink/80"}`}>
                  {day.date.getDate()}
                </span>
                
                {dayReminders.length > 0 && (
                  <div className="absolute bottom-2 flex gap-0.5">
                    {dayReminders.slice(0, 3).map((_, i) => (
                      <span key={i} className="h-1 w-1 rounded-full bg-cobalt" />
                    ))}
                    {dayReminders.length > 3 && (
                      <span className="h-1 w-1 rounded-full bg-cobalt/40" />
                    )}
                  </div>
                )}

                {isToday && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-cobalt shadow-[0_0_8px_rgba(79,70,229,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {selectedDate ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-ink/42 px-3 py-4 backdrop-blur-md sm:items-center sm:px-5"
          onClick={closeModal}
          role="dialog"
        >
          <section
            className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/70 bg-cloud/95 p-4 shadow-glass sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-5">
              <div>
                <p className="text-sm font-medium text-cobalt">Lembretes</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {formatSelectedDate(selectedDate)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Sobre o que voce quer ser lembrado
                </p>
              </div>
              <button className="icon-button shrink-0" onClick={closeModal} type="button" title="Fechar">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="pt-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink/72">Titulo</span>
                <textarea
                  className="liquid-input min-h-[110px] resize-y"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Ligar para Joao"
                  value={title}
                />
              </label>

              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink/72">
                    Quando voce quer ser lembrado
                  </span>
                  <select
                    className="liquid-input"
                    onChange={(event) => setPreset(event.target.value as ReminderPreset)}
                    value={preset}
                  >
                    {reminderPresets.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {preset === "custom" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink/72">Horario</span>
                    <input
                      className="liquid-input"
                      onChange={(event) => setCustomTime(event.target.value)}
                      type="time"
                      value={customTime}
                    />
                  </label>
                ) : null}
              </div>

              <label className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/62 px-4 py-3 text-sm font-semibold text-ink">
                <input
                  checked={urgent}
                  className="h-4 w-4 accent-cobalt"
                  onChange={(event) => setUrgent(event.target.checked)}
                  type="checkbox"
                />
                <Flag size={16} aria-hidden="true" />
                Marcar como urgente
              </label>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
                  disabled={!title.trim()}
                  onClick={saveReminder}
                  type="button"
                >
                  <Plus size={18} aria-hidden="true" />
                  Salvar lembrete
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <Clock3 size={16} aria-hidden="true" />
                  <p className="text-sm font-semibold text-ink/74">Lembretes desta data</p>
                </div>

                <div className="mt-3 space-y-3">
                  {remindersForSelectedDate.length ? (
                    remindersForSelectedDate.map((reminder) => (
                      <article className="rounded-[24px] bg-white/56 p-4" key={reminder.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{reminder.title}</p>
                            <p className="mt-1 text-sm text-ink/58">
                              {formatReminderMoment(reminder)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {reminder.urgent ? (
                              <span className="rounded-full bg-signal px-3 py-1 text-xs font-semibold text-ink">
                                Urgente
                              </span>
                            ) : null}
                            <button
                              className="icon-button"
                              onClick={() => removeReminder(reminder.id)}
                              type="button"
                              title="Remover lembrete"
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[24px] bg-white/50 p-4 text-sm leading-6 text-ink/58">
                      Nenhum lembrete salvo para esta data ainda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function buildCalendarDays(currentMonth: Date) {
  const firstDay = startOfMonth(currentMonth);
  const startWeekday = firstDay.getDay();
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startWeekday);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      inCurrentMonth: date.getMonth() === currentMonth.getMonth()
    };
  });

  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, index + 7);
    return weekdayFormatter.format(date).replace(".", "");
  });

  return { days, weekdays };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSelectedDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatReminderMoment(reminder: DashboardReminder) {
  const presetLabels: Record<ReminderPreset, string> = {
    "1h": "Em uma hora",
    "2h": "Em duas horas",
    tonight: "Hoje de noite",
    tomorrow_morning: "Amanha de manha",
    custom: reminder.time ? `as ${reminder.time}` : "Personalizado"
  };

  return presetLabels[reminder.preset];
}
