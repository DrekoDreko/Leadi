-- Adiciona campos comerciais específicos para corretagem de planos de saúde
alter table public.leads 
  add column cpf text,
  add column birth_date date,
  add column profession text,
  add column health_plan_type text,
  add column current_health_plan text,
  add column dependents_count integer check (dependents_count is null or dependents_count >= 0);
