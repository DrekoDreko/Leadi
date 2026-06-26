-- Conexão Meta por consultor.
-- owner_profile_id NULL  = conexão da corretora (owner / org-level), comportamento atual.
-- owner_profile_id != NULL = conexão pessoal daquele consultor (seller liberado), que usa a
--                            própria conta de anúncios / página FB / perfil IG.
--
-- As constraints de unicidade passam a usar NULLS NOT DISTINCT (Postgres 15+) para que duas
-- conexões org-level (owner_profile_id NULL) com a mesma conta ainda colidam, preservando a
-- unicidade da conexão da corretora.

alter table public.meta_integrations
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete cascade;

alter table public.meta_ad_accounts
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete cascade;

alter table public.meta_pages
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete cascade;

alter table public.meta_forms
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete cascade;

-- Recria as constraints de unicidade incluindo owner_profile_id.
alter table public.meta_integrations
  drop constraint if exists meta_integrations_account_unique;
alter table public.meta_integrations
  add constraint meta_integrations_account_unique
    unique nulls not distinct (organization_id, owner_profile_id, meta_account_id);

alter table public.meta_ad_accounts
  drop constraint if exists meta_ad_accounts_account_unique;
alter table public.meta_ad_accounts
  add constraint meta_ad_accounts_account_unique
    unique nulls not distinct (organization_id, owner_profile_id, meta_ad_account_id);

alter table public.meta_pages
  drop constraint if exists meta_pages_page_unique;
alter table public.meta_pages
  add constraint meta_pages_page_unique
    unique nulls not distinct (organization_id, owner_profile_id, page_id);

alter table public.meta_forms
  drop constraint if exists meta_forms_form_unique;
alter table public.meta_forms
  add constraint meta_forms_form_unique
    unique nulls not distinct (organization_id, owner_profile_id, form_id);

create index if not exists meta_integrations_owner_profile_idx
  on public.meta_integrations (owner_profile_id)
  where owner_profile_id is not null;
create index if not exists meta_ad_accounts_owner_profile_idx
  on public.meta_ad_accounts (owner_profile_id)
  where owner_profile_id is not null;
create index if not exists meta_pages_owner_profile_idx
  on public.meta_pages (owner_profile_id)
  where owner_profile_id is not null;
create index if not exists meta_forms_owner_profile_idx
  on public.meta_forms (owner_profile_id)
  where owner_profile_id is not null;

comment on column public.meta_integrations.owner_profile_id is
  'NULL = conexão da corretora (org). Não-nulo = conexão pessoal daquele consultor (seller liberado).';

-- RLS: o consultor pode gerenciar (insert/update/delete) apenas as próprias rows Meta.
-- A leitura org-wide já é coberta pelas policies de SELECT existentes ("Members can read ...").
-- O fluxo OAuth grava via service role, mas estas policies garantem isolamento em acessos diretos.

do $$
declare
  tbl text;
begin
  foreach tbl in array array['meta_integrations', 'meta_ad_accounts', 'meta_pages', 'meta_forms']
  loop
    execute format($f$
      drop policy if exists "Sellers manage own %1$s insert" on public.%1$s;
      create policy "Sellers manage own %1$s insert"
      on public.%1$s
      for insert
      with check (
        owner_profile_id in (
          select id from public.profiles
          where auth_user_id = auth.uid() and ad_creation_enabled = true
        )
      );

      drop policy if exists "Sellers manage own %1$s update" on public.%1$s;
      create policy "Sellers manage own %1$s update"
      on public.%1$s
      for update
      using (
        owner_profile_id in (
          select id from public.profiles where auth_user_id = auth.uid()
        )
      )
      with check (
        owner_profile_id in (
          select id from public.profiles
          where auth_user_id = auth.uid() and ad_creation_enabled = true
        )
      );

      drop policy if exists "Sellers manage own %1$s delete" on public.%1$s;
      create policy "Sellers manage own %1$s delete"
      on public.%1$s
      for delete
      using (
        owner_profile_id in (
          select id from public.profiles where auth_user_id = auth.uid()
        )
      );
    $f$, tbl);
  end loop;
end $$;

notify pgrst, 'reload schema';
