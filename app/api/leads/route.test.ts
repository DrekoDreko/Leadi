import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, POST } from './route';
import {
  assignLeadOwnersInBulkForCurrentUser,
  createLeadForCurrentUser,
  getLeadsForCurrentUser
} from '@/lib/leads/repository.server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// Mocks
vi.mock('@/lib/leads/repository.server', () => ({
  assignLeadOwnersInBulkForCurrentUser: vi.fn(),
  createLeadForCurrentUser: vi.fn(),
  getLeadsForCurrentUser: vi.fn()
}));

vi.mock('@/lib/supabase/config', () => ({
  isSupabaseConfigured: vi.fn()
}));

vi.mock('@/lib/billing/subscription-limits.server', () => {
  return {
    BillingResourceAccessError: class extends Error {
      status = 403;
      constructor(message: string) {
        super(message);
        this.name = 'BillingResourceAccessError';
      }
    }
  };
});

describe('Leads API - /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('retorna a lista de leads com sucesso', async () => {
      const mockState = {
        leads: [],
        mode: 'supabase',
        canDeleteLeads: true,
        canCreateMetaAdsLeads: true,
        pagination: { total: 0, pages: 0, current: 1 }
      };

      vi.mocked(getLeadsForCurrentUser).mockResolvedValue(mockState as never);

      const request = new Request('http://localhost:3000/api/leads?stage=new');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockState);
      expect(getLeadsForCurrentUser).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('cria um novo lead com sucesso', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      const mockLead = { id: '123', name: 'Test Lead', quality: 'high' };
      vi.mocked(createLeadForCurrentUser).mockResolvedValue({
        lead: mockLead as never,
        status: 'created'
      });

      const request = new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Lead', email: 'test@example.com', quality: 'high' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.lead).toEqual(mockLead);
      expect(data.mode).toBe('supabase');
      expect(data.status).toBe('created');
      expect(createLeadForCurrentUser).toHaveBeenCalledWith({
        name: 'Test Lead',
        email: 'test@example.com',
        quality: 'high'
      });
    });

    it('retorna erro de validacao (ex: nome do lead nao informado)', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(createLeadForCurrentUser).mockRejectedValue(new Error('Nome do lead incorreto'));

      const request = new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Informe o nome do lead antes de salvar.');
    });

    it('retorna erro de duplicidade (Conecte uma conta Meta ativa)', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(createLeadForCurrentUser).mockRejectedValue(new Error('Conecte uma conta Meta ativa'));

      const request = new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({ name: 'Dupe', phone: '11999999999' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Ja existe um lead do Meta Ads com esse contato. Conecte uma conta Meta ativa para alterar esse registro.');
    });
  });

  describe('PATCH', () => {
    it('distribui leads em lote com sucesso', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      const updatedLeads = [
        { id: 'lead-1', ownerProfileId: 'seller-1', owner: 'Fernanda' },
        { id: 'lead-2', ownerProfileId: 'seller-1', owner: 'Fernanda' }
      ];

      vi.mocked(assignLeadOwnersInBulkForCurrentUser).mockResolvedValue({
        leads: updatedLeads as never,
        updatedCount: 2
      });

      const request = new Request('http://localhost:3000/api/leads', {
        method: 'PATCH',
        body: JSON.stringify({
          lead_ids: ['lead-1', 'lead-2'],
          owner_profile_id: 'seller-1'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leads).toEqual(updatedLeads);
      expect(data.updatedCount).toBe(2);
      expect(data.mode).toBe('supabase');
      expect(assignLeadOwnersInBulkForCurrentUser).toHaveBeenCalledWith({
        leadIds: ['lead-1', 'lead-2'],
        ownerProfileId: 'seller-1'
      });
    });

    it('retorna erro quando um seller tenta distribuir em lote', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(assignLeadOwnersInBulkForCurrentUser).mockRejectedValue(
        new Error('Somente owner ou admin podem distribuir leads em lote.')
      );

      const request = new Request('http://localhost:3000/api/leads', {
        method: 'PATCH',
        body: JSON.stringify({
          lead_ids: ['lead-1'],
          owner_profile_id: 'seller-1'
        })
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Somente owner ou admin podem distribuir leads em lote.');
    });
  });
});
