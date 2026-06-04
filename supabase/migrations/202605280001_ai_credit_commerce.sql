alter table public.ai_credit_ledger
  add column if not exists balance_after integer,
  add column if not exists reason text,
  add column if not exists reference_type text,
  add column if not exists reference_id text;

update public.ai_credit_ledger
set
  balance_after = coalesce(balance_after, 0),
  reason = coalesce(reason, description)
where balance_after is null
   or reason is null;

alter table public.ai_credit_ledger
  alter column balance_after set default 0;

update public.ai_credit_ledger
set balance_after = 0
where balance_after is null;

alter table public.ai_credit_ledger
  alter column balance_after set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_credit_ledger_balance_after_nonnegative'
  ) then
    alter table public.ai_credit_ledger
      add constraint ai_credit_ledger_balance_after_nonnegative
      check (balance_after >= 0);
  end if;
end $$;

create unique index if not exists ai_credit_ledger_reference_unique_idx
  on public.ai_credit_ledger (org_id, type, reference_type, reference_id)
  where reference_type is not null and reference_id is not null;

create table if not exists public.ai_credit_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  credits integer not null check (credits > 0),
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'BRL',
  description text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_credit_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  package_id uuid not null references public.ai_credit_packages(id) on delete restrict,
  payment_provider text not null default 'mercadopago',
  provider_payment_id text,
  provider_preference_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'failed', 'refunded')),
  amount_cents integer not null check (amount_cents > 0),
  credits integer not null check (credits > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists ai_credit_packages_active_idx
  on public.ai_credit_packages (is_active, is_featured, created_at desc);

create index if not exists ai_credit_orders_org_created_idx
  on public.ai_credit_orders (organization_id, created_at desc);

create index if not exists ai_credit_orders_org_status_idx
  on public.ai_credit_orders (organization_id, status, updated_at desc);

create unique index if not exists ai_credit_orders_payment_id_idx
  on public.ai_credit_orders (provider_payment_id)
  where provider_payment_id is not null;

create unique index if not exists ai_credit_orders_preference_id_idx
  on public.ai_credit_orders (provider_preference_id)
  where provider_preference_id is not null;

drop trigger if exists ai_credit_packages_set_updated_at on public.ai_credit_packages;
create trigger ai_credit_packages_set_updated_at
before update on public.ai_credit_packages
for each row execute function public.set_updated_at();

drop trigger if exists ai_credit_orders_set_updated_at on public.ai_credit_orders;
create trigger ai_credit_orders_set_updated_at
before update on public.ai_credit_orders
for each row execute function public.set_updated_at();

insert into public.ai_credit_packages (
  slug,
  name,
  credits,
  price_cents,
  currency,
  description,
  is_active,
  is_featured,
  metadata
)
values
  (
    'essencial',
    'Essencial',
    100,
    2990,
    'BRL',
    'Indicado para mensagens e pequenos textos.',
    true,
    false,
    jsonb_build_object(
      'approximate_uses',
      jsonb_build_array(
        'ate 100 mensagens de WhatsApp com IA',
        'ou ate 20 textos curtos de anuncio'
      )
    )
  ),
  (
    'campanhas',
    'Campanhas',
    350,
    7990,
    'BRL',
    'Indicado para criar campanhas, copies e variacoes de anuncios.',
    true,
    true,
    jsonb_build_object(
      'badge',
      'Mais escolhido',
      'approximate_uses',
      jsonb_build_array(
        'ate 70 textos de anuncio',
        'ou ate 350 mensagens',
        'ou uso misto entre mensagens e campanhas'
      )
    )
  ),
  (
    'criativos',
    'Criativos',
    800,
    16990,
    'BRL',
    'Indicado para campanhas com geracao de imagem.',
    true,
    false,
    jsonb_build_object(
      'approximate_uses',
      jsonb_build_array(
        'ate 16 imagens de anuncio',
        'ou ate 160 textos de anuncio',
        'ou uso misto com mensagens, textos e imagens'
      )
    )
  )
on conflict (slug) do update
set
  name = excluded.name,
  credits = excluded.credits,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  description = excluded.description,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  metadata = excluded.metadata;

create or replace function public.add_ai_credits(
  target_org_id uuid,
  amount integer,
  p_type text default 'purchase',
  p_user_id uuid default null,
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id text default null,
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
  existing_ledger public.ai_credit_ledger%rowtype;
begin
  if target_org_id is null then
    raise exception 'Organização não informada.';
  end if;

  if amount is null or amount <= 0 then
    raise exception 'Quantidade de créditos inválida.';
  end if;

  if p_type not in ('purchase', 'monthly_grant', 'refund', 'adjustment') then
    raise exception 'Tipo de transação de crédito inválido.';
  end if;

  perform public.ensure_org_ai_balance(target_org_id);

  if p_reference_type is not null and p_reference_id is not null then
    select *
    into existing_ledger
    from public.ai_credit_ledger
    where org_id = target_org_id
      and type = p_type
      and reference_type = p_reference_type
      and reference_id = p_reference_id
    limit 1;

    if existing_ledger.id is not null then
      return query
      select existing_ledger.balance_after, existing_ledger.id;
      return;
    end if;
  end if;

  select *
  into balance_row
  from public.org_ai_balances
  where org_id = target_org_id
  for update;

  update public.org_ai_balances
  set available_credits = available_credits + amount
  where org_id = target_org_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    credits,
    balance_after,
    reason,
    description,
    reference_type,
    reference_id,
    metadata
  )
  values (
    target_org_id,
    p_user_id,
    p_type,
    amount,
    new_balance,
    p_reason,
    p_reason,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into ledger_id;

  return query
  select new_balance, ledger_id;
end;
$$;

create or replace function public.consume_ai_credits(
  target_org_id uuid,
  amount integer,
  p_user_id uuid default null,
  p_reason text default null,
  p_reference_type text default null,
  p_reference_id text default null,
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
  existing_ledger public.ai_credit_ledger%rowtype;
begin
  if target_org_id is null then
    raise exception 'Organização não informada.';
  end if;

  if amount is null or amount <= 0 then
    raise exception 'Quantidade de créditos inválida.';
  end if;

  perform public.ensure_org_ai_balance(target_org_id);

  if p_reference_type is not null and p_reference_id is not null then
    select *
    into existing_ledger
    from public.ai_credit_ledger
    where org_id = target_org_id
      and type = 'usage'
      and reference_type = p_reference_type
      and reference_id = p_reference_id
    limit 1;

    if existing_ledger.id is not null then
      return query
      select existing_ledger.balance_after, existing_ledger.id;
      return;
    end if;
  end if;

  select *
  into balance_row
  from public.org_ai_balances
  where org_id = target_org_id
  for update;

  if balance_row.available_credits < amount then
    raise exception 'Você não possui créditos de IA suficientes para executar esta ação.';
  end if;

  update public.org_ai_balances
  set available_credits = available_credits - amount
  where org_id = target_org_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    credits,
    balance_after,
    reason,
    description,
    reference_type,
    reference_id,
    metadata
  )
  values (
    target_org_id,
    p_user_id,
    'usage',
    -amount,
    new_balance,
    p_reason,
    p_reason,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into ledger_id;

  return query
  select new_balance, ledger_id;
end;
$$;

create or replace function public.finalize_ai_credit_order_payment(
  target_order_id uuid,
  p_provider_payment_id text,
  p_provider_preference_id text default null,
  p_paid_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  order_status text,
  already_processed boolean,
  new_balance integer,
  ledger_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.ai_credit_orders%rowtype;
  balance_row public.org_ai_balances%rowtype;
  package_row public.ai_credit_packages%rowtype;
  existing_ledger public.ai_credit_ledger%rowtype;
begin
  if target_order_id is null then
    raise exception 'Pedido de créditos não informado.';
  end if;

  select *
  into order_row
  from public.ai_credit_orders
  where id = target_order_id
  for update;

  if order_row.id is null then
    raise exception 'Pedido de créditos não encontrado.';
  end if;

  perform public.ensure_org_ai_balance(order_row.organization_id);

  select *
  into balance_row
  from public.org_ai_balances
  where org_id = order_row.organization_id
  for update;

  if order_row.status = 'paid' then
    select *
    into existing_ledger
    from public.ai_credit_ledger
    where org_id = order_row.organization_id
      and type = 'purchase'
      and reference_type = 'ai_credit_order_payment'
      and reference_id = coalesce(order_row.provider_payment_id, target_order_id::text)
    order by created_at desc
    limit 1;

    return query
    select
      order_row.status,
      true,
      balance_row.available_credits,
      existing_ledger.id;
    return;
  end if;

  select *
  into package_row
  from public.ai_credit_packages
  where id = order_row.package_id;

  update public.org_ai_balances
  set available_credits = available_credits + order_row.credits
  where org_id = order_row.organization_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    credits,
    balance_after,
    reason,
    description,
    reference_type,
    reference_id,
    metadata
  )
  values (
    order_row.organization_id,
    order_row.user_id,
    'purchase',
    order_row.credits,
    new_balance,
    coalesce(package_row.name, 'Compra de créditos de IA'),
    coalesce(package_row.name, 'Compra de créditos de IA'),
    'ai_credit_order_payment',
    coalesce(p_provider_payment_id, target_order_id::text),
    coalesce(order_row.metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into ledger_id;

  update public.ai_credit_orders
  set
    provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
    provider_preference_id = coalesce(p_provider_preference_id, provider_preference_id),
    status = 'paid',
    paid_at = coalesce(paid_at, p_paid_at, now()),
    metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
  where id = target_order_id
  returning status into order_status;

  return query
  select order_status, false, new_balance, ledger_id;
end;
$$;

alter table public.ai_credit_packages enable row level security;
alter table public.ai_credit_orders enable row level security;

drop policy if exists "Authenticated users can read active AI credit packages" on public.ai_credit_packages;
create policy "Authenticated users can read active AI credit packages"
on public.ai_credit_packages
for select
using (is_active = true);

drop policy if exists "Members can read organization AI credit orders" on public.ai_credit_orders;
create policy "Members can read organization AI credit orders"
on public.ai_credit_orders
for select
using (organization_id = public.current_profile_organization_id());

grant select on public.ai_credit_packages to authenticated;
grant select on public.ai_credit_orders to authenticated;
grant execute on function public.add_ai_credits(uuid, integer, text, uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.consume_ai_credits(uuid, integer, uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.finalize_ai_credit_order_payment(uuid, text, text, timestamptz, jsonb) to authenticated;

notify pgrst, 'reload schema';
