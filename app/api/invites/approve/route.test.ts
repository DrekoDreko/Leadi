import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import {
  reviewInviteForCurrentUser,
  TeamAccessError
} from "@/lib/workspaces/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

vi.mock("@/lib/workspaces/team", async () => {
  const actual = await vi.importActual<typeof import("@/lib/workspaces/team")>(
    "@/lib/workspaces/team"
  );

  return {
    ...actual,
    reviewInviteForCurrentUser: vi.fn()
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

describe("Invites approval API - /api/invites/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("aprova convite pendente com sucesso para gestor", async () => {
    const invite = {
      id: "invite-1",
      token: "token-1",
      teamId: null,
      teamName: null,
      invitePath: "/invite/token-1",
      roleToAssign: "seller" as const,
      status: "active" as const,
      requiresApproval: true,
      approvalStatus: "approved" as const,
      approvedByUserId: "owner-1",
      invitedEmail: null,
      createdAt: "2026-05-29T22:00:00.000Z",
      expiresAt: "2026-06-28T22:00:00.000Z"
    };

    vi.mocked(reviewInviteForCurrentUser).mockResolvedValue(invite);

    const response = await POST(
      new Request("http://localhost:3000/api/invites/approve", {
        method: "POST",
        body: JSON.stringify({
          inviteId: "invite-1",
          decision: "approved"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      invite,
      mode: "supabase"
    });
    expect(reviewInviteForCurrentUser).toHaveBeenCalledWith("invite-1", "approved");
  });

  it("retorna 403 quando supervisor tenta revisar convite", async () => {
    vi.mocked(reviewInviteForCurrentUser).mockRejectedValue(
      new TeamAccessError(403, "Somente owners podem aprovar convites.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/invites/approve", {
        method: "POST",
        body: JSON.stringify({
          inviteId: "invite-1",
          decision: "approved"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Somente o gestor pode aprovar ou rejeitar convites.");
  });

  it("retorna 400 para convite ja expirado", async () => {
    vi.mocked(reviewInviteForCurrentUser).mockRejectedValue(
      new TeamAccessError(400, "Este convite ja expirou.")
    );

    const response = await POST(
      new Request("http://localhost:3000/api/invites/approve", {
        method: "POST",
        body: JSON.stringify({
          inviteId: "invite-1",
          decision: "rejected"
        })
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Este convite ja expirou.");
  });
});
