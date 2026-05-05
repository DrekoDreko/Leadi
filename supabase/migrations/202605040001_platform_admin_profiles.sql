alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

comment on column public.profiles.is_platform_admin is
  'Permite acesso operacional interno a areas globais do produto fora do escopo da organizacao.';
