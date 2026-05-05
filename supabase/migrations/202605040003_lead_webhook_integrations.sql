create table if not exists public.lead_webhook_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label text,
  token_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_webhook_integrations_org_created_idx
  on public.lead_webhook_integrations (organization_id, created_at desc);

create index if not exists lead_webhook_integrations_active_idx
  on public.lead_webhook_integrations (organization_id)
  where revoked_at is null;

drop trigger if exists lead_webhook_integrations_set_updated_at on public.lead_webhook_integrations;
create trigger lead_webhook_integrations_set_updated_at
before update on public.lead_webhook_integrations
for each row execute function public.set_updated_at();

alter table public.lead_webhook_integrations enable row level security;

create or replace function public.create_lead_webhook_integration(
  target_organization_id uuid,
  integration_label text default null
)
returns table (
  id uuid,
  organization_id uuid,
  label text,
  token text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_row public.lead_webhook_integrations%rowtype;
  generated_token text;
begin
  if target_organization_id is null then
    raise exception 'Informe organization_id.';
  end if;

  if not exists (
    select 1
    from public.organizations
    where organizations.id = target_organization_id
  ) then
    raise exception 'Organizacao nao encontrada.';
  end if;

  generated_token := encode(gen_random_bytes(24), 'hex');

  insert into public.lead_webhook_integrations (
    organization_id,
    label,
    token_hash
  )
  values (
    target_organization_id,
    nullif(trim(integration_label), ''),
    encode(digest(generated_token, 'sha256'), 'hex')
  )
  returning * into created_row;

  return query
  select
    created_row.id,
    created_row.organization_id,
    created_row.label,
    generated_token,
    created_row.created_at;
end;
$$;

comment on table public.lead_webhook_integrations is
  'Tokens hash para autenticar webhooks de leads por organizacao.';

comment on function public.create_lead_webhook_integration(uuid, text) is
  'Gera um token de webhook de leads, salva apenas o hash e retorna o token em texto puro uma unica vez.';

notify pgrst, 'reload schema';
