-- Restrict Meta Ads leads to supervisors and owner-managed manual leads to their creator.

drop policy if exists "Members can create organization leads" on public.leads;
drop policy if exists "Members can update organization leads" on public.leads;
drop policy if exists "Supervisors can update organization leads" on public.leads;
drop policy if exists "Lead owners can update own non Meta leads" on public.leads;
drop policy if exists "Supervisors can delete organization leads" on public.leads;
drop policy if exists "Lead owners can delete own non Meta leads" on public.leads;

create policy "Members can create organization leads"
on public.leads
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and (
        p.role = 'supervisor'
        or (
          public.leads.owner_profile_id = p.id
          and public.leads.source <> 'meta_lead_ads'
        )
      )
  )
);

create policy "Supervisors can update organization leads"
on public.leads
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and p.role = 'supervisor'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and p.role = 'supervisor'
  )
);

create policy "Lead owners can update own non Meta leads"
on public.leads
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and public.leads.owner_profile_id = p.id
      and public.leads.source <> 'meta_lead_ads'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and public.leads.owner_profile_id = p.id
      and public.leads.source <> 'meta_lead_ads'
  )
);

create policy "Supervisors can delete organization leads"
on public.leads
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and p.role = 'supervisor'
  )
);

create policy "Lead owners can delete own non Meta leads"
on public.leads
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and public.leads.owner_profile_id = p.id
      and public.leads.source <> 'meta_lead_ads'
  )
);
