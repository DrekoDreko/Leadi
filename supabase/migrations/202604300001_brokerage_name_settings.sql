-- Commercial identity used in customer-facing generated messages.

create or replace function public.update_brokerage_name(brokerage_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  workspace_row public.organizations%rowtype;
  normalized_name text;
begin
  normalized_name := nullif(btrim(brokerage_name), '');

  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if normalized_name is null then
    raise exception 'Informe o nome da corretora.';
  end if;

  if length(normalized_name) > 80 then
    raise exception 'O nome da corretora deve ter no maximo 80 caracteres.';
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
  into workspace_row
  from public.organizations
  where id = profile_row.organization_id
  limit 1;

  if workspace_row.id is null then
    raise exception 'Workspace nao encontrado.';
  end if;

  if not (
    profile_row.role = 'supervisor'
    or (profile_row.role = 'seller' and workspace_row.type = 'solo')
  ) then
    raise exception 'Sem permissao para alterar o nome da corretora.';
  end if;

  update public.organizations
  set name = normalized_name
  where id = profile_row.organization_id;
end;
$$;

grant execute on function public.update_brokerage_name(text) to authenticated;

notify pgrst, 'reload schema';
