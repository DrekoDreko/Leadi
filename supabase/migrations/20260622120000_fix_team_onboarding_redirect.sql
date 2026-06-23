-- Corrige o redirect do onboarding de equipe.
-- A funcao complete_profile_setup apontava para '/team/setup', uma rota que nunca
-- existiu, causando 404 ao escolher "Configurar supervisao". A pagina real de
-- onboarding de equipe (convites) fica em '/team/invite'.

create or replace function public.complete_profile_setup(setup_mode text)
returns table (
  role text,
  organization_id uuid,
  redirect_path text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid;
  profile_row public.profiles%rowtype;
  workspace_type text;
  next_redirect text;
begin
  current_auth_user_id := auth.uid();

  if current_auth_user_id is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select *
  into profile_row
  from public.profiles
  where auth_user_id = current_auth_user_id
  limit 1;

  if profile_row.id is null then
    raise exception 'Perfil nao encontrado.';
  end if;

  if setup_mode not in ('solo', 'team') then
    raise exception 'Tipo de perfil invalido.';
  end if;

  if setup_mode = 'team' then
    workspace_type := 'team';
    next_redirect := '/team/invite';
  else
    workspace_type := 'solo';
    next_redirect := '/dashboard';
  end if;

  update public.organizations
  set
    type = workspace_type,
    owner_profile_id = profile_row.id,
    name = case
      when name is null or btrim(name) = '' then coalesce(profile_row.full_name, split_part(profile_row.email::text, '@', 1)) || ' CRM'
      else name
    end
  where id = profile_row.organization_id;

  update public.profiles
  set
    role = 'owner',
    profile_setup_completed = true
  where id = profile_row.id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (profile_row.organization_id, profile_row.id, 'owner', 'active')
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, status = excluded.status;

  return query
  select 'owner', profile_row.organization_id, next_redirect;
end;
$$;
