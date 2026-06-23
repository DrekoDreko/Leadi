-- RPC do novo onboarding por PLANO. Substitui a escolha binaria
-- (Consultor/Supervisor) do complete_profile_setup pela escolha de plano:
--   essencial / profissional -> workspace solo
--   equipe                   -> workspace de equipe (team)
-- Em todos os casos o usuario vira OWNER da propria organizacao. O plano
-- escolhido fica salvo em organizations.plan_type (fonte da verdade das
-- permissoes, valida mesmo com BILLING_DISABLED).

create or replace function public.complete_plan_setup(plan_code text)
returns table (
  plan_slug text,
  workspace_type text,
  organization_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid;
  profile_row public.profiles%rowtype;
  resolved_type text;
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

  if plan_code not in ('essencial', 'profissional', 'equipe') then
    raise exception 'Plano invalido.';
  end if;

  resolved_type := case when plan_code = 'equipe' then 'team' else 'solo' end;

  update public.organizations
  set
    type = resolved_type,
    owner_profile_id = profile_row.id,
    plan_type = complete_plan_setup.plan_code,
    plan_status = 'pending',
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
  select complete_plan_setup.plan_code, resolved_type, profile_row.organization_id;
end;
$$;
