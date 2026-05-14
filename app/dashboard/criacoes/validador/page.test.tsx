import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CriacoesValidadorPage from "./page";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getCreativeRequestsForCurrentUser } from "@/lib/creative-requests/repository.server";
import { requireCompletedProfile } from "@/lib/workspaces/context";

vi.mock("@/lib/billing/subscription-limits.server", () => ({
  getCurrentResourceAccess: vi.fn()
}));

vi.mock("@/lib/creative-requests/repository.server", () => ({
  getCreativeRequestsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("../../pedidos/pedidos-workspace", () => ({
  PedidosWorkspace: (props: { initialComposeOpen?: boolean }) => (
    <div data-testid="pedidos-workspace">
      Compose aberto: {String(Boolean(props.initialComposeOpen))}
    </div>
  )
}));

describe("CriacoesValidadorPage", () => {
  it("abre o formulario quando compose=1", async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      isPlatformAdmin: false,
      workspaceName: "Atlas"
    } as never);
    vi.mocked(getCreativeRequestsForCurrentUser).mockResolvedValue({
      requests: [],
      mode: "supabase"
    });
    vi.mocked(getCurrentResourceAccess).mockResolvedValue({
      allowed: true,
      message: ""
    } as never);

    const Page = await CriacoesValidadorPage({
      searchParams: Promise.resolve({ compose: "1" })
    });

    render(Page);

    expect(screen.getByTestId("pedidos-workspace")).toHaveTextContent("Compose aberto: true");
  });
});
