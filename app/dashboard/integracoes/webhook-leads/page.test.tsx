import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WebhookLeadsPage from "./page";
import { requireWorkspaceManager } from "@/lib/workspaces/context";
import { listLeadWebhookLogsByOrganization } from "@/lib/leads/webhook-events.repository";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers([["host", "leadi.example.com"], ["x-forwarded-proto", "https"]]))
}));

vi.mock("@/lib/workspaces/context", () => ({
  requireWorkspaceManager: vi.fn()
}));

vi.mock("@/lib/leads/webhook-events.repository", () => ({
  listLeadWebhookLogsByOrganization: vi.fn()
}));

vi.mock("../../perfil/webhook-setup-card", () => ({
  WebhookSetupCard: (props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="setup-card">
      <span>{props.webhookUrl}</span>
      <span>{props.canManageToken ? "can-manage" : "cannot-manage"}</span>
    </div>
  )
}));

vi.mock("../../perfil/webhook-logs-card", () => ({
  WebhookLogsCard: (props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="logs-card">
      <span>{props.filter}</span>
      <span>{String(props.logs.length)}</span>
    </div>
  )
}));

describe("Webhook Leads Page (/dashboard/integracoes/webhook-leads)", () => {
  it("monta a URL publica do webhook e repassa o filtro de logs", async () => {
    vi.mocked(requireWorkspaceManager).mockResolvedValue({
      mode: "supabase",
      workspace: { id: "org-1" },
      workspaceName: "Aliança Corretora",
      workspaceType: "solo",
      role: "owner",
      isManager: true,
      isSoloOwner: true,
      isAdmin: false,
      isOwner: true,
      displayName: "Gabriel",
      profile: { email: "gabriel@alianca.example" },
      profileSetupCompleted: true
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(listLeadWebhookLogsByOrganization).mockResolvedValue([
      {
        id: "log-1",
        receivedAt: "2026-05-14T10:00:00.000Z",
        status: "processed",
        httpStatus: 201,
        leadId: null,
        leadName: "Ana Martins",
        errorMessage: null,
        source: "Make/Zapier"
      }
    ]);

    const Page = await WebhookLeadsPage({
      searchParams: Promise.resolve({ webhookStatus: "failed" })
    });
    render(Page);

    expect(screen.getByText("Configuração do Webhook de Leads")).toBeInTheDocument();
    expect(screen.getByTestId("setup-card")).toHaveTextContent(
      "https://leadi.example.com/api/webhooks/leads"
    );
    expect(screen.getByTestId("setup-card")).toHaveTextContent("can-manage");
    expect(screen.getByTestId("logs-card")).toHaveTextContent("failed");
    expect(screen.getByTestId("logs-card")).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: /Voltar ao perfil/i })).toHaveAttribute(
      "href",
      "/dashboard/perfil"
    );
  });
});
