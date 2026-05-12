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

-- 5. Billing & Credits
drop policy if exists "Members can read credit wallets" on public.credit_wallets;
create policy "Members can read credit wallets"
on public.credit_wallets
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can read credit transactions" on public.credit_transactions;
create policy "Members can read credit transactions"
on public.credit_transactions
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can read billing purchases" on public.billing_purchases;
create policy "Members can read billing purchases"
on public.billing_purchases
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can read workspace subscriptions" on public.subscriptions;
create policy "Members can read workspace subscriptions"
on public.subscriptions
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Billing managers can create workspace subscriptions" on public.subscriptions;
create policy "Owners and admins can manage subscriptions"
on public.subscriptions
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Billing managers can update workspace subscriptions" on public.subscriptions;
create policy "Owners and admins can update subscriptions"
on public.subscriptions
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Members can read workspace payment events" on public.payment_events;
create policy "Members can read workspace payment events"
on public.payment_events
for select
using (organization_id = public.current_profile_organization_id());

-- 6. WhatsApp & Campaigns
drop policy if exists "Members can read organization whatsapp messages" on public.whatsapp_messages;
create policy "Members can read organization whatsapp messages"
on public.whatsapp_messages
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can create organization whatsapp messages" on public.whatsapp_messages;
create policy "Members can create organization whatsapp messages"
on public.whatsapp_messages
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
);

drop policy if exists "Members can read organization campaigns" on public.campaigns;
create policy "Members can read organization campaigns"
on public.campaigns
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can create organization campaigns" on public.campaigns;
create policy "Members can create organization campaigns"
on public.campaigns
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
);

-- 7. Meta Integrations & Accounts
drop policy if exists "Members can read organization meta integrations" on public.meta_integrations;
create policy "Members can read organization meta integrations"
on public.meta_integrations
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Owners and admins can manage meta integrations" on public.meta_integrations;
create policy "Owners and admins can create meta integrations"
on public.meta_integrations
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Owners and admins can update meta integrations" on public.meta_integrations;
create policy "Owners and admins can update meta integrations"
on public.meta_integrations
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Owners and admins can delete meta integrations" on public.meta_integrations;
create policy "Owners and admins can delete meta integrations"
on public.meta_integrations
for delete
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Members can read organization meta pages" on public.meta_pages;
create policy "Members can read organization meta pages"
on public.meta_pages
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Owners and admins can manage meta pages" on public.meta_pages;
create policy "Owners and admins can create meta pages"
on public.meta_pages
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Members can read organization meta forms" on public.meta_forms;
create policy "Members can read organization meta forms"
on public.meta_forms
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can read organization meta ad accounts" on public.meta_ad_accounts;
create policy "Members can read organization meta ad accounts"
on public.meta_ad_accounts
for select
using (organization_id = public.current_profile_organization_id());

-- 8. Webhooks (Fixing missing policies)
drop policy if exists "Owners and admins can read webhook integrations" on public.lead_webhook_integrations;
create policy "Owners and admins can read webhook integrations"
on public.lead_webhook_integrations
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Owners and admins can read webhook events" on public.lead_webhook_events;
create policy "Owners and admins can read webhook events"
on public.lead_webhook_events
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

-- 9. Other Connections & Logs
drop policy if exists "Members can read organization openai connections" on public.openai_connections;
create policy "Members can read organization openai connections"
on public.openai_connections
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can read integration sync logs" on public.integration_sync_logs;
create policy "Members can read integration sync logs"
on public.integration_sync_logs
for select
using (organization_id = public.current_profile_organization_id());

drop policy if exists "Members can read workspace lead follow up events" on public.lead_follow_up_events;
create policy "Members can read workspace lead follow up events"
on public.lead_follow_up_events
for select
using (
  organization_id = public.current_profile_organization_id()
  and lead_id in (
    select id
    from public.leads
    where organization_id = public.current_profile_organization_id()
  )
);

drop policy if exists "Members can create workspace lead follow up events" on public.lead_follow_up_events;
create policy "Members can create workspace lead follow up events"
on public.lead_follow_up_events
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

-- 10. Final check and grants
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_profile_organization_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

notify pgrst, 'reload schema';
