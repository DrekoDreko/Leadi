# Migrations e Gestão de Banco de Dados

Este documento descreve as práticas recomendadas, o fluxo de aplicação e a ordem das migrations do banco de dados (Supabase) para este projeto. O objetivo é reduzir erros manuais durante o deploy em produção e garantir um processo claro e rastreável.

## ⚠️ AVISO IMPORTANTE SOBRE PRODUÇÃO
**Sempre realize um backup completo do banco de dados antes de executar qualquer migration ou comando destrutivo em produção.** 
Veja o guia detalhado em: 👉 **[Orientação de Backup](./BACKUP.md)**

Qualquer alteração de schema deve ser revisada e preferencialmente testada em ambiente de desenvolvimento (Local ou Staging).

---

## 1. Fluxo Recomendado de Migrations

O fluxo ideal para alterações no banco de dados deve ser:

1. **Criar e Versionar a Migration:** Toda alteração de schema, funções, ou políticas de RLS deve ser salva como um arquivo SQL com um nome prefixado por timestamp em `supabase/migrations/`. 
2. **Aplicar a Migration:** Utilize a CLI do Supabase para aplicar a migration. O SQL Editor do Supabase deve ser evitado e usado apenas como um recurso de *fallback*.
3. **Validar via MCP Supabase:** O MCP Supabase (seja local ou configurado via Claude/IDE) já está mapeado para o projeto e deve ser utilizado para verificar se as tabelas foram criadas corretamente e se as permissões (RLS) estão funcionando como o esperado.

---

## 2. Ordem das Migrations Existentes

As migrations devem ser executadas em ordem crescente pelo prefixo (data). O Supabase já faz isso automaticamente ao rodar a CLI. O histórico atual de migrations no projeto é:

1. `202604280001_phase_1_core.sql`
2. `202604280002_security_hardening.sql`
3. `202604290001_add_csv_import_batch.sql`
4. `202604290002_meta_lead_owner_permissions.sql`
5. `202604290003_onboarding_workspaces_invites.sql`
6. `202604290004_billing_credits_mercadopago.sql`
7. `202604290005_whatsapp_messages_history.sql`
8. `202604300001_brokerage_name_settings.sql`
9. `202604300002_creative_requests.sql`
10. `202604300003_creative_requests_form_fields.sql`
11. `202604300004_creative_requests_storage.sql`
12. `202605040001_platform_admin_profiles.sql`
13. `202605040002_creative_request_comments.sql`
14. `202605040003_lead_webhook_integrations.sql`
15. `202605050001_lead_webhook_events.sql`
16. `202605050003_supervisor_delete_leads.sql`
17. `202605050004_campaigns_history.sql`
18. `202605050005_meta_integrations.sql`
19. `202605050006_meta_lead_idempotency.sql`
20. `202605060001_billing_subscriptions.sql`
21. `202605060002_lead_comments.sql`
22. `202605060003_connected_accounts.sql`
23. `202605060004_connected_accounts_error_status.sql`
24. `202605070001_billing_asaas_defaults.sql`
25. `202605070002_multiuser_owner_admin_seller.sql`
26. `202605070003_token_uuid_fallback.sql`
27. `202605070004_invite_acceptance_fix.sql`
28. `20260507160221_lead_follow_up_events.sql`

*Caso novas migrations sejam criadas, basta inseri-las na pasta `supabase/migrations/` com o prefixo apropriado `YYYYMMDDHHMMSS_name.sql`.*

---

## 3. Como Aplicar Migrations

### Alternativa A: Supabase CLI (Recomendado)
Se o Supabase CLI estiver configurado no projeto (ou se for instalá-lo via npx ou pacote global), utilize os seguintes comandos:

- **Para aplicar em desenvolvimento local:**
  ```bash
  supabase start  # Inicia o projeto localmente com as migrations
  ```
- **Para linkar e aplicar no projeto de produção/staging:**
  ```bash
  # Faça o login no Supabase
  supabase login
  
  # Linke o projeto usando o ID fornecido no painel do Supabase
  supabase link --project-ref <PROJECT_ID>
  
  # Empurre (push) as novas migrations para a nuvem
  supabase db push
  ```

### Alternativa B: Supabase SQL Editor (Apenas Fallback)
Se a CLI não for uma opção (por bloqueios de rede, falha na configuração, ou se o pipeline automatizado quebrar), as migrations podem ser executadas manualmente no painel web:
1. Faça login na Dashboard do Supabase.
2. Acesse a seção **SQL Editor**.
3. Crie um novo snippet e cole o conteúdo integral da migration SQL.
4. Execute o comando e confira os logs de sucesso no próprio painel.
*Nota: Este método exige atenção extrema para não pular migrations e respeitar a ordem listada no tópico 2.*

---

## 4. Validação e Controle via MCP Supabase

Uma vez aplicadas as migrations, você deve utilizar o [MCP Supabase](./mcp-supabase.md) configurado na sua IDE/Claude para verificar a saúde e o sucesso do que foi aplicado, e para gerenciar/validar dados iniciais que foram populados.

**Comandos importantes a serem usados pelo LLM / via MCP:**

- `supabase_status`
  Este comando permite verificar se o projeto Supabase foi corretamente lido e quais tabelas já estão configuradas no acesso do MCP. **O que validar:** verifique se as tabelas recém-criadas pela migration já aparecem e se o schema está íntegro.
  
- `supabase_select`
  Use para buscar registros de configuração e checar se os dados da migration (como `seed` data, roles default ou permissões inseridas) estão disponíveis na base. Exemplo: validar uma nova tabela listando até as primeiras 10 linhas.
  
- **Operações DML (Insert / Update / Delete)**
  Quando necessário (e em tabelas autorizadas pelo MCP), utilize o MCP para inserir registros cruciais de setup pós-migration (ex.: adicionar um usuário de sistema `platform_admin_profiles`) ou atualizar campos que faltaram na migration. Utilize sempre com parcimônia em ambiente de produção, priorizando migrations estruturais (DDL) como código em `supabase/migrations`.

Lembre-se: O MCP não roda DDL pesado (CREATE TABLE, ALTER). Ele é desenhado primariamente para consultas (`supabase_select`) e controle de dados (DML), agindo como o validador definitivo de que sua *migration* foi aplicada sem quebrar o sistema.
