insert into public.plans (
  code,
  name,
  description,
  status,
  gateway,
  amount_cents,
  interval_unit,
  interval_count
)
values
  (
    'essencial',
    'Essencial',
    'Organização comercial básica para centralizar leads, acompanhar oportunidades e manter o histórico de atendimento.',
    'active',
    'mercado_pago',
    23700,
    'month',
    1
  ),
  (
    'profissional',
    'Profissional',
    'O plano principal para equipes que precisam conectar captação, campanhas e distribuição em um fluxo único.',
    'active',
    'mercado_pago',
    63700,
    'month',
    1
  ),
  (
    'operacao',
    'Operação',
    'Estrutura para operações com múltiplas equipes, gestão de propostas e mais acompanhamento da rotina comercial.',
    'active',
    'mercado_pago',
    159700,
    'month',
    1
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  status = excluded.status,
  gateway = excluded.gateway;
