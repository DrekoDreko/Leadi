-- Follow-up history for commercial agenda execution.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'lead_follow_up_event_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.lead_follow_up_event_type as enum (
      'completed',
      'rescheduled',
      'cancelled',
      'not_completed'
    );
  end if;
end;
$$;

create table if not exists public.lead_follow_up_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  event_type public.lead_follow_up_event_type not null,
  previous_next_contact_at timestamptz,
  next_contact_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_follow_up_events_lead_created_idx
  on public.lead_follow_up_events (lead_id, created_at desc);

create index if not exists lead_follow_up_events_org_created_idx
  on public.lead_follow_up_events (organization_id, created_at desc);

create index if not exists lead_follow_up_events_author_created_idx
  on public.lead_follow_up_events (author_profile_id, created_at desc);

drop trigger if exists lead_follow_up_events_set_updated_at on public.lead_follow_up_events;
create trigger lead_follow_up_events_set_updated_at
before update on public.lead_follow_up_events
for each row execute function public.set_updated_at();

alter table public.lead_follow_up_events enable row level security;

drop policy if exists "Members can read workspace lead follow up events" on public.lead_follow_up_events;
create policy "Members can read workspace lead follow up events"
on public.lead_follow_up_events
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
  and lead_id in (
    select id
    from public.leads
    where organization_id in (
      select organization_id
      from public.profiles
      where auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "Members can create workspace lead follow up events" on public.lead_follow_up_events;
create policy "Members can create workspace lead follow up events"
on public.lead_follow_up_events
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
  and author_profile_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
  )
  and lead_id in (
    select id
    from public.leads
    where organization_id in (
      select organization_id
      from public.profiles
      where auth_user_id = auth.uid()
    )
  )
);

notify pgrst, 'reload schema';
