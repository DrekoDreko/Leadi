-- Consolidated migrations to fix brokerage name and apply latest features (Onboarding & System Templates)
-- Run this in Supabase SQL Editor.

-- 1. Fix Brokerage Name RPC (from 202604300001)
create or replace function public.update_brokerage_name(brokerage_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  workspace_row public.organizations%rowtype;
  normalized_name text;
begin
  normalized_name := nullif(btrim(brokerage_name), '');

  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  if normalized_name is null then
    raise exception 'Informe o nome da corretora.';
  end if;

  if length(normalized_name) > 80 then
    raise exception 'O nome da corretora deve ter no maximo 80 caracteres.';
  end if;

  select *
  into profile_row
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;

  if profile_row.id is null then
    raise exception 'Perfil nao encontrado.';
  end if;

  select *
  into workspace_row
  from public.organizations
  where id = profile_row.organization_id
  limit 1;

  if workspace_row.id is null then
    raise exception 'Workspace nao encontrado.';
  end if;

  if not (
    profile_row.role = 'supervisor'
    or (profile_row.role = 'seller' and workspace_row.type = 'solo')
  ) then
    raise exception 'Sem permissao para alterar o nome da corretora.';
  end if;

  update public.organizations
  set name = normalized_name
  where id = profile_row.organization_id;
end;
$$;

grant execute on function public.update_brokerage_name(text) to authenticated;

-- 2. Onboarding States (from 202605120002)
create table if not exists public.onboarding_states (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  dismissed_at timestamptz,
  completed_steps text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.onboarding_states enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Members can read their organization onboarding state') then
    create policy "Members can read their organization onboarding state"
    on public.onboarding_states for select
    using (organization_id = public.current_profile_organization_id());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Supervisors can update their organization onboarding state') then
    create policy "Supervisors can update their organization onboarding state"
    on public.onboarding_states for update
    using (
      organization_id = public.current_profile_organization_id()
      and public.current_profile_role() = 'supervisor'
    );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Supervisors can insert their organization onboarding state') then
    create policy "Supervisors can insert their organization onboarding state"
    on public.onboarding_states for insert
    with check (
      organization_id = public.current_profile_organization_id()
      and public.current_profile_role() = 'supervisor'
    );
  end if;
end;
$$;

grant select, insert, update on public.onboarding_states to authenticated;

-- 3. System Templates (from 202605130001)
create table if not exists public.system_templates (
  id uuid primary key default gen_random_uuid(),
  template_type text not null check (template_type in ('campaign', 'whatsapp')),
  category text not null,
  title text not null,
  description text not null default '',
  content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists system_templates_type_category_idx on public.system_templates (template_type, category);

alter table public.system_templates enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Everyone can read active system templates') then
    create policy "Everyone can read active system templates"
    on public.system_templates for select
    using (is_active = true);
  end if;
end;
$$;

-- Insert templates if they don't exist
insert into public.system_templates (template_type, category, title, description, content)
values
  ('campaign', 'MEI', 'Plano de Saude para MEI - Vantagens Exclusivas', 'Focado em microempreendedores.', '{"audience": "MEI", "offer": "Consultoria gratuita", "region": "Brasil", "tone": "consultivo"}'::jsonb),
  ('campaign', 'PME', 'Saude para Pequenas e Medias Empresas', 'Focado em empresas de 2 a 99 vidas.', '{"audience": "PMEs", "offer": "Analise de beneficios", "region": "Brasil", "tone": "profissional"}'::jsonb),
  ('whatsapp', 'Funil - Novo Lead', 'Primeira Abordagem (Boas-vindas)', 'Mensagem para o primeiro contato.', '{"openingMessage": "Ola [Nome do Lead], aqui e o [Seu Nome] da [Empresa].", "followUpMessage": "Como posso ajudar?", "objectionReply": "Entendo."}'::jsonb)
on conflict do nothing;

notify pgrst, 'reload schema';
