import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import PricingPage from './page';

vi.mock('@/components/brand-mark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />
}));

describe('Pricing Page (/pricing)', () => {
  it('renderiza o titulo e os planos', () => {
    render(<PricingPage />);
    
    expect(screen.getByText(/Planos para vender plano empresarial/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Solo$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Equipe$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Operação$/i })).toBeInTheDocument();
  });

  it('exibe os preços dos planos', () => {
    render(<PricingPage />);
    
    expect(screen.getByText(/R\$ 97/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 247/i)).toBeInTheDocument();
    expect(screen.getByText(/Sob consulta/i)).toBeInTheDocument();
  });

  it('contem links para assinar via asaas', () => {
    render(<PricingPage />);
    
    const links = screen.getAllByRole('link', { name: /Assinar com Asaas/i });
    expect(links.length).toBe(3);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/login?next=/dashboard/creditos'));
  });
});
