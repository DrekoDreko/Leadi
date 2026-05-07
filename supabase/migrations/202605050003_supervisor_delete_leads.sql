-- Restrict lead deletion to users with the supervisor role.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'admin', 'seller', 'supervisor'));

drop policy if exists "Owners and admins can delete organization leads" on public.leads;
drop policy if exists "Supervisors can delete organization leads" on public.leads;

create policy "Supervisors can delete organization leads"
on public.leads
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'supervisor'
  )
);
