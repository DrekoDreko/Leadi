create table if not exists public.request_rate_limits (
  key text primary key,
  count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits (updated_at);

alter table public.request_rate_limits enable row level security;

revoke all on public.request_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_record public.request_rate_limits%rowtype;
  now_ts timestamptz := now();
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'rate limit key required';
  end if;

  if p_limit <= 0 or p_window_ms <= 0 then
    raise exception 'invalid rate limit configuration';
  end if;

  if random() < 0.01 then
    delete from public.request_rate_limits
    where updated_at < now_ts - interval '7 days';
  end if;

  insert into public.request_rate_limits as rl (
    key,
    count,
    window_started_at,
    updated_at
  )
  values (
    p_key,
    1,
    now_ts,
    now_ts
  )
  on conflict (key) do update
  set
    count = case
      when rl.window_started_at + (p_window_ms || ' milliseconds')::interval <= now_ts then 1
      else rl.count + 1
    end,
    window_started_at = case
      when rl.window_started_at + (p_window_ms || ' milliseconds')::interval <= now_ts then now_ts
      else rl.window_started_at
    end,
    updated_at = now_ts
  returning * into current_record;

  allowed := current_record.count <= p_limit;
  remaining := greatest(p_limit - least(current_record.count, p_limit), 0);
  reset_at := current_record.window_started_at + (p_window_ms || ' milliseconds')::interval;

  return next;
end;
$$;

notify pgrst, 'reload schema';
