import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import {
  createTeamForCurrentUser,
  listTeamsForCurrentUser,
  TeamAccessError
} from "@/lib/workspaces/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

vi.mock("@/lib/workspaces/team", async () => {
  const actual = await vi.importActual<typeof import("@/lib/workspaces/team")>(
    "@/lib/workspaces/team"
  );

  return {
    ...actual,
    createTeamForCurrentUser: vi.fn(),
    listTeamsForCurrentUser: vi.fn()
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

describe("Teams API - /api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("lista equipes com sucesso para owner", async () => {
    const teams = [
      {
        id: "team-1",
        organizationId: "org-1",
        name: "Equipe Comercial",
        createdByProfileId: "profile-1",
        isActive: true,
        createdAt: "2026-05-29T21:00:00.000Z",
        updatedAt: "2026-05-29T21:00:00.000Z"
      }
    ];

    vi.mocked(listTeamsForCurrentUser).mockResolvedValue(teams);

    const response = await GET(new Request("http://localhost:3000/api/teams"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      teams,
      mode: "supabase"
    });
  });

  it("retorna 403 quando usuario sem permissao tenta listar equipes", async () => {
    vi.mocked(listTeamsForCurrentUser).mockRejectedValue(
      new TeamAccessError(403, "Somente owners podem gerenciar equipes.")
    );

    const response = await GET(new Request("http://localhost:3000/api/teams"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Somente o gestor pode gerenciar equipes.");
  });

  it("cria equipe com sucesso para owner", async () => {
    const createdTeam = {
      id: "team-2",
      organizationId: "org-1",
      name: "Equipe Sul",
      createdByProfileId: "profile-1",
      isActive: true,
      createdAt: "2026-05-29T21:05:00.000Z",
      updatedAt: "2026-05-29T21:05:00.000Z"
    };

    vi.mocked(createTeamForCurrentUser).mockResolvedValue(createdTeam);

    const response = await POST(
      new Request("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: "Equipe Sul" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      team: createdTeam,
      mode: "supabase"
    });
    expect(createTeamForCurrentUser).toHaveBeenCalledWith({
      name: "Equipe Sul"
    });
  });

  it("retorna 403 quando admin ou seller tenta criar equipe", async () => {
    vi.mocked(createTeamForCurrentUser).mockRejectedValue(
      new TeamAccessError(403, "Somente owners podem gerenciar equipes.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: "Equipe Norte" })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Somente o gestor pode criar equipes.");
  });
});
