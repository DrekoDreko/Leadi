-- Migration: board function hardening
-- Revoga EXECUTE público das funções SECURITY DEFINER internas do board.
-- São funções de trigger / uso interno (o seed roda via trigger de organizations
-- e via a migration inicial) — não devem ser chamáveis por anon/authenticated,
-- o que também fecha o vetor de semear etapas em organizações de terceiros.

revoke execute on function public.seed_default_pipeline_stages(uuid) from public, anon, authenticated;
revoke execute on function public.seed_pipeline_stages_on_organization_insert() from public, anon, authenticated;
revoke execute on function public.set_lead_board_defaults() from public, anon, authenticated;

notify pgrst, 'reload schema';
