-- Billing foundation: credit wallet, purchases, and Mercado Pago-backed top-ups.

create table if not exists public.credit_wallets (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_granted integer not null default 0 check (total_granted >= 0),
  total_spent integer not null default 0 check (total_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('grant', 'spend', 'refund', 'adjustment')),
  source text not null check (source in ('plan', 'pack', 'manual', 'webhook', 'system')),
  feature_key text,
  amount integer not null check (amount > 0),
  balance_after integer not null check (balance_after >= 0),
  reference_type text,
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('completed', 'pending', 'cancelled', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.billing_purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  provider text not null default 'mercadopago',
  product_key text not null,
  product_kind text not null check (product_kind in ('plan', 'pack')),
  credits integer not null check (credits > 0),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'BRL',
  status text not null default 'created' check (status in ('created', 'pending', 'approved', 'rejected', 'cancelled', 'credited', 'expired')),
  external_reference text,
  preference_id text,
  payment_id text,
  checkout_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_transactions_org_created_idx
  on public.credit_transactions (organization_id, created_at desc);

create unique index if not exists credit_transactions_reference_unique_idx
  on public.credit_transactions (organization_id, kind, reference_type, reference_id)
  where reference_type is not null and reference_id is not null;

create index if not exists billing_purchases_org_created_idx
  on public.billing_purchases (organization_id, created_at desc);

create unique index if not exists billing_purchases_external_reference_idx
  on public.billing_purchases (external_reference)
  where external_reference is not null;

create unique index if not exists billing_purchases_preference_id_idx
  on public.billing_purchases (preference_id)
  where preference_id is not null;

create unique index if not exists billing_purchases_payment_id_idx
  on public.billing_purchases (payment_id)
  where payment_id is not null;

create trigger credit_wallets_set_updated_at
before update on public.credit_wallets
for each row execute function public.set_updated_at();

create trigger billing_purchases_set_updated_at
before update on public.billing_purchases
for each row execute function public.set_updated_at();

insert into public.credit_wallets (organization_id)
select id
from public.organizations
on conflict (organization_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  new_profile_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.organizations (name, type)
  values (display_name || ' CRM', 'solo')
  returning id into new_organization_id;

  insert into public.profiles (
    auth_user_id,
    organization_id,
    full_name,
    email,
    role,
    profile_setup_completed
  )
  values (
    new.id,
    new_organization_id,
    display_name,
    new.email,
    'seller',
    false
  )
  returning id into new_profile_id;

  update public.organizations
  set owner_profile_id = new_profile_id
  where id = new_organization_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_organization_id, new_profile_id, 'seller', 'active')
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, status = excluded.status;

  insert into public.credit_wallets (organization_id)
  values (new_organization_id)
  on conflict (organization_id) do nothing;

  return new;
end;
$$;

create or replace function public.ensure_credit_wallet(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_wallets (organization_id)
  values (target_organization_id)
  on conflict (organization_id) do nothing;
end;
$$;

create or replace function public.grant_credits(
  target_organization_id uuid,
  amount integer,
  p_source text,
  p_feature_key text default null,
  p_reference_type text default null,
  p_reference_id text default null,
  p_created_by_profile_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  new_balance integer,
  transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.credit_wallets%rowtype;
  existing_transaction public.credit_transactions%rowtype;
begin
  if amount is null or amount <= 0 then
    raise exception 'Quantidade de créditos invalida.';
  end if;

  perform public.ensure_credit_wallet(target_organization_id);

  if p_reference_type is not null and p_reference_id is not null then
    select *
    into existing_transaction
    from public.credit_transactions
    where organization_id = target_organization_id
      and kind = 'grant'
      and reference_type = p_reference_type
      and reference_id = p_reference_id
    limit 1;

    if existing_transaction.id is not null then
      return query
      select existing_transaction.balance_after, existing_transaction.id;
      return;
    end if;
  end if;

  select *
  into wallet_row
  from public.credit_wallets
  where organization_id = target_organization_id
  for update;

  update public.credit_wallets
  set
    balance = balance + amount,
    total_granted = total_granted + amount
  where organization_id = target_organization_id
  returning balance into new_balance;

  insert into public.credit_transactions (
    organization_id,
    created_by_profile_id,
    kind,
    source,
    feature_key,
    amount,
    balance_after,
    reference_type,
    reference_id,
    metadata,
    status
  )
  values (
    target_organization_id,
    p_created_by_profile_id,
    'grant',
    p_source,
    p_feature_key,
    amount,
    new_balance,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb),
    'completed'
  )
  returning id into transaction_id;

  return query
  select new_balance, transaction_id;
end;
$$;

create or replace function public.consume_credits(
  target_organization_id uuid,
  amount integer,
  p_source text,
  p_feature_key text,
  p_reference_type text default null,
  p_reference_id text default null,
  p_created_by_profile_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  new_balance integer,
  transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  wallet_row public.credit_wallets%rowtype;
  existing_transaction public.credit_transactions%rowtype;
begin
  if amount is null or amount <= 0 then
    raise exception 'Quantidade de créditos invalida.';
  end if;

  perform public.ensure_credit_wallet(target_organization_id);

  if p_reference_type is not null and p_reference_id is not null then
    select *
    into existing_transaction
    from public.credit_transactions
    where organization_id = target_organization_id
      and kind = 'spend'
      and reference_type = p_reference_type
      and reference_id = p_reference_id
    limit 1;

    if existing_transaction.id is not null then
      return query
      select existing_transaction.balance_after, existing_transaction.id;
      return;
    end if;
  end if;

  select *
  into wallet_row
  from public.credit_wallets
  where organization_id = target_organization_id
  for update;

  if wallet_row.balance < amount then
    raise exception 'Créditos insuficientes.';
  end if;

  update public.credit_wallets
  set
    balance = balance - amount,
    total_spent = total_spent + amount
  where organization_id = target_organization_id
  returning balance into new_balance;

  insert into public.credit_transactions (
    organization_id,
    created_by_profile_id,
    kind,
    source,
    feature_key,
    amount,
    balance_after,
    reference_type,
    reference_id,
    metadata,
    status
  )
  values (
    target_organization_id,
    p_created_by_profile_id,
    'spend',
    p_source,
    p_feature_key,
    amount,
    new_balance,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb),
    'completed'
  )
  returning id into transaction_id;

  return query
  select new_balance, transaction_id;
end;
$$;

alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.billing_purchases enable row level security;

create policy "Members can read credit wallets"
on public.credit_wallets
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Members can read credit transactions"
on public.credit_transactions
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

create policy "Members can read billing purchases"
on public.billing_purchases
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);
