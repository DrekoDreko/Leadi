-- Corrige RLS da tabela whatsapp_messages.
-- A migration 202605130004_whatsapp_delivery.sql recria a tabela com
-- "create table if not exists" mas nao re-habilita RLS. Em ambientes onde
-- a tabela acabou sem RLS, ela fica exposta (UNRESTRICTED) no Supabase.
-- Esta migration garante RLS ligado e as politicas por organizacao,
-- de forma idempotente.

alter table public.whatsapp_messages enable row level security;

drop policy if exists "Members can read organization whatsapp messages" on public.whatsapp_messages;
create policy "Members can read organization whatsapp messages"
on public.whatsapp_messages
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Members can create organization whatsapp messages" on public.whatsapp_messages;
create policy "Members can create organization whatsapp messages"
on public.whatsapp_messages
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
  and created_by_profile_id in (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);
