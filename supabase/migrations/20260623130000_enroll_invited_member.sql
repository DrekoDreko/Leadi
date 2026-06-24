-- Aprovar um convite-link agora matricula o convidado na hora, sem depender de
-- ele revisitar o link para "aceitar". Antes, aprovar apenas marcava
-- approval_status='approved' e o convidado precisava voltar (com a aba aberta
-- fazendo polling) para rodar accept_workspace_invite — se nao voltasse, ficava
-- aprovado mas fora da organizacao, invisivel para o gestor distribuir.
--
-- Esta funcao matricula o reivindicante (requested_by_user_id) registrado no
-- convite: replica o efeito de accept_workspace_invite, porem executada no
-- contexto do gestor (via service_role). E idempotente e so age sobre convites
-- ja aprovados que tenham um reivindicante.
CREATE OR REPLACE FUNCTION public.enroll_invited_member(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_row public.invites%rowtype;
BEGIN
  SELECT * INTO invite_row FROM public.invites WHERE id = p_invite_id;

  -- So matricula convite valido, aprovado e com reivindicante registrado.
  IF invite_row.id IS NULL
    OR invite_row.requested_by_user_id IS NULL
    OR invite_row.approval_status <> 'approved' THEN
    RETURN;
  END IF;

  -- Idempotente: ja matriculado para este reivindicante, nada a fazer.
  IF invite_row.status = 'used'
    AND invite_row.used_by_user_id = invite_row.requested_by_user_id THEN
    RETURN;
  END IF;

  -- Tira o reivindicante de outras organizacoes ativas (ele tinha, no minimo,
  -- a propria org-solo criada no cadastro).
  UPDATE public.workspace_members
  SET status = 'removed'
  WHERE public.workspace_members.user_id = invite_row.requested_by_user_id
    AND public.workspace_members.workspace_id <> invite_row.workspace_id
    AND public.workspace_members.status = 'active';

  INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
  VALUES (
    invite_row.workspace_id,
    invite_row.requested_by_user_id,
    invite_row.role_to_assign::text,
    'active'
  )
  ON CONFLICT ON CONSTRAINT workspace_members_workspace_id_user_id_key
  DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

  UPDATE public.profiles
  SET
    organization_id = invite_row.workspace_id,
    role = invite_row.role_to_assign::text,
    profile_setup_completed = true
  WHERE public.profiles.id = invite_row.requested_by_user_id;

  UPDATE public.invites
  SET
    status = 'used',
    used_by_user_id = invite_row.requested_by_user_id,
    used_at = now()
  WHERE public.invites.id = invite_row.id;
END;
$$;

-- So o servidor (service_role) pode matricular; nao expomos para anon/usuarios.
REVOKE ALL ON FUNCTION public.enroll_invited_member(uuid) FROM public;
REVOKE ALL ON FUNCTION public.enroll_invited_member(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.enroll_invited_member(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_invited_member(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
