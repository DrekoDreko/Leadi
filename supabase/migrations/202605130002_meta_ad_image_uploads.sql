-- Base para upload de imagens na biblioteca de anuncios da Meta.

create table if not exists public.meta_ad_image_uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connected_account_id uuid not null references public.meta_integrations(id) on delete cascade,
  meta_ad_account_id text not null,
  creative_request_id uuid references public.creative_requests(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  source_filename text not null,
  source_mime_type text not null,
  source_size_bytes integer not null check (source_size_bytes > 0),
  meta_image_hash text,
  meta_image_id text,
  meta_image_url text,
  meta_response jsonb not null default '{}'::jsonb,
  local_status text not null default 'pending' check (local_status in ('pending', 'uploaded', 'failed')),
  uploaded_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meta_ad_image_uploads_scope_check check (
    num_nonnulls(creative_request_id, campaign_id) = 1
  )
);

create index if not exists meta_ad_image_uploads_org_created_idx
  on public.meta_ad_image_uploads (organization_id, created_at desc);

create index if not exists meta_ad_image_uploads_org_status_idx
  on public.meta_ad_image_uploads (organization_id, local_status, created_at desc);

create index if not exists meta_ad_image_uploads_request_idx
  on public.meta_ad_image_uploads (creative_request_id, created_at desc)
  where creative_request_id is not null;

create index if not exists meta_ad_image_uploads_campaign_idx
  on public.meta_ad_image_uploads (campaign_id, created_at desc)
  where campaign_id is not null;

create index if not exists meta_ad_image_uploads_account_idx
  on public.meta_ad_image_uploads (connected_account_id, meta_ad_account_id, created_at desc);

drop trigger if exists meta_ad_image_uploads_set_updated_at on public.meta_ad_image_uploads;
create trigger meta_ad_image_uploads_set_updated_at
before update on public.meta_ad_image_uploads
for each row execute function public.set_updated_at();

alter table public.meta_ad_image_uploads enable row level security;

drop policy if exists "Members can read organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can read organization meta ad image uploads"
on public.meta_ad_image_uploads
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Members can create organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can create organization meta ad image uploads"
on public.meta_ad_image_uploads
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Members can update organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can update organization meta ad image uploads"
on public.meta_ad_image_uploads
for update
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
)
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Members can delete organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can delete organization meta ad image uploads"
on public.meta_ad_image_uploads
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

comment on table public.meta_ad_image_uploads is
  'Registra uploads de imagens enviados para a biblioteca de anuncios da Meta, com associacao a pedido ou campanha.';

notify pgrst, 'reload schema';
