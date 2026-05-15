alter table public.leads
  add column if not exists archive_reason text,
  add column if not exists duplicate_of_lead_id uuid references public.leads(id) on delete set null;

create index if not exists leads_organization_duplicate_of_idx
  on public.leads (organization_id, duplicate_of_lead_id)
  where duplicate_of_lead_id is not null;

create index if not exists leads_organization_archive_reason_idx
  on public.leads (organization_id, archive_reason)
  where archive_reason is not null;
