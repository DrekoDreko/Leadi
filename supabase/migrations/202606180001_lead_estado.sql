-- Adiciona a coluna `estado` (UF) na tabela de leads, espelhando o campo `city`.
-- Usada no popup de detalhes do lead e nos fluxos de criacao/import/webhook.

alter table public.leads add column if not exists estado text;
