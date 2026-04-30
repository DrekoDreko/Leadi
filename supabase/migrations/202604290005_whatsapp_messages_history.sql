-- WhatsApp message history for generated lead conversations.

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  lead_name text not null,
  lead_context text not null default '',
  product text not null default 'Plano de saude empresarial',
  stage text not null default 'new' check (stage in ('new', 'qualification', 'proposal', 'negotiation', 'won', 'lost')),
  objective text not null,
  tone text not null,
  opening_message text not null,
  follow_up_message text not null,
  objection_reply text not null,
  compliance_notes jsonb not null default '[]'::jsonb,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_organization_created_at_idx
  on public.whatsapp_messages (organization_id, created_at desc);

create index if not exists whatsapp_messages_lead_created_at_idx
  on public.whatsapp_messages (lead_id, created_at desc);

create index if not exists whatsapp_messages_created_by_idx
  on public.whatsapp_messages (created_by_profile_id, created_at desc);

drop trigger if exists whatsapp_messages_set_updated_at on public.whatsapp_messages;
create trigger whatsapp_messages_set_updated_at
before update on public.whatsapp_messages
for each row execute function public.set_updated_at();

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
