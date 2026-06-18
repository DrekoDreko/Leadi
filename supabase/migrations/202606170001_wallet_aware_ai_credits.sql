-- Wallet-aware AI credit consumption, refund, allocation, and personal-wallet purchases.
--
-- Modelo final:
--   org_ai_balances  = pool da organização (franquia incluída + fallback).
--   credit_wallets   = saldos dedicados (equipe/usuário), abastecidos por alocação.
--   Consumo percorre: carteira do usuário -> carteiras das equipes ativas -> pool da org.
--
-- Idempotência preservada por reference (operationId) tanto no ai_credit_ledger
-- (pool) quanto em credit_transactions (carteiras). O split included/purchased do
-- pool continua registrado em consumed_breakdown para estorno e expiração corretos.

-- ---------------------------------------------------------------------------
-- Helper: total de créditos acessíveis a um usuário (carteira pessoal +
-- carteiras das equipes ativas + pool da organização).
-- ---------------------------------------------------------------------------
create or replace function public.accessible_ai_credits(
  target_org_id uuid,
  p_profile_id uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(w.available_credits)
      from public.credit_wallets w
      where w.organization_id = target_org_id
        and (
          (w.wallet_type = 'user' and w.profile_id = p_profile_id)
          or (
            w.wallet_type = 'team'
            and w.team_id in (
              select tm.team_id
              from public.team_members tm
              where tm.profile_id = p_profile_id
                and tm.organization_id = target_org_id
                and tm.status = 'active'
            )
          )
        )
    ), 0)
    + coalesce((
      select available_credits
      from public.org_ai_balances
      where org_id = target_org_id
    ), 0);
$$;

