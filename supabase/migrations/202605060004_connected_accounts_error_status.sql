-- Refina a arquitetura de contas conectadas para representar falhas reais
-- sem rebaixar tudo para expirado/desconectado.

alter type public.integration_connection_status add value if not exists 'error';
alter type public.integration_sync_status add value if not exists 'error';

alter table public.leads
  add column if not exists meta_connected_account_id uuid references public.meta_integrations(id) on delete set null;

create index if not exists leads_meta_connected_account_idx
  on public.leads (organization_id, meta_connected_account_id, received_at desc)
  where meta_connected_account_id is not null;

comment on column public.leads.meta_connected_account_id is
  'Conta Meta conectada da organizacao usada para sincronizar ou importar este lead, quando aplicavel.';
