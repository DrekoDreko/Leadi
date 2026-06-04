alter table public.org_ai_balances
  add column if not exists included_credits_balance integer not null default 0,
  add column if not exists purchased_credits_balance integer not null default 0,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz;

update public.org_ai_balances
set purchased_credits_balance = coalesce(available_credits, 0)
where purchased_credits_balance = 0
  and included_credits_balance = 0
  and coalesce(available_credits, 0) > 0;

update public.org_ai_balances
set available_credits = greatest(0, included_credits_balance) + greatest(0, purchased_credits_balance);

alter table public.org_ai_balances
  add constraint org_ai_balances_included_nonnegative
    check (included_credits_balance >= 0) not valid;

alter table public.org_ai_balances
  add constraint org_ai_balances_purchased_nonnegative
    check (purchased_credits_balance >= 0) not valid;

alter table public.ai_credit_ledger
  add column if not exists source text,
  add column if not exists included_balance_after integer,
  add column if not exists purchased_balance_after integer;

update public.ai_credit_ledger
set
  source = coalesce(source, 'legacy'),
  included_balance_after = coalesce(included_balance_after, 0),
  purchased_balance_after = coalesce(purchased_balance_after, greatest(coalesce(balance_after, 0), 0))
where source is null
   or included_balance_after is null
   or purchased_balance_after is null;

alter table public.ai_credit_ledger
  alter column source set default 'legacy',
  alter column included_balance_after set default 0,
  alter column purchased_balance_after set default 0;

update public.ai_credit_ledger
set
  source = 'legacy',
  included_balance_after = 0,
  purchased_balance_after = greatest(coalesce(balance_after, 0), 0)
where source is null
   or included_balance_after is null
   or purchased_balance_after is null;

