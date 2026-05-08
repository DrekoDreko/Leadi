-- Normalize workspace roles to owner/admin/seller and keep invites link-based.

alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;

  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('owner', 'admin', 'seller'));
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_members_role_check'
      and conrelid = 'public.workspace_members'::regclass
  ) then
    alter table public.workspace_members drop constraint workspace_members_role_check;
  end if;

  alter table public.workspace_members
    add constraint workspace_members_role_check
    check (role in ('owner', 'admin', 'seller'));
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'invites_role_to_assign_check'
      and conrelid = 'public.invites'::regclass
  ) then
    alter table public.invites drop constraint invites_role_to_assign_check;
  end if;

  alter table public.invites
    add constraint invites_role_to_assign_check
    check (role_to_assign in ('admin', 'seller'));
end;
$$;

update public.profiles
set role = 'admin'
where role = 'supervisor';

update public.profiles profile_row
set role = 'owner'
from public.organizations organization_row
where organization_row.owner_profile_id = profile_row.id
  and profile_row.role <> 'owner';

update public.organizations organization_row
set owner_profile_id = profile_row.id
from public.profiles profile_row
where organization_row.owner_profile_id is null
  and profile_row.organization_id = organization_row.id
  and profile_row.id = (
    select first_profile.id
    from public.profiles first_profile
    where first_profile.organization_id = organization_row.id
    order by first_profile.created_at asc
    limit 1
  );

insert into public.workspace_members (workspace_id, user_id, role, status)
select
  profile_row.organization_id,
  profile_row.id,
  case
    when profile_row.role = 'owner' or organization_row.owner_profile_id = profile_row.id then 'owner'
    when profile_row.role = 'admin' then 'admin'
    else 'seller'
  end,
  'active'
from public.profiles profile_row
join public.organizations organization_row
  on organization_row.id = profile_row.organization_id
on conflict (workspace_id, user_id)
do update set
  role = excluded.role,
  status = excluded.status;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  new_profile_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.organizations (name, type)
  values (display_name || ' CRM', 'solo')
  returning id into new_organization_id;

  insert into public.profiles (
    auth_user_id,
    organization_id,
    full_name,
    email,
    role,
    profile_setup_completed
  )
  values (
    new.id,
    new_organization_id,
    display_name,
    new.email,
    'owner',
    false
  )
  returning id into new_profile_id;

  update public.organizations
  set owner_profile_id = new_profile_id
  where id = new_organization_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_organization_id, new_profile_id, 'owner', 'active')
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, status = excluded.status;

  return new;
end;
$$;

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
    next_redirect := '/team/setup';
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

  if not (
    profile_row.role in ('owner', 'admin')
    or (profile_row.role = 'seller' and workspace_row.type = 'solo')
  ) then
    raise exception 'Sem permissao para alterar o nome da corretora.';
  end if;

  update public.organizations
  set name = normalized_name
  where id = profile_row.organization_id;
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
    and public.workspace_members.status = 'active';

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (invite_row.workspace_id, profile_row.id, invite_row.role_to_assign::text, 'active')
  on conflict (workspace_id, user_id)
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

