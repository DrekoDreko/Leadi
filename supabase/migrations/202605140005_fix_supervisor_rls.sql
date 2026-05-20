-- Fix RLS policies to include the 'supervisor' role in manager permissions.
-- This ensures that users with the 'supervisor' role (assigned during team onboarding)
-- can correctly manage leads and other organization resources.

-- 1. Organizations
drop policy if exists "Owners and admins can update their organization" on public.organizations;
create policy "Owners and admins can update their organization"
on public.organizations
for update
using (
  id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
)
with check (
  id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

-- 2. Profiles
-- (Members can already read all profiles in their organization)

-- 3. Leads
drop policy if exists "Members can read permitted workspace leads" on public.leads;
create policy "Members can read permitted workspace leads"
on public.leads
for select
using (
  organization_id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin', 'supervisor')
    or owner_profile_id = public.current_profile_id()
  )
);

drop policy if exists "Members can create organization leads" on public.leads;
create policy "Members can create organization leads"
on public.leads
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin', 'supervisor')
    or (
      owner_profile_id = public.current_profile_id()
      and source <> 'meta_lead_ads'
    )
  )
);

drop policy if exists "Owners and admins can update organization leads" on public.leads;
create policy "Owners and admins can update organization leads"
on public.leads
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

drop policy if exists "Owners and admins can delete organization leads" on public.leads;
create policy "Owners and admins can delete organization leads"
on public.leads
for delete
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

-- 4. Billing & Credits
drop policy if exists "Owners and admins can manage subscriptions" on public.subscriptions;
create policy "Owners and admins can manage subscriptions"
on public.subscriptions
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

drop policy if exists "Owners and admins can update subscriptions" on public.subscriptions;
create policy "Owners and admins can update subscriptions"
on public.subscriptions
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

-- 5. Meta Integrations
drop policy if exists "Owners and admins can create meta integrations" on public.meta_integrations;
create policy "Owners and admins can create meta integrations"
on public.meta_integrations
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

drop policy if exists "Owners and admins can update meta integrations" on public.meta_integrations;
create policy "Owners and admins can update meta integrations"
on public.meta_integrations
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

drop policy if exists "Owners and admins can delete meta integrations" on public.meta_integrations;
create policy "Owners and admins can delete meta integrations"
on public.meta_integrations
for delete
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

drop policy if exists "Owners and admins can create meta pages" on public.meta_pages;
create policy "Owners and admins can create meta pages"
on public.meta_pages
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

-- 6. Webhooks
drop policy if exists "Owners and admins can read webhook integrations" on public.lead_webhook_integrations;
create policy "Owners and admins can read webhook integrations"
on public.lead_webhook_integrations
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

drop policy if exists "Owners and admins can read webhook events" on public.lead_webhook_events;
create policy "Owners and admins can read webhook events"
on public.lead_webhook_events
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin', 'supervisor')
);

notify pgrst, 'reload schema';
