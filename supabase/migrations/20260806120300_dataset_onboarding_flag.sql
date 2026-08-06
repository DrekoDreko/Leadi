-- Mudanca 8: onboarding de pixel/dataset. Flag por organizacao para exibir o passo
-- uma unica vez (o corretor pode dispensar). Nao bloqueia publicacao — e melhoria.

alter table public.organizations
  add column if not exists dataset_onboarding_dismissed_at timestamptz;

comment on column public.organizations.dataset_onboarding_dismissed_at is
  'Quando preenchido, o passo de onboarding de pixel/dataset ja foi dispensado e nao deve mais aparecer (Mudanca 8).';
