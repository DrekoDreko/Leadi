-- Remove vestigios de "seller" em workspace "solo" que ja foram migrados para "owner".

create or replace function public.update_workspace_name(workspace_name text)
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
  normalized_name := nullif(btrim(workspace_name), '');

  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if normalized_name is null then
    raise exception 'Informe o nome da equipe.';
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

  if profile_row.role not in ('owner', 'admin') then
    raise exception 'Sem permissao para alterar o nome da corretora.';
  end if;

  update public.organizations
  set name = normalized_name
  where id = profile_row.organization_id;
end;
$$;

drop policy if exists "Owners and admins can update their organization" on public.organizations;
create policy "Owners and admins can update their organization"
on public.organizations
for update
using (
  id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);
