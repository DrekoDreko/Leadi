import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import Home from './page';

// Mock components that might be complex
vi.mock('@/components/mock-dashboard-preview', () => ({
  MockDashboardPreview: () => <div data-testid="mock-dashboard" />
}));

vi.mock('@/components/brand-mark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />
}));

describe('Landing Page (/)', () => {
  it('renderiza o titulo principal', async () => {
    render(<Home />);
    
    expect(screen.getByText(/LeadHealth/i)).toBeInTheDocument();
    expect(screen.getByText(/CRM \+ IA para corretores de plano de saúde empresarial/i)).toBeInTheDocument();
  });

  it('contem links para as paginas principais', async () => {
    render(<Home />);
    
    const loginLink = screen.getByRole('link', { name: /Entrar/i });
    expect(loginLink).toHaveAttribute('href', '/login');

    const pricingLink = screen.getAllByRole('link', { name: /Planos|Ver planos/i });
    expect(pricingLink.length).toBeGreaterThan(0);
  });
});
