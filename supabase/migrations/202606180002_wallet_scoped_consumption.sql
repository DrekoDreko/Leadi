-- Escopo do pool da organização por papel.
--
-- Modelo estrito: o pool da org (org_ai_balances = franquia incluída + avulsos não
-- alocados a um usuário) é exclusivo do OWNER. Consultor (seller) e supervisor (admin)
-- só enxergam e só gastam o que está nas carteiras dedicadas (carteira pessoal +
-- carteiras das equipes ativas), somadas num saldo único. Sem carteira, a geração é
-- bloqueada por saldo insuficiente — nunca vaza para o pool da corretora.
--
-- Distribuição continua via allocate_from_org_pool (owner -> equipe/usuário) e
-- allocate_credit_wallet_balance (supervisor -> consultor).
--
-- Redefine accessible_ai_credits (saldo exibido/validado) e consume_ai_credits_for_user
-- (consumo) para aplicar essa regra. Owner detectado por profiles.role = 'owner'.

-- ---------------------------------------------------------------------------
-- Saldo acessível: carteira pessoal + carteiras das equipes ativas, mais o
-- pool da org SOMENTE quando o perfil é owner.
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
    + case
        when exists (
          select 1
          from public.profiles p
          where p.id = p_profile_id
            and p.organization_id = target_org_id
            and p.role = 'owner'
        )
        then coalesce((
          select available_credits
          from public.org_ai_balances
          where org_id = target_org_id
        ), 0)
        else 0
      end;
$$;

-- ---------------------------------------------------------------------------
-- Consumo wallet-aware: debita carteira pessoal -> equipes. O pool da org só é
-- usado como fallback quando o perfil é owner; para os demais, esgotadas as
-- carteiras, a operação falha por saldo insuficiente.
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
  v_is_owner boolean := false;
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

  -- Apenas o owner pode consumir do pool da organização.
  select (p.role = 'owner')
  into v_is_owner
  from public.profiles p
  where p.id = p_profile_id
    and p.organization_id = target_org_id;
  v_is_owner := coalesce(v_is_owner, false);

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

  -- Restante (se houver) sai do pool da org, mas SOMENTE para o owner.
  -- Para os demais, esgotadas as carteiras, a operação falha.
  if v_remaining > 0 then
    if not v_is_owner then
      raise exception 'Você não possui créditos de IA suficientes para executar esta ação.';
    end if;

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
