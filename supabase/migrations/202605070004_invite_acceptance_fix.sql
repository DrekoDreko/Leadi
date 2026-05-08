-- Fix PL/pgSQL ambiguity in workspace invite acceptance.

create or replace function public.accept_workspace_invite(invite_token text)
returns table (
  workspace_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  invite_row public.invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select *
  into profile_row
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;

  if profile_row.id is null then
    raise exception 'Perfil nao encontrado.';
  end if;

  select *
  into invite_row
  from public.invites
  where token = invite_token
  limit 1;

  if invite_row.id is null then
    raise exception 'Convite nao encontrado.';
  end if;

  if invite_row.status = 'used' and invite_row.used_by_user_id = profile_row.id then
    return query
    select invite_row.workspace_id, invite_row.role_to_assign;
    return;
  end if;

  if invite_row.status <> 'active' or invite_row.expires_at <= now() then
    update public.invites
    set status = case when status = 'active' then 'expired' else status end
    where id = invite_row.id;

    raise exception 'Convite expirado ou indisponivel.';
  end if;

  update public.workspace_members
  set status = 'removed'
  where public.workspace_members.user_id = profile_row.id
    and public.workspace_members.workspace_id <> invite_row.workspace_id
    and public.workspace_members.status = 'active';

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (invite_row.workspace_id, profile_row.id, invite_row.role_to_assign::text, 'active')
  on conflict on constraint workspace_members_workspace_id_user_id_key
  do update set role = excluded.role, status = excluded.status;

  update public.profiles
  set
    organization_id = invite_row.workspace_id,
    role = invite_row.role_to_assign::text,
    profile_setup_completed = true
  where id = profile_row.id;

  update public.invites
  set
    status = 'used',
    used_by_user_id = profile_row.id,
    used_at = now()
  where id = invite_row.id;

  return query
  select invite_row.workspace_id, invite_row.role_to_assign;
end;
$$;

notify pgrst, 'reload schema';
