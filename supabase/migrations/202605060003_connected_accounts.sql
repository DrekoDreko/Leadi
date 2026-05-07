-- Contas conectadas por organizacao, com suporte a Meta, OpenAI, logs e campos
-- de publicacao controlada para campanhas.

create type public.integration_connection_status as enum (
  'connected',
  'disconnected',
  'expired',
  'pending'
);

create type public.integration_provider as enum (
  'meta',
  'openai'
);

create type public.integration_sync_status as enum (
  'success',
  'warning',
  'failed',
  'running'
);

create type public.campaign_publish_mode as enum (
  'draft',
  'manual_review',
  'scheduled',
  'paused'
);

create type public.campaign_publication_status as enum (
  'not_connected',
  'ready_to_prepare',
  'draft_created',
  'pending_review',
  'published',
  'paused',
  'failed'
);

alter table public.meta_integrations
  add column if not exists connected_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists connected_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists meta_user_id text,
  add column if not exists meta_user_name text,
  add column if not exists scopes text[] not null default '{}'::text[],
  add column if not exists connection_status public.integration_connection_status not null default 'pending';

update public.meta_integrations
set
  connection_status = case
    when status = 'active' then 'connected'
    when status = 'revoked' then 'disconnected'
    when status = 'inactive' then 'disconnected'
    else 'pending'
  end,
  connected_at = coalesce(connected_at, created_at),
  expires_at = coalesce(expires_at, token_expires_at)
where connection_status is null
   or connected_at is null
   or expires_at is null;

alter table public.meta_pages
  add column if not exists connected_account_id uuid;

alter table public.meta_pages
  add column if not exists category text;

alter table public.meta_pages
  add constraint meta_pages_connected_account_fk
  foreign key (connected_account_id, organization_id)
  references public.meta_integrations(id, organization_id)
  on delete cascade;

alter table public.meta_forms
  add column if not exists connected_account_id uuid;

alter table public.meta_forms
  add constraint meta_forms_connected_account_fk
  foreign key (connected_account_id, organization_id)
  references public.meta_integrations(id, organization_id)
  on delete cascade;

create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connected_account_id uuid not null,
  meta_ad_account_id text not null,
  name text not null,
  currency text not null,
  timezone text not null,
  status public.integration_connection_status not null default 'connected',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_ad_accounts_id_organization_unique unique (id, organization_id),
  constraint meta_ad_accounts_account_unique unique (organization_id, meta_ad_account_id),
  constraint meta_ad_accounts_connected_account_fk
    foreign key (connected_account_id, organization_id)
    references public.meta_integrations(id, organization_id)
    on delete cascade
);

create table if not exists public.openai_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connected_by_profile_id uuid references public.profiles(id) on delete set null,
  provider public.integration_provider not null default 'openai',
  status public.integration_connection_status not null default 'pending',
  api_key_ciphertext text,
  api_key_reference text,
  key_preview text,
  key_last_four text,
  connected_at timestamptz,
  last_validated_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint openai_connections_id_organization_unique unique (id, organization_id),
  constraint openai_connections_org_unique unique (organization_id),
  constraint openai_connections_key_storage_check
    check (
      num_nonnulls(
        nullif(api_key_ciphertext, ''),
        nullif(api_key_reference, '')
      ) = 1
    )
);

create table if not exists public.integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider public.integration_provider not null,
  connection_id uuid,
  asset_type text not null,
  status public.integration_sync_status not null default 'running',
  title text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.campaigns
  add column if not exists connected_account_id uuid references public.meta_integrations(id) on delete set null,
  add column if not exists meta_page_id text,
  add column if not exists meta_ad_account_id text,
  add column if not exists meta_lead_form_id text,
  add column if not exists publish_mode text not null default 'draft' check (
    publish_mode in ('draft', 'manual_review', 'scheduled', 'paused')
  ),
  add column if not exists publication_status text not null default 'not_connected' check (
    publication_status in (
      'not_connected',
      'ready_to_prepare',
      'draft_created',
      'pending_review',
      'published',
      'paused',
      'failed'
    )
  ),
  add column if not exists meta_campaign_id text,
  add column if not exists meta_adset_id text,
  add column if not exists meta_ad_id text,
  add column if not exists publication_message text,
  add column if not exists prepared_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists last_publication_attempt_at timestamptz,
  add column if not exists last_publication_error text;

update public.meta_pages
set connected_account_id = coalesce(connected_account_id, integration_id)
where connected_account_id is null;

update public.meta_forms
set connected_account_id = coalesce(connected_account_id, meta_pages.integration_id)
from public.meta_pages
where meta_forms.page_connection_id = meta_pages.id
  and meta_forms.connected_account_id is null;

create index if not exists meta_ad_accounts_org_status_idx
  on public.meta_ad_accounts (organization_id, status, created_at desc);

create index if not exists meta_ad_accounts_connected_account_idx
  on public.meta_ad_accounts (connected_account_id, created_at desc);

create index if not exists openai_connections_org_status_idx
  on public.openai_connections (organization_id, status, created_at desc);

create index if not exists integration_sync_logs_org_created_idx
  on public.integration_sync_logs (organization_id, created_at desc);

create index if not exists integration_sync_logs_provider_idx
  on public.integration_sync_logs (provider, created_at desc);

drop trigger if exists meta_ad_accounts_set_updated_at on public.meta_ad_accounts;
create trigger meta_ad_accounts_set_updated_at
before update on public.meta_ad_accounts
for each row execute function public.set_updated_at();

drop trigger if exists openai_connections_set_updated_at on public.openai_connections;
create trigger openai_connections_set_updated_at
before update on public.openai_connections
for each row execute function public.set_updated_at();

alter table public.meta_ad_accounts enable row level security;
alter table public.openai_connections enable row level security;
alter table public.integration_sync_logs enable row level security;

create policy "Members can read organization meta ad accounts"
on public.meta_ad_accounts
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can manage meta ad accounts"
on public.meta_ad_accounts
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update meta ad accounts"
on public.meta_ad_accounts
for update
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can delete meta ad accounts"
on public.meta_ad_accounts
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Members can read organization openai connections"
on public.openai_connections
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can manage openai connections"
on public.openai_connections
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update openai connections"
on public.openai_connections
for update
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can delete openai connections"
on public.openai_connections
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Members can read integration sync logs"
on public.integration_sync_logs
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can manage integration sync logs"
on public.integration_sync_logs
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update integration sync logs"
on public.integration_sync_logs
for update
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can delete integration sync logs"
on public.integration_sync_logs
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

comment on table public.meta_integrations is
  'Credenciais e metadados da integracao oficial Meta por organizacao, com suporte a token criptografado ou referencia segura.';

comment on table public.meta_ad_accounts is
  'Contas de anuncio da Meta sincronizadas por organizacao.';

comment on table public.openai_connections is
  'Chave OpenAI cadastrada pelo cliente por organizacao, com preview seguro e armazenamento protegido.';

comment on table public.integration_sync_logs is
  'Log de sincronizacao e operacoes das integracoes conectadas da organizacao.';

comment on column public.campaigns.publication_status is
  'Estado de publicacao controlada da campanha. Não representa o status geral de historico.';
