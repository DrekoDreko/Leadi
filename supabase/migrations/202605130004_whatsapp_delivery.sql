-- Base de envio oficial/external para WhatsApp.
-- Mantem a camada de historico no proprio whatsapp_messages para permitir
-- validacao operacional via MCP sem expor o conteudo das mensagens.

create type public.whatsapp_delivery_provider as enum (
  'official_meta',
  'external_http'
);

create type public.whatsapp_delivery_status as enum (
  'not_requested',
  'pending_config',
  'opt_in_required',
  'credentials_missing',
  'queued',
  'sent',
  'failed',
  'rate_limited',
  'blocked'
);

create table if not exists public.whatsapp_delivery_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  provider public.whatsapp_delivery_provider not null default 'official_meta',
  sending_enabled boolean not null default false,
  opt_in_confirmed_at timestamptz,
  opt_in_confirmed_by_profile_id uuid references public.profiles(id) on delete set null,
  provider_config jsonb not null default '{}'::jsonb,
  last_configuration_check_at timestamptz,
  last_configuration_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_delivery_settings_provider_idx
  on public.whatsapp_delivery_settings (provider, sending_enabled, created_at desc);

drop trigger if exists whatsapp_delivery_settings_set_updated_at on public.whatsapp_delivery_settings;
create trigger whatsapp_delivery_settings_set_updated_at
before update on public.whatsapp_delivery_settings
for each row execute function public.set_updated_at();

alter table public.whatsapp_delivery_settings enable row level security;

drop policy if exists "Members can read organization whatsapp delivery settings" on public.whatsapp_delivery_settings;
create policy "Members can read organization whatsapp delivery settings"
on public.whatsapp_delivery_settings
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Owners and admins can manage whatsapp delivery settings" on public.whatsapp_delivery_settings;
create policy "Owners and admins can manage whatsapp delivery settings"
on public.whatsapp_delivery_settings
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

drop policy if exists "Owners and admins can update whatsapp delivery settings" on public.whatsapp_delivery_settings;
create policy "Owners and admins can update whatsapp delivery settings"
on public.whatsapp_delivery_settings
for update
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
)
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

drop policy if exists "Owners and admins can delete whatsapp delivery settings" on public.whatsapp_delivery_settings;
create policy "Owners and admins can delete whatsapp delivery settings"
on public.whatsapp_delivery_settings
for delete
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin')
  )
);

alter table public.whatsapp_messages
  add column if not exists delivery_provider public.whatsapp_delivery_provider,
  add column if not exists delivery_status public.whatsapp_delivery_status not null default 'not_requested',
  add column if not exists delivery_attempted_at timestamptz,
  add column if not exists delivery_sent_at timestamptz,
  add column if not exists delivery_provider_message_id text,
  add column if not exists delivery_error_code text,
  add column if not exists delivery_error_message text,
  add column if not exists delivery_request_payload jsonb not null default '{}'::jsonb,
  add column if not exists delivery_response_payload jsonb not null default '{}'::jsonb,
  add column if not exists delivery_history jsonb not null default '[]'::jsonb;

update public.whatsapp_messages
set
  delivery_status = coalesce(delivery_status, 'not_requested')::public.whatsapp_delivery_status,
  delivery_history = coalesce(delivery_history, '[]'::jsonb),
  delivery_request_payload = coalesce(delivery_request_payload, '{}'::jsonb),
  delivery_response_payload = coalesce(delivery_response_payload, '{}'::jsonb)
where delivery_status is null
   or delivery_history is null
   or delivery_request_payload is null
   or delivery_response_payload is null;

create index if not exists whatsapp_messages_delivery_status_idx
  on public.whatsapp_messages (organization_id, delivery_status, updated_at desc);

create index if not exists whatsapp_messages_delivery_attempted_idx
  on public.whatsapp_messages (organization_id, delivery_attempted_at desc);

comment on table public.whatsapp_delivery_settings is
  'Configuracao de opt-in e provider de envio de WhatsApp por organizacao, sem armazenar segredos em texto puro.';

comment on column public.whatsapp_messages.delivery_status is
  'Status atual do envio do WhatsApp para o registro salvo.';

comment on column public.whatsapp_messages.delivery_history is
  'Historico resumido das tentativas de envio, sem incluir o corpo integral da mensagem.';