-- ---------------------------------------------------------------------------
-- Consumo wallet-aware: debita carteira pessoal -> equipes -> pool da org.
-- ---------------------------------------------------------------------------
create or replace function public.consume_ai_credits_for_user(
  target_org_id uuid,
  p_profile_id uuid,
  amount integer,
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
  v_remaining integer := amount;
  v_take integer;
  v_wallet record;
  v_wallet_balance integer;
  v_balance_row public.org_ai_balances%rowtype;
  v_existing_ledger public.ai_credit_ledger%rowtype;
  v_existing_txn_id uuid;
  v_ref_uuid uuid;
  v_consume_included integer := 0;
  v_consume_purchased integer := 0;
  v_next_included integer;
  v_next_purchased integer;
  v_org_new_balance integer;
  v_ledger_source text;
  v_org_ledger_id uuid;
  v_first_txn_id uuid;
begin
  if target_org_id is null then
    raise exception 'Organização não informada.';
  end if;
  if p_profile_id is null then
    raise exception 'Usuário não informado.';
  end if;
  if amount is null or amount <= 0 then
    raise exception 'Quantidade de créditos inválida.';
  end if;

  perform public.ensure_org_ai_balance(target_org_id);

  begin
    v_ref_uuid := p_reference_id::uuid;
  exception when others then
    v_ref_uuid := null;
  end;

  -- Idempotência: operação já registrada no pool ou nas carteiras.
  if p_reference_type is not null and p_reference_id is not null then
    select *
    into v_existing_ledger
    from public.ai_credit_ledger
    where org_id = target_org_id
      and type = 'usage'
      and reference_type = p_reference_type
      and reference_id = p_reference_id
    limit 1;

    if v_existing_ledger.id is not null then
      return query
      select public.accessible_ai_credits(target_org_id, p_profile_id), v_existing_ledger.id;
      return;
    end if;

    if v_ref_uuid is not null then
      select id
      into v_existing_txn_id
      from public.credit_transactions
      where organization_id = target_org_id
        and transaction_type = 'usage'
        and reference_type = p_reference_type
        and reference_id = v_ref_uuid
      limit 1;

      if v_existing_txn_id is not null then
        return query
        select public.accessible_ai_credits(target_org_id, p_profile_id), v_existing_txn_id;
        return;
      end if;
    end if;
  end if;

  -- Ordem de lock global: pool da org primeiro, depois carteiras por id.
  select *
  into v_balance_row
  from public.org_ai_balances
  where org_id = target_org_id
  for update;

  -- Adquire locks nas carteiras candidatas em ordem determinística de id.
  perform 1
  from public.credit_wallets w
  where w.organization_id = target_org_id
    and (
      (w.wallet_type = 'user' and w.profile_id = p_profile_id)
      or (
        w.wallet_type = 'team'
        and w.team_id in (
          select tm.team_id
          from public.team_members tm
          where tm.profile_id = p_profile_id
            and tm.organization_id = target_org_id
            and tm.status = 'active'
        )
      )
    )
  order by w.id
  for update;

  -- Debita na ordem de prioridade: carteira pessoal -> carteiras de equipe.
  for v_wallet in
    select w.*
    from public.credit_wallets w
    where w.organization_id = target_org_id
      and w.available_credits > 0
      and (
        (w.wallet_type = 'user' and w.profile_id = p_profile_id)
        or (
          w.wallet_type = 'team'
          and w.team_id in (
            select tm.team_id
            from public.team_members tm
            where tm.profile_id = p_profile_id
              and tm.organization_id = target_org_id
              and tm.status = 'active'
          )
        )
      )
    order by (w.wallet_type = 'user') desc, w.id
  loop
    exit when v_remaining <= 0;

    v_take := least(v_wallet.available_credits, v_remaining);
    if v_take <= 0 then
      continue;
    end if;

    update public.credit_wallets
    set available_credits = available_credits - v_take,
        updated_at = now()
    where id = v_wallet.id
    returning available_credits into v_wallet_balance;

    insert into public.credit_transactions (
      organization_id,
      wallet_id,
      team_id,
      actor_id,
      target_user_id,
      transaction_type,
      amount,
      balance_after,
      reason,
      reference_type,
      reference_id,
      metadata
    )
    values (
      target_org_id,
      v_wallet.id,
      v_wallet.team_id,
      p_profile_id,
      p_profile_id,
      'usage',
      -v_take,
      v_wallet_balance,
      p_reason,
      p_reference_type,
      v_ref_uuid,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('wallet_type', v_wallet.wallet_type)
    )
    returning id into v_first_txn_id;

    v_remaining := v_remaining - v_take;
  end loop;

  -- Restante (se houver) sai do pool da org, preservando included/purchased.
  if v_remaining > 0 then
    if coalesce(v_balance_row.available_credits, 0) < v_remaining then
      raise exception 'Você não possui créditos de IA suficientes para executar esta ação.';
    end if;

    v_consume_included := least(coalesce(v_balance_row.included_credits_balance, 0), v_remaining);
    v_consume_purchased := v_remaining - v_consume_included;
    v_next_included := coalesce(v_balance_row.included_credits_balance, 0) - v_consume_included;
    v_next_purchased := coalesce(v_balance_row.purchased_credits_balance, 0) - v_consume_purchased;
    v_ledger_source := coalesce(
      nullif(trim(coalesce(p_metadata ->> 'ledger_source', '')), ''),
      'legacy'
    );

    update public.org_ai_balances
    set included_credits_balance = v_next_included,
        purchased_credits_balance = v_next_purchased,
        available_credits = v_next_included + v_next_purchased
    where org_id = target_org_id
    returning available_credits into v_org_new_balance;

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
      p_profile_id,
      'usage',
      v_ledger_source,
      -v_remaining,
      v_org_new_balance,
      v_next_included,
      v_next_purchased,
      p_reason,
      p_reason,
      p_reference_type,
      p_reference_id,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'consumed_breakdown',
        jsonb_build_object('included', v_consume_included, 'purchased', v_consume_purchased)
      )
    )
    returning id into v_org_ledger_id;

    v_remaining := 0;
  end if;

  return query
  select
    public.accessible_ai_credits(target_org_id, p_profile_id),
    coalesce(v_org_ledger_id, v_first_txn_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Estorno simétrico: reverte exatamente os níveis debitados por uma operação.
-- Idempotente por (org, type='refund', reference_type='ai_usage_refund', op id).
-- ---------------------------------------------------------------------------
create or replace function public.refund_ai_credits_for_user(
  target_org_id uuid,
  p_profile_id uuid,
  p_reason text default null,
  p_operation_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  new_balance integer,
  refunded integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_op_uuid uuid;
  v_txn public.credit_transactions%rowtype;
  v_wallet_balance integer;
  v_usage_ledger public.ai_credit_ledger%rowtype;
  v_balance_row public.org_ai_balances%rowtype;
  v_inc integer;
  v_pur integer;
  v_next_included integer;
  v_next_purchased integer;
  v_org_new_balance integer;
  v_refunded integer := 0;
begin
  if target_org_id is null then
    raise exception 'Organização não informada.';
  end if;
  if p_operation_id is null then
    raise exception 'Operação não informada para estorno.';
  end if;

  perform public.ensure_org_ai_balance(target_org_id);

  begin
    v_op_uuid := p_operation_id::uuid;
  exception when others then
    v_op_uuid := null;
  end;

  -- Idempotência do estorno.
  if exists (
    select 1 from public.ai_credit_ledger
    where org_id = target_org_id
      and type = 'refund'
      and reference_type = 'ai_usage_refund'
      and reference_id = p_operation_id
  ) or (
    v_op_uuid is not null and exists (
      select 1 from public.credit_transactions
      where organization_id = target_org_id
        and transaction_type = 'refund'
        and reference_type = 'ai_usage_refund'
        and reference_id = v_op_uuid
    )
  ) then
    return query
    select public.accessible_ai_credits(target_org_id, p_profile_id), 0;
    return;
  end if;

  -- Reverte cada carteira debitada na operação.
  if v_op_uuid is not null then
    for v_txn in
      select *
      from public.credit_transactions
      where organization_id = target_org_id
        and transaction_type = 'usage'
        and reference_id = v_op_uuid
      order by id
    loop
      update public.credit_wallets
      set available_credits = available_credits + (-v_txn.amount),
          updated_at = now()
      where id = v_txn.wallet_id
      returning available_credits into v_wallet_balance;

      insert into public.credit_transactions (
        organization_id,
        wallet_id,
        team_id,
        actor_id,
        target_user_id,
        transaction_type,
        amount,
        balance_after,
        reason,
        reference_type,
        reference_id,
        metadata
      )
      values (
        target_org_id,
        v_txn.wallet_id,
        v_txn.team_id,
        coalesce(p_profile_id, v_txn.actor_id),
        v_txn.target_user_id,
        'refund',
        -v_txn.amount,
        v_wallet_balance,
        p_reason,
        'ai_usage_refund',
        v_op_uuid,
        coalesce(p_metadata, '{}'::jsonb)
      );

      v_refunded := v_refunded + (-v_txn.amount);
    end loop;
  end if;

  -- Reverte a parcela consumida do pool da org, restaurando included/purchased.
  select *
  into v_usage_ledger
  from public.ai_credit_ledger
  where org_id = target_org_id
    and type = 'usage'
    and reference_type = 'ai_usage_operation'
    and reference_id = p_operation_id
  order by created_at desc
  limit 1;

  if v_usage_ledger.id is not null then
    v_inc := greatest(
      coalesce((v_usage_ledger.metadata -> 'consumed_breakdown' ->> 'included')::integer, 0),
      0
    );
    v_pur := greatest(
      coalesce((v_usage_ledger.metadata -> 'consumed_breakdown' ->> 'purchased')::integer, 0),
      0
    );

    if v_inc + v_pur > 0 then
      select *
      into v_balance_row
      from public.org_ai_balances
      where org_id = target_org_id
      for update;

      v_next_included := coalesce(v_balance_row.included_credits_balance, 0) + v_inc;
      v_next_purchased := coalesce(v_balance_row.purchased_credits_balance, 0) + v_pur;

      update public.org_ai_balances
      set included_credits_balance = v_next_included,
          purchased_credits_balance = v_next_purchased,
          available_credits = v_next_included + v_next_purchased
      where org_id = target_org_id
      returning available_credits into v_org_new_balance;

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
        p_profile_id,
        'refund',
        'refund',
        v_inc + v_pur,
        v_org_new_balance,
        v_next_included,
        v_next_purchased,
        p_reason,
        p_reason,
        'ai_usage_refund',
        p_operation_id,
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
          'consumed_breakdown',
          jsonb_build_object('included', v_inc, 'purchased', v_pur)
        )
      );

      v_refunded := v_refunded + v_inc + v_pur;
    end if;
  end if;

  return query
  select public.accessible_ai_credits(target_org_id, p_profile_id), v_refunded;
