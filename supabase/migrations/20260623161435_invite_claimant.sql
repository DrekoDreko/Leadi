-- Registra quem reivindicou (criou conta a partir de) um convite-link pendente.
-- Sem esse sinal, o gestor conseguia "aprovar" convites que ninguem havia
-- reivindicado, e nao havia como pular o onboarding apenas para contas vindas
-- de convite. Tambem trava o link ja aprovado ao usuario que o reivindicou.

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS requested_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS requested_at timestamptz;

-- Registra o convidado que reivindicou um convite-link pendente e marca o
-- perfil como configurado para pular o onboarding de planos. Nao levanta
-- excecao no caminho feliz (evita rollback do plpgsql) e e idempotente:
-- so grava o reivindicante na primeira vez (primeiro a reivindicar).
CREATE OR REPLACE FUNCTION public.claim_workspace_invite(invite_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%rowtype;
  invite_row public.invites%rowtype;
  profile_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT *
  INTO profile_row
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'Perfil nao encontrado.';
  END IF;

  SELECT *
  INTO invite_row
  FROM public.invites
  WHERE invites.token = invite_token
  LIMIT 1;

  -- So agimos sobre convites validos e pendentes de aprovacao. Convites
  -- inexistentes/expirados/rejeitados sao ignorados silenciosamente para nao
  -- marcar profile_setup_completed de contas que nao estao entrando numa equipe.
  IF invite_row.id IS NULL
    OR invite_row.status <> 'active'
    OR invite_row.expires_at <= now()
    OR invite_row.approval_status <> 'pending' THEN
    RETURN;
  END IF;

  -- Respeita o trava por email, se houver.
  IF invite_row.invited_email IS NOT NULL THEN
    SELECT lower(u.email)
    INTO profile_email
    FROM auth.users u
    WHERE u.id = auth.uid();

    IF profile_email IS NULL OR profile_email <> lower(invite_row.invited_email) THEN
      RETURN;
    END IF;
  END IF;

  -- Primeiro a reivindicar fica registrado; reivindicacoes seguintes nao
  -- sobrescrevem o convidado original.
  IF invite_row.requested_by_user_id IS NULL THEN
    UPDATE public.invites
    SET
      requested_by_user_id = profile_row.id,
      requested_at = now()
    WHERE invites.id = invite_row.id
      AND invites.requested_by_user_id IS NULL;
  END IF;

  -- Conta vinda de convite real pula o onboarding de planos.
  UPDATE public.profiles
  SET profile_setup_completed = true
  WHERE profiles.id = profile_row.id;
END;
$$;

-- Reescreve accept_workspace_invite para travar o link aprovado ao usuario que
-- o reivindicou: depois da aprovacao, somente o convidado original pode entrar.
CREATE OR REPLACE FUNCTION public.accept_workspace_invite(invite_token text)
RETURNS TABLE (
  workspace_id uuid,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%rowtype;
  invite_row public.invites%rowtype;
  profile_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT *
  INTO profile_row
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF profile_row.id IS NULL THEN
    RAISE EXCEPTION 'Perfil nao encontrado.';
  END IF;

  SELECT *
  INTO invite_row
  FROM public.invites
  WHERE invites.token = invite_token
  LIMIT 1;

  IF invite_row.id IS NULL THEN
    RAISE EXCEPTION 'Convite nao encontrado.';
  END IF;

  IF invite_row.status = 'used' AND invite_row.used_by_user_id = profile_row.id THEN
    RETURN QUERY
    SELECT invite_row.workspace_id, invite_row.role_to_assign;
    RETURN;
  END IF;

  IF invite_row.status <> 'active' OR invite_row.expires_at <= now() THEN
    UPDATE public.invites
    SET status = CASE WHEN invites.status = 'active' THEN 'expired' ELSE invites.status END
    WHERE invites.id = invite_row.id;

    RAISE EXCEPTION 'Convite expirado ou indisponivel.';
  END IF;

  -- Validate email if invite is locked to a specific address
  IF invite_row.invited_email IS NOT NULL THEN
    SELECT lower(u.email)
    INTO profile_email
    FROM auth.users u
    WHERE u.id = auth.uid();

    IF profile_email IS NULL OR profile_email <> lower(invite_row.invited_email) THEN
      RAISE EXCEPTION 'Este convite foi enviado para outro email.';
    END IF;
  END IF;

  IF invite_row.approval_status = 'pending' THEN
    RAISE EXCEPTION 'Convite pendente de aprovacao.';
  END IF;

  IF invite_row.approval_status = 'rejected' THEN
    RAISE EXCEPTION 'Convite rejeitado.';
  END IF;

  -- Convite ja aprovado fica travado ao convidado que o reivindicou: impede que
  -- um terceiro com o mesmo link entre no lugar do convidado aprovado.
  IF invite_row.requested_by_user_id IS NOT NULL
    AND invite_row.requested_by_user_id <> profile_row.id THEN
    RAISE EXCEPTION 'Este convite foi aprovado para outro usuario.';
  END IF;

  UPDATE public.workspace_members
  SET status = 'removed'
  WHERE public.workspace_members.user_id = profile_row.id
    AND public.workspace_members.workspace_id <> invite_row.workspace_id
    AND public.workspace_members.status = 'active';

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (invite_row.workspace_id, profile_row.id, invite_row.role_to_assign::text, 'active')
  ON CONFLICT ON CONSTRAINT workspace_members_workspace_id_user_id_key
  DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

  UPDATE public.profiles
  SET
    organization_id = invite_row.workspace_id,
    role = invite_row.role_to_assign::text,
    profile_setup_completed = true
  WHERE profiles.id = profile_row.id;

  UPDATE public.invites
  SET
    status = 'used',
    used_by_user_id = profile_row.id,
    used_at = now()
  WHERE invites.id = invite_row.id;

  RETURN QUERY
  SELECT invite_row.workspace_id, invite_row.role_to_assign;
END;
$$;

NOTIFY pgrst, 'reload schema';
