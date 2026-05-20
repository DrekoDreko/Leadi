-- AI credits foundation for LeadHealth.
-- This migration creates the organization balance, ledger, and usage audit tables.

create table if not exists public.org_ai_balances (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  available_credits integer not null default 0 check (available_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('purchase', 'monthly_grant', 'usage', 'refund', 'adjustment')),
  credits integer not null check (credits <> 0),
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost numeric,
  credits_charged integer not null check (credits_charged >= 0),
  status text not null check (status in ('success', 'failed', 'refunded')),
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists org_ai_balances_updated_idx
  on public.org_ai_balances (updated_at desc);

create index if not exists ai_credit_ledger_org_created_idx
  on public.ai_credit_ledger (org_id, created_at desc);

create index if not exists ai_usage_events_org_created_idx
  on public.ai_usage_events (org_id, created_at desc);

create trigger org_ai_balances_set_updated_at
before update on public.org_ai_balances
for each row execute function public.set_updated_at();

insert into public.org_ai_balances (org_id)
select id
from public.organizations
on conflict (org_id) do nothing;

create or replace function public.ensure_org_ai_balance(target_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_org_id is null then
    raise exception 'Organização não informada.';
  end if;

  insert into public.org_ai_balances (org_id)
  values (target_org_id)
  on conflict (org_id) do nothing;
end;
$$;

create or replace function public.apply_ai_credit_change(
  target_org_id uuid,
  amount integer,
  p_type text,
  p_user_id uuid default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  new_balance integer,
  ledger_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  balance_row public.org_ai_balances%rowtype;
begin
  if target_org_id is null then
    raise exception 'Organização não informada.';
  end if;

  if amount is null or amount = 0 then
    raise exception 'Quantidade de créditos inválida.';
  end if;

  perform public.ensure_org_ai_balance(target_org_id);

  select *
  into balance_row
  from public.org_ai_balances
  where org_id = target_org_id
  for update;

  if amount < 0 and balance_row.available_credits + amount < 0 then
    raise exception 'Você não possui créditos de IA suficientes para executar esta ação.';
  end if;

  update public.org_ai_balances
  set available_credits = available_credits + amount
  where org_id = target_org_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    credits,
    description,
    metadata
  )
  values (
    target_org_id,
    p_user_id,
    p_type,
    amount,
    p_description,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into ledger_id;

  return query
  select new_balance, ledger_id;
end;
$$;

create or replace function public.handle_new_org_ai_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_ai_balances (org_id)
  values (new.id)
  on conflict (org_id) do nothing;

  return new;
end;
$$;

drop trigger if exists ensure_org_ai_balance_on_organization_insert on public.organizations;
create trigger ensure_org_ai_balance_on_organization_insert
after insert on public.organizations
for each row execute function public.handle_new_org_ai_balance();

alter table public.org_ai_balances enable row level security;
alter table public.ai_credit_ledger enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "Members can read organization AI balances" on public.org_ai_balances;
create policy "Members can read organization AI balances"
on public.org_ai_balances
for select
using (org_id = public.current_profile_organization_id());

drop policy if exists "Members can read organization AI ledger" on public.ai_credit_ledger;
create policy "Members can read organization AI ledger"
on public.ai_credit_ledger
for select
using (org_id = public.current_profile_organization_id());

drop policy if exists "Members can read organization AI usage events" on public.ai_usage_events;
create policy "Members can read organization AI usage events"
on public.ai_usage_events
for select
using (org_id = public.current_profile_organization_id());

grant select on public.org_ai_balances to authenticated;
grant select on public.ai_credit_ledger to authenticated;
grant select on public.ai_usage_events to authenticated;
