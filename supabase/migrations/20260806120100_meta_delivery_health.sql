-- Mudanca 7: monitoramento de entrega pos-publicacao.
--
-- Tabela de snapshots diarios de entrega por campanha (gasto vs orcamento, leads,
-- frequencia) + novos tipos de notificacao de alerta + agendamento diario do job
-- que compara gasto real com o esperado e dispara os alertas.

create table if not exists public.meta_delivery_health (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  snapshot_date date not null,
  spend_cents integer not null default 0,
  daily_budget_cents integer not null default 0,
  delivery_ratio numeric(6, 4) not null default 0,
  leads integer not null default 0,
  frequency numeric(8, 4) not null default 0,
  created_at timestamptz not null default now(),
  unique (campaign_id, snapshot_date)
);

comment on table public.meta_delivery_health is
  'Snapshot diario de entrega por campanha (Mudanca 7). delivery_ratio = spend_cents / daily_budget_cents do dia anterior. Base para detectar subentrega, 0 leads e saturacao.';

create index if not exists idx_meta_delivery_health_campaign_date
  on public.meta_delivery_health (campaign_id, snapshot_date desc);

-- RLS: leitura restrita a organizacao; escrita so pelo service role (job interno).
alter table public.meta_delivery_health enable row level security;

drop policy if exists "meta_delivery_health_select_org" on public.meta_delivery_health;
create policy "meta_delivery_health_select_org"
  on public.meta_delivery_health
  for select
  using (organization_id = public.current_profile_organization_id());

-- Novos tipos de notificacao de alerta de entrega (Mudanca 7).
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'campaign_approved',
      'campaign_rejected',
      'invite_pending',
      'team_member_added',
      'ad_creation_enabled',
      'campaign_underdelivery',
      'campaign_no_leads',
      'campaign_frequency_saturation',
      'campaign_optimization_upgrade'
    )
  );

notify pgrst, 'reload schema';

-- Agendamento diario do job de saude de entrega (09:00 UTC ~ 06:00 BRT). Reusa
-- os segredos do Vault (app_base_url, cron_secret) ja usados pelo reconcile.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'meta-delivery-health-daily') then
    perform cron.unschedule('meta-delivery-health-daily');
  end if;

  perform cron.schedule(
    'meta-delivery-health-daily',
    '0 9 * * *',
    $job$
    select net.http_post(
      url := (
        select decrypted_secret from vault.decrypted_secrets where name = 'app_base_url'
      ) || '/api/internal/meta/delivery-health',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'
        )
      ),
      body := '{}'::jsonb
    );
    $job$
  );
end;
$$;
