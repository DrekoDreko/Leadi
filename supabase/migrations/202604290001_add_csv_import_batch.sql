-- Track CSV import batches so recent imports can be undone safely.

alter table public.leads
  add column if not exists import_batch_id uuid;

create index if not exists leads_organization_import_batch_idx
  on public.leads (organization_id, import_batch_id);

create or replace function public.undo_csv_import_batch(batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  deleted_count integer;
begin
  select *
  into current_profile
  from public.profiles
  where auth_user_id = auth.uid();

  if not found then
    raise exception 'Usuario nao autenticado.';
  end if;

  if current_profile.role <> 'supervisor' then
    if exists (
      select 1
      from public.leads
      where organization_id = current_profile.organization_id
        and import_batch_id = batch_id
        and owner_profile_id is distinct from current_profile.id
    ) then
      raise exception 'Sem permissao para desfazer este lote.';
    end if;
  end if;

  delete from public.leads
  where organization_id = current_profile.organization_id
    and import_batch_id = batch_id
    and (
      current_profile.role = 'supervisor'
      or owner_profile_id = current_profile.id
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.undo_csv_import_batch(uuid) to authenticated;
