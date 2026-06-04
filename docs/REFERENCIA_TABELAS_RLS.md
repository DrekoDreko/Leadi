# Referência de Tabelas e RLS

Este documento mapeia todas as tabelas do Supabase que dependem de escopo de organização (seja via `organization_id`, `org_id` ou `workspace_id`), bem como suas respectivas políticas de RLS (Row Level Security).

## 1. Tabelas Mapeadas por Chave de Organização

### Tabelas com `organization_id`
- `campaigns`
- `meta_campaign_publication_attempts`
- `creative_requests`
- `dashboard_reminders`
- `meta_ad_image_uploads`
- `creative_request_comments`
- `whatsapp_messages`
- `whatsapp_delivery_settings`
- `meta_integrations`
- `meta_pages`
- `meta_forms`
- `meta_ad_accounts`
- `ai_credit_orders`
- `openai_connections`
- `integration_sync_logs`
- `lead_webhook_integrations`
- `lead_webhook_events`
- `profiles`
- `leads`
- `lead_comments`
- `lead_stage_history`
- `lead_tasks`
- `subscriptions`
- `payment_events`
- `onboarding_states`

### Tabelas com `org_id` (Módulo de Créditos IA)
- `org_ai_balances`
- `ai_credit_ledger`
- `ai_usage_events`

### Tabelas com `workspace_id`
- `workspace_members`
- `invites`

### Tabela Base
- `organizations` (chave primária `id`)

---

## 2. Políticas RLS Existentes (Row Level Security)

As políticas de RLS foram padronizadas na migration `202605120001_standardize_rls_isolation.sql` e endurecidas na migration `202605200002_supabase_hardening_rls.sql`.

Abaixo, as regras gerais aplicadas atualmente:

### Regras de Organização e Perfis
- **`organizations`**:
  - Membros podem ler sua própria organização (`Members can read their workspace`).
  - Apenas Owners e Admins podem atualizar a organização.
- **`profiles`**:
  - Membros podem ler perfis da sua organização (`Members can read workspace profiles`).
  - Usuários podem atualizar apenas o próprio perfil.
- **`workspace_members`**:
  - Membros podem ler registros do seu workspace.

### Regras de Leads
- **`leads`**:
  - Membros podem ler leads permitidos (`Members can read permitted workspace leads`).
  - Membros podem criar leads.
  - Apenas Owners e Admins podem atualizar e deletar leads livremente.
  - Vendedores (Sellers) só podem atualizar/deletar seus próprios leads manuais não advindos do Meta (`Lead owners can update/delete own non Meta leads`).
- **Comentários, Tarefas e Histórico (`lead_comments`, `lead_tasks`, `lead_stage_history`)**:
  - O acesso de leitura é garantido a membros que têm acesso ao lead pai (`Members can read visible lead comments/tasks`).

### Regras de Campanhas e Meta Ads
- **`campaigns`**:
  - Membros podem ler campanhas da organização (`Members can read visible campaigns`).
  - Membros podem criar campanhas.
- **Integrações (`meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`)**:
  - O acesso de leitura é restrito a gerentes/managers (`Managers can read organization meta integrations`, etc).
  - A manipulação e configuração dessas chaves é barrada para sellers.

### Regras Financeiras e Assinaturas
- **`subscriptions`, `payment_events`, `ai_credit_orders`**:
  - Apenas managers (Owner/Admin) podem ler e interagir (`Managers can read subscriptions/payment events`, etc).
- **Saldos de Créditos IA (`org_ai_balances`, `ai_credit_ledger`, `ai_usage_events`)**:
  - Apenas managers podem visualizar saldos e logs de créditos da organização.

---

## 3. Necessidades e Gaps para o Módulo de Equipes

Com base no planejamento para adicionar papéis granulares de equipe (Gestor, Supervisor, Consultor):

### 1. Inclusão de `team_id`
As seguintes tabelas precisarão receber a coluna `team_id` (nullable) para isolamento por equipe:
- `leads` (já está no planejamento: Tarefa F2.9)
- `campaigns` (Tarefa F2.9)
- `workspace_members` (ou tabela nova `team_members` conf. F2.1)
- `profiles` (opcional, para vínculo fixo)
- `invites` (Tarefa F2.8)
- Transações de créditos IA / sub-wallets

### 2. Criação de Novas Tabelas Mapeadas
Novas tabelas precisarão de RLS robusta baseada em `organization_id` **e** `team_id`:
- `teams` e `team_members`
- `approval_requests`
- `credit_requests`
- `ad_approval_requests`
- `credit_wallets` e `credit_transactions`
- `lead_assignments`
- `audit_logs`

### 3. Modificação das RLS Atuais
- A RLS de `leads` precisa ser ajustada para permitir que um **Supervisor** (admin) veja os leads da sua equipe (`team_id`) e não todos da organização, caso assim o gestor configure, ou por padrão. O Consultor continuará vendo apenas os que for dono (`owner_profile_id`).
- A RLS de campanhas deverá ser ajustada para que consultores sejam bloqueados de interagir ou visualizar e para que supervisores visualizem apenas as campanhas relacionadas à sua equipe ou as que enviaram para aprovação.
- A RLS das tabelas de saldos e ledger de IA atuais (`org_ai_balances`) não precisará ser alterada se o sistema de sub-wallets for incluído de forma separada (`credit_wallets`).

### Conclusão
O sistema atual já se baseia fortemente em RLS por `organization_id`, e a separação Owner/Admin vs Seller já existe. O próximo passo lógico em banco de dados para suportar as equipes é introduzir a modelagem hierárquica baseada no `team_id` e criar as tabelas de intersecção/aprovação com RLS compatível, garantindo que o `organization_id` siga como guardião de Tenant-Level Security.
