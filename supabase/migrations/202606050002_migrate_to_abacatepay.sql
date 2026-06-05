-- Add 'abacatepay' to gateway check constraints on plans and subscriptions tables.
-- Update existing plans from mercado_pago to abacatepay.

-- plans.gateway: add abacatepay
alter table public.plans drop constraint if exists plans_gateway_check;
alter table public.plans add constraint plans_gateway_check
  check (gateway in ('internal', 'mercado_pago', 'asaas', 'stripe', 'abacatepay', 'manual'));

-- subscriptions.gateway: add abacatepay
alter table public.subscriptions drop constraint if exists subscriptions_gateway_check;
alter table public.subscriptions add constraint subscriptions_gateway_check
  check (gateway in ('mercado_pago', 'asaas', 'stripe', 'abacatepay', 'manual'));

-- payment_events.gateway: add abacatepay
alter table public.payment_events drop constraint if exists payment_events_gateway_check;
alter table public.payment_events add constraint payment_events_gateway_check
  check (gateway in ('mercado_pago', 'asaas', 'stripe', 'abacatepay', 'manual'));

-- Migrate active plans from mercado_pago to abacatepay
update public.plans
  set gateway = 'abacatepay',
      metadata = metadata - 'mercado_pago_env',
      updated_at = now()
  where gateway = 'mercado_pago'
    and status = 'active';
