-- Liberação individual para o consultor (seller) criar anúncios com IA na própria conta Meta.
-- O owner liga/desliga esse grant por membro. Owner e admin seguem podendo criar anúncios
-- pelo papel (PERMISSION_MAP), independente desta coluna.

alter table public.profiles
  add column if not exists ad_creation_enabled boolean not null default false;

comment on column public.profiles.ad_creation_enabled is
  'Quando true, o consultor (seller) pode criar/publicar anúncios com IA usando a própria conta Meta. Liberado pelo owner.';

notify pgrst, 'reload schema';
