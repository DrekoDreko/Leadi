-- Onboarding checklist state persistence
create table if not exists public.onboarding_states (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  dismissed_at timestamptz,
  completed_steps text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.onboarding_states enable row level security;

create policy "Members can read their organization onboarding state"
on public.onboarding_states
for select
using (organization_id = public.current_profile_organization_id());

create policy "Supervisors can update their organization onboarding state"
on public.onboarding_states
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() = 'supervisor'
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() = 'supervisor'
);

create policy "Supervisors can insert their organization onboarding state"
on public.onboarding_states
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() = 'supervisor'
);

-- Trigger for updated_at
create trigger onboarding_states_set_updated_at
before update on public.onboarding_states
for each row execute function public.set_updated_at();

-- Grant access
grant select, insert, update on public.onboarding_states to authenticated;
