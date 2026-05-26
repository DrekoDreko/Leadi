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

  it('mantem o destaque do plano profissional', () => {
    render(<PricingPage />);

    const professionalCard = screen.getByRole('heading', { name: /^Profissional$/i }).closest('article');
    expect(professionalCard).toHaveClass('h-full');
  });

  it('contem links para assinar agora', () => {
    render(<PricingPage />);
    
    const links = screen.getAllByRole('link', { name: /Contratar/i });
    expect(links.length).toBe(3);
    expect(links[0]).toHaveAttribute('href', '/login?mode=signup&next=%2Fcheckout%3Fplan%3Dessencial');
    expect(links[1]).toHaveAttribute('href', '/login?mode=signup&next=%2Fcheckout%3Fplan%3Dprofissional');
    expect(links[2]).toHaveAttribute('href', '/login?mode=signup&next=%2Fcheckout%3Fplan%3Doperacao');
  });

  it('mostra o aviso sobre verba de anúncios e serviços extras', () => {
    render(<PricingPage />);

    expect(screen.getByText(/A mensalidade não inclui verba de anúncios/i)).toBeInTheDocument();
  });

  it('exibe a seção com vantagens do Leadi abaixo dos planos', () => {
    render(<PricingPage />);

    expect(screen.getByRole('heading', { name: /Mais clareza, velocidade e consistência para vender melhor/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Tenha seus leads, responsáveis e próximos passos no mesmo lugar/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Mostrar vantagem anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mostrar próxima vantagem/i })).toBeInTheDocument();
  });
});
