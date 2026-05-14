import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import DashboardPage from './page';
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { getCampaignsForCurrentUser } from "@/lib/campaigns/repository.server";
import { getConnectedAccountsForCurrentUser } from "@/lib/integrations/repository.server";
import { getWhatsAppMessagesCountForCurrentUser } from "@/lib/whatsapp/repository.server";
import { getOnboardingStateForCurrentUser } from "@/lib/onboarding/repository.server";
import { getCreativeRequestsCountForCurrentUser } from "@/lib/creative-requests/repository.server";
import { getDashboardRemindersForCurrentUser } from "@/lib/dashboard-reminders/repository.server";

// Mocks
vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/leads/repository.server", () => ({
  getLeadsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/campaigns/repository.server", () => ({
  getCampaignsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/integrations/repository.server", () => ({
  getConnectedAccountsForCurrentUser: vi.fn()
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

vi.mock("./dashboard-home", () => ({
  DashboardHome: (props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="dashboard-home">
      <span>Campaigns: {props.campaignsCount}</span>
      <span>Leads: {props.leads.length}</span>
      <span>Reminders: {props.dashboardReminders.length}</span>
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
      leads: [{ id: '1', name: 'Lead 1' }],
      pagination: { total: 1 }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getCampaignsForCurrentUser).mockResolvedValue({
      campaigns: [{}, {}, {}]
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getConnectedAccountsForCurrentUser).mockResolvedValue({
      metaConnection: null,
      openAIConnection: null
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getWhatsAppMessagesCountForCurrentUser).mockResolvedValue(0);
    vi.mocked(getOnboardingStateForCurrentUser).mockResolvedValue(null);
    vi.mocked(getCreativeRequestsCountForCurrentUser).mockResolvedValue(0);
    vi.mocked(getDashboardRemindersForCurrentUser).mockResolvedValue({
      reminders: [{ id: "reminder-1" }],
      mode: "supabase"
    } as never);

    const Page = await DashboardPage();
    render(Page);
    
    expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
    expect(screen.getByText(/Campaigns: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Leads: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Reminders: 1/i)).toBeInTheDocument();
  });
});
