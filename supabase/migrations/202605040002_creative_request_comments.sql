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
