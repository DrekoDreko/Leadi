-- Add email-based invite security: invites can be locked to a specific email.
-- Link-only invites (no email) created by owners now require approval.

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS invited_email TEXT;

CREATE INDEX IF NOT EXISTS invites_invited_email_workspace_status_idx
  ON public.invites (invited_email, workspace_id, status)
  WHERE invited_email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_workspace_invite(
  requested_role_to_assign text DEFAULT 'seller',
  target_email text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  token text,
  invite_url_path text,
  expires_at timestamptz,
  role_to_assign text,
  requires_approval boolean,
  approval_status text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%rowtype;
  workspace_row public.organizations%rowtype;
  generated_token text;
  generated_expires_at timestamptz;
  generated_role_to_assign text;
  creator_team_id uuid;
  generated_requires_approval boolean;
  generated_approval_status text;
  inserted_id uuid;
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

  IF profile_row.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Apenas owners e admins podem convidar membros.';
  END IF;

  SELECT *
  INTO workspace_row
  FROM public.organizations
  WHERE organizations.id = profile_row.organization_id
  LIMIT 1;

  IF workspace_row.id IS NULL OR workspace_row.type <> 'team' THEN
    RAISE EXCEPTION 'Convites exigem um workspace de equipe.';
  END IF;

  generated_role_to_assign := CASE
    WHEN requested_role_to_assign = 'admin' THEN 'admin'
    ELSE 'seller'
  END;

  IF profile_row.role = 'admin' AND generated_role_to_assign = 'admin' THEN
    RAISE EXCEPTION 'Admins so podem convidar vendedores.';
  END IF;

  creator_team_id := NULL;

  IF profile_row.role = 'admin' THEN
    SELECT team_member_row.team_id
    INTO creator_team_id
    FROM public.team_members AS team_member_row
    WHERE team_member_row.profile_id = profile_row.id
      AND team_member_row.organization_id = workspace_row.id
      AND team_member_row.role = 'supervisor'
      AND team_member_row.status = 'active'
    ORDER BY team_member_row.created_at ASC
    LIMIT 1;
  END IF;

  -- Email-based invites don't need approval (email itself is the auth).
  -- Link-only invites and admin-created invites always need approval.
  IF target_email IS NOT NULL THEN
    generated_requires_approval := false;
    generated_approval_status := 'not_required';
  ELSE
    generated_requires_approval := true;
    generated_approval_status := 'pending';
  END IF;

  -- Admins always need approval regardless
  IF profile_row.role = 'admin' THEN
    generated_requires_approval := true;
    generated_approval_status := 'pending';
  END IF;

  generated_token := replace(gen_random_uuid()::text, '-', '');
  generated_expires_at := now() + interval '30 days';

  INSERT INTO public.invites (
    token,
    workspace_id,
    created_by_user_id,
    team_id,
    role_to_assign,
    status,
    requires_approval,
    approval_status,
    invited_email,
    expires_at
  )
  VALUES (
    generated_token,
    workspace_row.id,
    profile_row.id,
    creator_team_id,
    generated_role_to_assign,
    'active',
    generated_requires_approval,
    generated_approval_status,
    lower(trim(target_email)),
    generated_expires_at
  )
  RETURNING invites.id INTO inserted_id;

  RETURN QUERY
  SELECT
    inserted_id,
    generated_token,
    '/invite/' || generated_token,
    generated_expires_at,
    generated_role_to_assign,
    generated_requires_approval,
    generated_approval_status,
    'active'::text;
END;
$$;

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