create or replace function public.update_workspace_member_role(
  target_profile_id uuid,
  next_role text
)
returns table (
  workspace_id uuid,
  user_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if next_role not in ('admin', 'seller') then
    raise exception 'Papel de membro invalido.';
  end if;

  select *
  into actor_profile
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;

  if actor_profile.id is null then
    raise exception 'Perfil nao encontrado.';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = target_profile_id
  limit 1;

  if target_profile.id is null then
    raise exception 'Membro nao encontrado.';
  end if;

  if target_profile.organization_id <> actor_profile.organization_id then
    raise exception 'O membro nao pertence a sua organizacao.';
  end if;

  if target_profile.id = actor_profile.id then
    raise exception 'Nao altere o proprio papel.';
  end if;

  if target_profile.role = 'owner' then
    raise exception 'Nao e possivel alterar o owner da organizacao.';
  end if;

  if actor_profile.role <> 'owner' then
    raise exception 'Apenas o owner pode alterar papeis.';
  end if;

  update public.profiles
  set role = next_role
  where id = target_profile.id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (target_profile.organization_id, target_profile.id, next_role, 'active')
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, status = excluded.status;

  return query
  select target_profile.organization_id, target_profile.id, next_role;
end;
$$;

create or replace function public.remove_workspace_member(target_profile_id uuid)
returns table (
  workspace_id uuid,
  user_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  new_organization_id uuid;
  display_name text;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select *
  into actor_profile
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;

  if actor_profile.id is null then
    raise exception 'Perfil nao encontrado.';
  end if;

  if actor_profile.role not in ('owner', 'admin') then
    raise exception 'Sem permissao para remover membros.';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = target_profile_id
  limit 1;

  if target_profile.id is null then
    raise exception 'Membro nao encontrado.';
  end if;

  if target_profile.organization_id <> actor_profile.organization_id then
    raise exception 'O membro nao pertence a sua organizacao.';
  end if;

  if target_profile.id = actor_profile.id then
    raise exception 'Nao e possivel remover o proprio usuario.';
  end if;

  if target_profile.role = 'owner' then
    raise exception 'Nao e possivel remover o owner da organizacao.';
  end if;

  if actor_profile.role = 'admin' and target_profile.role <> 'seller' then
    raise exception 'Admins so podem remover vendedores.';
  end if;

  update public.workspace_members
  set status = 'removed'
  where user_id = target_profile.id
    and status = 'active';

  display_name := coalesce(target_profile.full_name, split_part(target_profile.email::text, '@', 1));

  insert into public.organizations (name, type)
  values (display_name || ' CRM', 'solo')
  returning id into new_organization_id;

  update public.organizations
  set owner_profile_id = target_profile.id
  where id = new_organization_id;

  update public.profiles
  set
    organization_id = new_organization_id,
    role = 'owner',
    profile_setup_completed = true
  where id = target_profile.id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_organization_id, target_profile.id, 'owner', 'active')
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, status = excluded.status;

  return query
  select new_organization_id, target_profile.id, 'owner';
end;
$$;

create or replace function public.undo_csv_import_batch(batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  deleted_count integer;
begin
  select *
  into current_profile
  from public.profiles
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'Usuario nao autenticado.';
  end if;

  if current_profile.role not in ('owner', 'admin') then
    if exists (
      select 1
      from public.leads
      where organization_id = current_profile.organization_id
        and import_batch_id = batch_id
        and owner_profile_id is distinct from current_profile.id
    ) then
      raise exception 'Sem permissao para desfazer este lote.';
    end if;
  end if;

  delete from public.leads
  where organization_id = current_profile.organization_id
    and import_batch_id = batch_id
    and (
      current_profile.role in ('owner', 'admin')
      or owner_profile_id = current_profile.id
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

drop policy if exists "Owners and admins can update their organization" on public.organizations;
drop policy if exists "Supervisors can update their workspace" on public.organizations;
create policy "Owners and admins can update their organization"
on public.organizations
for update
using (
  id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin')
    or (
      public.current_profile_role() = 'seller'
      and type = 'solo'
    )
  )
)
with check (
  id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin')
    or (
      public.current_profile_role() = 'seller'
      and type = 'solo'
    )
  )
);

drop policy if exists "Supervisors can read workspace invites" on public.invites;
create policy "Owners and admins can read workspace invites"
on public.invites
for select
using (
  workspace_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Members can read permitted workspace leads" on public.leads;
create policy "Members can read permitted workspace leads"
on public.leads
for select
using (
  organization_id = public.current_profile_organization_id()
  and (
    public.current_profile_role() in ('owner', 'admin')
    or owner_profile_id = public.current_profile_id()
  )
);

drop policy if exists "Members can create organization leads" on public.leads;
create policy "Members can create organization leads"
on public.leads
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and (
        p.role in ('owner', 'admin')
        or (
          public.leads.owner_profile_id = p.id
          and public.leads.source <> 'meta_lead_ads'
        )
      )
  )
);

drop policy if exists "Supervisors can update organization leads" on public.leads;
drop policy if exists "Lead owners can update own non Meta leads" on public.leads;
create policy "Owners and admins can update organization leads"
on public.leads
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and p.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and p.role in ('owner', 'admin')
  )
);

create policy "Lead owners can update own non Meta leads"
on public.leads
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and public.leads.owner_profile_id = p.id
      and public.leads.source <> 'meta_lead_ads'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and public.leads.owner_profile_id = p.id
      and public.leads.source <> 'meta_lead_ads'
  )
);

drop policy if exists "Supervisors can delete organization leads" on public.leads;
drop policy if exists "Lead owners can delete own non Meta leads" on public.leads;
create policy "Owners and admins can delete organization leads"
on public.leads
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and p.role in ('owner', 'admin')
  )
);

create policy "Lead owners can delete own non Meta leads"
on public.leads
for delete
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.organization_id = public.leads.organization_id
      and public.leads.owner_profile_id = p.id
      and public.leads.source <> 'meta_lead_ads'
  )
);

grant select on public.workspace_members to authenticated;
grant select on public.invites to authenticated;
grant execute on function public.handle_new_user() to authenticated;
grant execute on function public.complete_profile_setup(text) to authenticated;
grant execute on function public.update_workspace_name(text) to authenticated;
grant execute on function public.create_workspace_invite(text) to authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;
grant execute on function public.update_workspace_member_role(uuid, text) to authenticated;
grant execute on function public.remove_workspace_member(uuid) to authenticated;
grant execute on function public.undo_csv_import_batch(uuid) to authenticated;

notify pgrst, 'reload schema';
