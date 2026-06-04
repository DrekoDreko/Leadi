import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { createCreditRequest, listCreditRequests } from "@/lib/ai/credit-requests.server";
import { parseJsonBody } from "@/lib/api/route-security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/api/route-security", () => ({
  assertRouteRateLimit: vi.fn(),
  assertSameOrigin: vi.fn(),
  assertServerAuth: vi.fn(),
  parseJsonBody: vi.fn()
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: vi.fn().mockReturnValue(true)
}));

vi.mock("@/lib/ai/credit-requests.server", () => ({
  createCreditRequest: vi.fn(),
  listCreditRequests: vi.fn()
}));

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom
  }))
}));

describe("Credit Requests API - /api/credits/requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({ data: { id: "profile-1", organization_id: "org-1" } });
  });

  describe("GET", () => {
    it("deve listar requests com sucesso", async () => {
      vi.mocked(listCreditRequests).mockResolvedValueOnce([]);

      const request = new Request("http://localhost:3000/api/credits/requests");
      const response = await GET(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it("deve retornar 403 se o usuário não tiver perfil", async () => {
      mockSingle.mockResolvedValueOnce({ data: null });

      const request = new Request("http://localhost:3000/api/credits/requests");
      const response = await GET(request);
      expect(response.status).toBe(403);
    });

    it("deve repassar erro 403 quando não houver permissão (lançado pelo service)", async () => {
      vi.mocked(listCreditRequests).mockRejectedValueOnce(new Error("Sem permissão para listar"));

      const request = new Request("http://localhost:3000/api/credits/requests");
      const response = await GET(request);
      const data = await response.json();

      // Ajuste para 403 se a rota mapear corretamente ou 500 se fallback
      expect(response.status).toBe(403);
    });
  });

  describe("POST", () => {
    it("deve criar um request com sucesso", async () => {
      vi.mocked(parseJsonBody).mockResolvedValueOnce({
        requestType: "team",
        amountRequested: 100,
        reason: "Need credits"
      });
      vi.mocked(createCreditRequest).mockResolvedValueOnce({ id: "req-1" } as any);

      const request = new Request("http://localhost:3000/api/credits/requests", {
        method: "POST"
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBe("req-1");
    });

    it("deve retornar 403 quando um seller tenta criar um request e o serviço recusa", async () => {
      vi.mocked(parseJsonBody).mockResolvedValueOnce({
        requestType: "team",
        amountRequested: 100,
        reason: "Need credits"
      });
      vi.mocked(createCreditRequest).mockRejectedValueOnce(new Error("Sem permissão para solicitar créditos."));

      const request = new Request("http://localhost:3000/api/credits/requests", {
        method: "POST"
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Sem permissão para solicitar créditos.");
    });
  });
});
