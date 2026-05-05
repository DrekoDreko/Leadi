create table if not exists public.lead_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  integration_id uuid references public.lead_webhook_integrations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  status text not null check (status in ('processed', 'failed')),
  http_status integer not null check (http_status between 100 and 599),
  raw_payload jsonb not null default '{}'::jsonb,
  safe_headers jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists lead_webhook_events_org_received_idx
  on public.lead_webhook_events (organization_id, received_at desc);

create index if not exists lead_webhook_events_integration_received_idx
  on public.lead_webhook_events (integration_id, received_at desc);

create index if not exists lead_webhook_events_lead_idx
  on public.lead_webhook_events (lead_id);

alter table public.lead_webhook_events enable row level security;

comment on table public.lead_webhook_events is
  'Auditoria de webhooks de leads com payload bruto, headers seguros, status e erros sem tokens.';

notify pgrst, 'reload schema';
