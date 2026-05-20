-- Migration: Add archived_at to leads table
alter table public.leads add column archived_at timestamptz;

-- Update RLS policies to ensure users can still see archived leads if they need to,
-- but typically we will filter them out in the application logic.
-- The existing "Members can read organization leads" policy already covers this
-- as it doesn't filter by archived_at.

create index leads_organization_archived_at_idx on public.leads (organization_id, archived_at) where archived_at is not null;
