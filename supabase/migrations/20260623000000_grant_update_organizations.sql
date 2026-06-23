-- A migration de onboarding (202604290003) concedeu a `authenticated` apenas
-- `grant update (name)` em public.organizations. Mas os formularios de corretora
-- (onboarding de equipe) e do perfil da empresa atualizam outras colunas
-- (logo_url, phone, endereco, etc.), o que causava "permission denied for table
-- organizations" ao salvar.
--
-- Concedemos UPDATE na tabela inteira para `authenticated`. A RLS
-- ("Owners and admins can update their organization") continua restringindo
-- QUEM pode atualizar e QUAIS linhas, entao isso e seguro.
grant update on public.organizations to authenticated;
