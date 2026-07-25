-- Migration: lead_labels
-- Etiquetas coloridas estilo Trello, por organizacao, e sua associacao aos leads.

create table public.lead_labels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default '',
  color text not null default 'slate',
  position numeric not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_labels_organization_position_idx
  on public.lead_labels (organization_id, position);

create trigger lead_labels_set_updated_at
  before update on public.lead_labels
  for each row execute function public.set_updated_at();

create table public.lead_label_assignments (
  lead_id uuid not null references public.leads(id) on delete cascade,
  label_id uuid not null references public.lead_labels(id) on delete cascade,
  -- Denormalizado para simplificar RLS e o filtro de realtime.
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, label_id)
);

create index lead_label_assignments_label_id_idx
  on public.lead_label_assignments (label_id);
create index lead_label_assignments_organization_id_idx
  on public.lead_label_assignments (organization_id);

-- RLS: leitura para toda a organizacao; criar/editar/excluir etiquetas fica com owner/admin.
alter table public.lead_labels enable row level security;

create policy "Members read organization labels"
on public.lead_labels
for select
using (organization_id = public.current_profile_organization_id());

create policy "Owners and admins manage labels"
on public.lead_labels
for all
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

grant select, insert, update, delete on public.lead_labels to authenticated;

-- Associacoes: qualquer membro da organizacao pode aplicar/remover etiquetas.
alter table public.lead_label_assignments enable row level security;

create policy "Members read organization label assignments"
on public.lead_label_assignments
for select
using (organization_id = public.current_profile_organization_id());

create policy "Members manage organization label assignments"
on public.lead_label_assignments
for all
using (organization_id = public.current_profile_organization_id())
with check (organization_id = public.current_profile_organization_id());

grant select, insert, update, delete on public.lead_label_assignments to authenticated;

notify pgrst, 'reload schema';
