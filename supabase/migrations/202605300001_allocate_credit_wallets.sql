-- RPC for safely allocating credits between wallets
CREATE OR REPLACE FUNCTION public.allocate_credit_wallet_balance(
  p_organization_id uuid,
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_amount integer,
  p_reason text,
  p_actor_id uuid,
  p_target_user_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  from_wallet_balance integer,
  to_wallet_balance integer,
  transaction_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_wallet public.credit_wallets%ROWTYPE;
  v_to_wallet public.credit_wallets%ROWTYPE;
  v_transaction_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Quantidade de créditos inválida.';
  END IF;

  -- Lock the wallets in a consistent order to prevent deadlocks
  IF p_from_wallet_id < p_to_wallet_id THEN
    SELECT * INTO v_from_wallet FROM public.credit_wallets WHERE id = p_from_wallet_id AND organization_id = p_organization_id FOR UPDATE;
    SELECT * INTO v_to_wallet FROM public.credit_wallets WHERE id = p_to_wallet_id AND organization_id = p_organization_id FOR UPDATE;
  ELSE
    SELECT * INTO v_to_wallet FROM public.credit_wallets WHERE id = p_to_wallet_id AND organization_id = p_organization_id FOR UPDATE;
    SELECT * INTO v_from_wallet FROM public.credit_wallets WHERE id = p_from_wallet_id AND organization_id = p_organization_id FOR UPDATE;
  END IF;

  IF v_from_wallet.id IS NULL THEN
    RAISE EXCEPTION 'Carteira de origem não encontrada.';
  END IF;

  IF v_to_wallet.id IS NULL THEN
    RAISE EXCEPTION 'Carteira de destino não encontrada.';
  END IF;

  IF v_from_wallet.available_credits < p_amount THEN
    RAISE EXCEPTION 'Créditos insuficientes na carteira de origem.';
  END IF;

  -- Deduct from source
  UPDATE public.credit_wallets
  SET
    available_credits = available_credits - p_amount,
    updated_at = now()
  WHERE id = p_from_wallet_id
  RETURNING available_credits INTO v_from_wallet.available_credits;

  -- Add to destination
  UPDATE public.credit_wallets
  SET
    available_credits = available_credits + p_amount,
    updated_at = now()
  WHERE id = p_to_wallet_id
  RETURNING available_credits INTO v_to_wallet.available_credits;

  -- Create transaction record
  INSERT INTO public.credit_transactions (
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
  VALUES (
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
    p_from_wallet_id::text,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY
  SELECT v_from_wallet.available_credits, v_to_wallet.available_credits, v_transaction_id;
END;
$$;
