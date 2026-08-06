-- Sinais para reaproveitar campanha/conjunto da mesma praca (Mudanca 2) e detectar
-- campanhas duplicadas concorrentes (Mudanca 3), alem de registrar o objetivo de
-- otimizacao efetivamente aplicado (Mudanca 1) para o monitoramento.

alter table public.campaigns
  add column if not exists meta_geo_signature text,
  add column if not exists meta_optimization_goal text;

comment on column public.campaigns.meta_geo_signature is
  'Assinatura normalizada (keys de cities/regions/countries, ordenadas e unidas por |) da segmentacao geo enviada a Meta. Torna o casamento de praca deterministico, independente do texto livre digitado. Usada para reaproveitar campanha/conjunto e bloquear duplicatas concorrentes.';

comment on column public.campaigns.meta_optimization_goal is
  'optimization_goal efetivamente aplicado ao conjunto na Meta (LEAD_GENERATION ou objetivo degradado quando o orcamento fica abaixo do piso de aprendizado). Usado pelo monitoramento para sugerir migracao ao objetivo cheio.';

-- Acelera a busca de campanhas reaproveitaveis / concorrentes por organizacao + praca.
create index if not exists idx_campaigns_reuse_lookup
  on public.campaigns (organization_id, meta_geo_signature)
  where meta_campaign_id is not null;
