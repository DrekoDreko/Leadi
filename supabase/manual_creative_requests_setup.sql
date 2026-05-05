-- Manual setup for the creative request flow on an existing LeadHealth database.
-- Run this whole file in Supabase SQL Editor and choose "Run without RLS" if prompted.
-- This bundles the migrations required by /dashboard/pedidos.

-- 202604300002_creative_requests.sql
create table if not exists public.creative_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('design', 'video', 'campaign')),
  title text not null,
  briefing text not null,
  status text not null default 'requested' check (status in ('requested', 'in_review', 'in_progress', 'delivered', 'approved', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_at timestamptz,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creative_requests_org_created_idx
  on public.creative_requests (organization_id, created_at desc);

create index if not exists creative_requests_org_status_idx
  on public.creative_requests (organization_id, status, created_at desc);

create index if not exists creative_requests_org_priority_idx
  on public.creative_requests (organization_id, priority, due_at asc nulls last);

create index if not exists creative_requests_requester_idx
  on public.creative_requests (requester_profile_id, created_at desc);

drop trigger if exists creative_requests_set_updated_at on public.creative_requests;
create trigger creative_requests_set_updated_at
before update on public.creative_requests
for each row execute function public.set_updated_at();

alter table public.creative_requests enable row level security;

drop policy if exists "Members can read organization creative requests" on public.creative_requests;
create policy "Members can read organization creative requests"
on public.creative_requests
for select
using (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can create organization creative requests" on public.creative_requests;
create policy "Members can create organization creative requests"
on public.creative_requests
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and requester_profile_id = public.current_profile_id()
);

drop policy if exists "Members can update organization creative requests" on public.creative_requests;
create policy "Members can update organization creative requests"
on public.creative_requests
for update
using (
  organization_id = public.current_profile_organization_id()
)
with check (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can delete organization creative requests" on public.creative_requests;
create policy "Members can delete organization creative requests"
on public.creative_requests
for delete
using (
  organization_id = public.current_profile_organization_id()
);

-- 202604300003_creative_requests_form_fields.sql
alter table public.creative_requests
  add column if not exists objective text not null default '',
  add column if not exists notes text;

comment on column public.creative_requests.objective is
  'Objetivo comercial principal do pedido de criativo.';

comment on column public.creative_requests.notes is
  'Observacoes adicionais opcionais para a equipe de producao.';

-- 202604300004_creative_requests_storage.sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creative-request-files',
  'creative-request-files',
  false,
  10485760,
  array[
    'application/msword',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can read creative request attachments" on storage.objects;
create policy "Members can read creative request attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'creative-request-files'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and exists (
    select 1
    from public.creative_requests
    where public.creative_requests.id::text = (storage.foldername(name))[2]
      and public.creative_requests.organization_id = public.current_profile_organization_id()
  )
);

drop policy if exists "Members can upload creative request attachments" on storage.objects;
create policy "Members can upload creative request attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'creative-request-files'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and exists (
    select 1
    from public.creative_requests
    where public.creative_requests.id::text = (storage.foldername(name))[2]
      and public.creative_requests.organization_id = public.current_profile_organization_id()
  )
);

-- 202605040002_creative_request_comments.sql
create table if not exists public.creative_request_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  creative_request_id uuid not null references public.creative_requests(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  body text not null,
  visibility text not null default 'workspace' check (visibility in ('workspace', 'ops_only')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creative_request_comments_request_created_idx
  on public.creative_request_comments (creative_request_id, created_at asc);

create index if not exists creative_request_comments_org_created_idx
  on public.creative_request_comments (organization_id, created_at desc);

drop trigger if exists creative_request_comments_set_updated_at on public.creative_request_comments;
create trigger creative_request_comments_set_updated_at
before update on public.creative_request_comments
for each row execute function public.set_updated_at();

alter table public.creative_request_comments enable row level security;

drop policy if exists "Members can read workspace creative request comments" on public.creative_request_comments;
create policy "Members can read workspace creative request comments"
on public.creative_request_comments
for select
using (
  organization_id = public.current_profile_organization_id()
  and visibility = 'workspace'
);

drop policy if exists "Members can create workspace creative request comments" on public.creative_request_comments;
create policy "Members can create workspace creative request comments"
on public.creative_request_comments
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and author_profile_id = public.current_profile_id()
  and visibility = 'workspace'
  and creative_request_id in (
    select id
    from public.creative_requests
    where organization_id = public.current_profile_organization_id()
  )
);

comment on column public.creative_request_comments.visibility is
  'workspace = visivel para a organizacao; ops_only = visivel apenas na operacao interna.';

notify pgrst, 'reload schema';
