import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SalesFunnelPage from "./page";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/ai/credits", () => ({
  getCurrentAiBalance: vi.fn()
}));

vi.mock("@/lib/billing/subscription-limits.server", () => ({
  getCurrentResourceAccess: vi.fn()
}));

vi.mock("@/lib/leads/filters", () => ({
  parseLeadUrlFilters: vi.fn()
}));

vi.mock("@/lib/leads/repository.server", () => ({
  getLeadsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/templates/repository.server", () => ({
  getSystemTemplates: vi.fn()
}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("./sales-funnel-workspace", () => ({
  SalesFunnelWorkspace: (props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="sales-funnel-workspace">
      <span>Leads count: {props.leadState.leads.length}</span>
      <span>AI balance: {props.aiBalance}</span>
      <span>WhatsApp templates: {props.whatsappTemplates.length}</span>
    </div>
  )
}));

describe("Sales Funnel Page (/dashboard/funil)", () => {
  it("entrega saldo e templates de WhatsApp ao workspace do funil", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({} as never);
    vi.mocked(parseLeadUrlFilters).mockReturnValue({} as never);
    vi.mocked(getLeadsForCurrentUser).mockResolvedValue({
      leads: [{ id: "lead-1" }]
    } as never);
    vi.mocked(getCurrentResourceAccess).mockResolvedValue({
      allowed: true
    } as never);
    vi.mocked(getCurrentAiBalance).mockResolvedValue(11);
    vi.mocked(getSystemTemplates).mockResolvedValue([{ id: "tpl-1" }, { id: "tpl-2" }] as never);

    const Page = await SalesFunnelPage({ searchParams: Promise.resolve({}) });
    render(Page);

    expect(screen.getByTestId("sales-funnel-workspace")).toBeInTheDocument();
    expect(screen.getByText(/Leads count: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/AI balance: 11/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp templates: 2/i)).toBeInTheDocument();
  });
});
