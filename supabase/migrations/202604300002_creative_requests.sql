-- Creative request queue for design, video, and campaign operations.

create table if not exists public.creative_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('design', 'video', 'campaign')),
  title text not null,
  briefing text not null,
  status text not null default 'requested' check (status in ('requested', 'in_review', 'in_progress', 'delivered', 'approved', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_at timestamptz,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creative_requests_org_created_idx
  on public.creative_requests (organization_id, created_at desc);

create index if not exists creative_requests_org_status_idx
  on public.creative_requests (organization_id, status, created_at desc);

create index if not exists creative_requests_org_priority_idx
  on public.creative_requests (organization_id, priority, due_at asc nulls last);

create index if not exists creative_requests_requester_idx
  on public.creative_requests (requester_profile_id, created_at desc);

drop trigger if exists creative_requests_set_updated_at on public.creative_requests;
create trigger creative_requests_set_updated_at
before update on public.creative_requests
for each row execute function public.set_updated_at();

alter table public.creative_requests enable row level security;

drop policy if exists "Members can read organization creative requests" on public.creative_requests;
create policy "Members can read organization creative requests"
on public.creative_requests
for select
using (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can create organization creative requests" on public.creative_requests;
create policy "Members can create organization creative requests"
on public.creative_requests
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and requester_profile_id = public.current_profile_id()
);

drop policy if exists "Members can update organization creative requests" on public.creative_requests;
create policy "Members can update organization creative requests"
on public.creative_requests
for update
using (
  organization_id = public.current_profile_organization_id()
)
with check (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can delete organization creative requests" on public.creative_requests;
create policy "Members can delete organization creative requests"
on public.creative_requests
for delete
using (
  organization_id = public.current_profile_organization_id()
);

notify pgrst, 'reload schema';
