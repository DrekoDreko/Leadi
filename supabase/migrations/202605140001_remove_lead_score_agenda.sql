-- Remove lead scoring and lead agenda/follow-up surfaces from the CRM.

drop table if exists public.lead_follow_up_events cascade;

alter table public.leads
  drop column if exists score,
  drop column if exists next_contact_at;
