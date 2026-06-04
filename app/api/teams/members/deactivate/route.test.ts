import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import {
  reviewMemberDeactivationRequestForCurrentUser,
  startMemberDeactivationForCurrentUser,
  TeamAccessError
} from "@/lib/workspaces/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

vi.mock("@/lib/workspaces/team", async () => {
  const actual = await vi.importActual<typeof import("@/lib/workspaces/team")>(
    "@/lib/workspaces/team"
  );

  return {
    ...actual,
    reviewMemberDeactivationRequestForCurrentUser: vi.fn(),
    startMemberDeactivationForCurrentUser: vi.fn()
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

describe("Team member deactivation API - /api/teams/members/deactivate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("cria solicitacao de desativacao para supervisor", async () => {
    const result = {
      outcome: "requested" as const,
      targetProfileId: "seller-1",
      closedRequestIds: [],
      request: {
        id: "request-1",
        status: "pending" as const,
        teamId: "team-1",
        teamName: "Equipe Sul",
        requestedByProfileId: "admin-1",
        requestedByName: "Supervisor Sul",
        targetProfileId: "seller-1",
        targetName: "Consultor Sul",
        targetEmail: "consultor@leadi.example",
        targetRole: "seller" as const,
        title: "Desativar Consultor Sul",
        description: "Solicitacao de desativacao enviada ao gestor.",
        createdAt: "2026-05-29T22:30:00.000Z",
        reviewedAt: null
      }
    };

    vi.mocked(startMemberDeactivationForCurrentUser).mockResolvedValue(result);

    const response = await POST(
      new Request("http://localhost:3000/api/teams/members/deactivate", {
        method: "POST",
        body: JSON.stringify({
          targetProfileId: "seller-1"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      result,
      mode: "supabase"
    });
    expect(startMemberDeactivationForCurrentUser).toHaveBeenCalledWith("seller-1");
  });

  it("aprova solicitacao de desativacao para gestor", async () => {
    const result = {
      outcome: "approved" as const,
      targetProfileId: "seller-1",
      closedRequestIds: ["request-1"],
      request: {
        id: "request-1",
        status: "approved" as const,
        teamId: "team-1",
        teamName: "Equipe Sul",
        requestedByProfileId: "admin-1",
        requestedByName: "Supervisor Sul",
        targetProfileId: "seller-1",
        targetName: "Consultor Sul",
        targetEmail: "consultor@leadi.example",
        targetRole: "seller" as const,
        title: "Desativar Consultor Sul",
        description: "Solicitacao de desativacao enviada ao gestor.",
        createdAt: "2026-05-29T22:30:00.000Z",
        reviewedAt: "2026-05-29T22:31:00.000Z"
      }
    };

    vi.mocked(reviewMemberDeactivationRequestForCurrentUser).mockResolvedValue(result);

    const response = await POST(
      new Request("http://localhost:3000/api/teams/members/deactivate", {
        method: "POST",
        body: JSON.stringify({
          requestId: "request-1",
          decision: "approved"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      result,
      mode: "supabase"
    });
    expect(reviewMemberDeactivationRequestForCurrentUser).toHaveBeenCalledWith(
      "request-1",
      "approved"
    );
  });

  it("retorna 403 quando supervisor tenta revisar a solicitacao", async () => {
    vi.mocked(reviewMemberDeactivationRequestForCurrentUser).mockRejectedValue(
      new TeamAccessError(403, "Somente owners podem aprovar desativacoes.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/teams/members/deactivate", {
        method: "POST",
        body: JSON.stringify({
          requestId: "request-1",
          decision: "rejected"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Somente o gestor pode aprovar ou rejeitar desativacoes.");
  });
});
