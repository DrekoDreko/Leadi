import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import LeadsPage from './page';
import { requireCompletedProfile } from "@/lib/workspaces/context";
import { getLeadsForCurrentUser } from "@/lib/leads/repository.server";
import { getCurrentResourceAccess } from "@/lib/billing/subscription-limits.server";
import { getAiBalance } from "@/lib/ai/credits";
import { getSystemTemplates } from "@/lib/templates/repository.server";

// Mocks
vi.mock("server-only", () => ({}));

vi.mock("@/lib/leads/repository.server", () => ({
  getLeadsForCurrentUser: vi.fn()
}));

vi.mock("@/lib/billing/subscription-limits.server", () => ({
  getCurrentResourceAccess: vi.fn(),
  BillingResourceAccessError: class extends Error { status = 403 }
}));

vi.mock("@/lib/workspaces/context", () => ({
  requireCompletedProfile: vi.fn()
}));

vi.mock("@/lib/ai/credits", () => ({
  getAiBalance: vi.fn()
}));

vi.mock("@/lib/templates/repository.server", () => ({
  getSystemTemplates: vi.fn()
}));

vi.mock("./leads-workspace", () => ({
  LeadsWorkspace: (props: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="leads-workspace">
      <span>Leads count: {props.leadState.leads.length}</span>
      <span>AI balance: {props.aiBalance}</span>
    </div>
  )
}));

describe('Leads Page (/dashboard/leads)', () => {
  it('renderiza o leads workspace com os dados carregados', async () => {
    vi.mocked(requireCompletedProfile).mockResolvedValue({
      workspace: { id: "org-1" },
      isManager: true,
      isSoloOwner: false
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getLeadsForCurrentUser).mockResolvedValue({
      leads: [{ id: '1', name: 'Lead 1' }, { id: '2', name: 'Lead 2' }],
      pagination: { total: 2 }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    vi.mocked(getCurrentResourceAccess).mockResolvedValue({
      allowed: true,
      remaining: 10
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    vi.mocked(getAiBalance).mockResolvedValue(9);

    vi.mocked(getSystemTemplates).mockResolvedValue([] as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    const Page = await LeadsPage({ searchParams: Promise.resolve({}) });
    render(Page);
    
    expect(screen.getByTestId('leads-workspace')).toBeInTheDocument();
    expect(screen.getByText(/Leads count: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/AI balance: 9/i)).toBeInTheDocument();
  });
});
