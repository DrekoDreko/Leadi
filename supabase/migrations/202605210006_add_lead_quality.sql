alter table public.leads
  add column quality text
  check (quality is null or quality in ('high', 'medium', 'low'));
