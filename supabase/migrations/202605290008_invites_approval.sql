-- Add approval metadata to workspace invites and gate invite acceptance on approval.

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invites_approval_status_check'
      AND conrelid = 'public.invites'::regclass
  ) THEN
    ALTER TABLE public.invites
      ADD CONSTRAINT invites_approval_status_check
      CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS invites_team_id_idx
  ON public.invites (team_id);

CREATE INDEX IF NOT EXISTS invites_workspace_approval_status_idx
  ON public.invites (workspace_id, approval_status, created_at DESC);

UPDATE public.invites
SET
  requires_approval = false,
  approval_status = 'not_required'
WHERE requires_approval IS DISTINCT FROM false
   OR approval_status IS DISTINCT FROM 'not_required';

CREATE OR REPLACE FUNCTION public.create_workspace_invite(requested_role_to_assign text default 'seller')
RETURNS TABLE (
  token text,
  invite_url_path text,
  expires_at timestamptz,
  role_to_assign text
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
  WHERE id = profile_row.organization_id
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

  generated_requires_approval := profile_row.role = 'admin';
  generated_approval_status := CASE
    WHEN generated_requires_approval THEN 'pending'
    ELSE 'not_required'
  END;
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
    generated_expires_at
  );

  RETURN QUERY
  SELECT generated_token, '/invite/' || generated_token, generated_expires_at, generated_role_to_assign;
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
  WHERE token = invite_token
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
    SET status = CASE WHEN status = 'active' THEN 'expired' ELSE status END
    WHERE id = invite_row.id;

    RAISE EXCEPTION 'Convite expirado ou indisponivel.';
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
  WHERE id = profile_row.id;

  UPDATE public.invites
  SET
    status = 'used',
    used_by_user_id = profile_row.id,
    used_at = now()
  WHERE id = invite_row.id;

  RETURN QUERY
  SELECT invite_row.workspace_id, invite_row.role_to_assign;
END;
$$;

NOTIFY pgrst, 'reload schema';
