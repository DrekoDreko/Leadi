-- Stores sanitized Meta campaign publication attempts and their outcomes.

create table if not exists public.meta_campaign_publication_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  connected_account_id uuid references public.meta_integrations(id) on delete set null,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  publish_mode text not null check (publish_mode in ('draft', 'manual_review', 'scheduled', 'paused')),
  status text not null check (status in ('pending', 'success', 'failed', 'skipped')),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meta_campaign_publication_attempts_org_created_at_idx
  on public.meta_campaign_publication_attempts (organization_id, created_at desc);

create index if not exists meta_campaign_publication_attempts_campaign_idx
  on public.meta_campaign_publication_attempts (campaign_id, created_at desc);

drop trigger if exists meta_campaign_publication_attempts_set_updated_at on public.meta_campaign_publication_attempts;
create trigger meta_campaign_publication_attempts_set_updated_at
before update on public.meta_campaign_publication_attempts
for each row execute function public.set_updated_at();

alter table public.meta_campaign_publication_attempts enable row level security;

drop policy if exists "Members can read organization meta campaign publication attempts" on public.meta_campaign_publication_attempts;
create policy "Members can read organization meta campaign publication attempts"
on public.meta_campaign_publication_attempts
for select
using (
  organization_id = public.current_profile_organization_id()
);
