-- Agenda a reconciliacao de status de veiculacao das campanhas chamando o
-- endpoint interno /api/internal/meta/reconcile-delivery via pg_net. Com isso o
-- app detecta sozinho quando a Meta aprova/reprova um anuncio e cria a
-- notificacao no sino do dashboard, sem ninguem abrir a tela.
--
-- Dois jobs, para detectar a aprovacao rapido sem martelar a Meta:
--   * reconcile-meta-delivery-pending  -> a cada 30s, scope=pending (so as
--     campanhas em revisao). pg_cron 1.6 aceita intervalos sub-minuto.
--   * reconcile-meta-delivery-all      -> a cada 10min, varredura ampla
--     (published/paused/pending) para pegar mudancas externas.
--
-- PRE-REQUISITOS (rodar UMA vez no projeto remoto, fora desta migration para
-- nao versionar segredos). URL e segredo sao lidos do Supabase Vault em runtime:
--   select vault.create_secret('https://SEU-DOMINIO', 'app_base_url');
--   select vault.create_secret('<igual ao CRON_SECRET do app>', 'cron_secret');
--
-- pg_cron e pg_net ja foram habilitados em 20260615234838_enable_pg_cron_pg_net.

do $$
begin
  -- Idempotente: remove agendamentos anteriores antes de recriar.
  if exists (select 1 from cron.job where jobname = 'reconcile-meta-delivery') then
    perform cron.unschedule('reconcile-meta-delivery');
  end if;
  if exists (select 1 from cron.job where jobname = 'reconcile-meta-delivery-pending') then
    perform cron.unschedule('reconcile-meta-delivery-pending');
  end if;
  if exists (select 1 from cron.job where jobname = 'reconcile-meta-delivery-all') then
    perform cron.unschedule('reconcile-meta-delivery-all');
  end if;

  -- Loop rapido: 30s, apenas campanhas em revisao.
  perform cron.schedule(
    'reconcile-meta-delivery-pending',
    '30 seconds',
    $job$
    select net.http_post(
      url := (
        select decrypted_secret from vault.decrypted_secrets where name = 'app_base_url'
      ) || '/api/internal/meta/reconcile-delivery?scope=pending',
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

  -- Varredura ampla: a cada 10 minutos.
  perform cron.schedule(
    'reconcile-meta-delivery-all',
    '*/10 * * * *',
    $job$
    select net.http_post(
      url := (
        select decrypted_secret from vault.decrypted_secrets where name = 'app_base_url'
      ) || '/api/internal/meta/reconcile-delivery',
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
