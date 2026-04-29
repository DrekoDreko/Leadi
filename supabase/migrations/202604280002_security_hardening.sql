-- Security hardening: keep users from changing tenant or role fields on profiles.

drop policy if exists "Users can update their own profile" on public.profiles;

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "Users can update their own display name"
on public.profiles
for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());
