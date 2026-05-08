create table if not exists public.lead_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_profile_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create index if not exists lead_comments_lead_created_idx
  on public.lead_comments (lead_id, created_at asc);

create index if not exists lead_comments_org_created_idx
  on public.lead_comments (organization_id, created_at desc);

drop trigger if exists lead_comments_set_updated_at on public.lead_comments;
create trigger lead_comments_set_updated_at
before update on public.lead_comments
for each row execute function public.set_updated_at();

alter table public.lead_comments enable row level security;

drop policy if exists "Members can read workspace lead comments" on public.lead_comments;
create policy "Members can read workspace lead comments"
on public.lead_comments
for select
using (
  organization_id = public.current_profile_organization_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
);

drop policy if exists "Members can create workspace lead comments" on public.lead_comments;
create policy "Members can create workspace lead comments"
on public.lead_comments
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and author_profile_id = public.current_profile_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
);

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_profile_organization_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

notify pgrst, 'reload schema';
