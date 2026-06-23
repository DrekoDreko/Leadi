-- Adiciona o bloco `features` (e ajusta `included_credits`) na metadata de cada
-- plano publico, para a fonte da verdade de permissoes por plano:
--   Essencial  -> sem nenhuma IA, sem Meta, sem equipe.
--   Profissional -> IA completa + Meta, sem equipe.
--   Equipe     -> IA completa + Meta + convites/distribuicao de equipe.
-- Idempotente: faz merge (||) preservando o resto da metadata.

update public.plans
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'included_credits', 0,
  'features', jsonb_build_object(
    'ai', false,
    'creative_requests', false,
    'team_invites', false,
    'meta_integration', false,
    'lead_distribution', false
  )
)
where code = 'essencial';

update public.plans
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'included_credits', 75,
  'features', jsonb_build_object(
    'ai', true,
    'creative_requests', false,
    'team_invites', false,
    'meta_integration', true,
    'lead_distribution', false
  )
)
where code = 'profissional';

update public.plans
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'included_credits', 150,
  'features', jsonb_build_object(
    'ai', true,
    'creative_requests', false,
    'team_invites', true,
    'meta_integration', true,
    'lead_distribution', true
  )
)
where code = 'equipe';
