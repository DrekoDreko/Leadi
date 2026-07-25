-- Migration: lead_checklists
-- Checklists estilo Trello dentro de cada lead, com itens marcaveis.

create table public.lead_checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null default 'Checklist',
  position numeric not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_checklists_lead_id_idx
  on public.lead_checklists (lead_id, position);
create index lead_checklists_organization_id_idx
  on public.lead_checklists (organization_id);

create trigger lead_checklists_set_updated_at
  before update on public.lead_checklists
  for each row execute function public.set_updated_at();

create table public.lead_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  checklist_id uuid not null references public.lead_checklists(id) on delete cascade,
  -- Denormalizado para o filtro de realtime por lead.
  lead_id uuid not null references public.leads(id) on delete cascade,
  text text not null default '',
  done boolean not null default false,
  position numeric not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_checklist_items_checklist_id_idx
  on public.lead_checklist_items (checklist_id, position);
create index lead_checklist_items_lead_id_idx
  on public.lead_checklist_items (lead_id);
create index lead_checklist_items_organization_id_idx
  on public.lead_checklist_items (organization_id);

create trigger lead_checklist_items_set_updated_at
  before update on public.lead_checklist_items
  for each row execute function public.set_updated_at();

-- RLS: qualquer membro da organizacao pode gerenciar checklists dos leads da sua organizacao.
alter table public.lead_checklists enable row level security;

create policy "Members manage organization checklists"
on public.lead_checklists
for all
using (organization_id = public.current_profile_organization_id())
with check (organization_id = public.current_profile_organization_id());

grant select, insert, update, delete on public.lead_checklists to authenticated;

alter table public.lead_checklist_items enable row level security;

create policy "Members manage organization checklist items"
on public.lead_checklist_items
for all
using (organization_id = public.current_profile_organization_id())
with check (organization_id = public.current_profile_organization_id());

grant select, insert, update, delete on public.lead_checklist_items to authenticated;

notify pgrst, 'reload schema';
