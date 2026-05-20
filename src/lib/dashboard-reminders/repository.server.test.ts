import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDashboardReminderForCurrentUser,
  getDashboardRemindersForCurrentUser,
  resolveDashboardReminderInput
} from "./repository.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
  hasSupabaseServiceRole: vi.fn()
}));

describe("dashboard reminders repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasSupabaseServiceRole).mockReturnValue(false);
  });

  it("resolve horario manual invalido", () => {
    expect(() =>
      resolveDashboardReminderInput({
        date: "2026-05-20",
        message: "Lembrete",
        time24h: "99:30",
        timezoneOffsetMinutes: 0,
        clientNowIso: "2026-05-13T10:00:00.000Z"
      })
    ).toThrow("Informe um horario valido no formato 24 horas.");
  });

  it("bloqueia horario passado para hoje", () => {
    expect(() =>
      resolveDashboardReminderInput({
        date: "2026-05-13",
        message: "Lembrete",
        time24h: "09:30",
        timezoneOffsetMinutes: 0,
        clientNowIso: "2026-05-13T10:00:00.000Z"
      })
    ).toThrow("Escolha um horario futuro para o lembrete de hoje.");
  });

  it("resolve lembrete com atalho rapido", () => {
    const resolved = resolveDashboardReminderInput({
      date: "2026-05-13",
      message: "Ligar para cliente",
      preset: "one_hour",
      timezoneOffsetMinutes: 0,
      clientNowIso: "2026-05-13T10:00:00.000Z"
    });

    expect(resolved).toEqual({
      date: "2026-05-13",
      message: "Ligar para cliente",
      remindAtIso: "2026-05-13T11:00:00.000Z"
    });
  });

  it("filtra leitura por organization_id", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);

    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const lte = vi.fn(() => ({ order }));
    const gte = vi.fn(() => ({ lte }));
    const eqReminders = vi.fn(() => ({ gte }));
    const selectReminders = vi.fn(() => ({ eq: eqReminders }));

    const maybeSingleProfile = vi.fn().mockResolvedValue({
      data: {
        id: "profile-1",
        organization_id: "org-1"
      },
      error: null
    });
    const eqProfile = vi.fn(() => ({ maybeSingle: maybeSingleProfile }));
    const selectProfile = vi.fn(() => ({ eq: eqProfile }));

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: "auth-1" }
          }
        })
      },
      from: vi.fn((table: string) =>
        table === "profiles" ? { select: selectProfile } : { select: selectReminders }
      )
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await getDashboardRemindersForCurrentUser(new Date("2026-05-13T10:00:00.000Z"));

    expect(eqReminders).toHaveBeenCalledWith("organization_id", "org-1");
  });

  it("salva lembrete usando o organization_id do perfil atual", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);

    const insertedRows: Array<Record<string, unknown>> = [];
    const singleInsert = vi.fn().mockResolvedValue({
      data: {
        id: "reminder-1",
        organization_id: "org-1",
        created_by_profile_id: "profile-1",
        reminder_date: "2026-05-20",
        remind_at: "2026-05-20T09:30:00.000Z",
        message: "Revisar design",
        created_at: "2026-05-13T10:00:00.000Z",
        updated_at: "2026-05-13T10:00:00.000Z"
      },
      error: null
    });
    const selectInsert = vi.fn(() => ({ single: singleInsert }));
    const insertReminders = vi.fn((payload: Record<string, unknown>) => {
      insertedRows.push(payload);
      return { select: selectInsert };
    });

    const maybeSingleProfile = vi.fn().mockResolvedValue({
      data: {
        id: "profile-1",
        organization_id: "org-1"
      },
      error: null
    });
    const eqProfile = vi.fn(() => ({ maybeSingle: maybeSingleProfile }));
    const selectProfile = vi.fn(() => ({ eq: eqProfile }));

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: "auth-1" }
          }
        })
      },
      from: vi.fn((table: string) =>
        table === "profiles" ? { select: selectProfile } : { insert: insertReminders }
      )
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    await createDashboardReminderForCurrentUser({
      date: "2026-05-20",
      message: "Revisar design",
      time24h: "09:30",
      timezoneOffsetMinutes: 0,
      clientNowIso: "2026-05-13T10:00:00.000Z"
    });

    expect(insertedRows[0]).toMatchObject({
      organization_id: "org-1",
      created_by_profile_id: "profile-1",
      reminder_date: "2026-05-20",
      message: "Revisar design"
    });
  });

  it("usa o cliente admin como fallback quando a leitura do perfil falha", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(hasSupabaseServiceRole).mockReturnValue(true);

    const fallbackProfile = {
      id: "profile-1",
      organization_id: "org-1",
      auth_user_id: "auth-1",
      full_name: "Fallback User",
      email: "fallback@example.com",
      role: "owner",
      profile_setup_completed: true
    };

    const regularSingleProfile = vi.fn().mockResolvedValue({
      data: null,
      error: null
    });
    const regularEqProfile = vi.fn(() => ({ maybeSingle: regularSingleProfile }));
    const regularSelectProfile = vi.fn(() => ({ eq: regularEqProfile }));

    const adminSingleProfile = vi.fn().mockResolvedValue({
      data: fallbackProfile,
      error: null
    });
    const adminEqProfile = vi.fn(() => ({ maybeSingle: adminSingleProfile }));
    const adminSelectProfile = vi.fn(() => ({ eq: adminEqProfile }));

    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        id: "reminder-1",
        organization_id: "org-1",
        created_by_profile_id: "profile-1",
        reminder_date: "2026-05-20",
        remind_at: "2026-05-20T09:30:00.000Z",
        message: "Revisar design",
        created_at: "2026-05-13T10:00:00.000Z",
        updated_at: "2026-05-13T10:00:00.000Z"
      },
      error: null
    });
    const insertReminders = vi.fn(() => ({ select: () => ({ single: insertSingle }) }));

    const regularSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-1" } }
        })
      },
      from: vi.fn((table: string) =>
        table === "profiles" ? { select: regularSelectProfile } : { insert: insertReminders }
      )
    };

    const adminSupabase = {
      from: vi.fn((table: string) =>
        table === "profiles" ? { select: adminSelectProfile } : { insert: insertReminders }
      )
    };

    vi.mocked(createSupabaseServerClient).mockResolvedValue(regularSupabase as never);
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminSupabase as never);

    await createDashboardReminderForCurrentUser({
      date: "2026-05-20",
      message: "Revisar design",
      time24h: "09:30",
      timezoneOffsetMinutes: 0,
      clientNowIso: "2026-05-13T10:00:00.000Z"
    });

    expect(createSupabaseAdminClient).toHaveBeenCalled();
    expect(adminEqProfile).toHaveBeenCalledWith("auth_user_id", "auth-1");
  });
});
