-- Manual onboarding fix for an existing LeadHealth database.
-- Run this whole file in Supabase SQL Editor and choose "Run without RLS" if prompted.

alter table public.organizations
  add column if not exists type text not null default 'solo',
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organizations_type_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_type_check
      check (type in ('solo', 'team'));
  end if;
end;
$$;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'admin', 'seller', 'supervisor'));

alter table public.profiles
  add column if not exists profile_setup_completed boolean not null default false;

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('seller', 'supervisor')),
  status text not null default 'active' check (status in ('active', 'invited', 'removed')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  workspace_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  role_to_assign text not null default 'seller' check (role_to_assign in ('seller')),
  status text not null default 'active' check (status in ('active', 'expired', 'used')),
  used_by_user_id uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists workspace_members_workspace_idx
  on public.workspace_members (workspace_id, status);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id, status);

create index if not exists invites_workspace_idx
  on public.invites (workspace_id, status, created_at desc);

create index if not exists invites_token_idx
  on public.invites (token);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_profile_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1
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
  profile_row public.profiles%rowtype;
  workspace_type text;
  next_role text;
  next_redirect text;
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

  if setup_mode not in ('solo', 'supervisor') then
    raise exception 'Tipo de perfil invalido.';
  end if;

  if setup_mode = 'supervisor' then
    workspace_type := 'team';
    next_role := 'supervisor';
    next_redirect := '/team/invite';
  else
    workspace_type := 'solo';
    next_role := 'seller';
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
    role = next_role,
    profile_setup_completed = true
  where id = profile_row.id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (profile_row.organization_id, profile_row.id, next_role, 'active')
  on conflict (workspace_id, user_id)
  do update set role = excluded.role, status = excluded.status;

  return query
  select next_role, profile_row.organization_id, next_redirect;
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

  if profile_row.id is null or profile_row.role <> 'supervisor' then
    raise exception 'Apenas supervisores podem editar a equipe.';
  end if;

  update public.organizations
  set name = normalized_name
  where id = profile_row.organization_id
    and type = 'team';
end;
$$;

create or replace function public.create_workspace_invite()
returns table (
  token text,
  invite_url_path text,
  expires_at timestamptz
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
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select *
  into profile_row
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;

  if profile_row.id is null or profile_row.role <> 'supervisor' then
    raise exception 'Apenas supervisores podem convidar vendedores.';
  end if;

  select *
  into workspace_row
  from public.organizations
  where id = profile_row.organization_id
  limit 1;

  if workspace_row.id is null or workspace_row.type <> 'team' then
    raise exception 'Convites exigem um workspace de equipe.';
  end if;

  generated_token := encode(gen_random_bytes(24), 'hex');
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
    'seller',
    'active',
    generated_expires_at
  );

  return query
  select generated_token, '/invite/' || generated_token, generated_expires_at;
end;
$$;

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
  organization_id,
  id,
  case when role = 'supervisor' then 'supervisor' else 'seller' end,
  'active'
from public.profiles
on conflict (workspace_id, user_id) do nothing;

alter table public.workspace_members enable row level security;
alter table public.invites enable row level security;

grant select on public.workspace_members to authenticated;
grant select on public.invites to authenticated;
grant execute on function public.complete_profile_setup(text) to authenticated;
grant execute on function public.update_workspace_name(text) to authenticated;
grant execute on function public.create_workspace_invite() to authenticated;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_profile_organization_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;

notify pgrst, 'reload schema';
