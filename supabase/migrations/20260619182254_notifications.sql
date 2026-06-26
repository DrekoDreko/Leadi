-- Notificacoes in-app exibidas no sino do dashboard.
--
-- Primeiro caso de uso: avisar quando a Meta aprova (ou reprova) um anuncio,
-- detectado pela reconciliacao de status (delivery-status.server.ts). A tabela e
-- generica de proposito para abrigar outros tipos de aviso no futuro.
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- NULL = destinada a todos os owners da organizacao. Preenchida quando o aviso
  -- e direcionado a um perfil especifico (ex.: o criador da campanha).
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'campaign_approved', 'campaign_rejected'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX notifications_organization_id_idx ON public.notifications(organization_id);
CREATE INDEX notifications_recipient_idx ON public.notifications(recipient_profile_id);
CREATE INDEX notifications_campaign_id_idx ON public.notifications(campaign_id);
CREATE INDEX notifications_unread_idx
  ON public.notifications(organization_id, created_at DESC)
  WHERE read_at IS NULL;

-- Evita duplicar o mesmo aviso de aprovacao/reprovacao para a mesma campanha
-- quando a reconciliacao roda em lote varias vezes.
CREATE UNIQUE INDEX notifications_campaign_type_unique
  ON public.notifications(campaign_id, type)
  WHERE campaign_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Owners enxergam todas as notificacoes da organizacao; demais perfis so as suas.
CREATE POLICY "Members can view their organization notifications"
ON public.notifications
FOR SELECT
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    public.current_profile_role() = 'owner'
    OR recipient_profile_id IS NULL
    OR recipient_profile_id = public.current_profile_id()
  )
);

-- Marcar como lida: mesma visibilidade do SELECT.
CREATE POLICY "Members can mark their notifications as read"
ON public.notifications
FOR UPDATE
USING (
  organization_id = public.current_profile_organization_id()
  AND (
    public.current_profile_role() = 'owner'
    OR recipient_profile_id IS NULL
    OR recipient_profile_id = public.current_profile_id()
  )
)
WITH CHECK (
  organization_id = public.current_profile_organization_id()
);

-- INSERT e feito pelo service role (admin client) na reconciliacao, que ignora
-- RLS. Nao expomos INSERT/DELETE para authenticated de proposito.

-- Trigger for updated_at
CREATE TRIGGER notifications_set_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant access
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
