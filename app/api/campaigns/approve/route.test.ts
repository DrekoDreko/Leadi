import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { updateCampaignApprovalStatus } from "@/lib/campaigns/repository.server";
import { getBillingAuthContext } from "@/lib/billing/auth.server";
import { parseJsonBody } from "@/lib/api/route-security";

vi.mock("@/lib/api/route-security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/route-security")>("@/lib/api/route-security");
  return {
    ...actual,
    assertRouteRateLimit: vi.fn(),
    assertSameOrigin: vi.fn(),
    parseJsonBody: vi.fn(),
    logApiError: vi.fn()
  };
});

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn().mockReturnValue(true)
}));

vi.mock("@/lib/billing/auth.server", () => ({
  getBillingAuthContext: vi.fn()
}));

vi.mock("@/lib/campaigns/repository.server", () => ({
  updateCampaignApprovalStatus: vi.fn()
}));

describe("Campaigns Approve API - /api/campaigns/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("deve aprovar campanha com sucesso quando for Gestor (owner)", async () => {
      vi.mocked(getBillingAuthContext).mockResolvedValueOnce({
        role: "owner"
      } as any);
      vi.mocked(parseJsonBody).mockResolvedValueOnce({
        campaignId: "camp-1",
        approvalStatus: "approved"
      });
      vi.mocked(updateCampaignApprovalStatus).mockResolvedValueOnce({ id: "camp-1", status: "approved" } as any);

      const request = new Request("http://localhost:3000/api/campaigns/approve", {
        method: "POST"
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.campaign.id).toBe("camp-1");
    });

    it("deve retornar 403 quando Supervisor (admin) tentar aprovar", async () => {
      vi.mocked(getBillingAuthContext).mockResolvedValueOnce({
        role: "admin"
      } as any);

      const request = new Request("http://localhost:3000/api/campaigns/approve", {
        method: "POST"
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Apenas o gestor (owner) pode aprovar campanhas.");
    });

    it("deve retornar 403 quando Consultor (seller) tentar aprovar", async () => {
      vi.mocked(getBillingAuthContext).mockResolvedValueOnce({
        role: "seller"
      } as any);

      const request = new Request("http://localhost:3000/api/campaigns/approve", {
        method: "POST"
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it("deve retornar 401 se não estiver autenticado", async () => {
      vi.mocked(getBillingAuthContext).mockResolvedValueOnce(null);

      const request = new Request("http://localhost:3000/api/campaigns/approve", {
        method: "POST"
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });
});
