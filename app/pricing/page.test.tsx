import { render, screen, within } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import PricingPage from './page';

vi.mock('@/components/brand-mark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />
}));

describe('Pricing Page (/pricing)', () => {
  it('renderiza o titulo e os planos', () => {
    render(<PricingPage />);
    
    expect(screen.getByRole('heading', { name: /Escolha o plano ideal para sua operação/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Essencial$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Profissional$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Operação$/i })).toBeInTheDocument();
  });

  it('exibe os preços dos planos', () => {
    render(<PricingPage />);

    const initialCard = screen.getByRole('heading', { name: /^Essencial$/i }).closest('article');
    const professionalCard = screen.getByRole('heading', { name: /^Profissional$/i }).closest('article');
    const operationCard = screen.getByRole('heading', { name: /^Operação$/i }).closest('article');

    expect(initialCard).not.toBeNull();
    expect(professionalCard).not.toBeNull();
    expect(operationCard).not.toBeNull();

    expect(within(initialCard as HTMLElement).getByText(/R\$ 297\/mês$/i)).toBeInTheDocument();
    expect(within(professionalCard as HTMLElement).getByText(/R\$ 797\/mês$/i)).toBeInTheDocument();
    expect(within(operationCard as HTMLElement).getByText(/A partir de R\$ 1\.997\/mês/i)).toBeInTheDocument();
  });

  it('destaca o plano profissional e o fundador', () => {
    render(<PricingPage />);

    const professionalCard = screen.getByRole('heading', { name: /^Profissional$/i }).closest('article');
    expect(professionalCard).toHaveClass('glass-dark');
    expect(screen.getByText(/Plano Fundador/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 297\/mês por 90 dias/i)).toBeInTheDocument();
  });

  it('contem links para falar com a equipe e fundador', () => {
    render(<PricingPage />);
    
    const links = screen.getAllByRole('link', { name: /Falar com a equipe/i });
    expect(links.length).toBe(3);
    expect(screen.getByRole('link', { name: /Quero entrar como fundador/i })).toHaveAttribute('href', '/login');
  });

  it('mostra o aviso sobre verba de anúncios e serviços extras', () => {
    render(<PricingPage />);

    expect(screen.getByText(/A mensalidade não inclui verba de anúncios/i)).toBeInTheDocument();
  });
});