end;
$$;

-- ---------------------------------------------------------------------------
-- Alocação a partir do pool da org (owner): debita org_ai_balances (franquia
-- primeiro) e credita uma carteira de equipe/usuário em credit_wallets.
-- ---------------------------------------------------------------------------
create or replace function public.allocate_from_org_pool(
  p_organization_id uuid,
  p_to_wallet_id uuid,
  p_amount integer,
  p_reason text,
  p_actor_id uuid,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  org_pool_balance integer,
  to_wallet_balance integer,
  transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance_row public.org_ai_balances%rowtype;
  v_to_wallet public.credit_wallets%rowtype;
  v_take_included integer;
  v_take_purchased integer;
  v_next_included integer;
  v_next_purchased integer;
  v_org_new integer;
  v_wallet_new integer;
  v_txn_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Quantidade de créditos inválida.';
  end if;

  perform public.ensure_org_ai_balance(p_organization_id);

  -- Ordem de lock global: pool da org primeiro, depois carteira destino.
  select *
  into v_balance_row
  from public.org_ai_balances
  where org_id = p_organization_id
  for update;

  select *
  into v_to_wallet
  from public.credit_wallets
  where id = p_to_wallet_id
    and organization_id = p_organization_id
  for update;

  if v_to_wallet.id is null then
    raise exception 'Carteira de destino não encontrada.';
  end if;

  if v_to_wallet.wallet_type = 'organization' then
    raise exception 'Não é possível alocar do pool para a carteira da organização.';
  end if;

  if coalesce(v_balance_row.available_credits, 0) < p_amount then
    raise exception 'O pool da organização não possui créditos suficientes.';
  end if;

  v_take_included := least(coalesce(v_balance_row.included_credits_balance, 0), p_amount);
  v_take_purchased := p_amount - v_take_included;
  v_next_included := coalesce(v_balance_row.included_credits_balance, 0) - v_take_included;
  v_next_purchased := coalesce(v_balance_row.purchased_credits_balance, 0) - v_take_purchased;

  update public.org_ai_balances
  set included_credits_balance = v_next_included,
      purchased_credits_balance = v_next_purchased,
      available_credits = v_next_included + v_next_purchased
  where org_id = p_organization_id
  returning available_credits into v_org_new;

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
    p_organization_id,
    p_actor_id,
    'adjustment',
    'adjustment',
    -p_amount,
    v_org_new,
    v_next_included,
    v_next_purchased,
    p_reason,
    p_reason,
    'org_pool_allocation',
    p_to_wallet_id::text,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'allocated_breakdown',
      jsonb_build_object('included', v_take_included, 'purchased', v_take_purchased),
      'to_wallet_id',
      p_to_wallet_id
    )
  );

  update public.credit_wallets
  set available_credits = available_credits + p_amount,
      updated_at = now()
  where id = p_to_wallet_id
  returning available_credits into v_wallet_new;

  insert into public.credit_transactions (
    organization_id,
    wallet_id,
    team_id,
    actor_id,
    target_user_id,
    transaction_type,
    amount,
    balance_after,
    reason,
    reference_type,
    reference_id,
    metadata
  )
  values (
    p_organization_id,
    p_to_wallet_id,
    v_to_wallet.team_id,
    p_actor_id,
    p_target_user_id,
    'allocation',
    p_amount,
    v_wallet_new,
    p_reason,
    'org_pool_allocation',
    null,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('source', 'org_pool')
  )
  returning id into v_txn_id;

  return query
  select v_org_new, v_wallet_new, v_txn_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Compra credita a carteira pessoal do comprador (order.user_id), mantendo o
