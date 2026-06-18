-- Fix: profile avatar upload saved the file to Storage but never persisted
-- profiles.avatar_url, because the 202604280002 security hardening revoked
-- table-wide UPDATE on profiles and only re-granted the full_name column.
-- The avatar feature (202606050001) added avatar_url but never extended the grant.

grant update (avatar_url) on public.profiles to authenticated;
