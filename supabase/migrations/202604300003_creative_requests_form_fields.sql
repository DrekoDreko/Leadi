alter table public.creative_requests
  add column if not exists objective text not null default '',
  add column if not exists notes text;

comment on column public.creative_requests.objective is
  'Objetivo comercial principal do pedido de criativo.';

comment on column public.creative_requests.notes is
  'Observacoes adicionais opcionais para a equipe de producao.';
