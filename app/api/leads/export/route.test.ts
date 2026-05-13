import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getLeadExportRowsForCurrentUser } from "@/lib/leads/repository.server";

vi.mock("@/lib/leads/repository.server", () => ({
  getLeadExportRowsForCurrentUser: vi.fn()
}));

describe("Leads export API - /api/leads/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna CSV com filtros aplicados", async () => {
    vi.mocked(getLeadExportRowsForCurrentUser).mockResolvedValue([
      {
        id: "1",
        name: "Lead Exportado",
        owner: "Equipe",
        stage: "Novo lead",
        nextContact: "A definir",
        score: 87,
        source: "Meta Lead Form",
        phone: "(11) 99999-0000",
        email: "lead@exemplo.com",
        city: "Sao Paulo",
        companyName: "Exemplo LTDA",
        livesCount: 12,
        createdAt: "01 mai 2026",
        budget: "R$ 10k/mês",
        interest: "Plano empresarial",
        lastInteraction: "Contato inicial.",
        notes: "Observacao",
        receivedAt: "2026-05-01T10:00:00.000Z",
        nextContactAt: "2026-05-02T10:00:00.000Z"
      }
    ] as never);

    const request = new Request(
      "http://localhost:3000/api/leads/export?stage=Novo%20lead&source=Meta%20Lead%20Form&search=lead"
    );
    const response = await GET(request);
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(csv).toContain("Lead Exportado");
    expect(getLeadExportRowsForCurrentUser).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "Novo lead",
        source: "Meta Lead Form",
        search: "lead"
      }),
      null
    );
  });
});
