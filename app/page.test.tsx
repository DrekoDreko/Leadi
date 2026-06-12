import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import Home from './page';

// Mock components that might be complex

vi.mock('@/components/brand-mark', () => ({
  BrandMark: () => <div data-testid="brand-mark" />
}));

describe('Landing Page (/)', () => {
  it('renderiza o titulo principal', async () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Venda mais planos de saúde sem perder nenhum lead/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Crie campanhas com IA, receba os leads do Facebook e Instagram/i)).toBeInTheDocument();
  });

  it('contem links para as paginas principais', async () => {
    render(<Home />);

    const loginLink = screen.getByRole('link', { name: /^Entrar$/ });
    expect(loginLink).toHaveAttribute('href', '/login');

    const startLinks = screen.getAllByRole('link', { name: /Começar agora/i });
    expect(startLinks.length).toBeGreaterThan(0);
    startLinks.forEach((link) => expect(link).toHaveAttribute('href', '/pricing'));

    const pricingLinks = screen.getAllByRole('link', { name: /Planos|Ver planos/i });
    expect(pricingLinks.length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /^Planos$/ })).toHaveAttribute('href', '/pricing');
  });

  it('usa o CTA de comparação na LP sem renderizar a tabela detalhada', async () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: /Compare os Planos/i })).toHaveAttribute('href', '/pricing');
    expect(screen.queryByText(/Veja o que está incluso em cada plano antes de escolher/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Adicionais opcionais/i)).not.toBeInTheDocument();
  });
});
