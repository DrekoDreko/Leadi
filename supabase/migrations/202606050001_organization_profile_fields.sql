-- Add company profile fields to organizations and avatar to profiles.

alter table public.organizations
  add column if not exists logo_url text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists cnpj text,
  add column if not exists description text,
  add column if not exists instagram text,
  add column if not exists linkedin text,
  add column if not exists address_cep text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists address_neighborhood text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists plan_type text,
  add column if not exists plan_status text;

alter table public.profiles
  add column if not exists avatar_url text;

-- Public bucket for organization logos (2 MB, images only).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-logos',
  'organization-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read organization logos" on storage.objects;
create policy "Anyone can read organization logos"
on storage.objects
for select
using (bucket_id = 'organization-logos');

drop policy if exists "Owners and admins can upload organization logos" on storage.objects;
create policy "Owners and admins can upload organization logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Owners and admins can update organization logos" on storage.objects;
create policy "Owners and admins can update organization logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and public.current_profile_role() in ('owner', 'admin')
);

drop policy if exists "Owners and admins can delete organization logos" on storage.objects;
create policy "Owners and admins can delete organization logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and public.current_profile_role() in ('owner', 'admin')
);

-- Public bucket for profile avatars (2 MB, images only).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read profile avatars" on storage.objects;
create policy "Anyone can read profile avatars"
on storage.objects
for select
using (bucket_id = 'profile-avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = public.current_profile_id()::text
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = public.current_profile_id()::text
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = public.current_profile_id()::text
);

notify pgrst, 'reload schema';
