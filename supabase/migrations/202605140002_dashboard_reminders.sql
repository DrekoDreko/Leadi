-- Dashboard month reminders shown in the right rail calendar.

create table if not exists public.dashboard_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  reminder_date date not null,
  remind_at timestamptz not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dashboard_reminders_org_date_idx
  on public.dashboard_reminders (organization_id, reminder_date, remind_at asc);

create index if not exists dashboard_reminders_profile_idx
  on public.dashboard_reminders (created_by_profile_id, remind_at desc);

drop trigger if exists dashboard_reminders_set_updated_at on public.dashboard_reminders;
create trigger dashboard_reminders_set_updated_at
before update on public.dashboard_reminders
for each row execute function public.set_updated_at();

alter table public.dashboard_reminders enable row level security;

drop policy if exists "Members can read organization dashboard reminders" on public.dashboard_reminders;
create policy "Members can read organization dashboard reminders"
on public.dashboard_reminders
for select
using (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can create organization dashboard reminders" on public.dashboard_reminders;
create policy "Members can create organization dashboard reminders"
on public.dashboard_reminders
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
);

drop policy if exists "Members can update own organization dashboard reminders" on public.dashboard_reminders;
create policy "Members can update own organization dashboard reminders"
on public.dashboard_reminders
for update
using (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
)
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
);

grant select, insert, update on public.dashboard_reminders to authenticated;

notify pgrst, 'reload schema';
