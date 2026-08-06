-- Mudanca 6: publicos personalizados a partir da carteira do corretor.
--
-- Guarda o Custom Audience (base de clientes com hashing) e o Lookalike derivado,
-- por organizacao + conta de anuncio. NAO guardamos a carteira crua — apenas os
-- IDs retornados pela Meta. Lookalike pode ficar indisponivel sob Categoria
-- Especial (FINANCIAL_PRODUCTS_SERVICES); nesse caso lookalike_id fica nulo e o
-- status registra o motivo.

create table if not exists public.meta_custom_audiences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  meta_ad_account_id text not null,
  custom_audience_id text not null,
  lookalike_id text,
  source_count integer not null default 0,
  status text not null default 'ready'
    check (status in ('ready', 'lookalike_unavailable', 'processing', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.meta_custom_audiences is
  'Custom Audience (carteira com hashing) + Lookalike derivado por organizacao/conta (Mudanca 6). Nunca guarda a carteira crua, so os IDs da Meta.';

create index if not exists idx_meta_custom_audiences_org_account
  on public.meta_custom_audiences (organization_id, meta_ad_account_id);

alter table public.meta_custom_audiences enable row level security;

drop policy if exists "meta_custom_audiences_select_org" on public.meta_custom_audiences;
create policy "meta_custom_audiences_select_org"
  on public.meta_custom_audiences
  for select
  using (organization_id = public.current_profile_organization_id());
