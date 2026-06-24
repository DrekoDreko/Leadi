-- Novo tipo de notificação: owner liberou o consultor para criar anúncios com IA.
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'campaign_approved',
      'campaign_rejected',
      'invite_pending',
      'team_member_added',
      'ad_creation_enabled'
    )
  );

notify pgrst, 'reload schema';
