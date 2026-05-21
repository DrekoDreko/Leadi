-- Fix: reload schema cache after adding completed column to dashboard_reminders
-- Also update RLS policy to be explicit about allowed columns

-- Recreate the update policy to be explicit that members can update their own reminders
drop policy if exists "Members can update own organization dashboard reminders" on public.dashboard_reminders;
create policy "Members can update own organization dashboard reminders"
on public.dashboard_reminders
for update
using (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
)
with check (
  organization_id = public.current_profile_organization_id()
  and created_by_profile_id = public.current_profile_id()
);

-- Notify PostgREST to reload schema cache (picks up the new completed column)
notify pgrst, 'reload schema';
