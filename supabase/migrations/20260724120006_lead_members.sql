-- Migration: lead_members
-- Membros de um card (leads) estilo Trello: multiplos perfis podem ser associados
-- a um lead alem do owner. Usado para exibir avatares na frente do card.

create table public.lead_members (
  lead_id uuid not null references public.leads(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, profile_id)
);

create index lead_members_profile_id_idx on public.lead_members (profile_id);
create index lead_members_organization_id_idx on public.lead_members (organization_id);

alter table public.lead_members enable row level security;

create policy "Members read organization lead members"
on public.lead_members
for select
using (organization_id = public.current_profile_organization_id());

create policy "Members manage organization lead members"
on public.lead_members
for all
using (organization_id = public.current_profile_organization_id())
with check (organization_id = public.current_profile_organization_id());

grant select, insert, update, delete on public.lead_members to authenticated;

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lead_members'
  ) then
    alter publication supabase_realtime add table public.lead_members;
  end if;
end;
$$;

alter table public.lead_members replica identity full;

notify pgrst, 'reload schema';
