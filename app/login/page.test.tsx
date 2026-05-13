import { render, screen } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import LoginPage from './page';

// Mock AuthCard to avoid testing its internal logic here
vi.mock('./auth-card', () => ({
  AuthCard: ({ error, initialMode }: { error: string | null, initialMode: string }) => (
    <div data-testid="auth-card">
      <span>Mode: {initialMode}</span>
      {error && <span>Error: {error}</span>}
    </div>
  )
}));

describe('Login Page (/login)', () => {
  it('renderiza o card de autenticacao no modo login por padrao', async () => {
    const Page = await LoginPage({});
    render(Page);
    
    expect(screen.getByTestId('auth-card')).toBeInTheDocument();
    expect(screen.getByText(/Mode: login/i)).toBeInTheDocument();
  });

  it('renderiza no modo signup se especificado no searchParams', async () => {
    const Page = await LoginPage({ searchParams: Promise.resolve({ mode: 'signup' }) });
    render(Page);
    
    expect(screen.getByText(/Mode: signup/i)).toBeInTheDocument();
  });

  it('exibe mensagem de erro se presente no searchParams', async () => {
    const Page = await LoginPage({ searchParams: Promise.resolve({ error: 'invalid-credentials' }) });
    render(Page);
    
    expect(screen.getByText(/Error: E-mail ou senha incorretos/i)).toBeInTheDocument();
  });
});
