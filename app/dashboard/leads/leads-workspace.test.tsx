import type { ComponentProps, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadsWorkspace, buildMetaImportPresentation } from "./leads-workspace";
import type { MetaLeadImportResponse } from "@/lib/meta/manual-lead-import.types";
import { defaultLeadUrlFilters } from "@/lib/leads/filters";
import { leads as mockLeads, mockLeadOwnerOptions } from "@/data/mock";

const routerRefresh = vi.fn();
const routerReplace = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace
  }),
  usePathname: () => "/dashboard/leads",
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/components/billing/subscription-access-banner", () => ({
  SubscriptionAccessBanner: () => null
}));

vi.mock("@/components/dashboard/lead-details-popup", () => ({
  LeadDetailsPopup: () => null
}));

vi.mock("./lead-create-modal", () => ({
  LeadCreateModal: () => null
}));

vi.mock("@/components/dashboard/lead-filters-popup", () => ({
  LeadFiltersPopup: () => null
}));

vi.mock("@/components/dashboard/widgets", () => ({
  Metric: ({ label, value }: { label: string; value: string }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  PageHeading: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <div>{children}</div>
    </div>
  )
}));

function createImportResponse(
  overrides: Partial<MetaLeadImportResponse> = {}
): MetaLeadImportResponse {
  return {
    success: true,
    status: "success",
    summary: {
      totalFound: 3,
      imported: 3,
      duplicates: 0,
      archived: 0,
      errors: 0
    },
    items: [],
    mode: "supabase",
    message: "Importacao concluida: 3 novos no CRM.",
    ...overrides
  };
}

function createLeadState() {
  return {
    leads: mockLeads.slice(0, 2),
    mode: "supabase" as const,
    canDeleteLeads: true,
    canCreateMetaAdsLeads: true,
    pagination: {
      total: 2,
      limit: 25,
      offset: 0,
      nextOffset: null,
      hasMore: false
    }
  };
}

describe("buildMetaImportPresentation", () => {
  it("usa tom de sucesso para importacao concluida", () => {
    expect(buildMetaImportPresentation(createImportResponse())).toEqual({
      tone: "success",
      title: "Importacao concluida"
    });
  });

  it("usa tom de alerta quando so existirem duplicados", () => {
    expect(
      buildMetaImportPresentation(
        createImportResponse({
          status: "duplicates_only",
          summary: {
            totalFound: 2,
            imported: 0,
            duplicates: 2,
            archived: 1,
            errors: 0
          }
        })
      )
    ).toEqual({
      tone: "warning",
      title: "Nenhum lead novo entrou no CRM"
    });
  });

  it("usa tom de erro quando a importacao nao conclui", () => {
    expect(
      buildMetaImportPresentation(
        createImportResponse({
          success: false,
          status: "error",
          summary: {
            totalFound: 1,
            imported: 0,
            duplicates: 0,
            archived: 0,
            errors: 1
          }
        })
      )
    ).toEqual({
      tone: "error",
      title: "Importacao nao concluida"
    });
  });
});

describe("LeadsWorkspace bulk assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("exibe distribuicao em lote apenas para gestores", () => {
    render(
      <LeadsWorkspace
        aiBalance={5}
        canManageLeadOwners={false}
        createLeadAccess={{ allowed: true } as never}
        initialLeadId={null}
        initialLeadPanel="details"
        leadFilters={defaultLeadUrlFilters}
        leadOwnerOptions={mockLeadOwnerOptions}
        leadState={createLeadState()}
        whatsappTemplates={[]}
      />
    );

    expect(screen.queryByText("Dividir igualmente")).not.toBeInTheDocument();
  });

  it("mantem o badge Novo apenas para leads sem primeiro contato e joga os contatados para baixo", () => {
    const leadState = createLeadState();
    leadState.leads = [
      {
        ...mockLeads[0],
        id: "lead-contactado",
        name: "Lead contactado",
        hasRecordedContact: true
      },
      {
        ...mockLeads[0],
        id: "lead-pendente",
        name: "Lead pendente",
        hasRecordedContact: false
      },
      {
        ...mockLeads[1],
        id: "lead-qualificacao",
        name: "Lead qualificado",
        stage: "Qualificação",
        hasRecordedContact: true
      }
    ];

    const { container } = render(
      <LeadsWorkspace
        aiBalance={5}
        canManageLeadOwners={false}
        createLeadAccess={{ allowed: true } as never}
        initialLeadId={null}
        initialLeadPanel="details"
        leadFilters={defaultLeadUrlFilters}
        leadOwnerOptions={mockLeadOwnerOptions}
        leadState={leadState}
        whatsappTemplates={[]}
      />
    );

    expect(screen.getAllByText(/^Novo$/)).toHaveLength(1);
    expect(container.textContent?.indexOf("Lead pendente")).toBeLessThan(
      container.textContent?.indexOf("Lead qualificado") ?? 0
    );
    expect(container.textContent?.indexOf("Lead qualificado")).toBeLessThan(
      container.textContent?.indexOf("Lead contactado") ?? 0
    );
  });

  it("permite selecionar leads e distribuir para um consultor", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        leads: [
          {
            ...mockLeads[0],
            owner: "Fernanda",
            ownerProfileId: "demo-profile-fernanda"
          },
          {
            ...mockLeads[1],
            owner: "Fernanda",
            ownerProfileId: "demo-profile-fernanda"
          }
        ],
        updatedCount: 2,
        mode: "supabase"
      })
    } as Response);

    render(
      <LeadsWorkspace
        aiBalance={5}
        canManageLeadOwners
        createLeadAccess={{ allowed: true } as never}
        initialLeadId={null}
        initialLeadPanel="details"
        leadFilters={defaultLeadUrlFilters}
        leadOwnerOptions={mockLeadOwnerOptions}
        leadState={createLeadState()}
        whatsappTemplates={[]}
      />
    );

    fireEvent.click(screen.getByLabelText(`Selecionar lead ${mockLeads[0].name}`));
    fireEvent.click(screen.getByLabelText(`Selecionar lead ${mockLeads[1].name}`));
    fireEvent.change(screen.getByLabelText("Distribuir leads para consultor"), {
      target: { value: "demo-profile-fernanda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Distribuir" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/leads/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leadIds: [mockLeads[0].id, mockLeads[1].id],
          ownerProfileId: "demo-profile-fernanda"
        })
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText("2 leads foram distribuidos para os consultores.")
      ).toBeInTheDocument();
    });

    expect(routerRefresh).toHaveBeenCalled();
  });
});

describe("LeadsWorkspace permissions", () => {
  it("não exibe botões de importar e exportar para o consultor", () => {
    render(
      <LeadsWorkspace
        aiBalance={5}
        canManageLeadOwners={false}
        canExportLeads={false}
        canImportLeads={false}
        createLeadAccess={{ allowed: true } as never}
        initialLeadId={null}
        initialLeadPanel="details"
        leadFilters={defaultLeadUrlFilters}
        leadOwnerOptions={mockLeadOwnerOptions}
        leadState={createLeadState()}
        whatsappTemplates={[]}
      />
    );

    expect(screen.queryByText("Importar leads Meta")).not.toBeInTheDocument();
    expect(screen.queryByText("Exportar CSV")).not.toBeInTheDocument();
  });
});
