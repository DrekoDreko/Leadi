import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";
import {
  deactivateTeamForCurrentUser,
  TeamAccessError,
  updateTeamForCurrentUser
} from "@/lib/workspaces/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

vi.mock("@/lib/workspaces/team", async () => {
  const actual = await vi.importActual<typeof import("@/lib/workspaces/team")>(
    "@/lib/workspaces/team"
  );

  return {
    ...actual,
    deactivateTeamForCurrentUser: vi.fn(),
    updateTeamForCurrentUser: vi.fn()
  };
});

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn()
}));

vi.mock("@/lib/api/route-security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/route-security")>(
    "@/lib/api/route-security"
  );

  return {
    ...actual,
    assertRouteRateLimit: vi.fn().mockResolvedValue(undefined),
    assertSameOrigin: vi.fn(),
    assertServerAuth: vi.fn().mockResolvedValue(null)
  };
});

describe("Teams API - /api/teams/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("edita equipe com sucesso para owner", async () => {
    const updatedTeam = {
      id: "team-1",
      organizationId: "org-1",
      name: "Equipe Premium",
      createdByProfileId: "profile-1",
      isActive: true,
      createdAt: "2026-05-29T21:00:00.000Z",
      updatedAt: "2026-05-29T21:10:00.000Z"
    };

    vi.mocked(updateTeamForCurrentUser).mockResolvedValue(updatedTeam);

    const response = await PATCH(
      new Request("http://localhost:3000/api/teams/team-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Equipe Premium" })
      }),
      { params: Promise.resolve({ id: "team-1" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      team: updatedTeam,
      mode: "supabase"
    });
    expect(updateTeamForCurrentUser).toHaveBeenCalledWith("team-1", {
      name: "Equipe Premium"
    });
  });

  it("retorna 403 quando admin ou seller tenta editar equipe", async () => {
    vi.mocked(updateTeamForCurrentUser).mockRejectedValue(
      new TeamAccessError(403, "Somente owners podem gerenciar equipes.")
    );

    const response = await PATCH(
      new Request("http://localhost:3000/api/teams/team-1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Equipe Premium" })
      }),
      { params: Promise.resolve({ id: "team-1" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Somente o gestor pode editar equipes.");
  });

  it("desativa equipe com sucesso para owner", async () => {
    const deactivatedTeam = {
      id: "team-1",
      organizationId: "org-1",
      name: "Equipe Premium",
      createdByProfileId: "profile-1",
      isActive: false,
      createdAt: "2026-05-29T21:00:00.000Z",
      updatedAt: "2026-05-29T21:12:00.000Z"
    };

    vi.mocked(deactivateTeamForCurrentUser).mockResolvedValue(deactivatedTeam);

    const response = await DELETE(
      new Request("http://localhost:3000/api/teams/team-1", {
        method: "DELETE"
      }),
      { params: Promise.resolve({ id: "team-1" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ok: true,
      team: deactivatedTeam,
      mode: "supabase"
    });
    expect(deactivateTeamForCurrentUser).toHaveBeenCalledWith("team-1");
  });

  it("retorna 404 quando equipe nao existe", async () => {
    vi.mocked(deactivateTeamForCurrentUser).mockRejectedValue(
      new TeamAccessError(404, "Equipe nao encontrada.")
    );

    const response = await DELETE(
      new Request("http://localhost:3000/api/teams/team-inexistente", {
        method: "DELETE"
      }),
      { params: Promise.resolve({ id: "team-inexistente" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Equipe nao encontrada.");
  });
});
