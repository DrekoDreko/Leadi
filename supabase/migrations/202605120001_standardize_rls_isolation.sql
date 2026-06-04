-- Standardize RLS policies to ensure robust multi-tenant isolation.
-- This migration replaces old subquery-based policies with optimized helper functions
-- and fixes missing or incomplete policies.

-- 1. Ensure helper functions are available and up to date.
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

-- 2. Organizations
drop policy if exists "Members can read their workspace" on public.organizations;
drop policy if exists "Owners and admins can update their organization" on public.organizations;
drop policy if exists "Supervisors can update their workspace" on public.organizations;

create policy "Members can read their workspace"
on public.organizations
for select
using (id = public.current_profile_organization_id());

create policy "Owners and admins can update their organization"
on public.organizations
for update
using (
  id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

-- 3. Profiles
drop policy if exists "Members can read workspace profiles" on public.profiles;
drop policy if exists "Users can update their own display name" on public.profiles;

create policy "Members can read workspace profiles"
on public.profiles
for select
using (
  auth_user_id = auth.uid()
  or organization_id = public.current_profile_organization_id()
);

-- Note: Profile updates are restricted to 'full_name' via GRANTS in 202604280002.
create policy "Users can update their own profile"
on public.profiles
for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

-- 4. Leads
drop policy if exists "Members can read permitted workspace leads" on public.leads;
drop policy if exists "Members can create organization leads" on public.leads;
drop policy if exists "Owners and admins can update organization leads" on public.leads;
drop policy if exists "Lead owners can update own non Meta leads" on public.leads;
drop policy if exists "Owners and admins can delete organization leads" on public.leads;
drop policy if exists "Lead owners can delete own non Meta leads" on public.leads;

create policy "Members can read permitted workspace leads"
on public.leads
for select
using (
  organization_id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin')
    or owner_profile_id = public.current_profile_id()
  )
);

create policy "Members can create organization leads"
on public.leads
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin')
    or (
      owner_profile_id = public.current_profile_id()
      and source <> 'meta_lead_ads'
    )
  )
);

create policy "Owners and admins can update organization leads"
on public.leads
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

create policy "Lead owners can update own non Meta leads"
on public.leads
for update
using (
  organization_id = public.current_profile_organization_id()
  and owner_profile_id = public.current_profile_id()
  and source <> 'meta_lead_ads'
)
with check (
  organization_id = public.current_profile_organization_id()
  and owner_profile_id = public.current_profile_id()
  and source <> 'meta_lead_ads'
);

create policy "Owners and admins can delete organization leads"
on public.leads
for delete
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

create policy "Lead owners can delete own non Meta leads"
on public.leads
for delete
using (
  organization_id = public.current_profile_organization_id()
  and owner_profile_id = public.current_profile_id()
  and source <> 'meta_lead_ads'
);



-- 10. Final check and grants
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_profile_organization_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

notify pgrst, 'reload schema';