alter table public.ai_credit_ledger
  alter column source set not null,
  alter column included_balance_after set not null,
  alter column purchased_balance_after set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_credit_ledger_source_allowed'
  ) then
    alter table public.ai_credit_ledger
      add constraint ai_credit_ledger_source_allowed
      check (
        source in (
          'legacy',
          'subscription',
          'package',
          'ai_message',
          'ad_text',
          'campaign',
          'campaign_questions',
          'creative_brief',
          'compliance_review',
          'image_standard',
          'image_premium',
          'refund',
          'adjustment',
          'expiration'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_credit_ledger_included_balance_nonnegative'
  ) then
    alter table public.ai_credit_ledger
      add constraint ai_credit_ledger_included_balance_nonnegative
      check (included_balance_after >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_credit_ledger_purchased_balance_nonnegative'
  ) then
    alter table public.ai_credit_ledger
      add constraint ai_credit_ledger_purchased_balance_nonnegative
      check (purchased_balance_after >= 0);
  end if;
end $$;

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
  next_included_balance integer;
  next_purchased_balance integer;
  ledger_source text;
  refund_included integer;
  refund_purchased integer;
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

  ledger_source := coalesce(nullif(trim(coalesce(p_metadata ->> 'ledger_source', '')), ''), '');

  if ledger_source = '' then
    ledger_source := case
      when p_type = 'purchase' then 'package'
      when p_type = 'monthly_grant' then 'subscription'
      when p_type = 'refund' then 'refund'
      else 'adjustment'
    end;
  end if;

  next_included_balance := coalesce(balance_row.included_credits_balance, 0);
  next_purchased_balance := coalesce(balance_row.purchased_credits_balance, 0);

  if p_type = 'monthly_grant' then
    next_included_balance := next_included_balance + amount;
  elsif p_type = 'purchase' then
    next_purchased_balance := next_purchased_balance + amount;
  elsif p_type = 'refund' then
    refund_included := greatest(
      coalesce((p_metadata -> 'consumed_breakdown' ->> 'included')::integer, 0),
      0
    );
    refund_purchased := greatest(
      coalesce((p_metadata -> 'consumed_breakdown' ->> 'purchased')::integer, 0),
      0
    );

    if refund_included + refund_purchased = amount and refund_included > 0 then
      next_included_balance := next_included_balance + refund_included;
      next_purchased_balance := next_purchased_balance + refund_purchased;
    else
      next_purchased_balance := next_purchased_balance + amount;
    end if;
  else
    if ledger_source = 'subscription' then
      next_included_balance := next_included_balance + amount;
    else
      next_purchased_balance := next_purchased_balance + amount;
    end if;
  end if;

  update public.org_ai_balances
  set
    included_credits_balance = next_included_balance,
    purchased_credits_balance = next_purchased_balance,
    available_credits = next_included_balance + next_purchased_balance
  where org_id = target_org_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    source,
    credits,
    balance_after,
    included_balance_after,
    purchased_balance_after,
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
    ledger_source,
    amount,
    new_balance,
    next_included_balance,
    next_purchased_balance,
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
  consume_from_included integer;
  consume_from_purchased integer;
  next_included_balance integer;
  next_purchased_balance integer;
  ledger_source text;
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

  if coalesce(balance_row.available_credits, 0) < amount then
    raise exception 'Você não possui créditos de IA suficientes para executar esta ação.';
  end if;

  consume_from_included := least(coalesce(balance_row.included_credits_balance, 0), amount);
  consume_from_purchased := amount - consume_from_included;
  next_included_balance := coalesce(balance_row.included_credits_balance, 0) - consume_from_included;
  next_purchased_balance := coalesce(balance_row.purchased_credits_balance, 0) - consume_from_purchased;
  ledger_source := coalesce(
    nullif(trim(coalesce(p_metadata ->> 'ledger_source', '')), ''),
    'legacy'
  );

  update public.org_ai_balances
  set
    included_credits_balance = next_included_balance,
    purchased_credits_balance = next_purchased_balance,
    available_credits = next_included_balance + next_purchased_balance
  where org_id = target_org_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    source,
    credits,
    balance_after,
    included_balance_after,
    purchased_balance_after,
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
    ledger_source,
    -amount,
    new_balance,
    next_included_balance,
    next_purchased_balance,
    p_reason,
    p_reason,
    p_reference_type,
    p_reference_id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'consumed_breakdown',
      jsonb_build_object(
        'included', consume_from_included,
        'purchased', consume_from_purchased
      )
    )
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
  next_purchased_balance integer;
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
      coalesce(balance_row.available_credits, 0),
      existing_ledger.id;
    return;
  end if;

  select *
  into package_row
  from public.ai_credit_packages
  where id = order_row.package_id;

  next_purchased_balance := coalesce(balance_row.purchased_credits_balance, 0) + order_row.credits;

  update public.org_ai_balances
  set
    purchased_credits_balance = next_purchased_balance,
    available_credits = coalesce(included_credits_balance, 0) + next_purchased_balance
  where org_id = order_row.organization_id
  returning available_credits into new_balance;

  insert into public.ai_credit_ledger (
    org_id,
    user_id,
    type,
    source,
    credits,
    balance_after,
    included_balance_after,
    purchased_balance_after,
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
    'package',
    order_row.credits,
    new_balance,
    coalesce(balance_row.included_credits_balance, 0),
    next_purchased_balance,
    coalesce(package_row.name, 'Compra de créditos de IA'),
    coalesce(package_row.name, 'Compra de créditos de IA'),
    'ai_credit_order_payment',
    coalesce(p_provider_payment_id, target_order_id::text),
    coalesce(order_row.metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'ledger_source',
      'package'
    )
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

create or replace function public.grant_subscription_included_ai_credits(
  target_subscription_id uuid,
  p_reference_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  new_balance integer,
  included_balance integer,
  purchased_balance integer,
  ledger_id uuid,
  already_processed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_row public.subscriptions%rowtype;
  plan_row public.plans%rowtype;
  balance_row public.org_ai_balances%rowtype;
  grant_ledger public.ai_credit_ledger%rowtype;
  expiration_ledger_id uuid;
  reference_id text;
  included_amount integer;
begin
  if target_subscription_id is null then
    raise exception 'Assinatura não informada.';
  end if;

  select *
  into subscription_row
  from public.subscriptions
  where id = target_subscription_id
  for update;

  if subscription_row.id is null then
    raise exception 'Assinatura não encontrada.';
  end if;

  select *
  into plan_row
  from public.plans
  where id = subscription_row.plan_id;

  included_amount := greatest(
    coalesce((plan_row.metadata ->> 'included_credits')::integer, 0),
    0
  );
  reference_id := coalesce(
    p_reference_id,
    subscription_row.id::text || ':' || coalesce(subscription_row.current_period_start::text, '')
  );

  perform public.ensure_org_ai_balance(subscription_row.organization_id);

  select *
  into balance_row
  from public.org_ai_balances
  where org_id = subscription_row.organization_id
  for update;

  select *
  into grant_ledger
  from public.ai_credit_ledger
  where org_id = subscription_row.organization_id
    and type = 'monthly_grant'
    and reference_type = 'subscription_cycle_grant'
    and reference_id = reference_id
  limit 1;

  if grant_ledger.id is not null then
    return query
    select
      coalesce(balance_row.available_credits, 0),
      coalesce(balance_row.included_credits_balance, 0),
      coalesce(balance_row.purchased_credits_balance, 0),
      grant_ledger.id,
      true;
    return;
  end if;

  if coalesce(balance_row.current_period_start, to_timestamp(0)) is distinct from coalesce(subscription_row.current_period_start, to_timestamp(0))
     or coalesce(balance_row.current_period_end, to_timestamp(0)) is distinct from coalesce(subscription_row.current_period_end, to_timestamp(0)) then
    if coalesce(balance_row.included_credits_balance, 0) > 0 then
      update public.org_ai_balances
      set
        included_credits_balance = 0,
        available_credits = coalesce(purchased_credits_balance, 0)
      where org_id = subscription_row.organization_id
      returning available_credits, purchased_credits_balance into new_balance, purchased_balance;

      insert into public.ai_credit_ledger (
        org_id,
        type,
        source,
        credits,
        balance_after,
        included_balance_after,
        purchased_balance_after,
        reason,
        description,
        reference_type,
        reference_id,
        metadata
      )
      values (
        subscription_row.organization_id,
        'adjustment',
        'expiration',
        -coalesce(balance_row.included_credits_balance, 0),
        new_balance,
        0,
        purchased_balance,
        'Expiração dos créditos incluídos do ciclo anterior',
        'Expiração dos créditos incluídos do ciclo anterior',
        'subscription_cycle_expiration',
        coalesce(balance_row.current_period_start::text, subscription_row.id::text),
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
          'expired_included_credits',
          coalesce(balance_row.included_credits_balance, 0)
        )
      )
      returning id into expiration_ledger_id;
    end if;

    update public.org_ai_balances
    set
      current_period_start = subscription_row.current_period_start,
      current_period_end = subscription_row.current_period_end
    where org_id = subscription_row.organization_id;
  end if;

  if included_amount <= 0 then
    select *
    into balance_row
    from public.org_ai_balances
    where org_id = subscription_row.organization_id;

    return query
    select
      coalesce(balance_row.available_credits, 0),
      coalesce(balance_row.included_credits_balance, 0),
      coalesce(balance_row.purchased_credits_balance, 0),
      expiration_ledger_id,
      false;
    return;
  end if;

  update public.org_ai_balances
  set
    included_credits_balance = coalesce(included_credits_balance, 0) + included_amount,
    available_credits = coalesce(purchased_credits_balance, 0) + coalesce(included_credits_balance, 0) + included_amount,
    current_period_start = subscription_row.current_period_start,
    current_period_end = subscription_row.current_period_end
  where org_id = subscription_row.organization_id
  returning
    available_credits,
    included_credits_balance,
    purchased_credits_balance
  into new_balance, included_balance, purchased_balance;

  insert into public.ai_credit_ledger (
    org_id,
    type,
    source,
    credits,
    balance_after,
    included_balance_after,
    purchased_balance_after,
    reason,
    description,
    reference_type,
    reference_id,
    metadata
  )
  values (
    subscription_row.organization_id,
    'monthly_grant',
    'subscription',
    included_amount,
    new_balance,
    included_balance,
    purchased_balance,
    'Créditos incluídos renovados pela assinatura',
    'Créditos incluídos renovados pela assinatura',
    'subscription_cycle_grant',
    reference_id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'subscription_id',
      subscription_row.id,
      'plan_id',
      plan_row.id,
      'period_start',
      subscription_row.current_period_start,
      'period_end',
      subscription_row.current_period_end,
      'included_credits',
      included_amount
    )
  )
  returning id into ledger_id;

  return query
  select new_balance, included_balance, purchased_balance, ledger_id, false;
end;
$$;

grant execute on function public.grant_subscription_included_ai_credits(uuid, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
