import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { leads } from "@/data/mock";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type { LeadDataState } from "@/lib/leads/repository";
import { defaultLeadUrlFilters } from "@/lib/leads/filters";
import { SalesFunnelWorkspace } from "./sales-funnel-workspace";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
    push: vi.fn()
  }),
  usePathname: () => "/dashboard/funil",
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("../leads/lead-create-modal", () => ({
  LeadCreateModal: () => null
}));

vi.mock("@/components/dashboard/lead-details-popup", () => ({
  LeadDetailsPopup: () => null
}));

const createLeadAccess: ResourceAccessSummary = {
  resource: "lead_creation",
  allowed: true,
  reason: "allowed",
  title: "Liberado",
  message: "Recurso liberado.",
  actionHref: "/dashboard/perfil/creditos",
  actionLabel: "Ver billing",
  limit: null,
  used: null
};

function buildLeadState(customLeads = leads): LeadDataState {
  return {
    leads: customLeads,
    mode: "mock",
    canDeleteLeads: true,
    canCreateMetaAdsLeads: true,
    pagination: {
      limit: null,
      offset: 0,
      total: customLeads.length,
      hasMore: false,
      nextOffset: null
    }
  };
}

describe("SalesFunnelWorkspace", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("conta os leads parados na métrica do funil", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00-03:00"));

    render(
      <SalesFunnelWorkspace
        aiBalance={5}
        canManageLeadOwners={false}
        createLeadAccess={createLeadAccess}
        leadState={buildLeadState()}
        leadFilters={defaultLeadUrlFilters}
        leadOwnerOptions={[]}
        whatsappTemplates={[]}
      />
    );

    const stalledMetric = screen.getByText("Leads parados").closest("article");

    expect(stalledMetric).not.toBeNull();
    expect(within(stalledMetric as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("nao marca leads fechados como parados mesmo com data antiga", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00-03:00"));

    render(
      <SalesFunnelWorkspace
        aiBalance={5}
        canManageLeadOwners={false}
        createLeadAccess={createLeadAccess}
        leadState={buildLeadState([
          {
            ...leads[0],
            id: "lead-won-antigo",
            stage: "Venda",
            updatedAt: "2026-05-01T09:00:00-03:00"
          }
        ])}
        leadFilters={defaultLeadUrlFilters}
        leadOwnerOptions={[]}
        whatsappTemplates={[]}
      />
    );

    const stalledMetric = screen.getByText("Leads parados").closest("article");

    expect(stalledMetric).not.toBeNull();
    expect(within(stalledMetric as HTMLElement).getByText("0")).toBeInTheDocument();
  });
});
