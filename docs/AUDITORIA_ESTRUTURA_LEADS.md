# Auditoria da Estrutura de Leads

Data da auditoria: 2026-05-21  
Tarefa: `TASK-001 — Revisar estrutura atual de leads`

## 1. Visão geral da estrutura atual de leads

A estrutura atual de leads do Leadi ja existe em producao de forma funcional e cobre cadastro manual, importacao CSV, importacao manual da Meta, webhook generico, webhook oficial da Meta, exportacao CSV, arquivamento logico, comentarios e restricao por organizacao.

O modelo central real esta no banco e no server-side, principalmente em:

- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `supabase/migrations/*` relacionadas a `leads`, `lead_comments`, `lead_webhook_integrations` e `lead_webhook_events`

Na camada de interface, o CRM trabalha sobre um tipo de lead adaptado para exibicao em `src/data/mock.ts`. Esse tipo e reutilizado por listagem, funil, detalhe do lead, exportacao e fluxos auxiliares, o que simplifica a UI, mas cria um gap relevante entre o contrato real do banco/API e o contrato exibido ao frontend.

Conclusao de alto nivel:

- A base atual esta `parcialmente pronta`.
- O nucleo multi-tenant e os fluxos de entrada de leads existem.
- Ainda ha desalinhamentos entre banco, API, UI e mocks.
- Ha riscos reais de governanca de dados em `raw_payload`, exportacao e duplicacao de contratos.

## 2. Arquivos encontrados relacionados a leads

### Banco, tipos e migrations

- `src/lib/supabase/database.types.ts`
- `supabase/migrations/202604280001_phase_1_core.sql`
- `supabase/migrations/202604290001_add_csv_import_batch.sql`
- `supabase/migrations/202604290002_meta_lead_owner_permissions.sql`
- `supabase/migrations/202605060002_lead_comments.sql`
- `supabase/migrations/202605060004_connected_accounts_error_status.sql`
- `supabase/migrations/202605120001_standardize_rls_isolation.sql`
- `supabase/migrations/202605140001_remove_lead_score_agenda.sql`
- `supabase/migrations/202605140004_lead_archive.sql`
- `supabase/migrations/202605140005_fix_supervisor_rls.sql`
- `supabase/migrations/202605150001_lead_duplicate_archive_reason.sql`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`
- `supabase/migrations/202605040003_lead_webhook_integrations.sql`
- `supabase/migrations/202605050001_lead_webhook_events.sql`

### Repositorio, regras e normalizacao

- `src/lib/leads/repository.server.ts`
- `src/lib/leads/repository.ts`
- `src/lib/leads/filters.ts`
- `src/lib/leads/normalization.ts`
- `src/lib/leads/comments.ts`
- `src/lib/leads/webhook-auth.ts`
- `src/lib/leads/webhook-events.repository.ts`
- `src/lib/leads/webhook-events.server.ts`
- `src/lib/leads/stages.ts`
- `src/lib/workspaces/permissions.ts`

### UI do CRM e detalhe do lead

- `src/data/mock.ts`
- `app/dashboard/leads/page.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `app/dashboard/leads/lead-create-modal.tsx`
- `app/dashboard/leads/arquivados/page.tsx`
- `app/dashboard/funil/page.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-message-generator.tsx`

### APIs relacionadas a leads

- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `app/api/leads/[id]/comments/route.ts`
- `app/api/leads/export/route.ts`
- `app/api/leads/import-batches/[batchId]/route.ts`
- `app/api/webhooks/leads/route.ts`
- `app/api/meta/webhook/route.ts`
- `app/api/meta/leads/sources/route.ts`
- `app/api/meta/leads/import/route.ts`

### Importacao CSV e Meta

