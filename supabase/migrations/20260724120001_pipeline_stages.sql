-- Migration: pipeline_stages
-- Cria as colunas customizaveis do funil estilo Trello (por organizacao).
-- Substitui o enum fixo public.lead_stage como fonte de verdade das etapas,
-- mantendo o enum leads.stage como legado durante a transicao.

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text,
  position numeric not null default 1000,
  color text not null default 'slate',
  type text not null default 'open' check (type in ('open', 'won', 'lost')),
  is_system boolean not null default false,
  wip_limit integer check (wip_limit is null or wip_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pipeline_stages_organization_position_idx
  on public.pipeline_stages (organization_id, position);
-- Slug so faz sentido para etapas de sistema; unico por organizacao quando presente.
create unique index pipeline_stages_organization_slug_idx
  on public.pipeline_stages (organization_id, slug)
  where slug is not null;

create trigger pipeline_stages_set_updated_at
  before update on public.pipeline_stages
  for each row execute function public.set_updated_at();

-- Semeia as 6 etapas canonicas para uma organizacao.
create or replace function public.seed_default_pipeline_stages(target_org_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.pipeline_stages (organization_id, name, slug, position, color, type, is_system)
  select target_org_id, s.name, s.slug, s.position, s.color, s.type, true
  from (values
    ('Novo lead', 'new', 1000, 'cobalt', 'open'),
    ('Qualificação', 'qualification', 2000, 'lagoon', 'open'),
    ('Proposta', 'proposal', 3000, 'signal', 'open'),
    ('Negociação', 'negotiation', 4000, 'ink', 'open'),
    ('Venda', 'won', 5000, 'emerald', 'won'),
    ('Perdido', 'lost', 6000, 'red', 'lost')
  ) as s(name, slug, position, color, type)
  where not exists (
    select 1 from public.pipeline_stages ps
    where ps.organization_id = target_org_id and ps.slug = s.slug
  );
$$;

grant execute on function public.seed_default_pipeline_stages(uuid) to authenticated;

-- Semeia para todas as organizacoes existentes.
do $$
declare
  org record;
begin
  for org in select id from public.organizations loop
    perform public.seed_default_pipeline_stages(org.id);
  end loop;
end;
$$;

-- Novas organizacoes recebem o board padrao automaticamente.
create or replace function public.seed_pipeline_stages_on_organization_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_pipeline_stages(new.id);
  return new;
end;
$$;

create trigger organizations_seed_pipeline_stages
  after insert on public.organizations
  for each row execute function public.seed_pipeline_stages_on_organization_insert();

-- Adiciona referencia da etapa nos leads e faz o backfill a partir do enum.
alter table public.leads
  add column stage_id uuid references public.pipeline_stages(id) on delete restrict;

update public.leads l
set stage_id = ps.id
from public.pipeline_stages ps
where ps.organization_id = l.organization_id
  and ps.slug = l.stage::text;

create index leads_organization_stage_id_idx on public.leads (organization_id, stage_id);

-- RLS
alter table public.pipeline_stages enable row level security;

create policy "Members read organization pipeline stages"
on public.pipeline_stages
for select
using (organization_id = public.current_profile_organization_id());

create policy "Owners and admins manage pipeline stages"
on public.pipeline_stages
for all
using (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
)
with check (
  organization_id = public.current_profile_organization_id()
  and public.current_profile_role() in ('owner', 'admin')
);

grant select, insert, update, delete on public.pipeline_stages to authenticated;

notify pgrst, 'reload schema';
