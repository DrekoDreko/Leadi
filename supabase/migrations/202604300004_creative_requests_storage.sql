-- Private Storage bucket and policies for creative request attachments.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creative-request-files',
  'creative-request-files',
  false,
  10485760,
  array[
    'application/msword',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can read creative request attachments" on storage.objects;
create policy "Members can read creative request attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'creative-request-files'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and exists (
    select 1
    from public.creative_requests
    where public.creative_requests.id::text = (storage.foldername(name))[2]
      and public.creative_requests.organization_id = public.current_profile_organization_id()
  )
);

drop policy if exists "Members can upload creative request attachments" on storage.objects;
create policy "Members can upload creative request attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'creative-request-files'
  and (storage.foldername(name))[1] = public.current_profile_organization_id()::text
  and exists (
    select 1
    from public.creative_requests
    where public.creative_requests.id::text = (storage.foldername(name))[2]
      and public.creative_requests.organization_id = public.current_profile_organization_id()
  )
);
