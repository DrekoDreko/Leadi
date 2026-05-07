create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  gateway text not null default 'internal' check (gateway in ('internal', 'mercado_pago', 'asaas', 'stripe')),
  gateway_plan_id text,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'BRL',
  interval_unit text not null default 'month' check (interval_unit in ('day', 'week', 'month', 'year')),
  interval_count integer not null default 1 check (interval_count > 0),
  trial_period_days integer not null default 0 check (trial_period_days >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  gateway text not null check (gateway in ('mercado_pago', 'asaas', 'stripe', 'manual')),
  external_id text,
  customer_external_id text,
  checkout_external_id text,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  gateway text not null check (gateway in ('mercado_pago', 'asaas', 'stripe', 'manual')),
  event_type text not null,
  status text not null check (status in ('pending', 'processed', 'failed', 'cancelled')),
  external_id text,
  invoice_external_id text,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  currency text not null default 'BRL',
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists plans_status_idx
  on public.plans (status, created_at desc);

create unique index if not exists plans_gateway_plan_id_idx
  on public.plans (gateway, gateway_plan_id)
  where gateway_plan_id is not null;

create index if not exists subscriptions_org_created_idx
  on public.subscriptions (organization_id, created_at desc);

create index if not exists subscriptions_org_status_idx
  on public.subscriptions (organization_id, status, current_period_end desc);

create unique index if not exists subscriptions_gateway_external_id_idx
  on public.subscriptions (gateway, external_id)
  where external_id is not null;

create unique index if not exists subscriptions_one_current_idx
  on public.subscriptions (organization_id)
  where status in ('trialing', 'active', 'past_due', 'paused');

create index if not exists payment_events_org_occurred_idx
  on public.payment_events (organization_id, occurred_at desc);

create index if not exists payment_events_subscription_occurred_idx
  on public.payment_events (subscription_id, occurred_at desc);

create unique index if not exists payment_events_gateway_external_id_idx
  on public.payment_events (gateway, external_id)
  where external_id is not null;

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "Members can read active plans" on public.plans;
create policy "Members can read active plans"
on public.plans
for select
using (status = 'active');

drop policy if exists "Members can read workspace subscriptions" on public.subscriptions;
create policy "Members can read workspace subscriptions"
on public.subscriptions
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Billing managers can create workspace subscriptions" on public.subscriptions;
create policy "Billing managers can create workspace subscriptions"
on public.subscriptions
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin', 'supervisor')
  )
);

drop policy if exists "Billing managers can update workspace subscriptions" on public.subscriptions;
create policy "Billing managers can update workspace subscriptions"
on public.subscriptions
for update
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin', 'supervisor')
  )
)
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin', 'supervisor')
  )
);

drop policy if exists "Members can read workspace payment events" on public.payment_events;
create policy "Members can read workspace payment events"
on public.payment_events
for select
using (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "Billing managers can create workspace payment events" on public.payment_events;
create policy "Billing managers can create workspace payment events"
on public.payment_events
for insert
with check (
  organization_id in (
    select organization_id
    from public.profiles
    where auth_user_id = auth.uid()
      and role in ('owner', 'admin', 'supervisor')
  )
);

comment on table public.plans is
  'Catalogo de planos de assinatura independente de gateway.';

comment on table public.subscriptions is
  'Assinaturas por organizacao com periodo vigente e referencias externas por gateway.';

comment on table public.payment_events is
  'Eventos de cobranca e pagamento ligados a planos/assinaturas, com payload audivel por gateway.';

grant select on public.plans to authenticated;
grant select on public.subscriptions to authenticated;
grant insert, update on public.subscriptions to authenticated;
grant select on public.payment_events to authenticated;
grant insert on public.payment_events to authenticated;

notify pgrst, 'reload schema';
