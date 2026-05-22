import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardHome } from "./dashboard-home";
import { leads } from "@/data/mock";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/components/dashboard/widgets", () => ({
  PageHeading: ({ children, title }: { children?: ReactNode; title: string }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
  Metric: ({ label, value, note }: { label: string; value: string; note: string }) => (
    <div>
      {label}: {value} ({note})
    </div>
  ),
  KanbanBoard: () => <div>kanban</div>,
  LeadTable: () => <div>lead-table</div>
}));

vi.mock("@/components/dashboard/lead-details-popup", () => ({
  LeadDetailsPopup: () => null
}));

vi.mock("@/components/dashboard/onboarding-checklist", () => ({
  OnboardingChecklist: () => null
}));

vi.mock("@/components/dashboard/reminders-calendar-card", () => ({
  RemindersCalendarCard: () => <div>reminders</div>
}));

vi.mock("./onboarding-actions", () => ({
  dismissOnboardingChecklist: vi.fn(),
  toggleOnboardingStep: vi.fn()
}));

describe("DashboardHome", () => {
  it("mostra o resumo de leads sem contato com a regra inicial", () => {
    render(
      <DashboardHome
        campaignActivitySummary={{
          activeCount: 1,
          readyCount: 1,
          pausedCount: 0,
          campaigns: [
            {
              id: "campaign-1",
              campaignName: "Campanha PME Campinas",
              publicationStatus: "published",
              publishMode: "scheduled"
            },
            {
              id: "campaign-2",
              campaignName: "Campanha Revisao Manual",
              publicationStatus: "pending_review",
              publishMode: "manual_review"
            }
          ],
          mode: "supabase"
        }}
        campaignsCount={2}
        cplSummary={{
          value: "~R$ 24,00",
          note: "mock inicial • sem custo Meta real",
          status: "mocked"
        }}
        leadNoContactSummary={{
          total: 2,
          leads: [
            {
              id: leads[0].id,
              name: leads[0].name,
              owner: leads[0].owner,
              source: leads[0].source,
              stage: leads[0].stage,
              createdAtLabel: leads[0].createdAt
            }
          ]
        }}
        leads={leads}
      />
    );

    expect(screen.getByText("Sem primeiro contato")).toBeInTheDocument();
    expect(screen.getByText("CPL inicial: ~R$ 24,00 (mock inicial • sem custo Meta real)")).toBeInTheDocument();
    expect(screen.getByText("Campanhas ativas")).toBeInTheDocument();
    expect(screen.getByText("2 campanhas ativas ou prontas")).toBeInTheDocument();
    expect(screen.getByText("1 publicada • 1 pronta para proxima acao")).toBeInTheDocument();
    expect(screen.getByText("Campanha PME Campinas")).toBeInTheDocument();
    expect(screen.getByText("Publicada • Agendada")).toBeInTheDocument();
    expect(screen.getByText("Campanha Revisao Manual")).toBeInTheDocument();
    expect(screen.getByText("Aguardando revisao • Revisao manual")).toBeInTheDocument();
    expect(screen.getByText("2 leads aguardando abordagem")).toBeInTheDocument();
    expect(
      screen.getByText("Regra inicial: lead sem registro manual de contato no histórico comercial.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(leads[0].name, "i") })).toBeInTheDocument();
    expect(screen.getByText("Priorize os mais recentes para acelerar o primeiro retorno")).toBeInTheDocument();
  });
});
