create type public.meta_connection_status as enum (
  'active',
  'inactive',
  'error',
  'revoked'
);

create table if not exists public.meta_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meta_account_id text,
  meta_account_name text,
  access_token_ciphertext text,
  access_token_reference text,
  token_last_four text,
  token_expires_at timestamptz,
  status public.meta_connection_status not null default 'active',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_integrations_token_storage_check
    check (
      num_nonnulls(
        nullif(access_token_ciphertext, ''),
        nullif(access_token_reference, '')
      ) = 1
    ),
  constraint meta_integrations_id_organization_unique unique (id, organization_id),
  constraint meta_integrations_account_unique unique (organization_id, meta_account_id)
);

create table if not exists public.meta_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  integration_id uuid not null,
  page_id text not null,
  page_name text not null,
  status public.meta_connection_status not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_pages_id_organization_unique unique (id, organization_id),
  constraint meta_pages_page_unique unique (organization_id, page_id),
  constraint meta_pages_integration_fk
    foreign key (integration_id, organization_id)
    references public.meta_integrations(id, organization_id)
    on delete cascade
);

create table if not exists public.meta_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  page_connection_id uuid not null,
  page_id text not null,
  page_name text not null,
  form_id text not null,
  form_name text not null,
  status public.meta_connection_status not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_forms_form_unique unique (organization_id, form_id),
  constraint meta_forms_page_connection_fk
    foreign key (page_connection_id, organization_id)
    references public.meta_pages(id, organization_id)
    on delete cascade
);

create index if not exists meta_integrations_org_status_idx
  on public.meta_integrations (organization_id, status, created_at desc);

create index if not exists meta_integrations_token_reference_idx
  on public.meta_integrations (access_token_reference)
  where access_token_reference is not null;

create index if not exists meta_pages_org_status_idx
  on public.meta_pages (organization_id, status, created_at desc);

create index if not exists meta_pages_integration_idx
  on public.meta_pages (integration_id, created_at desc);

create index if not exists meta_forms_org_status_idx
  on public.meta_forms (organization_id, status, created_at desc);

create index if not exists meta_forms_page_connection_idx
  on public.meta_forms (page_connection_id, created_at desc);

drop trigger if exists meta_integrations_set_updated_at on public.meta_integrations;
create trigger meta_integrations_set_updated_at
before update on public.meta_integrations
for each row execute function public.set_updated_at();

drop trigger if exists meta_pages_set_updated_at on public.meta_pages;
create trigger meta_pages_set_updated_at
before update on public.meta_pages
for each row execute function public.set_updated_at();

drop trigger if exists meta_forms_set_updated_at on public.meta_forms;
create trigger meta_forms_set_updated_at
before update on public.meta_forms
for each row execute function public.set_updated_at();

alter table public.meta_integrations enable row level security;
alter table public.meta_pages enable row level security;
alter table public.meta_forms enable row level security;

create policy "Members can read organization meta integrations"
on public.meta_integrations
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can manage meta integrations"
on public.meta_integrations
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update meta integrations"
on public.meta_integrations
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

create policy "Owners and admins can delete meta integrations"
on public.meta_integrations
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Members can read organization meta pages"
on public.meta_pages
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can manage meta pages"
on public.meta_pages
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update meta pages"
on public.meta_pages
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

create policy "Owners and admins can delete meta pages"
on public.meta_pages
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Members can read organization meta forms"
on public.meta_forms
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can manage meta forms"
on public.meta_forms
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update meta forms"
on public.meta_forms
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

create policy "Owners and admins can delete meta forms"
on public.meta_forms
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

comment on table public.meta_pages is
  'Paginas Meta conectadas a uma integracao da organizacao.';

comment on table public.meta_forms is
  'Formularios Meta conectados a paginas integradas, isolados por organizacao.';

notify pgrst, 'reload schema';
