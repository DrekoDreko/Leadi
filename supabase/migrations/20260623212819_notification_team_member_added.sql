-- Novo tipo de notificacao: avisa o supervisor quando um consultor e alocado
-- (ou transferido) para a equipe dele pelo gestor no organizador de equipes.
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('campaign_approved', 'campaign_rejected', 'team_member_added'));

NOTIFY pgrst, 'reload schema';
