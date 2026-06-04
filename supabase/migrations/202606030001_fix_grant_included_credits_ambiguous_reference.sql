-- Corrige bug em grant_subscription_included_ai_credits: a variavel local
-- `reference_id` colidia com a coluna `reference_id` da tabela ai_credit_ledger,
-- gerando "column reference \"reference_id\" is ambiguous" na verificacao de
-- idempotencia (e quebrando a concessao de creditos inclusos no webhook de
-- pagamento aprovado do Mercado Pago). A variavel local foi renomeada para
-- `v_reference_id`. A assinatura e o comportamento da funcao permanecem iguais.

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
  v_reference_id text;
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
  v_reference_id := coalesce(
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
    and reference_id = v_reference_id
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
    v_reference_id,
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
