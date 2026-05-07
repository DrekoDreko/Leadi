create unique index if not exists leads_meta_lead_unique_idx
  on public.leads (organization_id, meta_lead_id)
  where meta_lead_id is not null;
