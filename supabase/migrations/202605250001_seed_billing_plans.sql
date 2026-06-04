insert into public.plans (
  code,
  name,
  description,
  status,
  gateway,
  amount_cents,
  interval_unit,
  interval_count,
  metadata
)
values
  (
    'essencial',
    'Essencial',
    'Organização comercial básica para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.',
    'active',
    'mercado_pago',
    5900,
    'month',
    1,
    jsonb_build_object(
      'included_credits', 25,
      'included_users', 1,
      'extra_user_amount_cents', null,
      'checkout_availability', jsonb_build_object(
        'monthly', true,
        'annual', false
      ),
      'mercado_pago_env', jsonb_build_object(
        'monthly', 'MERCADO_PAGO_PLAN_ESSENCIAL_MONTHLY_ID',
        'annual', 'MERCADO_PAGO_PLAN_ESSENCIAL_ANNUAL_ID'
      )
    )
  ),
  (
    'profissional',
    'Profissional',
    'O plano principal para equipes que precisam conectar captação, campanhas e distribuição em um fluxo único.',
    'active',
    'mercado_pago',
    11900,
    'month',
    1,
    jsonb_build_object(
      'included_credits', 75,
      'included_users', 1,
      'extra_user_amount_cents', null,
      'checkout_availability', jsonb_build_object(
        'monthly', true,
        'annual', false
      ),
      'mercado_pago_env', jsonb_build_object(
        'monthly', 'MERCADO_PAGO_PLAN_PROFISSIONAL_MONTHLY_ID',
        'annual', 'MERCADO_PAGO_PLAN_PROFISSIONAL_ANNUAL_ID'
      )
    )
  ),
  (
    'equipe',
    'Equipe',
    'Estrutura para distribuir leads, acompanhar responsáveis e organizar a rotina comercial da equipe.',
    'active',
    'mercado_pago',
    24900,
    'month',
    1,
    jsonb_build_object(
      'included_credits', 150,
      'included_users', 3,
      'extra_user_amount_cents', 5900,
      'checkout_availability', jsonb_build_object(
        'monthly', true,
        'annual', false
      ),
      'mercado_pago_env', jsonb_build_object(
        'monthly', 'MERCADO_PAGO_PLAN_EQUIPE_MONTHLY_ID',
        'annual', 'MERCADO_PAGO_PLAN_EQUIPE_ANNUAL_ID'
      )
    )
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  status = excluded.status,
  gateway = excluded.gateway,
  metadata = excluded.metadata;