-- ai_credit_ledger como âncora de idempotência. Pool da org permanece intacto.
-- Fallback legado: se a ordem não tiver user_id, credita o pool (comportamento
-- anterior) para não perder créditos.
-- ---------------------------------------------------------------------------
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
  user_wallet public.credit_wallets%rowtype;
  next_purchased_balance integer;
  wallet_new_balance integer;
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

  if order_row.user_id is not null then
    -- Credita a carteira pessoal do comprador (cria se necessário).
    select *
    into user_wallet
    from public.credit_wallets
    where organization_id = order_row.organization_id
      and wallet_type = 'user'
      and profile_id = order_row.user_id
    for update;

    if user_wallet.id is null then
      insert into public.credit_wallets (
        organization_id,
        wallet_type,
        profile_id,
        available_credits
      )
      values (
        order_row.organization_id,
        'user',
        order_row.user_id,
        0
      )
      returning * into user_wallet;
    end if;

    update public.credit_wallets
    set available_credits = available_credits + order_row.credits,
        updated_at = now()
    where id = user_wallet.id
    returning available_credits into wallet_new_balance;

    insert into public.credit_transactions (
      organization_id,
      wallet_id,
      team_id,
      actor_id,
      target_user_id,
      transaction_type,
      amount,
      balance_after,
      reason,
      reference_type,
      reference_id,
      metadata
    )
    values (
      order_row.organization_id,
      user_wallet.id,
      null,
      order_row.user_id,
      order_row.user_id,
      'purchase',
      order_row.credits,
      wallet_new_balance,
      coalesce(package_row.name, 'Compra de créditos de IA'),
      'ai_credit_order_payment',
      target_order_id,
      coalesce(p_metadata, '{}'::jsonb)
    );

    -- Pool da org inalterado; ledger registra a compra para auditoria.
    new_balance := coalesce(balance_row.available_credits, 0);

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
      coalesce(balance_row.available_credits, 0),
      coalesce(balance_row.included_credits_balance, 0),
      coalesce(balance_row.purchased_credits_balance, 0),
      coalesce(package_row.name, 'Compra de créditos de IA'),
      coalesce(package_row.name, 'Compra de créditos de IA'),
      'ai_credit_order_payment',
      coalesce(p_provider_payment_id, target_order_id::text),
      coalesce(order_row.metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'credited_wallet', 'user',
        'wallet_id', user_wallet.id
      )
    )
    returning id into ledger_id;
  else
    -- Fallback legado: credita o pool da organização.
    next_purchased_balance := coalesce(balance_row.purchased_credits_balance, 0) + order_row.credits;

    update public.org_ai_balances
    set purchased_credits_balance = next_purchased_balance,
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
        'ledger_source', 'package'
      )
    )
    returning id into ledger_id;
  end if;

  update public.ai_credit_orders
  set provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
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

