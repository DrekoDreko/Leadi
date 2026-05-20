import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  DashboardReminderCreateInput,
  DashboardReminderItem,
  DashboardReminderListState,
  DashboardReminderPreset
} from "./types";

type DashboardReminderRow = Database["public"]["Tables"]["dashboard_reminders"]["Row"];
type DashboardReminderInsert = Database["public"]["Tables"]["dashboard_reminders"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const time24hPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const mockReminderSeed: DashboardReminderItem[] = [
  {
    id: "mock-reminder-1",
    reminderDate: "2026-05-14",
    remindAt: "2026-05-14T12:00:00.000Z",
    message: "Revisar oferta da campanha PME antes de publicar.",
    createdAt: "2026-05-13T12:00:00.000Z",
    updatedAt: "2026-05-13T12:00:00.000Z"
  }
];

const presetHours: Record<Extract<DashboardReminderPreset, "this_afternoon" | "this_evening">, string> = {
  this_afternoon: "15:00",
  this_evening: "20:00"
};

const mockReminders = getMockDashboardReminderStore();

function getMockDashboardReminderStore() {
  const globalScope = globalThis as typeof globalThis & {
    __leadHealthDashboardRemindersMock?: DashboardReminderItem[];
  };

  if (!globalScope.__leadHealthDashboardRemindersMock) {
    globalScope.__leadHealthDashboardRemindersMock = structuredClone(mockReminderSeed);
  }

  return globalScope.__leadHealthDashboardRemindersMock;
}

export async function getDashboardRemindersForCurrentUser(referenceDate = new Date()): Promise<DashboardReminderListState> {
  const { monthStart, monthEnd } = getMonthBounds(referenceDate);

  if (!isSupabaseConfigured()) {
    return {
      reminders: mockReminders.filter(
        (item) => item.reminderDate >= monthStart && item.reminderDate <= monthEnd
      ),
      mode: "not-configured",
      message: "Supabase ainda nao configurado. Exibindo lembretes demonstrativos."
    };
  }

  try {
    const profile = await getCurrentProfile();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("dashboard_reminders")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .gte("reminder_date", monthStart)
      .lte("reminder_date", monthEnd)
      .order("remind_at", { ascending: true });

    if (error) {
      return {
        reminders: [],
        mode: "error",
        message: "Nao foi possivel carregar os lembretes do calendario."
      };
    }

    return {
      reminders: (data ?? []).map(mapDashboardReminderRowToItem),
      mode: "supabase"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    return {
      reminders: [],
      mode: message.includes("Usuario nao autenticado") ? "unauthenticated" : "error",
      message:
        message.includes("Usuario nao autenticado")
          ? "Usuario nao autenticado."
          : "Nao foi possivel carregar os lembretes do calendario."
    };
  }
}

export async function createDashboardReminderForCurrentUser(
  input: DashboardReminderCreateInput
): Promise<DashboardReminderItem> {
  const resolvedInput = resolveDashboardReminderInput(input);

  if (!isSupabaseConfigured()) {
    return createMockDashboardReminder(resolvedInput);
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const payload = buildDashboardReminderInsert(profile, resolvedInput);
  const { data, error } = await supabase
    .from("dashboard_reminders")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      throw new Error("A tabela de lembretes ainda nao foi criada no banco de dados.");
    }
    throw new Error(error.message);
  }

  return mapDashboardReminderRowToItem(data);
}

export function resolveDashboardReminderInput(input: DashboardReminderCreateInput) {
  const date = normalizeDate(input.date);
  const message = normalizeMessage(input.message);
  const time24h = normalizeOptionalTime24h(input.time24h);
  const preset = normalizeOptionalPreset(input.preset);
  const timezoneOffsetMinutes = normalizeTimezoneOffsetMinutes(input.timezoneOffsetMinutes);
  const clientNow = normalizeClientNow(input.clientNowIso);
  const today = formatDateForOffset(clientNow, timezoneOffsetMinutes);
  const isToday = date === today;

  if (!isToday && !time24h) {
    throw new Error("Informe um horario em 24 horas para lembretes em outros dias.");
  }

  if (time24h) {
    const remindAt = buildLocalDateIso(date, time24h, timezoneOffsetMinutes);

    if (isToday && remindAt.getTime() <= clientNow.getTime()) {
      throw new Error("Escolha um horario futuro para o lembrete de hoje.");
    }

    return {
      date,
      message,
      remindAtIso: remindAt.toISOString()
    };
  }

  if (!preset || preset === "custom") {
    throw new Error("Escolha quando voce quer ser lembrado.");
  }

  if (!isToday) {
    throw new Error("Use um horario manual para lembretes em outros dias.");
  }

  const remindAt = resolvePresetReminderDate({ clientNow, preset, timezoneOffsetMinutes });

  if (formatDateForOffset(remindAt, timezoneOffsetMinutes) !== date) {
    throw new Error("Escolha um horario manual para este lembrete.");
  }

  return {
    date,
    message,
    remindAtIso: remindAt.toISOString()
  };
}

function resolvePresetReminderDate(input: {
  clientNow: Date;
  preset: DashboardReminderPreset;
  timezoneOffsetMinutes: number;
}) {
  if (input.preset === "one_hour") {
    return new Date(input.clientNow.getTime() + 60 * 60 * 1000);
  }

  if (input.preset === "two_hours") {
    return new Date(input.clientNow.getTime() + 2 * 60 * 60 * 1000);
  }

  const hourString = presetHours[input.preset as keyof typeof presetHours];

  if (!hourString) {
    throw new Error("Escolha uma opcao valida para o lembrete.");
  }

  return buildLocalDateIso(
    formatDateForOffset(input.clientNow, input.timezoneOffsetMinutes),
    hourString,
    input.timezoneOffsetMinutes
  );
}

function buildDashboardReminderInsert(
  profile: ProfileRow,
  input: ReturnType<typeof resolveDashboardReminderInput>
): DashboardReminderInsert {
  return {
    organization_id: profile.organization_id,
    created_by_profile_id: profile.id,
    reminder_date: input.date,
    remind_at: input.remindAtIso,
    message: input.message
  };
}

function createMockDashboardReminder(
  input: ReturnType<typeof resolveDashboardReminderInput>
): DashboardReminderItem {
  const now = new Date().toISOString();
  const reminder: DashboardReminderItem = {
    id: `mock-dashboard-reminder-${crypto.randomUUID()}`,
    reminderDate: input.date,
    remindAt: input.remindAtIso,
    message: input.message,
    createdAt: now,
    updatedAt: now
  };

  mockReminders.unshift(reminder);

  return reminder;
}

function mapDashboardReminderRowToItem(row: DashboardReminderRow): DashboardReminderItem {
  return {
    id: row.id,
    reminderDate: row.reminder_date,
    remindAt: row.remind_at,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  const profile = await fetchCurrentProfile(supabase, user.id);

  if (profile) {
    return profile;
  }

  if (hasSupabaseServiceRole()) {
    const adminSupabase = createSupabaseAdminClient();
    const adminProfile = await fetchCurrentProfile(adminSupabase, user.id);

    if (adminProfile) {
      return adminProfile;
    }
  }

  throw new Error("Perfil nao encontrado.");
}

async function fetchCurrentProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | ReturnType<typeof createSupabaseAdminClient>,
  authUserId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    return null;
  }

  if (!profile) {
    return null;
  }

  if (!profile.organization_id) {
    throw new Error("Seu perfil nao esta vinculado a uma organizacao.");
  }

  return profile;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Informe uma data valida para o lembrete.");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Informe uma data valida para o lembrete.");
  }

  return value;
}

