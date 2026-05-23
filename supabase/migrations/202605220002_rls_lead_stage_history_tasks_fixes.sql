-- Migration: 202605220002_rls_lead_stage_history_tasks_fixes
-- Description: Fixes recent RLS gaps for lead_stage_history, lead_tasks, meta_campaign_publication_attempts, and meta_ad_image_uploads to ensure strict tenant isolation and least-privilege reads using helper functions.

-- 1. lead_stage_history
drop policy if exists "Users can view lead stage history from their organization" on public.lead_stage_history;
drop policy if exists "Users can insert lead stage history to their organization" on public.lead_stage_history;

create policy "Members can read visible lead stage history"
on public.lead_stage_history
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_lead(lead_id)
);

create policy "Members can create visible lead stage history"
on public.lead_stage_history
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_lead(lead_id)
);

-- 2. lead_tasks
drop policy if exists "Members can read workspace lead tasks" on public.lead_tasks;
create policy "Members can read visible lead tasks"
on public.lead_tasks
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_lead(lead_id)
);

drop policy if exists "Members can create workspace lead tasks" on public.lead_tasks;
create policy "Members can create visible lead tasks"
on public.lead_tasks
for insert
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
  and public.current_profile_can_access_lead(lead_id)
  and (
    assigned_to_profile_id is null
    or assigned_to_profile_id in (
      select id
      from public.profiles
      where organization_id = public.current_profile_organization_id()
    )
  )
);

drop policy if exists "Members can update workspace lead tasks" on public.lead_tasks;
create policy "Members can update visible lead tasks"
on public.lead_tasks
for update
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_lead(lead_id)
  and (
    created_by_profile_id = public.current_profile_id()
    or assigned_to_profile_id = public.current_profile_id()
    or public.current_profile_role() in ('owner', 'admin')
  )
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_lead(lead_id)
  and (
    assigned_to_profile_id is null
    or assigned_to_profile_id in (
      select id
      from public.profiles
      where organization_id = public.current_profile_organization_id()
    )
  )
);

-- 3. meta_campaign_publication_attempts
drop policy if exists "Members can read organization meta campaign publication attempts" on public.meta_campaign_publication_attempts;
create policy "Members can read visible meta campaign publication attempts"
on public.meta_campaign_publication_attempts
for select
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_can_access_campaign(campaign_id)
);

-- 4. meta_ad_image_uploads
drop policy if exists "Members can read organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can read organization meta ad image uploads"
on public.meta_ad_image_uploads
for select
using (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can create organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can create organization meta ad image uploads"
on public.meta_ad_image_uploads
for insert
with check (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can update organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can update organization meta ad image uploads"
on public.meta_ad_image_uploads
for update
using (
  organization_id = public.current_profile_organization_id()
)
with check (
  organization_id = public.current_profile_organization_id()
);

drop policy if exists "Members can delete organization meta ad image uploads" on public.meta_ad_image_uploads;
create policy "Members can delete organization meta ad image uploads"
on public.meta_ad_image_uploads
for delete
using (
  organization_id = public.current_profile_organization_id()
);

notify pgrst, 'reload schema';
