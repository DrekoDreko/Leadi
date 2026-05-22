import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import DashboardPage from './page';
import { requireCompletedProfile } from "@/lib/workspaces/context";
import {
  getLeadsForCurrentUser,
  listLeadIdsWithRecordedContactForCurrentUser,
  listOverdueLeadTasksForCurrentUser
} from "@/lib/leads/repository.server";
import {
  getCampaignActivitySummaryForCurrentUser,
  getCampaignsForCurrentUser
} from "@/lib/campaigns/repository.server";
import { getCurrentAiBalance } from "@/lib/ai/credits";
import { getWhatsAppMessagesCountForCurrentUser } from "@/lib/whatsapp/repository.server";
import { getOnboardingStateForCurrentUser } from "@/lib/onboarding/repository.server";
import { getCreativeRequestsCountForCurrentUser } from "@/lib/creative-requests/repository.server";
import { getDashboardRemindersForCurrentUser } from "@/lib/dashboard-reminders/repository.server";
import { getSystemTemplates } from "@/lib/templates/repository.server";

// Mocks
vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/leads/repository.server", () => ({
  getLeadsForCurrentUser: vi.fn(),
  listLeadIdsWithRecordedContactForCurrentUser: vi.fn(),
  listOverdueLeadTasksForCurrentUser: vi.fn()
}));

vi.mock("@/lib/campaigns/repository.server", () => ({
  getCampaignActivitySummaryForCurrentUser: vi.fn(),
  getCampaignsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/whatsapp/repository.server", () => ({
  getWhatsAppMessagesCountForCurrentUser: vi.fn()
}));

vi.mock("@/lib/onboarding/repository.server", () => ({
  getOnboardingStateForCurrentUser: vi.fn()
}));

vi.mock("@/lib/creative-requests/repository.server", () => ({
  getCreativeRequestsCountForCurrentUser: vi.fn()
}));

vi.mock("@/lib/dashboard-reminders/repository.server", () => ({
  getDashboardRemindersForCurrentUser: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  getCurrentAiBalance: vi.fn()
}));

vi.mock("@/lib/templates/repository.server", () => ({
  getSystemTemplates: vi.fn()
}));

vi.mock("./dashboard-home", () => ({
  DashboardHome: (props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="dashboard-home">
      <span>Campaigns: {props.campaignsCount}</span>
      <span>Active campaigns: {props.campaignActivitySummary.activeCount}</span>
      <span>Leads: {props.leads.length}</span>
      <span>CPL: {props.cplSummary.value}</span>
      <span>CPL note: {props.cplSummary.note}</span>
      <span>No contact: {props.leadNoContactSummary.total}</span>
      <span>Overdue tasks: {props.overdueTasks.length}</span>
      <span>Reminders: {props.dashboardReminders.length}</span>
      <span>AI Balance: {props.aiBalance}</span>
      <span>WhatsApp templates: {props.whatsappTemplates.length}</span>
    </div>
  )
}));

describe('Dashboard Page (/dashboard)', () => {
  it('renderiza o dashboard home com os dados carregados', async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      mode: 'supabase',
      isSoloOwner: true,
      isTeamSeller: false,
      organizationId: 'org-1'
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getLeadsForCurrentUser).mockResolvedValue({
      leads: [
        {
          id: '1',
          name: 'Lead 1',
          owner: 'Ana',
          source: 'Meta Lead Form',
          stage: 'Novo lead',
          createdAt: '21 mai 2026'
        },
        {
          id: '2',
          name: 'Lead 2',
          owner: 'Bruno',
          source: 'CSV importado',
          stage: 'Qualificação',
          createdAt: '20 mai 2026'
        }
      ],
      pagination: { total: 2 }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(listLeadIdsWithRecordedContactForCurrentUser).mockResolvedValue(['2']);

    vi.mocked(getCampaignsForCurrentUser).mockResolvedValue({
      campaigns: [{}, {}, {}]
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(getCampaignActivitySummaryForCurrentUser).mockResolvedValue({
      activeCount: 2,
      readyCount: 1,
      pausedCount: 0,
      campaigns: [],
      mode: "supabase"
    });

    vi.mocked(getCurrentAiBalance).mockResolvedValue(18);

    vi.mocked(getWhatsAppMessagesCountForCurrentUser).mockResolvedValue(0);
    vi.mocked(getOnboardingStateForCurrentUser).mockResolvedValue(null);
    vi.mocked(getCreativeRequestsCountForCurrentUser).mockResolvedValue(0);
    vi.mocked(getDashboardRemindersForCurrentUser).mockResolvedValue({
      reminders: [{ id: "reminder-1" }],
      mode: "supabase"
    } as never);
    vi.mocked(listOverdueLeadTasksForCurrentUser).mockResolvedValue([]);
    vi.mocked(getSystemTemplates).mockResolvedValue([{ id: "tpl-1" }] as never);

    const Page = await DashboardPage();
    render(Page);
    
    expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
    expect(screen.getByText(/Campaigns: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Active campaigns: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Leads: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/CPL: ~R\$ 24,00/i)).toBeInTheDocument();
    expect(screen.getByText(/CPL note: mock inicial/i)).toBeInTheDocument();
    expect(screen.getByText(/No contact: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Overdue tasks: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Reminders: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Balance: 18/i)).toBeInTheDocument();
    expect(screen.getByText(/WhatsApp templates: 1/i)).toBeInTheDocument();
  });
});
