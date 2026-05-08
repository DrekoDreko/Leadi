-- Replace byte-token generators with UUID-based tokens to avoid extension dependency.

create or replace function public.create_lead_webhook_integration(
  target_organization_id uuid,
  integration_label text default null
)
returns table (
  id uuid,
  organization_id uuid,
  label text,
  token text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_row public.lead_webhook_integrations%rowtype;
  generated_token text;
begin
  if target_organization_id is null then
    raise exception 'Informe organization_id.';
  end if;

  if not exists (
    select 1
    from public.organizations
    where organizations.id = target_organization_id
  ) then
    raise exception 'Organizacao nao encontrada.';
  end if;

  generated_token := replace(gen_random_uuid()::text, '-', '');

  insert into public.lead_webhook_integrations (
    organization_id,
    label,
    token_hash
  )
  values (
    target_organization_id,
    nullif(trim(integration_label), ''),
    encode(digest(generated_token, 'sha256'), 'hex')
  )
  returning * into created_row;

  return query
  select
    created_row.id,
    created_row.organization_id,
    created_row.label,
    generated_token,
    created_row.created_at;
end;
$$;

create or replace function public.create_workspace_invite(requested_role_to_assign text default 'seller')
returns table (
  token text,
  invite_url_path text,
  expires_at timestamptz,
  role_to_assign text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  workspace_row public.organizations%rowtype;
  generated_token text;
  generated_expires_at timestamptz;
  generated_role_to_assign text;
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

  if profile_row.role not in ('owner', 'admin') then
    raise exception 'Apenas owners e admins podem convidar membros.';
  end if;

  select *
  into workspace_row
  from public.organizations
  where id = profile_row.organization_id
  limit 1;

  if workspace_row.id is null or workspace_row.type <> 'team' then
    raise exception 'Convites exigem um workspace de equipe.';
  end if;

  generated_role_to_assign := case
    when requested_role_to_assign = 'admin' then 'admin'
    else 'seller'
  end;

  if profile_row.role = 'admin' and generated_role_to_assign = 'admin' then
    raise exception 'Admins so podem convidar vendedores.';
  end if;

  generated_token := replace(gen_random_uuid()::text, '-', '');
  generated_expires_at := now() + interval '30 days';

  insert into public.invites (
    token,
    workspace_id,
    created_by_user_id,
    role_to_assign,
    status,
    expires_at
  )
  values (
    generated_token,
    workspace_row.id,
    profile_row.id,
    generated_role_to_assign,
    'active',
    generated_expires_at
  );

  return query
  select generated_token, '/invite/' || generated_token, generated_expires_at, generated_role_to_assign;
end;
$$;

notify pgrst, 'reload schema';
