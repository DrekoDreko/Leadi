-- Supabase hardening pass for tenant isolation and least-privilege reads.
-- Forward-only migration: do not edit historical migrations.

create or replace function public.current_profile_is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin', 'supervisor')
  )
$$;

create or replace function public.current_profile_can_access_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leads
    where id = target_lead_id
      and organization_id = public.current_profile_organization_id()
      and (
        public.current_profile_is_manager()
        or owner_profile_id = public.current_profile_id()
      )
  )
$$;

create or replace function public.current_profile_can_access_campaign(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns
    where id = target_campaign_id
      and organization_id = public.current_profile_organization_id()
      and (
        public.current_profile_is_manager()
        or created_by_profile_id = public.current_profile_id()
      )
  )
$$;

grant execute on function public.current_profile_is_manager() to authenticated;
grant execute on function public.current_profile_can_access_lead(uuid) to authenticated;
grant execute on function public.current_profile_can_access_campaign(uuid) to authenticated;

alter table public.lead_comments enable row level security;
alter table public.campaigns enable row level security;
alter table public.meta_integrations enable row level security;
alter table public.meta_pages enable row level security;
alter table public.meta_forms enable row level security;
alter table public.meta_ad_accounts enable row level security;
alter table public.openai_connections enable row level security;
alter table public.integration_sync_logs enable row level security;
alter table public.lead_webhook_integrations enable row level security;
alter table public.lead_webhook_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.billing_purchases enable row level security;
alter table public.org_ai_balances enable row level security;
alter table public.ai_credit_ledger enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "Members can read workspace lead comments" on public.lead_comments;
create policy "Members can read visible lead comments"
on public.lead_comments
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_lead(lead_id)
);

drop policy if exists "Members can create workspace lead comments" on public.lead_comments;
create policy "Members can create comments on visible leads"
on public.lead_comments
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and author_profile_id = public.current_profile_id()
  and public.current_profile_can_access_lead(lead_id)
);

drop policy if exists "Members can read organization campaigns" on public.campaigns;
create policy "Members can read visible campaigns"
on public.campaigns
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_campaign(id)
);

drop policy if exists "Members can create organization campaigns" on public.campaigns;
create policy "Members can create organization campaigns"
on public.campaigns
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
);

drop policy if exists "Members can read organization meta integrations" on public.meta_integrations;
create policy "Managers can read organization meta integrations"
on public.meta_integrations
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization meta pages" on public.meta_pages;
create policy "Managers can read organization meta pages"
on public.meta_pages
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization meta forms" on public.meta_forms;
create policy "Managers can read organization meta forms"
on public.meta_forms
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization meta ad accounts" on public.meta_ad_accounts;
create policy "Managers can read organization meta ad accounts"
on public.meta_ad_accounts
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization openai connections" on public.openai_connections;
create policy "Managers can read organization openai connections"
on public.openai_connections
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read integration sync logs" on public.integration_sync_logs;
create policy "Managers can read integration sync logs"
on public.integration_sync_logs
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Owners and admins can read webhook integrations" on public.lead_webhook_integrations;
create policy "Managers can read webhook integrations"
on public.lead_webhook_integrations
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Owners and admins can read webhook events" on public.lead_webhook_events;
create policy "Managers can read webhook events"
on public.lead_webhook_events
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read workspace subscriptions" on public.subscriptions;
create policy "Managers can read subscriptions"
on public.subscriptions
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read workspace payment events" on public.payment_events;
create policy "Managers can read payment events"
on public.payment_events
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read credit wallets" on public.credit_wallets;
create policy "Managers can read credit wallets"
on public.credit_wallets
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read credit transactions" on public.credit_transactions;
create policy "Managers can read credit transactions"
on public.credit_transactions
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read billing purchases" on public.billing_purchases;
create policy "Managers can read billing purchases"
on public.billing_purchases
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization AI balances" on public.org_ai_balances;
create policy "Managers can read organization AI balances"
on public.org_ai_balances
for select
using (
  org_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization AI ledger" on public.ai_credit_ledger;
create policy "Managers can read organization AI ledger"
on public.ai_credit_ledger
for select
using (
  org_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

drop policy if exists "Members can read organization AI usage events" on public.ai_usage_events;
create policy "Managers can read organization AI usage events"
on public.ai_usage_events
for select
using (
  org_id = public.current_profile_organization_id()
  and public.current_profile_is_manager()
);

notify pgrst, 'reload schema';