function normalizeMessage(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Informe do que voce quer ser lembrado.");
  }

  return value.trim();
}

function normalizeOptionalTime24h(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value !== "string" || !time24hPattern.test(value)) {
    throw new Error("Informe um horario valido no formato 24 horas.");
  }

  return value;
}

function normalizeOptionalPreset(value: unknown): DashboardReminderPreset | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (
    value === "one_hour" ||
    value === "two_hours" ||
    value === "this_afternoon" ||
    value === "this_evening"
  ) {
    return value;
  }

  throw new Error("Escolha uma opcao valida para o lembrete.");
}

function normalizeTimezoneOffsetMinutes(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Nao foi possivel identificar o horario local do navegador.");
  }

  return value;
}

function normalizeClientNow(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Nao foi possivel identificar o horario atual do navegador.");
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Nao foi possivel identificar o horario atual do navegador.");
  }

  return parsed;
}

function buildLocalDateIso(date: string, time24h: string, timezoneOffsetMinutes: number) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time24h.split(":").map(Number);
  const utcTime =
    Date.UTC(year, month - 1, day, hours, minutes, 0, 0) + timezoneOffsetMinutes * 60 * 1000;

  return new Date(utcTime);
}

function formatDateForOffset(date: Date, timezoneOffsetMinutes: number) {
  const localTime = new Date(date.getTime() - timezoneOffsetMinutes * 60 * 1000);

  return localTime.toISOString().slice(0, 10);
}

function getMonthBounds(referenceDate: Date) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

  return {
    monthStart: monthStart.toISOString().slice(0, 10),
    monthEnd: monthEnd.toISOString().slice(0, 10)
  };
}
