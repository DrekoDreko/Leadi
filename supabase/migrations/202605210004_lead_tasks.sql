-- Lead-scoped operational tasks kept separate from dashboard reminders.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'lead_task_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.lead_task_status as enum (
      'open',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'lead_task_priority'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.lead_task_priority as enum (
      'low',
      'medium',
      'high'
    );
  end if;
end;
$$;

create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(btrim(title)) > 0),
  description text,
  status public.lead_task_status not null default 'open',
  priority public.lead_task_priority not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_tasks_completed_state_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists lead_tasks_lead_status_due_idx
  on public.lead_tasks (lead_id, status, due_at asc);

create index if not exists lead_tasks_org_assignee_status_due_idx
  on public.lead_tasks (organization_id, assigned_to_profile_id, status, due_at asc);

create index if not exists lead_tasks_org_created_idx
  on public.lead_tasks (organization_id, created_at desc);

drop trigger if exists lead_tasks_set_updated_at on public.lead_tasks;
create trigger lead_tasks_set_updated_at
before update on public.lead_tasks
for each row execute function public.set_updated_at();

alter table public.lead_tasks enable row level security;

drop policy if exists "Members can read workspace lead tasks" on public.lead_tasks;
create policy "Members can read workspace lead tasks"
on public.lead_tasks
for select
using (
  organization_id = public.current_profile_organization_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
);

drop policy if exists "Members can create workspace lead tasks" on public.lead_tasks;
create policy "Members can create workspace lead tasks"
on public.lead_tasks
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
  and (
    assigned_to_profile_id is null
    or assigned_to_profile_id in (
      select id
      from public.profiles
      where organization_id = public.current_profile_organization_id()
    )
  )
);

drop policy if exists "Members can update workspace lead tasks" on public.lead_tasks;
create policy "Members can update workspace lead tasks"
on public.lead_tasks
for update
using (
  organization_id = public.current_profile_organization_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
  and (
    created_by_profile_id = public.current_profile_id()
    or assigned_to_profile_id = public.current_profile_id()
    or public.current_profile_role() in ('owner', 'admin')
  )
)
with check (
  organization_id = public.current_profile_organization_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
  and (
    assigned_to_profile_id is null
    or assigned_to_profile_id in (
      select id
      from public.profiles
      where organization_id = public.current_profile_organization_id()
    )
  )
);

grant select, insert, update on public.lead_tasks to authenticated;

notify pgrst, 'reload schema';