- `src/lib/imports/csv.ts`
- `app/dashboard/importar/csv-import-workspace.tsx`
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/meta/manual-lead-import.types.ts`
- `src/lib/meta/lead-retrieval.server.ts`
- `src/lib/meta/webhook-processing.server.ts`

### Documentacao de apoio

- `docs/LGPD_SECURITY_CHECKLIST.md`
- `docs/mcp-supabase.md`

## 3. Campos de lead encontrados no projeto

### Modelo real do banco (`public.leads`)

Campos observados em `database.types.ts`:

- Identificacao e isolamento:
  - `id`
  - `organization_id`
  - `owner_profile_id`
- Contato e perfil:
  - `name`
  - `phone`
  - `phone_e164`
  - `email`
  - `city`
  - `company_name`
  - `lives_count`
- Comercial:
  - `stage`
  - `source`
  - `budget`
  - `interest`
  - `last_interaction`
  - `notes`
- Origem e atribuicao:
  - `source_campaign`
  - `source_adset`
  - `source_ad`
  - `meta_lead_id`
  - `meta_form_id`
  - `meta_page_id`
  - `meta_campaign_id`
  - `meta_adset_id`
  - `meta_ad_id`
  - `meta_connected_account_id`
  - `import_batch_id`
- Ciclo de vida e rastreio:
  - `archived_at`
  - `archive_reason`
  - `duplicate_of_lead_id`
  - `raw_payload`
  - `received_at`
  - `created_at`
  - `updated_at`

### Entidades relacionadas

`lead_comments`:

- `organization_id`
- `lead_id`
- `author_profile_id`
- `author_name`
- `author_email`
- `body`
- `created_at`
- `updated_at`

`lead_webhook_events`:

- `organization_id`
- `integration_id`
- `lead_id`
- `status`
- `http_status`
- `raw_payload`
- `safe_headers`
- `error_message`
- `received_at`
- `created_at`

### Modelo de UI e mock (`src/data/mock.ts`)

Campos expostos para a interface:

- `id`
- `name`
- `owner`
- `ownerProfileId`
- `canEdit`
- `canDelete`
- `stage`
- `source`
- `phone`
- `email`
- `city`
- `companyName`
- `livesCount`
- `createdAt`
- `budget`
- `interest`
- `lastInteraction`
- `notes`
- `sourceCampaign`
- `sourceAdset`
- `sourceAd`
- `metaLeadId`
- `metaFormId`
- `metaPageId`
- `metaConnectedAccountId`
- `receivedAt`
- `archivedAt`
- `archiveReason`
- `duplicateOfLeadId`

## 4. Diferenças entre mock, UI, API e banco

### 4.1 Banco e API sao mais ricos do que a UI

O banco contem campos que nao aparecem no tipo principal de UI:

- `organization_id`
- `phone_e164`
- `meta_campaign_id`
- `meta_adset_id`
- `meta_ad_id`
- `import_batch_id`
- `raw_payload`
- `updated_at`

Impacto:

- a interface nao trabalha com o contrato completo;
- parte do rastreio fica invisivel no frontend;
- futuras evolucoes do prontuario podem voltar a duplicar mapeamentos.

### 4.2 `Lead` de UI e um contrato de exibicao, nao o contrato real do dominio

`src/data/mock.ts` concentra o tipo `Lead` usado em toda a UI. Esse tipo:

- traduz `stage` e `source` para labels em portugues;
- converte `company_name` para `companyName`;
- converte `last_interaction` para `lastInteraction`;
- mistura campos reais com campos puramente de exibicao, como `owner`, `canEdit` e `canDelete`.

Impacto:

- o frontend depende de um DTO de visualizacao;
- o tipo nao deixa claro o que vem do banco e o que e calculado;
- o uso do arquivo de mock como fonte de tipagem aumenta risco de drift.

### 4.3 Listagem e funil usam o mesmo contrato simplificado

As telas de `leads`, `arquivados` e `funil` recebem `LeadDataState`, que por sua vez embute `Lead[]` do tipo de UI. Isso facilita reaproveitamento, mas:

- empobrece o contrato para telas futuras de detalhe;
- deixa o funil dependente da mesma adaptacao da listagem;
- esconde campos que ja existem no banco.

### 4.4 Nao existe pagina standalone de detalhe do lead

O detalhe atual existe como modal reutilizavel:

- `src/components/dashboard/lead-details-popup.tsx`

Isso atende o fluxo atual, mas significa que:

- o prontuario do lead ainda nao existe como rota dedicada;
- nao ha contrato separado para leitura detalhada vs listagem;
- a estrutura atual ainda e mais de CRM leve do que de prontuario robusto.

### 4.5 Criacao manual, edicao e importacoes nao usam o mesmo recorte de campos

Criacao manual (`lead-create-modal` / `POST /api/leads`) aceita:

- nome
- email
- telefone
- cidade
- empresa
- vidas
- interesse
- orcamento
- etapa
- origem
- observacoes

Edicao (`lead-details-popup` / `PATCH /api/leads/[id]`) aceita:

- nome
- email
- telefone
- cidade
- empresa
- vidas
- etapa
- interesse
- orcamento
- ultima interacao
- observacoes

Importacao CSV aceita apenas:

- nome
- email
- telefone
- cidade
- origem
- interesse
- observacoes

Importacao Meta e webhook oficial conseguem preencher tambem:

- campanha
- adset
- anuncio
- ids Meta
- `raw_payload`
- `meta_connected_account_id`

Impacto:

- o modelo de banco e mais amplo que os fluxos manuais;
- a origem do lead muda bastante a riqueza do registro;
- a qualidade do prontuario atual depende fortemente da origem do dado.

### 4.6 CSV importa sempre com etapa inicial

Na tela `app/dashboard/importar/csv-import-workspace.tsx`, o payload final fixa:

- `stage: "new"`

Isso significa que o CSV:

- nao reaproveita etapa informada na planilha;
- nao mapeia responsavel;
- nao mapeia empresa, vidas, campanha ou campos Meta;
- usa um subconjunto bem menor do schema real.

### 4.7 Comentarios e `last_interaction` se sobrepoem

Ao criar comentario em `createLeadCommentForCurrentUser`, o sistema:

- grava um item em `lead_comments`;
- atualiza `leads.last_interaction` com um resumo do comentario.

Impacto:

- existe historico detalhado e resumo simultaneamente;
- `last_interaction` deixa de ser campo canonicamente manual;
- parte da historia do lead fica duplicada entre resumo e comentarios.

### 4.8 Responsavel do lead nao esta fiel na UI gerencial

`mapLeadRowToLead()` calcula `owner` assim:

- se o lead pertence ao perfil atual, mostra o nome do usuario;
- senao retorna `"Equipe"`.

Impacto:

- managers nao veem o nome real do responsavel na maioria das telas;
- o campo de responsavel existe no banco, mas a UI nao o representa fielmente;
- exportacao CSV e mais rica que a propria listagem nesse ponto.

### 4.9 Existe tolerancia explicita a drift de schema

`insertLeadWithSchemaFallback()` remove dinamicamente colunas como:

- `import_batch_id`
- `archive_reason`
- `duplicate_of_lead_id`

se elas nao existirem no banco do ambiente.

Impacto:

- o codigo tenta continuar funcionando mesmo com schema incompleto;
- isso reduz quebra operacional, mas pode mascarar ambientes defasados;
- diagnostico e observabilidade do contrato real ficam mais dificeis.

### 4.10 Historico de papeis ainda nao esta totalmente alinhado

O produto atual trabalha com:

- `owner`
- `admin`
- `seller`

Mas migrations e policies antigas ainda citam:

- `supervisor`

A camada TS normaliza `supervisor` para `admin` em `src/lib/workspaces/permissions.ts`.

Impacto:

- ha compatibilidade retroativa;
- ainda existe ruido entre nomenclatura historica do banco e do produto atual.

## 5. Riscos de seguranca e multi-tenant

### Controles positivos observados

- `organization_id` esta presente no modelo real e e aplicado nas queries principais.
- Sellers ficam limitados aos proprios leads por `owner_profile_id`.
- Managers (`owner`/`admin`, com compatibilidade para `supervisor`) conseguem ver a organizacao.
- `lead_comments` usam policy de acesso baseada em visibilidade real do lead.
- A tela `/dashboard/integracoes/webhook-leads` esta protegida por `requireWorkspaceManager()`.
- `lead_webhook_events` salva `safe_headers` e payload resumido/sensibilizado, nao o body bruto completo.

### Riscos encontrados

#### Risco 1: `leads.raw_payload` pode armazenar PII e dados livres demais

O campo `raw_payload` do proprio lead recebe:

- body completo do webhook generico;
- dados resumidos da Meta;
- linha completa do CSV importado.

Hoje nao ha evidencia de minimizacao central para `leads.raw_payload`, ao contrario de `lead_webhook_events`, que passa por sanitizacao.

Impacto:

- o registro principal do lead pode virar um deposito de payload arbitrario;
- aumenta a superficie de PII e de dados nao estruturados;
- dificulta retencao, exclusao e governanca.

#### Risco 2: exportacao CSV nao gera trilha de auditoria persistente

`GET /api/leads/export` exporta:

- contato
- cidade
- empresa
- vidas
- orcamento
- interesse
- observacoes
- ids Meta

mas nao registra ator, volume, filtros e horario em uma trilha dedicada.

#### Risco 3: logs de erro ainda podem carregar contexto comercial demais

O logger mascara nomes de campo sensiveis como `name`, `email`, `phone` e `authorization`, mas:

- nao trata `notes`, `interest`, `campaign`, `city` e campos livres de negocio como sensiveis por padrao;
- rotas como `POST /api/leads` registram `body` em caso de erro.

Isso reduz risco de PII obvia, mas nao fecha todo o risco de contexto comercial exposto em logs.

## 6. Riscos de dados pessoais

Dados pessoais e sensiveis observados no fluxo de leads:

- nome
- telefone
- telefone normalizado (`phone_e164`)
- email
- cidade
- empresa
- quantidade de vidas
- observacoes livres
- historico de comentarios
- origem comercial
- ids Meta e contexto de campanha
- payload bruto/resumido de importacao

Pontos de atencao:

- `lead_comments` persistem `author_name` e `author_email` em cada comentario.
- `leads.raw_payload` pode guardar dados excedentes ao minimo necessario.
- exportacao CSV entrega uma visao muito ampla do lead.
- nao foi encontrada trilha formal de consentimento por origem.
- nao foi encontrada politica clara de retencao para arquivados, duplicados, payloads e exportacoes.

## 7. Pontos frageis

- O tipo principal da UI nasce em `src/data/mock.ts`, nao em um contrato de dominio compartilhado.
- Labels de etapa e origem sao mapeadas em mais de um lugar.
- O responsavel do lead nao aparece corretamente para managers na UI operacional.
- Comentarios e `last_interaction` se sobrepoem semanticamente.
- CSV cobre um recorte pequeno do schema real.
- O sistema depende de fallback para ambientes com schema incompleto.
- Nao existe contrato unico de leitura resumida vs leitura detalhada do lead.
- A estrutura atual ainda favorece uso em modal e lista, nao prontuario comercial mais profundo.

## 8. Recomendações tecnicas

1. Criar um contrato central de dominio para leads, separado do mock e separado do DTO de exibicao.
2. Separar explicitamente:
   - row do banco;
   - DTO de API;
   - view model de listagem;
   - view model de detalhe.
3. Revisar `leads.raw_payload` para guardar apenas resumo minimo auditavel por origem.
4. Corrigir a exibicao de responsavel para managers com nome real do `owner_profile_id`.
5. Centralizar os schemas de create/update/import para evitar drift entre rotas.
6. Decidir se `last_interaction` sera resumo derivado ou campo manual independente.
7. Expandir ou documentar melhor o limite intencional da importacao CSV.
8. Registrar exportacoes, importacoes, edicoes e arquivamentos em trilha de auditoria.
9. Encerrar a nomenclatura historica `supervisor` nas camadas que ainda dependerem dela.

## 9. Subtarefas sugeridas para o roadmap

- Criar contrato compartilhado de lead entre banco, API e UI.
- Revisar exibicao do responsavel real do lead nas telas gerenciais.
- Revisar minimizacao e retencao de `leads.raw_payload`.
- Adicionar auditoria persistente para exportacao de leads.
- Revisar contrato de importacao CSV frente ao schema real do lead.
- Definir estrategia unica para `last_interaction` e `lead_comments`.
- Consolidar nomenclatura de perfis entre produto, TS e migrations historicas.

## 10. Conclusão

Status da estrutura atual: `parcial`.

O Leadi ja possui uma base real de CRM de leads com:

- isolamento por organizacao;
- atribuicao por owner;
- funil;
- comentarios;
- importacao CSV;
- importacao Meta;
- webhook generico;
- webhook oficial da Meta;
- arquivamento e tratamento de duplicados.

Mesmo assim, a estrutura ainda nao esta pronta como modelo estavel de prontuario comercial mais completo porque:

- banco, API, UI e mock ainda nao compartilham um contrato unico;
- o payload bruto do lead merece revisao de minimizacao;
- a exibicao de responsavel esta incompleta para managers;
- ha gaps de auditoria e governanca de dados pessoais.

Para a continuidade do roadmap, a recomendacao e tratar a base atual como suficiente para evolucao controlada, mas nao como estrutura final consolidada.
