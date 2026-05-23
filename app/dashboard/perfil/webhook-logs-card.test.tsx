import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WebhookLogsCard } from "./webhook-logs-card";
import type { LeadWebhookLog } from "@/lib/leads/webhook-events.repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("WebhookLogsCard", () => {
  it("destaca eventos duplicados da Meta com contexto operacional", () => {
    const logs: LeadWebhookLog[] = [
      {
        id: "log-1",
        receivedAt: "2026-05-22T10:00:00.000Z",
        status: "processed",
        deliveryStatus: "duplicate",
        httpStatus: 200,
        leadId: "lead-1",
        leadName: "Ana Martins",
        errorMessage: null,
        detailMessage: "Evento duplicado absorvido com seguranca (mesmo meta_lead_id).",
        metaLeadId: "1202099988776655",
        metaFormId: "9988776655443322",
        metaPageId: "7766554433221100",
        source: "Meta Lead Ads"
      }
    ];

    render(
      <WebhookLogsCard
        filter="duplicate"
        isSupabaseMode
        logs={logs}
      />
    );

    expect(screen.getByRole("link", { name: "Duplicado" })).toHaveAttribute(
      "href",
      "/dashboard/integracoes/webhook-leads?webhookStatus=duplicate#logs"
    );
    expect(screen.getByText("Duplicado")).toBeInTheDocument();
    expect(screen.getByText("HTTP 200")).toBeInTheDocument();
    expect(screen.getByText(/Lead Meta 12020999/i)).toBeInTheDocument();
    expect(screen.getByText(/Formulario 99887766/i)).toBeInTheDocument();
    expect(screen.getByText(/Pagina 77665544/i)).toBeInTheDocument();
    expect(screen.getByText(/mesmo meta_lead_id/i)).toBeInTheDocument();
  });
});
