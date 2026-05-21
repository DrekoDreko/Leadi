import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { leads } from "@/data/mock";
import { LeadDetailsPopup } from "./lead-details-popup";

describe("LeadDetailsPopup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.style.overflow = "";
  });

  it("destaca dados basicos e origem sem esconder comentarios", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        comments: [
          {
            id: "comment-1",
            leadId: leads[0].id,
            authorProfileId: "profile-1",
            authorName: "Gabriel",
            authorEmail: "gabriel@leadi.local",
            body: "Retornar ainda hoje com comparativo de rede.",
            createdAt: "2026-05-21T10:30:00.000Z",
            updatedAt: "2026-05-21T10:30:00.000Z"
          }
        ]
      })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<LeadDetailsPopup lead={leads[0]} onClose={() => undefined} />);

    expect(screen.getByRole("heading", { name: "Dados basicos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumo de origem" })).toBeInTheDocument();
    expect(screen.getByText("Responsavel")).toBeInTheDocument();
    expect(screen.getByText("Meta Lead Form")).toBeInTheDocument();
    expect(screen.getByText("Campanha PME conectada")).toBeInTheDocument();
    expect(screen.getByText("48 vidas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comentarios internos" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Retornar ainda hoje com comparativo de rede.")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/leads/${encodeURIComponent(leads[0].id)}/comments`,
      expect.objectContaining({
        cache: "no-store",
        method: "GET"
      })
    );
  });
});
