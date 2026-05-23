import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { leads, mockLeadOwnerOptions } from "@/data/mock";
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
    expect(screen.getByText("Etapa atual")).toBeInTheDocument();
    expect(screen.getByText("Entrada e primeira abordagem")).toBeInTheDocument();
    expect(screen.getByText("Responsavel")).toBeInTheDocument();
    expect(screen.getByText("Meta Lead Form")).toBeInTheDocument();
    expect(screen.getByText("Campanha PME conectada")).toBeInTheDocument();
    expect(screen.getByText("Conjunto decisores Campinas")).toBeInTheDocument();
    expect(screen.getByText("Anuncio rede premium")).toBeInTheDocument();
    expect(screen.getByText("form_445566")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Lead captado pela integracao da Meta, com campanha, anuncio e formulario quando disponiveis."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("48 vidas")).toBeInTheDocument();
    expect(screen.getAllByText("Qualidade: Alta").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Comentarios internos" })).toBeInTheDocument();
    expect(screen.queryByText("Motivo de perda")).not.toBeInTheDocument();

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

  it("normaliza a etapa quando o lead chega com value tecnico", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadDetailsPopup
        lead={{ ...leads[0], id: "LE-9001", stage: "won" }}
        onClose={() => undefined}
      />
    );

    expect(screen.getByText("Etapa: Venda")).toBeInTheDocument();
    expect(screen.getByText("Venda ganha")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leads/LE-9001/comments",
        expect.objectContaining({
          cache: "no-store",
          method: "GET"
        })
      );
    });
  });

  it("mostra e permite editar motivo de perda para leads perdidos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadDetailsPopup
        lead={{
          ...leads[0],
          id: "LE-9010",
          stage: "lost",
          interest: "Lead perdido apos comparacao final",
          lossReason: "Fechou com a operadora atual por menor reajuste."
        }}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />
    );

    expect(screen.getByText("Motivo de perda")).toBeInTheDocument();
    expect(screen.getByText("Fechou com a operadora atual por menor reajuste.")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Editar lead"));

    expect(screen.getByLabelText("Qualidade do lead")).toHaveValue("high");
    expect(screen.getByLabelText("Motivo de perda")).toHaveValue(
      "Fechou com a operadora atual por menor reajuste."
    );
  });

  it("permite que gestor ajuste o responsavel do lead no formulario", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadDetailsPopup
        canManageLeadOwners
        lead={leads[0]}
        leadOwnerOptions={mockLeadOwnerOptions}
        onClose={() => undefined}
        onUpdated={() => undefined}
      />
    );

    fireEvent.click(screen.getByTitle("Editar lead"));

    const ownerSelect = screen.getByLabelText("Responsável pelo lead");

    expect(ownerSelect).toHaveValue("demo-profile-gabriel");
    expect(screen.getByRole("option", { name: "Gabriel (Owner)" })).toBeInTheDocument();
  });

  it("abre o WhatsApp com mensagem pronta quando o lead tem telefone valido", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<LeadDetailsPopup lead={leads[0]} onClose={() => undefined} />);

    const whatsappLink = screen.getByRole("link", {
      name: "Abrir WhatsApp com mensagem pronta"
    });

    expect(whatsappLink).toHaveAttribute(
      "href",
      "https://wa.me/5519988421042?text=Ola%2C%20Marina!%20Tudo%20bem%3F%20Vi%20seu%20interesse%20sobre%20Plano%20empresarial%20com%20coparticipacao%20para%20Azevedo%20Clinica%20e%20posso%20te%20ajudar%20por%20aqui."
    );
    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink).toHaveAttribute("aria-disabled", "false");
  });

  it("mantem o CTA de WhatsApp desabilitado sem telefone valido", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadDetailsPopup
        lead={{ ...leads[0], id: "LE-9011", phone: "Sem telefone" }}
        onClose={() => undefined}
      />
    );

    const whatsappLink = screen.getByRole("link", {
      name: "Abrir WhatsApp com mensagem pronta"
    });

    expect(whatsappLink).toHaveAttribute("href", "#");
    expect(whatsappLink).toHaveAttribute("aria-disabled", "true");
  });

  it("exibe o atalho de IA quando o gerador esta habilitado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] })
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadDetailsPopup
        aiBalance={3}
        lead={leads[0]}
        messageGeneratorEnabled
        onClose={() => undefined}
      />
    );

    expect(screen.getByTitle(`Gerar mensagem para ${leads[0].name}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Gerar mensagem" }));

    expect(screen.getByRole("heading", { name: "WhatsApp do lead" })).toBeInTheDocument();
  });
});
