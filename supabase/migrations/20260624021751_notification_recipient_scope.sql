-- Corrige o escopo de visibilidade das notificacoes.
--
-- Antes: o owner enxergava TODAS as notificacoes da organizacao (clausula
-- `current_profile_role() = 'owner'`), inclusive as direcionadas a um perfil
-- especifico. Isso fazia, por exemplo, o aviso "Voce foi liberado para criar
-- anuncios" (destinado ao consultor) aparecer no sino do owner.
--
-- Agora: cada notificacao com `recipient_profile_id` pertence APENAS ao
-- destinatario. Avisos para todos continuam com `recipient_profile_id IS NULL`.
-- O owner so ve o que e dele ou broadcast — alinhado ao modelo de destinatario.

DROP POLICY IF EXISTS "Members can view their organization notifications" ON public.notifications;
CREATE POLICY "Members can view their organization notifications"
ON public.notifications
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    recipient_profile_id IS NULL
    OR recipient_profile_id = public.current_profile_id()
  )
);

DROP POLICY IF EXISTS "Members can mark their notifications as read" ON public.notifications;
CREATE POLICY "Members can mark their notifications as read"
ON public.notifications
FOR UPDATE
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    recipient_profile_id IS NULL
    OR recipient_profile_id = public.current_profile_id()
  )
)
WITH CHECK (
  organization_id = public.current_profile_organization_id()
);