-- ---------------------------------------------------------------------------
-- Correção de bug pré-existente: a versão original (202605300001) inseria
-- `p_from_wallet_id::text` em credit_transactions.reference_id, que é uuid,
-- causando erro de tipo em qualquer alocação (equipe->consultor do supervisor
-- e org->equipe/usuário do owner). Mantém o resto idêntico; só corrige o cast.
-- ---------------------------------------------------------------------------
create or replace function public.allocate_credit_wallet_balance(
  p_organization_id uuid,
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_amount integer,
  p_reason text,
  p_actor_id uuid,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  from_wallet_balance integer,
  to_wallet_balance integer,
  transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_wallet public.credit_wallets%rowtype;
  v_to_wallet public.credit_wallets%rowtype;
  v_transaction_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Quantidade de créditos inválida.';
  end if;

  -- Lock das carteiras em ordem estável para evitar deadlock.
  if p_from_wallet_id < p_to_wallet_id then
    select * into v_from_wallet from public.credit_wallets where id = p_from_wallet_id and organization_id = p_organization_id for update;
    select * into v_to_wallet from public.credit_wallets where id = p_to_wallet_id and organization_id = p_organization_id for update;
  else
    select * into v_to_wallet from public.credit_wallets where id = p_to_wallet_id and organization_id = p_organization_id for update;
    select * into v_from_wallet from public.credit_wallets where id = p_from_wallet_id and organization_id = p_organization_id for update;
  end if;

  if v_from_wallet.id is null then
    raise exception 'Carteira de origem não encontrada.';
  end if;

  if v_to_wallet.id is null then
    raise exception 'Carteira de destino não encontrada.';
  end if;

  if v_from_wallet.available_credits < p_amount then
    raise exception 'Créditos insuficientes na carteira de origem.';
  end if;

  update public.credit_wallets
  set available_credits = available_credits - p_amount, updated_at = now()
  where id = p_from_wallet_id
  returning available_credits into v_from_wallet.available_credits;

  update public.credit_wallets
  set available_credits = available_credits + p_amount, updated_at = now()
  where id = p_to_wallet_id
  returning available_credits into v_to_wallet.available_credits;

  insert into public.credit_transactions (
    organization_id,
    wallet_id,
    team_id,
    actor_id,
    target_user_id,
    transaction_type,
    amount,
    balance_after,
    reason,
    reference_type,
    reference_id,
    metadata
  )
  values (
    p_organization_id,
    p_to_wallet_id,
    v_to_wallet.team_id,
    p_actor_id,
    p_target_user_id,
    'allocation',
    p_amount,
    v_to_wallet.available_credits,
    p_reason,
    'wallet_allocation',
    p_from_wallet_id,
    p_metadata
  )
  returning id into v_transaction_id;

  return query
  select v_from_wallet.available_credits, v_to_wallet.available_credits, v_transaction_id;
end;
$$;

grant execute on function public.accessible_ai_credits(uuid, uuid) to authenticated;
grant execute on function public.consume_ai_credits_for_user(uuid, uuid, integer, text, text, text, jsonb) to authenticated;
grant execute on function public.refund_ai_credits_for_user(uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.allocate_from_org_pool(uuid, uuid, integer, text, uuid, uuid, jsonb) to authenticated;
grant execute on function public.allocate_credit_wallet_balance(uuid, uuid, uuid, integer, text, uuid, uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
