-- Migration: leads board fields
-- Adiciona ordenacao persistente (board_position), data de vencimento e capa aos leads,
-- alem de defaults automaticos de etapa/posicao para novos leads.

alter table public.leads
  add column board_position numeric,
  add column due_at timestamptz,
  add column cover jsonb;

-- Backfill: posiciona os leads existentes por etapa mantendo a ordem atual (mais novos no topo).
with ordered as (
  select
    id,
    row_number() over (
      partition by organization_id, stage
      order by received_at desc, created_at desc
    ) as rn
  from public.leads
)
update public.leads l
set board_position = ordered.rn * 1000
from ordered
where ordered.id = l.id;

create index leads_board_order_idx
  on public.leads (organization_id, stage_id, board_position);

-- Preenche stage_id e board_position automaticamente em novos leads,
-- cobrindo todos os caminhos de insercao (webhook, manual, import).
create or replace function public.set_lead_board_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage_id is null then
    select id into new.stage_id
    from public.pipeline_stages
    where organization_id = new.organization_id and slug = new.stage::text
    limit 1;

    if new.stage_id is null then
      select id into new.stage_id
      from public.pipeline_stages
      where organization_id = new.organization_id and type = 'open'
      order by position
      limit 1;
    end if;
  end if;

  if new.board_position is null then
    select coalesce(min(board_position), 1000) - 1000 into new.board_position
    from public.leads
    where organization_id = new.organization_id and stage_id = new.stage_id;
  end if;

  return new;
end;
$$;

create trigger leads_set_board_defaults
  before insert on public.leads
  for each row execute function public.set_lead_board_defaults();

notify pgrst, 'reload schema';
