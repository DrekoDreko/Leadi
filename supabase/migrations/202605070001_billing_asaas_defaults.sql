-- Billing gateway defaults updated to favor Asaas as the initial integration,
-- while keeping the schema gateway-agnostic for Mercado Pago and Stripe.

alter table public.plans
  alter column gateway set default 'asaas';

alter table public.subscriptions
  alter column gateway set default 'asaas';

alter table public.payment_events
  alter column gateway set default 'asaas';

comment on table public.plans is
  'Catalogo de planos de assinatura independente de gateway, com foco inicial em Asaas.';

comment on table public.subscriptions is
  'Assinaturas por organizacao com periodo vigente e referencias externas por gateway, com foco inicial em Asaas.';

comment on table public.payment_events is
  'Eventos de cobranca e pagamento ligados a planos/assinaturas, com payload audivel por gateway e foco inicial em Asaas.';

notify pgrst, 'reload schema';
