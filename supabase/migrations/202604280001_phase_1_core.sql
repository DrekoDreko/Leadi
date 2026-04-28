-- Phase 1: Supabase Auth + multi-tenant CRM foundation.
-- Apply this migration in Supabase SQL Editor or through the Supabase CLI.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type public.lead_source as enum (
  'manual',
  'csv_import',
  'meta_lead_ads',
  'make_zapier',
  'api'
);

create type public.lead_stage as enum (
  'new',
  'qualification',
  'proposal',
  'negotiation',
  'won',
  'lost'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  email citext not null,
  role text not null default 'owner' check (role in ('owner', 'admin', 'seller')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text,
  phone_e164 text,
  email citext,
  city text,
  company_name text,
  lives_count integer check (lives_count is null or lives_count >= 0),
  stage public.lead_stage not null default 'new',
  source public.lead_source not null default 'manual',
  score integer not null default 50 check (score between 0 and 100),
  next_contact_at timestamptz,
  budget text,
  interest text,
  last_interaction text,
  notes text,
  source_campaign text,
  source_adset text,
  source_ad text,
  meta_lead_id text,
  meta_form_id text,
  meta_page_id text,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organization_stage_idx on public.leads (organization_id, stage);
create index leads_organization_source_idx on public.leads (organization_id, source);
create index leads_received_at_idx on public.leads (organization_id, received_at desc);
create unique index leads_meta_lead_unique_idx
  on public.leads (organization_id, meta_lead_id)
  where meta_lead_id is not null;
create unique index leads_email_unique_idx
  on public.leads (organization_id, lower(email::text))
  where email is not null;
create unique index leads_phone_unique_idx
  on public.leads (organization_id, phone_e164)
  where phone_e164 is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.organizations (name)
  values (display_name || ' CRM')
  returning id into new_organization_id;

  insert into public.profiles (auth_user_id, organization_id, full_name, email, role)
  values (new.id, new_organization_id, display_name, new.email, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;

create policy "Members can read their organization"
on public.organizations
for select
using (
  id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Owners and admins can update their organization"
on public.organizations
for update
using (
  id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

create policy "Users can read their own profile"
on public.profiles
for select
using (auth_user_id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "Members can read organization leads"
on public.leads
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Members can create organization leads"
on public.leads
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Members can update organization leads"
on public.leads
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

create policy "Owners and admins can delete organization leads"
on public.leads
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);
