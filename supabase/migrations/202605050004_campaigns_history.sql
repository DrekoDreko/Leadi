-- Campaign history for generated Meta campaign drafts.

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'generated' check (status in ('generated', 'archived')),
  product text not null default 'Plano de saude empresarial',
  audience text not null,
  offer text not null,
  region text not null,
  differentiator text not null,
  tone text not null,
  campaign_name text not null,
  primary_text text not null,
  headline text not null,
  description text not null,
  call_to_action text not null,
  suggested_audience text not null,
  variants jsonb not null default '[]'::jsonb,
  compliance_notes jsonb not null default '[]'::jsonb,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_organization_created_at_idx
  on public.campaigns (organization_id, created_at desc);

create index if not exists campaigns_created_by_idx
  on public.campaigns (created_by_profile_id, created_at desc);

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

drop policy if exists "Members can read organization campaigns" on public.campaigns;
create policy "Members can read organization campaigns"
on public.campaigns
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Members can create organization campaigns" on public.campaigns;
create policy "Members can create organization campaigns"
on public.campaigns
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
  and created_by_profile_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);
