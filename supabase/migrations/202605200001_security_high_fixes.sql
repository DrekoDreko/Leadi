-- High-risk security fixes from the 2026-05-20 audit.
-- Forward-only hardening: do not edit already-applied historical migrations.

-- Prevent authenticated clients from reading ciphertext/reference columns for integration secrets.
revoke select on table public.meta_integrations from anon, authenticated;
revoke select on table public.openai_connections from anon, authenticated;

grant select (
  id,
  organization_id,
  connected_by_profile_id,
  connected_at,
  expires_at,
  meta_user_id,
  meta_user_name,
  meta_account_id,
  meta_account_name,
  token_expires_at,
  status,
  connection_status,
  scopes,
  last_synced_at,
  last_error,
  created_at,
  updated_at
) on public.meta_integrations to authenticated;

grant select (
  id,
  organization_id,
  connected_by_profile_id,
  provider,
  status,
  connected_at,
  last_validated_at,
  last_error,
  created_at,
  updated_at
) on public.openai_connections to authenticated;

-- Financial state must be mutated by service-role server code/RPCs only.
drop policy if exists "Billing managers can create workspace subscriptions" on public.subscriptions;
drop policy if exists "Billing managers can update workspace subscriptions" on public.subscriptions;
drop policy if exists "Owners and admins can manage subscriptions" on public.subscriptions;
drop policy if exists "Owners and admins can update subscriptions" on public.subscriptions;
drop policy if exists "Billing managers can create workspace payment events" on public.payment_events;

revoke insert, update on table public.subscriptions from anon, authenticated;
revoke insert on table public.payment_events from anon, authenticated;

notify pgrst, 'reload schema';
