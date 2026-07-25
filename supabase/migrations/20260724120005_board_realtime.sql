-- Migration: board realtime
-- Habilita o Supabase Realtime (postgres_changes) nas tabelas do board para
-- sincronizacao ao vivo entre os membros da equipe.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'leads',
    'pipeline_stages',
    'lead_labels',
    'lead_label_assignments',
    'lead_checklists',
    'lead_checklist_items'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end;
$$;

-- REPLICA IDENTITY FULL garante que o payload de UPDATE/DELETE traga as colunas
-- necessarias para o filtro por organizacao/lead no cliente.
alter table public.leads replica identity full;
alter table public.pipeline_stages replica identity full;
alter table public.lead_labels replica identity full;
alter table public.lead_label_assignments replica identity full;
alter table public.lead_checklists replica identity full;
alter table public.lead_checklist_items replica identity full;

notify pgrst, 'reload schema';
