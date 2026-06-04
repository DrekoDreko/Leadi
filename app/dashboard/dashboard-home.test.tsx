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
        stageConversionSummary={{
          total: 4,
          note: "Percentual da base atual em cada etapa oficial do funil.",
          rows: [
            { stageValue: "new", label: "Novo lead", tone: "cobalt", count: 2, percentage: 0.5 },
            { stageValue: "qualification", label: "Qualificação", tone: "lagoon", count: 1, percentage: 0.25 },
            { stageValue: "proposal", label: "Proposta", tone: "signal", count: 1, percentage: 0.25 },
            { stageValue: "negotiation", label: "Negociação", tone: "ink", count: 0, percentage: 0 },
            { stageValue: "won", label: "Venda", tone: "emerald", count: 0, percentage: 0 },
            { stageValue: "lost", label: "Perdido", tone: "red", count: 0, percentage: 0 }
          ],
          status: "available"
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
    expect(screen.getByText("Conversao por etapa")).toBeInTheDocument();
    expect(
      screen.getByText("Percentual da base atual em cada etapa oficial do funil.")
    ).toBeInTheDocument();
    expect(screen.getByText("Sem contato: 2 (pedem primeiro retorno)")).toBeInTheDocument();
    expect(screen.getByText("Tarefas em atraso: 0 (follow-up em dia)")).toBeInTheDocument();
    expect(screen.getAllByText("Novo lead").length).toBeGreaterThan(0);
    expect(screen.getByText("2 leads na etapa atual")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Contexto da conta")).toBeInTheDocument();
    expect(screen.getByText("Anuncios salvos:")).toBeInTheDocument();
    expect(screen.getByText("CPL inicial:")).toBeInTheDocument();
    expect(screen.getByText("Mensagens WhatsApp: 0 (nenhuma mensagem gerada)")).toBeInTheDocument();
    expect(screen.getByText("Envios com falha: 0 (nenhuma falha de envio)")).toBeInTheDocument();
    expect(screen.getByText("Saldo de IA: 0 (seu saldo de IA acabou)")).toBeInTheDocument();
    expect(
      screen.getByText("Créditos usados no ciclo: 0 (consumo do período atual)")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("CPL inicial: ~R$ 24,00 (mock inicial • sem custo Meta real)")
    ).not.toBeInTheDocument();
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

  it("mostra carteira e atrasos por consultor para gestores", () => {
    render(
      <DashboardHome
        canManageLeadOwners
        consultantPortfolioSummary={{
          totalConsultants: 2,
          totalLeads: 4,
          totalOverdue: 2,
          note: "Carteira atual e tarefas em atraso agregadas por consultor visivel no CRM.",
          rows: [
            {
              ownerProfileId: "owner-1",
              ownerName: "Gabriel",
              role: "seller",
              leadCount: 3,
              overdueCount: 2
            },
            {
              ownerProfileId: "owner-2",
              ownerName: "Fernanda",
              role: "seller",
              leadCount: 1,
              overdueCount: 0
            }
          ],
          status: "available"
        }}
        leadNoContactSummary={{
          total: 0,
          leads: []
        }}
        leads={leads}
      />
    );

    expect(screen.getByText("Carteira por consultor")).toBeInTheDocument();
    expect(screen.getByText("2 consultores com carteira visivel")).toBeInTheDocument();
    expect(screen.getByText("Gabriel")).toBeInTheDocument();
    expect(screen.getByText("Consultor • 3 leads na carteira")).toBeInTheDocument();
    expect(screen.getByText("2 atrasos")).toBeInTheDocument();
    expect(screen.getByText("Fernanda")).toBeInTheDocument();
    expect(screen.getByText("0 atrasos")).toBeInTheDocument();
  });

  it("mostra os cards de WhatsApp e IA com os dados agregados", () => {
    render(
      <DashboardHome
        leads={leads}
        leadNoContactSummary={{ total: 0, leads: [] }}
        whatsappMessagesCount={42}
        whatsappDeliverySummary={{ total: 42, sent: 38, failed: 3 }}
        aiBalanceDetails={{
          orgId: "org-1",
          availableCredits: 120,
          includedCredits: 80,
          purchasedCredits: 40,
          currentPeriodStart: "2026-06-01T12:00:00.000Z",
          currentPeriodEnd: "2026-06-30T12:00:00.000Z",
          createdAt: null,
          updatedAt: null
        }}
        aiUsageSummary={{ usedCredits: 65, periodEnd: "2026-06-30T12:00:00.000Z" }}
      />
    );

    expect(screen.getByText("Mensagens WhatsApp: 42 (38 enviadas)")).toBeInTheDocument();
    expect(screen.getByText("Envios com falha: 3 (precisam reenvio)")).toBeInTheDocument();
    expect(screen.getByText("Saldo de IA: 120 (80 inclusos • 40 comprados)")).toBeInTheDocument();
    expect(
      screen.getByText("Créditos usados no ciclo: 65 (renova em 30/06)")
    ).toBeInTheDocument();
  });
});
