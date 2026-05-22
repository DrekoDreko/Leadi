import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from './route';
import { updateLeadForCurrentUser, archiveLeadForCurrentUser } from '@/lib/leads/repository.server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// Mocks
vi.mock('@/lib/leads/repository.server', () => ({
  updateLeadForCurrentUser: vi.fn(),
  archiveLeadForCurrentUser: vi.fn()
}));

vi.mock('@/lib/supabase/config', () => ({
  isSupabaseConfigured: vi.fn()
}));

describe('Leads API - /api/leads/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH', () => {
    it('atualiza um lead com sucesso', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      const mockLead = { id: '123', name: 'Updated Lead', quality: 'medium' };
      vi.mocked(updateLeadForCurrentUser).mockResolvedValue(mockLead as never);

      const request = new Request('http://localhost:3000/api/leads/123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Lead', quality: 'medium' })
      });

      const context = { params: Promise.resolve({ id: '123' }) };
      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lead).toEqual(mockLead);
      expect(data.mode).toBe('supabase');
      expect(updateLeadForCurrentUser).toHaveBeenCalledWith('123', {
        name: 'Updated Lead',
        quality: 'medium'
      });
    });

    it('retorna erro ao tentar atualizar sem permissao', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(updateLeadForCurrentUser).mockRejectedValue(new Error('Sem permissao'));

      const request = new Request('http://localhost:3000/api/leads/123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Lead' })
      });

      const context = { params: Promise.resolve({ id: '123' }) };
      const response = await PATCH(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Voce so pode editar leads adicionados por voce.');
    });
  });

  describe('DELETE', () => {
    it('exclui um lead com sucesso', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(archiveLeadForCurrentUser).mockResolvedValue(undefined);

      const request = new Request('http://localhost:3000/api/leads/123', {
        method: 'DELETE'
      });

      const context = { params: Promise.resolve({ id: '123' }) };
      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.mode).toBe('supabase');
      expect(archiveLeadForCurrentUser).toHaveBeenCalledWith('123');
    });

    it('retorna erro quando o lead nao e encontrado', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(archiveLeadForCurrentUser).mockRejectedValue(new Error('Lead nao encontrado'));

      const request = new Request('http://localhost:3000/api/leads/123', {
        method: 'DELETE'
      });

      const context = { params: Promise.resolve({ id: '123' }) };
      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Lead nao encontrado ou ja arquivado.');
    });
  });
});
