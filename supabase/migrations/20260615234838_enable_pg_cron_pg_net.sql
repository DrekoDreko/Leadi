-- Habilita pg_cron (agendamento de jobs) e pg_net (requisicoes HTTP) usados
-- pelas rotinas de reconciliacao/automacao. Ja aplicada no projeto remoto;
-- este arquivo apenas registra a migration localmente para manter o historico
-- em sincronia com supabase_migrations.schema_migrations.
create extension if not exists pg_cron;
create extension if not exists pg_net;
