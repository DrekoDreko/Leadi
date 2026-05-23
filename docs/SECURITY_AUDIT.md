# Security Audit - Leadi / LeadHealth

Data da auditoria: 2026-05-20  
Escopo: auditoria estatica do repositorio local, migrations Supabase, rotas `app/api`, server actions, variaveis de ambiente, risco Git/GitHub, webhooks, integracoes Meta/OpenAI, billing/creditos, frontend e dependencias.

> Este documento nao corrige o sistema. Ele identifica riscos, impacto e recomendacoes. Nenhum valor real de chave, token, senha ou segredo foi copiado para este relatorio.

## Sumario Executivo

| Gravidade | Achado | Status | Impacto | Recomendacao |
|---|---|---|---|---|
| Alto | `next@^15.0.0` aparece em faixa vulneravel no `npm audit`, incluindo bypass de middleware/App Router e DoS | Corrigido no lote seguro: `next` e `eslint-config-next` fixados em `15.5.18`; `npm audit --json` nao reporta alta para `next` | Autenticacao centralizada em middleware pode ser contornada em versoes vulneraveis; risco de vazamento de dados e indisponibilidade | Manter monitoramento de advisories e reforcar auth dentro dos handlers em lotes posteriores |
| Alto | Possiveis segredos locais no workspace | Parcialmente corrigido / precisa de validacao manual: `.gitignore` ampliado; rotacao/remocao segura de arquivos locais depende do operador | Exposicao acidental em prints, backups, commits futuros ou uploads de ambiente | Manter fora do Git, rotacionar se houver suspeita de vazamento, usar secrets manager/Vercel env |
| Alto | RLS permite leitura por membros em tabelas que contem ciphertext/metadados de segredos | Parcialmente corrigido no lote seguro: migration revoga leitura ampla e concede colunas sanitizadas; retornos server-side para UI nao carregam ciphertext | Membros autenticados podem ler ciphertext, previews, ultimos digitos, logs e metadados de integracoes | Migrar segredos para tabela server-only dedicada em lote posterior |
| Alto | Billing tem grants diretos para `insert/update` em `subscriptions` e `insert` em `payment_events` | Corrigido no lote seguro: migration revoga grants/policies de escrita financeira direta para `authenticated` | Usuarios internos podem tentar manipular estado financeiro se policies/RPC falharem ou ficarem amplas | Manter mutacoes financeiras em service role/RPC validado |
| Medio | Muitas APIs dependem do middleware para protecao | Confirmado por rotas | Vulnerabilidades de middleware ou rotas especiais podem expor handlers | Revalidar sessao, papel e organizacao dentro de cada rota mutavel |
| Medio | Validacao de payload e metodos e majoritariamente manual, sem Zod | Confirmado por rotas | Entrada malformada, excesso de campos, incoerencias e mensagens de erro inconsistentes | Padronizar schemas Zod por rota e bloquear metodos nao suportados |
| Medio | Rate limit e em memoria e parcial | Confirmado em `src/lib/rate-limit.ts` | Em serverless/multiplas instancias o limite pode ser burlado; APIs de IA/webhooks seguem expostas a abuso | Usar rate limit distribuido por IP, usuario, organizacao e token |
| Medio | Webhooks persistem payloads brutos com dados pessoais | Confirmado em rotas/repositorios | Excesso de PII em logs e tabelas, risco LGPD e exposicao operacional | Minimizar payload persistido, mascarar campos sensiveis e definir retencao |
| Medio | Rotas/actions autenticadas por cookie nao mostram protecao CSRF/origin padronizada | Risco/recomendacao | POSTs sensiveis podem ser chamados de origens indevidas se SameSite/origin nao bastar | Validar `Origin`/`Host`, usar tokens CSRF em formularios sensiveis |
| Medio | `returnTo` em integracoes aceita paths iniciados por `/`, mas nem todos rejeitam `//host` | Confirmado em rotas | Possivel open redirect em fluxos de integracao | Reusar helper unico que rejeita `//`, URLs absolutas e caracteres suspeitos |
| Baixo | `.gitignore` cobre `.env*` e `.vercel`, mas nao cobre `*.pem`, `*.key`, dumps/backups e credenciais genericas | Confirmado em `.gitignore` | Risco de commit acidental futuro | Expandir `.gitignore` e adicionar varredura de segredos pre-commit/CI |
| Info | `npm run lint` e `npm test` falharam por instalacao/dependencia local quebrada | Confirmado em comandos locais | Auditoria nao teve verificacao automatizada completa | Reinstalar dependencias e repetir lint/test/audit |

## Achados Prioritarios

### LGPD, leads, logs e auditoria

- Alto: `app/dashboard/integracoes/webhook-leads/page.tsx` mostra logs organizacionais para qualquer usuario autenticado com perfil completo. A consulta usa service role via `listLeadWebhookLogsByOrganization()` e pode expor nomes de leads e erros operacionais a consultores.
- Alto: nao existe trilha persistente e unificada de auditoria para login, edicao de lead, exportacao de leads, alteracao de permissoes, criacao/edicao de campanha ou alteracao do nome comercial da empresa.
- Medio: a exportacao CSV exige sessao e respeita o escopo visivel do usuario, mas nao registra quem exportou, quando, com quais filtros e com qual volume de dados.
- Medio: exclusao de lead no fluxo principal e arquivamento (`archived_at`) sem trilha de ator, motivo ou evento. O desfazer importacao CSV remove linhas fisicamente por lote e tambem nao gera auditoria.
- Medio: `src/lib/logger.ts` mascara apenas parte dos nomes de campos sensiveis e nao cobre integralmente `notes`, `city`, `source_campaign`, `meta_form_id`, historico de atendimento e outros campos de negocio pedidos nesta revisao.
- Medio: a sanitizacao atual e fraca para payloads estruturados da Meta. Arrays como `field_data[].values` podem reter PII mesmo quando a chave `name` e mascarada.
- Medio: `app/api/meta/data-deletion/route.ts` remove integracoes e ativos Meta, mas nao apaga leads importados nem `lead_webhook_events` relacionados, deixando lacuna de retencao e exclusao para dados pessoais oriundos da Meta.

## Status das correcoes - lote seguro

Data da atualizacao: 2026-05-20

- Corrigido: dependencia vulneravel do Next.js. `package.json` e `package-lock.json` foram atualizados para `next@15.5.18` e `eslint-config-next@15.5.18`.
- Parcialmente corrigido / precisa de validacao manual: possiveis segredos locais. `.gitignore` foi ampliado para chaves, certificados, dumps, backups, logs e arquivos comuns de credenciais; arquivos `.env*` locais nao foram removidos nem rotacionados automaticamente.
- Parcialmente corrigido: segredos cifrados legiveis por membros via RLS. A migration `202605200001_security_high_fixes.sql` revoga leitura ampla de `meta_integrations` e `openai_connections`, concede somente colunas sanitizadas e o repositorio nao retorna ciphertext/reference para UI. A separacao fisica em tabela server-only ainda fica pendente.
- Corrigido: escrita financeira direta por `authenticated` em `subscriptions` e `payment_events`. A migration remove policies/grants de escrita direta e preserva o modelo server-only.
- Parcialmente corrigido: Meta OAuth e acoes sensiveis. Connect/sync/disconnect/upload exigem gestor, `returnTo` rejeita `//`, URL OAuth completa deixou de ser logada e state expira em 10 minutos. Nonce one-time, CSRF padronizado, auditoria completa e rate limit distribuido ficam para validacao/lote posterior.
- Parcialmente corrigido: webhook Mercado Pago. O payload persistido foi minimizado e a assinatura deixou de ser salva; rate limit distribuido e auditoria completa ficam pendentes.

Data da atualizacao: 2026-05-21

- Corrigido parcialmente: catalogo e template de ambiente ficaram mais claros. `.env.example` agora cobre o conjunto compartilhado de variaveis com separacao explicita entre `NEXT_PUBLIC_*` e segredos server-only.
- Corrigido parcialmente: o repositorio ganhou teste para evitar drift entre `src/lib/env/shared.ts` e `.env.example`, reduzindo o risco de documentar mal uma variavel sensivel.
- Mantido e reforcado: `npm run security:check` continua como guardrail obrigatorio para bloquear segredos server-side em modulos `"use client"`.

### 1. Dependencia vulneravel do Next.js

Confirmado por `npm audit --json`.

- Pacote direto afetado: `next`.
- Gravidade: Alta.
- O audit local reportou 7 vulnerabilidades totais: 1 alta e 6 moderadas.
- A faixa instalada/permitida (`next@^15.0.0`) esta associada a advisories de bypass de middleware/proxy em App Router, DoS em Server Components/Cache Components, SSRF e cache poisoning.
- Como o projeto usa `middleware.ts` para proteger quase todas as rotas `/dashboard`, `/team`, `/onboarding`, `/invite` e `/api`, esse achado e critico para o modelo de seguranca.

Recomendacoes:

- Atualizar Next.js para uma versao corrigida e travar a versao em `package-lock.json`.
- Reexecutar `npm audit`, `npm run lint`, `npm test` e um smoke test autenticado.
- Nao depender exclusivamente do middleware para rotas API sensiveis. Cada handler mutavel deve validar sessao, perfil, papel e organizacao.

### 2. Possiveis segredos locais no workspace

Possivel segredo encontrado em: `.env.local`  
Possivel segredo encontrado em: `.env.production`  
Possivel segredo encontrado em: `.vercel/.env.preview.local`

Observacoes:

- Esses arquivos nao apareceram como rastreados por `git ls-files`.
- `.env.example` esta rastreado e aparenta ser template.
- `.env.production` e `.vercel/.env.preview.local` contem nomes de variaveis sensiveis e metadados de deploy. Nenhum valor foi copiado.

Recomendacoes:

- Validar manualmente se algum valor real foi compartilhado fora da maquina.
- Rotacionar chaves se houver qualquer suspeita de vazamento.
- Manter secrets somente no ambiente seguro do provedor e evitar arquivos `.env.production` reais no workspace.
- Remover arquivos locais sensiveis de backups, anexos, prints e dumps.

### 3. Segredos cifrados legiveis por membros via RLS

Arquivos relevantes:

- `supabase/migrations/202605050005_meta_integrations.sql`
- `supabase/migrations/202605060003_connected_accounts.sql`
- `src/lib/integrations/repository.server.ts`
- `src/lib/integrations/crypto.server.ts`

Risco:

- `meta_integrations` contem `access_token_ciphertext`, `access_token_reference`, `token_last_four`, metadados da conta e status.
- `openai_connections` contem `api_key_ciphertext`, `api_key_reference`, `key_preview`, `key_last_four` e `last_error`.
- As policies permitem leitura por membros da organizacao.
- Mesmo cifrado, ciphertext de secrets nao deve ser exposto ao cliente autenticado. Se a chave de cifragem vazar, ciphertext historico vira material sensivel.

Recomendacoes:

- Separar segredos para tabelas como `integration_secrets` sem grant para `authenticated`.
- Expor para membros apenas resumo sanitizado via view/RPC: status, provedor, conta, ultimos 4 caracteres e timestamps.
- Remover `api_key_ciphertext` e `access_token_ciphertext` dos tipos/queries retornados ao frontend.
- Usar `INTEGRATIONS_SECRET_KEY` dedicado; evitar fallback para `SUPABASE_SERVICE_ROLE_KEY` como chave de cifragem.

### 4. Billing e creditos precisam ser server-only

Arquivos relevantes:

- `supabase/migrations/202605060001_billing_subscriptions.sql`
- `supabase/migrations/202604290004_billing_credits_mercadopago.sql`
- `src/lib/billing/admin.ts`
- `app/api/billing/mercadopago/checkout/route.ts`
- `app/api/billing/webhooks/mercadopago/route.ts`

Risco:

- Existem grants para `authenticated` inserir/atualizar `subscriptions` e inserir `payment_events`.
- Policies limitam por organizacao e papel, mas billing, creditos e eventos de pagamento devem ser autoritativos no servidor.
- O webhook Mercado Pago usa assinatura, mas retorna erros internos em alguns casos e armazena `providerPayload` com resposta completa do provedor.

Recomendacoes:

- Revogar grants diretos de escrita financeira para `authenticated`.
- Criar RPCs `security definer` ou endpoints server-only com service role para toda mudanca de assinatura, compra, pagamento e credito.
- Persistir payload do provedor com minimizacao e mascaramento.
- Usar idempotencia forte em todos os creditos concedidos por webhook.

### 5. Logs e PII

Arquivos relevantes:

- `src/lib/logger.ts`
- `app/api/webhooks/leads/route.ts`
- `app/api/meta/webhook/route.ts`
- `src/lib/leads/webhook-events.server.ts`
- `src/lib/leads/webhook-events.repository.ts`

Pontos positivos:

- `logger.sensitize` mascara campos com nomes como `token`, `key`, `password`, `secret`, `authorization`, `email`, `phone`, `name`, `cpf`, `cnpj`.
- Headers de webhook sao filtrados antes de persistir.

Riscos:

- Payload bruto de leads e Meta e gravado em `lead_webhook_events.raw_payload`.
- `error.stack` e `error.message` podem conter detalhes internos.
- O mascaramento por nome de campo nao cobre todos os aliases possiveis em payloads livres.

Recomendacoes:

- Definir politica de retencao para logs de webhook.
- Persistir somente payload normalizado e campos de diagnostico essenciais.
- Mascarar PII antes de salvar no banco, nao apenas antes de escrever console.
- Separar logs operacionais de dados pessoais auditaveis.

## Supabase Security Review

### Tabelas encontradas

Foram encontradas as seguintes tabelas em migrations e scripts SQL:

`organizations`, `profiles`, `leads`, `workspace_members`, `invites`, `lead_comments`, `lead_follow_up_events`, `lead_webhook_integrations`, `lead_webhook_events`, `campaigns`, `creative_requests`, `creative_request_comments`, `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`, `meta_ad_image_uploads`, `meta_campaign_publication_attempts`, `openai_connections`, `integration_sync_logs`, `plans`, `subscriptions`, `payment_events`, `credit_wallets`, `credit_transactions`, `billing_purchases`, `org_ai_balances`, `ai_credit_ledger`, `ai_usage_events`, `whatsapp_messages`, `whatsapp_delivery_settings`, `dashboard_reminders`, `onboarding_states`, `system_templates`.

### Tabelas sensiveis

Precisam obrigatoriamente de RLS e revisao de grants:

- Dados pessoais/CRM: `leads`, `lead_comments`, `lead_follow_up_events`, `profiles`, `organizations`, `workspace_members`, `invites`.
- Webhooks/logs: `lead_webhook_integrations`, `lead_webhook_events`, `integration_sync_logs`.
- Meta: `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`, `meta_ad_image_uploads`, `meta_campaign_publication_attempts`.
- OpenAI: `openai_connections`.
- Billing/creditos: `plans`, `subscriptions`, `payment_events`, `credit_wallets`, `credit_transactions`, `billing_purchases`, `org_ai_balances`, `ai_credit_ledger`, `ai_usage_events`.
- WhatsApp: `whatsapp_messages`, `whatsapp_delivery_settings`.
- Operacional: `dashboard_reminders`, `onboarding_states`.

### RLS e policies

Pontos positivos confirmados:

- RLS aparece habilitado amplamente nas tabelas principais.
- As policies geralmente isolam por `organization_id` do perfil autenticado.
- Funcoes `security definer` encontradas usam `set search_path = public`.
- Nao foram encontrados padroes explicitos `using (true)` ou `with check (true)` nas policies revisadas.
- O bucket `creative-request-files` e privado (`public = false`) e tem policies por pasta/organizacao.

Policies e grants que merecem revisao:

- `Members can read organization meta integrations` permite leitura de linhas com campos de token cifrado.
- `Members can read organization openai connections` permite leitura de linhas com campos de chave cifrada.
- `Members can read integration sync logs` pode expor mensagens de erro/metadados sensiveis.
- `Members can read workspace payment events` e leitura ampla de billing por membros; avaliar se vendedores devem ver eventos financeiros.
- `Billing managers can create/update workspace subscriptions` e `Billing managers can create workspace payment events` permitem escrita a usuarios autenticados por policy. Mesmo com papel filtrado, o melhor modelo e escrita server-only.
- `Members can read active plans` e aceitavel se o catalogo for publico, mas precisa evitar metadados internos.

### Service role

Uso encontrado:

- `src/lib/supabase/admin.ts`
- `src/lib/billing/admin.ts`
- `src/lib/integrations/repository.server.ts`
- `src/lib/meta/*`
- `src/lib/leads/*`
- `src/lib/creative-requests/repository.server.ts`
- scripts locais como `scripts/supabase-mcp.mjs`, `scripts/debug-leads.mjs`, `scripts/check-lead-webhook-receipt.mjs`

Pontos positivos:

- O client admin principal usa `persistSession: false` e `autoRefreshToken: false`.
- Os modulos que manipulam segredos usam `server-only` em partes importantes.
- Nao foi visto uso direto de `SUPABASE_SERVICE_ROLE_KEY` em componente client.

Riscos:

- Service role aparece em scripts e docs operacionais; se executados em ambiente errado podem vazar acesso administrativo.
- O fallback de cifragem usa `SUPABASE_SERVICE_ROLE_KEY` se `INTEGRATIONS_SECRET_KEY` nao existir.
- Rotas publicas de webhook usam service role por necessidade; qualquer falha de autenticacao nelas tem impacto alto.

Recomendacoes:

- Tornar `INTEGRATIONS_SECRET_KEY` obrigatoria em producao.
- Criar allowlist de modulos server-only que podem importar `createSupabaseAdminClient`.
- Adicionar teste/linters para impedir `SUPABASE_SERVICE_ROLE_KEY`, `createSupabaseAdminClient` ou secrets em arquivos `"use client"`.
- Separar scripts MCP/debug de producao e exigir env local separado.

### Storage/uploads

Bucket encontrado:

- `creative-request-files`, privado, limite SQL de 10 MB, MIME allowlist incluindo PDF, Office, ZIP, imagens e videos.

Riscos:

- Upload de SVG e ZIP pode introduzir XSS/arquivo ativo se servido inline ou baixado sem headers seguros.
- O app tambem aceita upload de imagem Meta ate 30 MB em rota propria.

Recomendacoes:

- Forcar download para anexos nao-imagem ou servir com `Content-Disposition: attachment`.
- Reavaliar `image/svg+xml` e `application/zip` se nao forem estritamente necessarios.
- Validar extensao, MIME real e tamanho no servidor.
- Considerar antivirus/sandbox para anexos de clientes.

### Multi-tenancy

Modelo observado:

- `profiles.organization_id` e base para isolamento.
- Repositorios server-side filtram por organizacao atual.
- Webhook de leads autentica token e resolve `organizationId`.
- Importacao Meta rejeita `organizationId` diferente da organizacao do usuario.

Riscos:

- Qualquer uso de service role precisa repetir filtro por organizacao manualmente.
- Payloads de frontend que carregam `organizationId`, `owner_profile_id`, ids Meta ou ids de campanha precisam sempre ser validados no servidor.

Recomendacoes:

- Adotar helpers obrigatorios para `requireCurrentProfile`, `requireOrganizationResource` e `assertSameOrganization`.
- Escrever testes de acesso cruzado para leads, campanhas, anexos, Meta, OpenAI, billing e webhooks.

## Supabase Hardening Results

Data da atualizacao: 2026-05-20

Migration criada:

- `supabase/migrations/202605200002_supabase_hardening_rls.sql`

Tabelas revisadas:

- CRM e ownership: `organizations`, `profiles`, `workspace_members`, `leads`, `lead_comments`, `lead_follow_up_events`, `campaigns`
- `lead_follow_up_events` aparece no historico de migrations, mas foi removida por `202605140001_remove_lead_score_agenda.sql`; o hardening atual cobre apenas as tabelas sensiveis ainda ativas no schema final
- Integracoes e segredos operacionais: `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`, `openai_connections`, `integration_sync_logs`
- Webhooks e auditoria operacional: `lead_webhook_integrations`, `lead_webhook_events`
- Billing e creditos: `subscriptions`, `payment_events`, `credit_wallets`, `credit_transactions`, `billing_purchases`, `org_ai_balances`, `ai_credit_ledger`, `ai_usage_events`
- Storage: `storage.objects` para o bucket `creative-request-files`

RLS habilitado:

- Confirmado nas tabelas sensiveis revisadas acima; a nova migration reaplica `enable row level security` nas tabelas criticas para manter o hardening forward-only explicito.

Policies corrigidas:

- Novos helpers reutilizaveis: `current_profile_is_manager()`, `current_profile_can_access_lead(uuid)` e `current_profile_can_access_campaign(uuid)`
- `lead_comments` deixou de aceitar leitura/escrita por "mesma organizacao" e passou a exigir visibilidade real do lead
- `lead_follow_up_events` foi tratado como risco historico identificado no review de migrations, mas nao recebeu nova policy porque a tabela foi removida do schema final
- `campaigns` deixou de ser leitura ampla por organizacao para sellers; agora seller ve apenas campanhas criadas por ele, enquanto managers veem campanhas da organizacao
- `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`, `openai_connections` e `integration_sync_logs` passaram a leitura manager-only via RLS
- `lead_webhook_integrations` e `lead_webhook_events` passaram a leitura manager-only via RLS
- `subscriptions`, `payment_events`, `credit_wallets`, `credit_transactions`, `billing_purchases`, `org_ai_balances`, `ai_credit_ledger` e `ai_usage_events` deixaram de ser leitura ampla por membros e passaram a leitura manager-only via RLS

Hardening server-side aplicado:

- `getCurrentAiBalance()` agora deriva o usuario autenticado no servidor antes de consultar saldo
- `getCurrentBillingSnapshot()` agora deriva usuario e organizacao no servidor e retorna billing apenas para managers
- `getConnectedAccountsForCurrentUser()` passou a ser um loader sanitizado para fluxos autenticados comuns
- `getManagedConnectedAccountsForCurrentUser()` ficou reservado ao fluxo gerencial de `/dashboard/perfil/meta`
- A callback OAuth da Meta agora revalida `profileId` + `organizationId` do `state` assinado contra o banco antes de salvar a conexao

Riscos ainda pendentes:

- `lead_comments` vazava metadados de leads de colegas na mesma organizacao antes do novo hardening; a correcao precisa ser validada em ambiente real com usuarios seller distintos
- `lead_follow_up_events` tinha a mesma fraqueza estrutural no historico de migrations, mas a tabela foi removida do schema final; nao ha validacao operacional pendente para ela
- A callback OAuth da Meta agora revalida vinculo e papel, mas ainda nao ha nonce one-time persistido em banco
- Ainda existem funcoes service-role exportadas que dependem de call sites corretos; os fluxos autenticados principais foram endurecidos, mas vale continuar reduzindo superficie
- O bucket `creative-request-files` permaneceu privado e nao foi ampliado; ainda e recomendavel revisar MIME ativos como SVG/ZIP

Validacoes manuais necessarias:

- Confirmar em `pg_policies` que nenhuma tabela sensivel revisada ficou com `using (true)` ou `with check (true)`
- Validar com dois sellers na mesma organizacao que um nao consegue ler comentarios do outro quando os leads pertencem a owners distintos
- Validar com seller e manager na mesma organizacao que campanhas respeitam "seller so ve as proprias"
- Validar que seller nao consegue ler `payment_events`, `billing_purchases`, `lead_webhook_events` nem `integration_sync_logs`
- Validar que owner/admin continuam vendo ativos Meta necessarios no fluxo gerencial e que seller continua recebendo apenas o estado sanitizado necessario para campanhas/importacao
- Validar que a callback OAuth falha quando o perfil do `state` deixa de pertencer a organizacao ou perde permissao gerencial antes do retorno da Meta

## APIs Internas

| Rota/API | Protegida? | Validacao | Risco | Gravidade | Recomendacao |
|---|---|---|---|---|---|
| `GET /api/campaigns` | Sim, middleware/repository current-user | Baixa/manual | Depende do middleware e RLS | Medio | Validar sessao no handler e manter filtro por org |
| `POST /api/campaigns/generate` | Sim, `getBillingAuthContext` | Manual, sem Zod | Custo IA, payload livre, sem rate limit dedicado | Medio | Zod, rate limit por usuario/org, limites por campo e auth no handler |
| `POST /api/campaigns/questions` | Sim, checa auth | Manual, sem Zod | Custo IA/entrada livre | Medio | Zod, rate limit e erro sanitizado |
| `POST /api/campaigns/publish` | Sim, checa auth/repository | Manual | Publicacao Meta sensivel | Alto | Validar ownership da campanha/conta Meta no handler e aplicar idempotencia |
| `POST /api/compliance/validate` | Sim, `getBillingAuthContext` | Manual com limite de texto | Custo IA, prompt/data exposure | Medio | Zod, rate limit e politica de dados enviados a OpenAI |
| `GET /api/creative-requests` | Sim, repository current-user | N/A | Dados de pedidos/anexos por org | Medio | Auth no handler e testes cross-org |
| `POST /api/creative-requests` | Sim, repository current-user | Manual | Criacao com dados livres | Medio | Zod, payload limit e validação de papel/org |
| `PATCH /api/creative-requests/[id]` | Sim, repository current-user | Manual | Alteracao de pedido por id | Medio | Validar org/role no handler e schema |
| `POST /api/creative-requests/[id]/comments` | Sim, repository current-user | Manual | Comentarios podem conter PII | Medio | Zod e sanitizacao/minimizacao |
| `POST /api/creative-requests/[id]/attachments` | Sim, repository/storage | FormData/manual | Upload malicioso | Alto | MIME real, antivirus, limitar SVG/ZIP, headers seguros |
| `GET /api/creative-requests/[id]/attachments/[attachmentId]` | Sim, repository current-user | Params manuais | Link/download cross-org | Alto | Garantir org no handler e URL assinada curta |
| `POST /api/admin/creative-requests/[id]/comments` | Sim, admin role via repository | Manual | Usa fila/admin, service role indireto | Alto | Exigir `requirePlatformAdmin` no handler e auditar logs |
| `POST /api/dashboard-reminders` | Sim, middleware/repository | Manual | Criacao de lembretes por org | Medio | Zod e auth no handler |
| `GET /api/integrations/meta/connect` | Sim, `resolveCurrentIdentity` | Query manual | `returnTo` aceita path iniciado por `/` | Medio | Rejeitar `//`, validar role owner/admin e origin |
| `GET /api/integrations/meta/callback` | Publica por OAuth state assinado | State HMAC/manual | State sem expiracao efetiva observada; callback sensivel | Alto | Expirar state, validar sessao/nonce e registrar auditoria |
| `POST /api/integrations/meta/sync` | Sim, `resolveCurrentIdentity` | FormData manual | Sincroniza ativos com token Meta | Alto | Exigir owner/admin, CSRF/origin e rate limit |
| `POST /api/integrations/meta/disconnect` | Sim, `resolveCurrentIdentity` | FormData manual | Desconexao de integracao | Alto | Exigir owner/admin no handler, CSRF/origin e auditoria |
| `POST /api/integrations/meta/ad-images` | Sim, `resolveCurrentIdentity` | FormData/manual + tamanho | Upload para Meta e armazenamento local | Alto | Zod/FormData schema, validar org de campanha/pedido e rate limit |
| `POST /api/integrations/openai/connect` | Sim, reexport save | FormData manual | Stub atual; futuro segredo OpenAI | Medio | Ao implementar, salvar segredo server-only e nao expor ciphertext |
| `POST /api/integrations/openai/save` | Sim, `resolveCurrentIdentity` | FormData manual | Stub, sem salvamento atual | Medio | Exigir owner/admin, Zod, CSRF e segregacao de segredo |
| `POST /api/integrations/openai/test` | Sim, `resolveCurrentIdentity` | FormData manual | Stub, futuro custo externo | Medio | Rate limit e nao retornar detalhes da chave |
| `POST /api/integrations/openai/disconnect` | Sim, `resolveCurrentIdentity` | FormData manual | Stub, futura acao sensivel | Medio | Exigir owner/admin e CSRF/origin |
| `GET /api/leads` | Sim, repository current-user | Query manual | PII de leads | Alto | Auth no handler, filtros Zod e teste cross-org |
| `POST /api/leads` | Sim, repository current-user | Manual + payload size | Cria/atualiza duplicados com PII | Alto | Zod, rate limit, validar owner_profile_id e org no servidor |
| `PATCH /api/leads/[id]` | Sim, repository current-user | Manual | Edicao por id, depende de regras server-side | Alto | Zod, auth no handler, optimistic locking/auditoria |
| `DELETE /api/leads/[id]` | Sim, repository current-user | Params manuais | Arquivamento indevido | Alto | Auth no handler, validar papel/owner e auditar |
| `GET /api/leads/[id]/comments` | Sim, repository current-user | Params manuais | Comentarios com PII | Alto | Auth no handler e filtro org obrigatorio |
| `POST /api/leads/[id]/comments` | Sim, repository current-user | Manual | PII livre e spam | Medio | Zod, rate limit e sanitizacao |
| `GET /api/leads/export` | Sim, repository current-user | Query manual | Exportacao massiva de PII | Alto | Exigir role, rate limit, auditoria e limites de volume |
| `DELETE /api/leads/import-batches/[batchId]` | Sim, RPC current-user | Params manuais | Desfaz importacao | Alto | Auth no handler, role/ownership e auditoria |
| `POST /api/meta/leads/import` | Sim, `resolveCurrentIdentity` | Manual + payload size | Importacao em massa via Meta | Alto | Zod, rate limit, validar fonte pertence a org e registrar auditoria |
| `GET /api/meta/leads/sources` | Sim, `resolveCurrentIdentity` | N/A | Lista paginas/forms Meta | Medio | Exigir owner/admin se dados forem sensiveis |
| `GET /api/meta/webhook` | Publica intencional | Verify token | Verificacao Meta | Baixo | Manter token forte e nao logar challenge/token |
| `POST /api/meta/webhook` | Publica intencional | Assinatura HMAC, JSON, payload size, rate limit parcial | Entrada publica com service role e PII | Alto | Rate limit distribuido, payload minimizado, idempotencia e erros genericos |
| `POST /api/meta/data-deletion` | Publica intencional | Signed request Meta | Apaga dados Meta por user id | Alto | Nao retornar detalhes internos, auditar, revisar escopo de delecao por org |
| `POST /api/webhooks/leads` | Publica intencional | Bearer/header token hash, JSON, payload size, rate limit parcial | Cria leads com service role e payload livre | Alto | Rate limit distribuido, schema por integracao, minimizar raw payload e rotate tokens |
| `POST /api/billing/mercadopago/checkout` | Sim, `getBillingAuthContext` | Manual | Cria compra/checkout | Alto | Rate limit, CSRF/origin e validar catalogo server-only |
| `POST /api/billing/webhooks/mercadopago` | Publica intencional | Assinatura Mercado Pago, payload size | Credita saldo financeiro | Alto | Idempotencia forte, erro generico, rate limit e payload minimizado |
| `POST /api/whatsapp/generate` | Sim, `getBillingAuthContext` | Manual | Custo IA e PII de lead | Medio | Zod, rate limit e validar `leadId` pertence a org |
| `POST /api/whatsapp/send` | Sim, `getBillingAuthContext` | Manual | Envio externo/WhatsApp indevido | Alto | Validar ownership da mensagem/lead, rate limit, auditoria e consentimento |

Observacao: existe tambem arquivo duplicado nao rastreado `app/api/meta/data-deletion/route 2.ts`. Arquivos duplicados com sufixo ` 2` nao entram no roteamento padrao, mas criam risco operacional de revisao incorreta, drift e commit acidental.

## Variaveis De Ambiente E Segredos

Arquivos analisados:

- `.env.local`
- `.env.production`
- `.env.example`
- `.vercel/.env.preview.local`
- `.gitignore`
- `README.md`
- `docs/*`
- `scripts/*`
- `src/lib/env/*`
- configs Supabase, Meta, OpenAI e billing

Variaveis sensiveis citadas no projeto:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `META_APP_SECRET`
- `META_VERIFY_TOKEN`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `INTEGRATIONS_SECRET_KEY`
- tokens Meta e WhatsApp

Achados:

- Possivel segredo encontrado em: `.env.local`
- Possivel segredo encontrado em: `.env.production`
- Possivel segredo encontrado em: `.vercel/.env.preview.local`
- Testes usam chaves fake como valores de teste. Nao foram tratados como segredo real.
- Docs citam nomes de variaveis e exemplos com `...`; isso e aceitavel.
- Scripts locais dependem de service role e devem ficar fora de ambientes compartilhados.

`.gitignore` atual protege:

- `.env`
- `.env.local`
- `.env.production`
- `.env.*.local`
- `.vercel`
- logs npm/yarn basicos
- `node_modules`, `.next`, `dist`, `build`

Lacunas no `.gitignore`:

- `*.pem`
- `*.key`
- `*.p12`
- `*.pfx`
- `*.crt`
- `*.csr`
- `*.sql.gz`
- `*.dump`
- `*.bak`
- `*.backup`
- `credentials.json`
- `service-account*.json`
- logs genericos (`logs/`, `*.log`) alem de npm/yarn

## GitHub E Risco De Exposicao

Resultado local:

- `git ls-files` encontrou apenas `.env.example` entre arquivos tipo env/segredo rastreados.
- `git log --all --full-history -- "*.env"` retornou apenas `.env.example`.
- A worktree esta suja, com arquivos modificados e varios arquivos nao rastreados com sufixo ` 2`; isso aumenta o risco de commit acidental de duplicatas.

Comandos de validacao manual recomendados:

```bash
git status
git log --all --full-history -- "*.env"
git grep -n "SUPABASE_SERVICE_ROLE"
git grep -n "OPENAI_API_KEY"
git grep -n "META_APP_SECRET"
git grep -n "MERCADO_PAGO"
git grep -n "access_token"
git grep -n "refresh_token"
git grep -n "service_role"
```

Comandos extras:

```bash
npm audit
git ls-files | rg 'env|pem|key|secret|credential'
```

Recomendacoes:

- Adicionar secret scanning no GitHub.
- Rodar uma ferramenta dedicada antes de push/deploy, por exemplo Gitleaks ou TruffleHog.
- Revisar arquivos nao rastreados antes de qualquer commit.
- Nunca commitar `.env.production`, `.vercel`, dumps ou exports reais.

## Meta Ads / Meta Lead Ads

Arquivos relevantes:

- `app/api/integrations/meta/*`
- `app/api/meta/webhook/route.ts`
- `app/api/meta/leads/import/route.ts`
- `src/lib/integrations/meta-graph.server.ts`
- `src/lib/meta/webhook.ts`
- `src/lib/meta/webhook-processing.server.ts`
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/meta/ad-image-upload.server.ts`
- `src/lib/meta/campaign-publication.server.ts`

Pontos positivos:

- OAuth Meta usa `state` assinado por HMAC, com TTL de 10 minutos e `returnTo` sanitizado.
- A callback OAuth revalida `profileId`, `organizationId` e permissao gerencial antes de salvar a conexao.
- Fluxos de `connect`, `sync`, `disconnect`, upload de imagem e publicacao exigem role gerencial (`owner`/`admin` ou workspace solo).
- Webhook Meta valida `x-hub-signature-256`, aplica limite de payload e rate limit local.
- Tokens Meta sao cifrados com `INTEGRATIONS_SECRET_KEY` e nao sao retornados ao frontend nos mapeamentos server-side.
- Importacao manual rejeita `organizationId` divergente da organizacao autenticada.

Riscos:

- Nao existe refresh token ou rotacao automatica observada; o fluxo depende do access token atual e de reconexao quando necessario.
- O `state` tem TTL, mas o `nonce` nao e persistido como one-time token; ha janela de replay dentro do periodo de validade.
- Os escopos solicitados hoje sao amplos para alguns fluxos: `business_management`, `pages_manage_metadata` e `ads_management`.
- Listagem/importacao manual de fontes Meta usa o token da organizacao sem bloqueio gerencial explicito; hoje qualquer usuario autenticado da org pode acionar esse fluxo.
- Persistencia de campanha aceita `metaPageId`, `metaAdAccountId` e `metaLeadFormId` do request sem ownership server-side explicito antes do save.
- Upload de imagem valida a conta de anuncio da organizacao, mas nao valida ownership de `campaignId` ou `creativeRequestId` antes de registrar a associacao.
- Webhook Meta e importacao manual ainda persistem payloads brutos com PII.
- O processamento continua usando service role em webhooks/importacao/publicacao; qualquer enfraquecimento de autenticacao nesses pontos teria impacto alto.

Recomendacoes:

- Persistir nonce one-time para o OAuth.
- Reduzir escopos Meta ao minimo necessario por fluxo.
- Validar ownership server-side de ativos Meta antes de salvar campanha ou associar upload.
- Minimizar payload bruto salvo em webhook/importacao e definir retencao curta.
- Implementar rate limit distribuido em `sync`, importacao, upload e publicacao.

## OpenAI

Arquivos relevantes:

- `src/lib/openai/index.ts`
- `src/lib/ai/credits.ts`
- `src/lib/integrations/repository.server.ts`
- `app/api/compliance/validate/route.ts`
- `app/api/campaigns/generate/route.ts`
- `app/api/whatsapp/generate/route.ts`
- `app/api/campaigns/questions/route.ts`
- `app/api/integrations/openai/*`

Pontos positivos:

- A chave global da plataforma fica em `OPENAI_API_KEY` server-side e nao ha exposicao intencional ao frontend.
- Chamadas de IA passam por debito/estorno server-side em `runAiActionWithCredits()`.
- Existe estrutura de chave por organizacao em `openai_connections`, com cifragem por `INTEGRATIONS_SECRET_KEY`.
- O mapeamento server-side zera `apiKeyCiphertext`/`apiKeyReference` antes de entregar `openAIConnection` para a UI.
- O client guard bloqueia uso de `OPENAI_API_KEY`, `getServerEnv()` e modulos `.server` em componentes `"use client"`.
- A resposta da OpenAI usa `json_schema` estruturado antes do parse.

Riscos:

- As rotas `/api/integrations/openai/*` continuam placeholder `coming_soon`; a chave por organizacao existe no repository, mas nao esta ativa no fluxo HTTP.
- Todas as geracoes atuais usam a chave global `OPENAI_API_KEY`; nao ha uso efetivo de chave por organizacao.
- A saida da IA e parseada com `JSON.parse`, sem validacao runtime local adicional antes de persistencia em banco.
- Alguns erros 4xx podem refletir `payload.error.message` do provedor para o usuario.
- Prompts podem enviar PII minimamente tratada para provedor externo; o ponto mais sensivel hoje e o fluxo de WhatsApp, que envia `leadName` e `leadContext`.
- Rate limit das rotas de IA existe, mas segue local/em memoria.
- Nao ha role explicita na camada de billing auth para restringir quem pode consumir creditos de IA; qualquer usuario autenticado da org entra no fluxo atual.

Recomendacoes:

- Ativar a chave por organizacao apenas com tabela/view server-only dedicada para segredos.
- Validar a saida da OpenAI com schema runtime local antes de salvar em banco.
- Definir politica formal de minimizacao de PII por feature, com foco em WhatsApp.
- Sanitizar mensagens de erro 4xx do provedor antes de retornar ao frontend.
- Implementar rate limit distribuido por usuario, organizacao e feature.
- Decidir explicitamente quem pode gastar creditos da org e iniciar chamadas de IA.

## Pagamentos, Creditos E Planos

Arquivos relevantes:

- `app/api/billing/mercadopago/checkout/route.ts`
- `app/api/billing/webhooks/mercadopago/route.ts`
- `src/lib/billing/mercadopago.ts`
- `src/lib/billing/admin.ts`
- `src/lib/ai/credits.ts`
- `supabase/migrations/202604290004_billing_credits_mercadopago.sql`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`

Pontos positivos:

- Checkout Mercado Pago aplica `same-origin`, schema e rate limit local antes de criar compra.
- Webhook Mercado Pago valida assinatura, consulta o pagamento no provedor e credita saldo no servidor.
- Creditos financeiros usam RPC/idempotencia por `reference_type`/`reference_id`.
- Creditos de IA sao debitados e estornados no servidor, com trilha em `ai_usage_events`.
- RLS atual restringe leitura de billing, compras e ledger para perfis gerenciais.

Riscos:

- O rate limit continua local/em memoria em checkout e webhook.
- O `provider_payload` de compras ainda guarda metadados operacionais do provedor; embora minimizado, ainda precisa de politica de retencao.
- Qualquer usuario autenticado da organizacao pode hoje iniciar checkout e consumir creditos de IA; isso precisa ser tratado como decisao de produto/permissao a validar.
- O documento precisa continuar tratando billing/creditos como fluxo server-only; qualquer future fallback client-side seria risco alto.

Recomendacoes:

- Definir papel explicito para iniciar compras e consumir creditos compartilhados da organizacao.
- Adotar rate limit distribuido e auditoria financeira dedicada para compras, creditos e estornos.
- Revisar retencao e minimizacao de `provider_payload`.
- Manter toda mutacao financeira em RPC/server-only com idempotencia obrigatoria.

## External Integrations Hardening

### Riscos corrigidos

- Meta OAuth usa `state` assinado por HMAC, TTL de 10 minutos e `returnTo` sanitizado.
- A callback Meta revalida `profileId`, `organizationId` e permissao gerencial antes de salvar a conexao.
- Tokens Meta e chaves OpenAI sao cifrados server-side com `INTEGRATIONS_SECRET_KEY`.
- Os mapeamentos server-side zeram `ciphertext/reference` antes de entregar `metaConnection` e `openAIConnection` para o frontend.
- O webhook Meta valida `x-hub-signature-256`, aplica limite de payload e rate limit local.
- Checkout Mercado Pago aplica `same-origin`/rate limit local e o webhook valida assinatura antes de creditar saldo no servidor.
- Creditos de IA sao debitados e estornados no servidor, sem passagem de chave ao frontend.
- O guard de codigo client impede uso de `OPENAI_API_KEY`, `META_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` e segredos equivalentes em componentes `"use client"`.

### Riscos pendentes

- Meta nao possui refresh token/rotacao automatica; o sistema depende do access token atual e de reconexao.
- O nonce do OAuth nao e one-time persistido; existe janela de replay dentro do TTL do `state`.
- Os escopos Meta atuais sao amplos para alguns fluxos, em especial `business_management`, `pages_manage_metadata` e `ads_management`.
- Importacao manual de leads Meta e listagem de fontes usam token da organizacao sem exigir papel gerencial.
- Persistencia de campanha aceita `metaPageId`, `metaAdAccountId` e `metaLeadFormId` do request sem ownership server-side explicito antes de salvar.
- Upload de imagem Meta valida a conta de anuncio, mas nao valida ownership de `campaignId`/`creativeRequestId` antes de registrar a associacao.
- Webhook Meta e importacao manual ainda armazenam payloads brutos com PII.
- O fluxo de chave OpenAI por organizacao existe na camada de repository, mas nao esta ativo nas rotas; `/api/integrations/openai/*` continua placeholder.
- Todas as geracoes atuais usam a chave global `OPENAI_API_KEY`; nao ha uso efetivo de chave por organizacao.
- A saida da OpenAI e apenas `JSON.parse` sobre a resposta estruturada; falta validacao runtime local antes de salvar em banco.
- Erros da OpenAI ainda podem refletir `payload.error.message` do provedor em alguns cenarios 4xx nao mapeados.
- Prompts de WhatsApp enviam `leadName` e `leadContext` ao provedor, sem politica formal de minimizacao de PII.
- O rate limit segue local/em memoria, nao distribuido.
- Qualquer usuario autenticado da organizacao pode hoje consumir creditos de IA e iniciar checkout de billing; isso precisa ser validado como decisao de permissao, nao tratado como risco ja corrigido.

### Arquivos alterados

- `app/api/integrations/meta/connect/route.ts`
- `app/api/integrations/meta/callback/route.ts`
- `app/api/integrations/meta/sync/route.ts`
- `app/api/integrations/meta/disconnect/route.ts`
- `app/api/meta/webhook/route.ts`
- `app/api/meta/leads/import/route.ts`
- `app/api/integrations/meta/ad-images/route.ts`
- `app/api/campaigns/publish/route.ts`
- `app/api/integrations/openai/save/route.ts`
- `app/api/integrations/openai/test/route.ts`
- `app/api/integrations/openai/disconnect/route.ts`
- `app/api/campaigns/generate/route.ts`
- `app/api/campaigns/questions/route.ts`
- `app/api/compliance/validate/route.ts`
- `app/api/whatsapp/generate/route.ts`
- `app/api/billing/mercadopago/checkout/route.ts`
- `app/api/billing/webhooks/mercadopago/route.ts`
- `src/lib/integrations/repository.server.ts`
- `src/lib/integrations/oauth-state.server.ts`
- `src/lib/integrations/meta-graph.server.ts`
- `src/lib/meta/webhook-processing.server.ts`
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/meta/ad-image-upload.server.ts`
- `src/lib/meta/campaign-publication.server.ts`
- `src/lib/openai/index.ts`
- `src/lib/ai/credits.ts`
- `src/lib/security/client-code-guard.ts`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`

### Validacoes necessarias

- Validar que o OAuth Meta expira apos 10 minutos e falha com `state` adulterado.
- Validar que a callback Meta falha se o perfil perder permissao gerencial antes do retorno.
- Validar que seller nao consegue conectar, sincronizar, desconectar ou publicar campanha Meta.
- Decidir e validar se seller pode ou nao listar/importar fontes Meta; hoje o fluxo permite.
- Confirmar que `metaPageId`, `metaAdAccountId` e `metaLeadFormId` enviados no save/publicacao pertencem a ativos da mesma organizacao.
- Confirmar que upload de imagem Meta rejeita `campaignId`/`creativeRequestId` de outra organizacao.
- Garantir que nenhum token/chave aparece em HTML, JSON de pagina, hydration payload ou logs.
- Validar que webhook Meta e Mercado Pago continuam aceitando apenas assinaturas validas.
- Validar que debito/estorno de creditos de IA e idempotencia financeira funcionam sob retry.
- Confirmar que respostas OpenAI invalidas ou fora do schema nao sao persistidas.
- Confirmar politica de minimizacao de PII antes de enviar contexto de lead para OpenAI.

### Recomendacoes para producao

- Persistir nonce one-time para OAuth Meta.
- Reduzir escopos Meta ao minimo necessario por fluxo.
- Validar ownership server-side de ativos Meta referenciados em campanha, upload e importacao.
- Implementar rate limit distribuido por IP, usuario, organizacao e feature.
- Migrar segredos de integracao para tabela/view server-only dedicada.
- Validar runtime da saida OpenAI com schema local antes de salvar.
- Formalizar politica de dados/PII enviados a LLM.
- Definir papel explicito para quem pode gastar creditos e iniciar compras.
- Reduzir retencao e mascarar payload bruto de webhooks.

## Leads, CRM E Dados Pessoais

Dados sensiveis identificados:

- Nome, email, telefone/WhatsApp, cidade, empresa, quantidade de vidas, orcamento, interesse, notas, origem/campanha/anuncio, comentarios e historico.

Riscos:

- Exportacao CSV inclui muitos campos sensiveis e identificadores Meta.
- Logs e eventos de webhook podem reter payload bruto.
- Criacao e update dependem de validacoes server-side manuais.
- `owner_profile_id` e `owner_email` podem vir do payload de webhook; o servidor valida pertencimento, mas precisa de testes.

Recomendacoes:

- Exigir papel adequado para exportacao.
- Registrar auditoria de exportacao e delecao/arquivamento.
- Definir retencao para leads perdidos/duplicados/webhook events.
- Testar acesso cruzado entre organizacoes e vendedores.

## Revisao LGPD De Leads, Dados Pessoais, Logs E Auditoria

Escopo desta revisao complementar:

- nome
- telefone
- e-mail
- cidade
- origem
- campanha
- formulario
- observacoes
- historico de atendimento
- status no funil
- dados importados do Meta
- tokens de integracao
- dados financeiros
- logs de eventos

Fontes principais usadas nesta revisao:

- `src/lib/leads/repository.server.ts`
- `app/dashboard/integracoes/webhook-leads/page.tsx`
- `src/lib/logger.ts`
- `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`

### Matriz de verificacao LGPD

| Item verificado | Status | Conclusao | Risco residual | Fonte principal |
|---|---|---|---|---|
| Quem acessa leads | Confirmado | Sellers leem apenas os proprios leads; owners/admins leem a organizacao inteira. O filtro aparece no repository e na RLS. | Continua necessario testar acesso cruzado em runtime real. | `src/lib/leads/repository.server.ts`, `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql` |
| Quem edita leads | Confirmado | Sellers editam apenas leads proprios e nao-Meta; owners/admins editam leads da organizacao. | Nao ha trilha persistente de quais campos foram alterados, por quem e quando. | `src/lib/leads/repository.server.ts`, `app/api/leads/[id]/route.ts` |
| Quem exclui leads | Parcial | O fluxo principal nao exclui fisicamente; ele arquiva via `archived_at`. Owners/admins podem arquivar leads da organizacao; owners do lead podem remover leads proprios nao-Meta em regras historicas/RLS. | Falta auditoria de ator, motivo, data e tipo de exclusao/arquivamento. | `src/lib/leads/repository.server.ts`, `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`, `supabase/migrations/202605140004_lead_archive.sql` |
| Quem importa leads | Parcial | Importacao CSV e Meta exigem sessao e respeitam organizacao autenticada. Importacao Meta rejeita `organizationId` divergente. | Nao existe tabela de auditoria dedicada com ator, origem, volume e resultado por importacao. | `app/dashboard/importar/csv-import-workspace.tsx`, `app/api/meta/leads/import/route.ts`, `src/lib/meta/manual-lead-import.server.ts` |
| Quem exporta leads | Parcial | A exportacao exige sessao e respeita o escopo visivel do usuario corrente. | Nao registra quem exportou, filtros usados, volume ou finalidade da exportacao. | `app/api/leads/export/route.ts`, `src/lib/leads/repository.server.ts` |
| Consultores veem apenas os proprios leads | Confirmado | O papel operacional atual de consultor e `seller`; ele e limitado a `owner_profile_id = current_profile_id()`. | Ha risco residual se outras telas fora do CRM usarem service role sem replicar essa regra. | `src/lib/leads/repository.server.ts`, `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql` |
| Supervisores veem leads da equipe | Parcial | O modelo operacional atual usa `owner`, `admin` e `seller`. `supervisor` aparece como nomenclatura historica em migrations e e normalizado para manager na camada de permissao. | A documentacao funcional deve evitar depender de `supervisor` como papel atual de produto. | `src/lib/workspaces/permissions.ts`, `supabase/migrations/202605050003_supervisor_delete_leads.sql` |
| Admins/owners veem todos os leads da organizacao | Confirmado | Owners/admins sao tratados como managers tanto na aplicacao quanto na RLS. | Continua recomendada validacao manual com usuarios reais. | `src/lib/leads/repository.server.ts`, `supabase/migrations/202605200002_supabase_hardening_rls.sql` |
| Isolamento por organizacao | Confirmado | O isolamento usa `organization_id` no repository, nas RPCs e nas policies RLS. | Fluxos com service role continuam dependendo de filtro manual correto por organizacao. | `src/lib/leads/repository.server.ts`, `supabase/migrations/202605200002_supabase_hardening_rls.sql` |
| Logs expoem dados pessoais | Parcial | Existe mascaramento recursivo por nome de campo e armazenamento de headers seguros. | O mascaramento nao cobre todo o escopo sensivel e payloads Meta estruturados ainda podem reter PII. | `src/lib/logger.ts`, `src/lib/leads/webhook-events.server.ts`, `app/api/meta/webhook/route.ts` |
| Exportacoes sao protegidas | Parcial | O CSV exige autenticacao e respeita o escopo de visibilidade do usuario. Nao existe rota publica de exportacao. | Falta auditoria de exportacao, limite de volume e governanca de finalidade/retenção do arquivo exportado. | `app/api/leads/export/route.ts`, `app/dashboard/leads/leads-workspace.tsx` |
| Exclusoes sao auditadas | Ausente | Nao foi encontrada auditoria persistente de exclusao/arquivamento de lead, nem de desfazer importacao por lote. | Exclusao sem trilha compromete prestacao de contas e investigacao de incidente. | `src/lib/leads/repository.server.ts`, `app/api/leads/import-batches/[batchId]/route.ts`, `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql` |

### Achados LGPD prioritarios

- `src/lib/logger.ts` usa lista parcial de chaves sensiveis e hoje nao cobre integralmente `notes`, `city`, `source_campaign`, `meta_form_id`, historico de atendimento, campos de campanha/origem e variacoes livres relevantes para o CRM.
- A funcao `sensitize()` depende do nome do campo. Em payloads estruturados da Meta, arrays como `field_data[].values` podem continuar carregando telefone, email e respostas livres mesmo com a chave `name` mascarada.
- `app/dashboard/integracoes/webhook-leads/page.tsx` usa `requireCompletedProfile()` e nao `requireWorkspaceManager()`. Na pratica, qualquer usuario autenticado da organizacao pode chegar a uma tela com logs operacionais e nomes de leads carregados por service role.
- `app/api/meta/data-deletion/route.ts` remove `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts` e `integration_sync_logs` do provedor Meta, mas nao elimina leads ja importados nem eventos de webhook relacionados a esses dados.
- Nao foi encontrada auditoria persistente para login, edicao de lead, exportacao, alteracao de permissoes, criacao/edicao de campanha ou alteracao do nome comercial.

### Trilhas existentes parcialmente

- `integration_sync_logs` cobre parte dos eventos de conexao, desconexao e sincronizacao Meta, mas nao funciona como trilha geral de auditoria do SaaS.
- `meta_campaign_publication_attempts` registra tentativas sanitizadas de publicacao de campanha na Meta e pode ser tratado como log operacional especializado.
- `credit_transactions`, `billing_purchases` e `payment_events` formam trilha operacional/financeira parcial para cobranca e creditos.
- Essas trilhas sao uteis, mas nao substituem uma auditoria unica e consistente com ator, acao, alvo, organizacao, timestamp, resultado, IP e user agent.

### Retencao, exclusao e descarte

- O fluxo de "exclusao" de lead no produto principal e arquivamento logico via `archived_at`, nao eliminacao fisica imediata.
- O desfazer importacao CSV por `import_batch_id` remove linhas fisicamente, mas sem registrar evento de auditoria dedicado.
- O endpoint de exclusao de dados da Meta atende ao requisito do provedor para conexoes/ativos, mas nao encerra sozinho o ciclo LGPD de leads e logs derivados.
- Nao foi encontrada politica documental de retencao para `lead_webhook_events`, exports CSV, duplicados arquivados, erros de integracao e historico comercial.

## Controle De Acesso E Papeis

Modelo observado:

- Papeis normalizados: `owner`, `admin`, `seller` e equivalentes historicos como `supervisor`.
- Middleware bloqueia rotas de dashboard/team/import/create-team.
- Repositorios e RPCs aplicam regras por organizacao/papel.

Riscos:

- Rotas API sensiveis nao devem depender so do middleware.
- Algumas acoes usam fallback direto se RPC ausente.
- Admin/platform admin precisa de verificacao explicita em endpoints admin.

Recomendacoes:

- Criar helpers obrigatorios de auth para API: `requireApiUser`, `requireApiWorkspace`, `requireApiManager`, `requireApiPlatformAdmin`.
- Remover fallbacks que fazem update direto quando RPC/migration falta em producao.
- Testes de permissao por papel para todas as rotas mutaveis.

## Frontend

Pontos positivos:

- Nao foi encontrado uso de `dangerouslySetInnerHTML`, `eval` ou `new Function` na busca estatica.
- `createSupabaseBrowserClient` usa anon key publica, como esperado.
- O service role nao apareceu em componente client.

Riscos:

- Dados sensiveis podem ser renderizados em client components e exportados.
- Rotas protegidas apenas por interface visual seriam inseguras; o projeto usa middleware, mas precisa reforco nos handlers.
- Anexos SVG/HTML-like podem gerar XSS se exibidos inline.

Recomendacoes:

- Nunca enviar ciphertext/secrets para componentes client.
- Aplicar Content Security Policy.
- Evitar inline rendering de SVG/anexos de usuario.
- Revisar componentes que exibem payloads/logs para mascaramento.

## Webhooks

Webhooks publicos intencionais:

- `/api/webhooks/leads`
- `/api/meta/webhook`
- `/api/meta/data-deletion`
- `/api/billing/webhooks/mercadopago`

Pontos positivos:

- Lead webhook usa token em `Authorization Bearer` ou `x-leadhealth-token`, armazenado como hash.
- Meta webhook valida assinatura HMAC.
- Mercado Pago webhook valida assinatura.
- Ha limites de payload por `Content-Length`.

Riscos:

- Rate limit atual e em memoria.
- Payload bruto persistido.
- Erros podem retornar detalhes em alguns fluxos.
- Public endpoints usam service role apos autenticacao.

Recomendacoes:

- Rate limit distribuido e WAF.
- Schema por webhook e rejeicao de campos inesperados quando possivel.
- Rotacao/revogacao de tokens de webhook.
- Retencao curta para payload bruto ou eliminacao total de raw payload.

## Rate Limit

Arquivo relevante:

- `src/lib/rate-limit.ts`

Achados:

- Implementacao atual usa `Map` em memoria.
- O proprio comentario reconhece limitacoes em serverless/multiplas instancias.
- Rate limit aparece em webhooks Meta/leads, mas nao em todas as rotas de IA, exportacao, billing checkout, sync/import Meta e WhatsApp.

Recomendacoes:

- Usar Redis/Upstash/Vercel KV ou solucao equivalente.
- Chaves por IP, usuario, organizacao, token de webhook e feature.
- Limites diferentes para IA, exportacao, upload, webhook e billing.

## Abuse and Rate Limit Review

Objetivo desta secao: registrar o estado atual dos controles contra abuso, custo excessivo, spam, sobrecarga e alteracao financeira indevida nos endpoints mais sensiveis. Os itens abaixo diferenciam o que ja existe hoje no codigo do que ainda depende de implementacao futura.

Endpoints revisados:

- Login e signup em `app/login/actions.ts`.
- `POST /api/whatsapp/generate`.
- `POST /api/compliance/validate`.
- `POST /api/campaigns/questions`.
- `POST /api/campaigns/generate`.
- `POST /api/campaigns/publish`.
- `POST /api/meta/leads/import`.
- `GET /api/meta/leads/sources`.
- `POST /api/webhooks/leads`.
- `POST /api/meta/webhook`.
- `POST /api/integrations/openai/test`.
- `GET /api/leads` como endpoint de busca/listagem.
- `GET /api/leads/export`.
- `POST /api/billing/mercadopago/checkout`.
- `POST /api/billing/webhooks/mercadopago`.

Endpoints protegidos:

- Checkout Mercado Pago nao confia em preco nem quantidade de creditos enviados pelo frontend; o cliente informa apenas `productKey`, e o servidor resolve `amountCents` e `credits` a partir de `src/lib/billing/catalog.ts`.
- Geracao com IA debita creditos no servidor via `runAiActionWithCredits()` e `apply_ai_credit_change`, sem confiar em saldo ou custo vindos do cliente.
- Webhook Meta valida assinatura HMAC antes de processar eventos.
- Webhook Mercado Pago valida assinatura, consulta o pagamento de forma autoritativa no provedor e concede creditos no servidor com referencia idempotente em `grant_credits`.
- Criacao manual de leads, importacao Meta e webhooks de leads passam por `assertOrganizationResourceAccess`, reduzindo abuso quando a organizacao ja atingiu limite de plano.
- Checkout, rotas de IA, publicacao de campanha, upload Meta e varios handlers internos ja aplicam rate limit basico e validacao server-side, embora ainda local/em memoria.

Endpoints ainda pendentes:

- Login, signup e OAuth continuam sem throttle dedicado contra brute force, credential stuffing ou abuso de criacao de conta.
- Rotas de IA cobram creditos no servidor, mas nao possuem limite efetivo por usuario, organizacao, plano, feature e janela de tempo; hoje o controle esta concentrado em rate limit local por IP.
- `GET /api/leads` e `GET /api/leads/export` nao usam chave de rate limit por usuario/organizacao, o que facilita abuso por sessoes autenticadas atras de poucos IPs.
- `GET /api/meta/leads/sources` faz chamadas upstream para a Meta, mas hoje nao aplica rate limit no proprio handler.
- `POST /api/webhooks/leads` nao tem idempotencia forte para reenvios arbitrarios; duplicatas por email/telefone podem atualizar o lead existente em vez de serem tratadas como replay seguro.
- Webhooks publicos continuam com rate limit apenas local/em memoria, sem garantia global em ambiente serverless ou multi-instancia.
- O debito de creditos de IA ainda nao recebe chave de idempotencia propria; retries ou submits duplicados podem cobrar mais de uma vez antes de qualquer conciliacao posterior.

Riscos financeiros:

- Dupla cobranca de creditos de IA por retry do cliente, reenvio de formulario ou repeticao acidental do submit.
- Ausencia de trilha persistente em `payment_events` no fluxo atual do Mercado Pago, apesar da tabela existir para registrar eventos financeiros.
- Consumo concentrado de OpenAI, Meta ou WhatsApp por uma unica organizacao sem fairness por plano, usuario ou feature.
- Importacao em lote continua limitada principalmente por chamadas unitarias repetidas a `POST /api/leads`, o que aumenta superficie de abuso operacional e custo indireto.
- O webhook generico de leads pode ser usado para sobrecarga ou alteracao indevida de registros existentes quando o token vaza e o replay nao e bloqueado por `event_id` ou chave idempotente.

Recomendacoes para producao:

- Adotar rate limit distribuido por `IP`, `userId`, `organizationId`, `endpoint`, `plan` e janela de tempo, reaproveitando o helper atual apenas como fachada.
- Exigir `Idempotency-Key` ou referencia equivalente para debit/charge de IA e para qualquer endpoint que possa gerar custo, spam ou mutacao relevante.
- Gravar `payment_events` em todo evento financeiro do Mercado Pago, inclusive validacao, ignorado, aprovado, falha e refund, para manter trilha de auditoria completa.
- Aplicar throttle explicito em login, signup e OAuth callback/init para reduzir brute force, credential stuffing e abuso de criacao de conta.
- Definir limite diario, por lote e por organizacao para importacao de leads, incluindo CSV, Meta manual e webhooks publicos.
- Exigir `event_id`, `delivery_id` ou `Idempotency-Key` nos webhooks publicos sempre que a origem suportar esse identificador.
- Manter auditoria persistente para exportacao, checkout, concessao de creditos, consumo de creditos, refund e processamento de webhook financeiro.
- Tratar o rate limit atual como mitigacao parcial apenas; ele reduz abuso basico, mas nao substitui enforcement distribuido em producao.

## Logs E Auditoria

Pontos positivos:

- Logger server-side padronizado e com mascaramento recursivo por nome de campo.
- Eventos de webhook guardam status e headers seguros.
- Ja existem trilhas operacionais parciais em `integration_sync_logs`, `meta_campaign_publication_attempts`, `credit_transactions`, `billing_purchases` e `payment_events`.

Riscos:

- `error.stack` pode vazar caminho interno.
- Payloads brutos com PII sao persistidos.
- `app/dashboard/integracoes/webhook-leads/page.tsx` expoe logs organizacionais a qualquer perfil autenticado com perfil completo, inclusive com nome de lead e mensagem de erro.
- Faltam trilhas completas de auditoria para login, exportacao de leads, edicao e arquivamento/exclusao de lead, conexao/desconexao Meta/OpenAI, mudancas de papel, convites e alteracoes de nome comercial.

Recomendacoes:

- Criar tabela de auditoria por organizacao com evento, ator, alvo, IP, user agent, data e resultado.
- Mascarar PII antes de persistir logs.
- Definir retencao e acesso restrito a logs.
- Registrar exportacoes CSV e downloads de anexos.
- Diferenciar explicitamente log operacional, log financeiro e log de auditoria LGPD para evitar falsas conclusoes de conformidade.

## Dependencias

Resultado de `npm audit --json`:

- Total: 7 vulnerabilidades.
- Alta: 1.
- Moderadas: 6.
- Critica: 0.
- Pacotes destacados: `next`, `postcss`, `hono`, `brace-expansion`, `express-rate-limit`, `ip-address`, `ws`.

Riscos:

- `next` e direto e afeta middleware/App Router.
- Dependencias transientes podem afetar tooling, SSR, cache ou dev server.

Recomendacoes:

- Atualizar dependencias com foco em Next.js.
- Rodar `npm audit fix` somente apos revisar impacto e lockfile.
- Usar Dependabot/Renovate.
- Bloquear deploy se `npm audit` tiver alta/critica em runtime dependency.

## Resultado De Verificacao Local

Comandos executados durante a auditoria:

- `rg`/`find` para mapear arquivos, rotas, SQL, envs e referencias a secrets.
- `git status --short`.
- `git ls-files` para risco de arquivos sensiveis rastreados.
- `git log --all --full-history -- "*.env"`.
- `git check-ignore`.
- `npm audit --json`.
- `npm run lint`.
- `npm test -- --runInBand`.

Resultado:

- `npm audit --json`: falhou com exit code de vulnerabilidades, mas retornou relatorio valido.
- `npm run lint`: falhou por dependencia local quebrada em `node_modules`, envolvendo `jsx-ast-utils`/`eslint-plugin-react`.
- `npm test -- --runInBand`: falhou por chunk ausente do Vitest em `node_modules`.

Conclusao: a auditoria estatica foi concluida, mas a verificacao automatizada completa precisa de reinstalacao/normalizacao de dependencias antes de ser considerada confiavel.

## Recomendacoes De Correcao Por Prioridade

### Prioridade 0

- Atualizar Next.js para versao corrigida.
- Reinstalar dependencias e restaurar lint/test.
- Reforcar autenticacao dentro de cada API sensivel.
- Separar ciphertext/secrets de Meta/OpenAI em tabelas server-only.

### Prioridade 1

- Revogar grants diretos de escrita financeira para `authenticated`.
- Adicionar CSRF/origin checks para actions e POSTs autenticados por cookie.
- Implementar rate limit distribuido.
- Reduzir payload bruto em logs/webhook events.
- Validar `returnTo` com helper unico que rejeita `//`.

### Prioridade 2

- Padronizar Zod em APIs e server actions.
- Criar testes cross-org e por papel.
- Expandir `.gitignore`.
- Ativar secret scanning/pre-commit.
- Definir politica de retencao LGPD para leads, logs e webhooks.

## Assumptions E Limites

- Esta auditoria foi estatica e local; nao valida configuracao remota real do Supabase, Vercel, Meta, OpenAI ou Mercado Pago.
- Valores reais de `.env*` e tokens nao foram copiados.
- Achados marcados como confirmados foram observados em codigo, migrations ou saida local de comando.
- Achados marcados como risco/recomendacao dependem de runtime, configuracao remota ou comportamento operacional.
- Arquivos nao rastreados e duplicados com sufixo ` 2` foram considerados risco operacional, nao necessariamente vulnerabilidade exploravel.

## Revisao Especifica Das APIs Internas

Resumo do lote implementado:

- Criado helper compartilhado `src/lib/api/route-security.ts` para validacao com Zod, same-origin checks, rate limit local, erros seguros e logging estruturado.
- Endurecidas rotas sensiveis de leads, campanhas/IA, billing, Meta, OpenAI, webhooks, creative requests e WhatsApp.
- Reduzidos retornos desnecessarios em webhooks publicos.
- Eliminados arquivos duplicados acidentais com sufixo ` 2` que estavam entrando no grafo do Next/TypeScript e mascarando o estado real do backend.
- Revisadas server actions em `app/login/actions.ts`, `app/team/setup/actions.ts`, `app/dashboard/perfil/actions.ts`, `app/onboarding/profile-setup/actions.ts` e `app/dashboard/onboarding-actions.ts`.
  - Nao exigiram patch neste lote porque ja operam server-side com cliente de servidor/RPC e redirects seguros, mas permanecem dependentes de RLS/RPC para enforcement fino.

Riscos residuais apos o lote:

- `src/lib/rate-limit.ts` continua em memoria; reduz abuso basico, mas nao substitui rate limit distribuido em producao.
- Alguns fluxos ainda dependem de repositories/RPCs para autorizacao detalhada por ownership/papel; o handler agora rejeita melhor entradas ruins, mas nao substitui auditoria de todas as policies.
- Webhooks ainda persistem payload bruto em trilhas operacionais; o retorno foi minimizado, mas a retencao/mascaramento desses dados segue como trabalho adicional.
- Ainda existem warnings nao bloqueantes de frontend/lint fora do escopo de seguranca das APIs.

### Tabela Obrigatoria

| Rota/API | Status anterior | Correcao aplicada | Risco restante | Validacao |
|---|---|---|---|---|
| `GET /api/campaigns` | Auth apenas indireta via repository | Resposta `401` explicita para sessao ausente | Filtros e escopo seguem dependentes do repository | `npm run lint`, `npm run test`, `npm run build` |
| `POST /api/campaigns/generate` | Auth por billing, payload manual, sem rate limit | Zod, same-origin, rate limit, erro/log seguro | Rate limit ainda local em memoria | `npm run lint`, `npm run build` |
| `POST /api/campaigns/questions` | Auth por billing, payload manual | Zod, same-origin, rate limit, erro/log seguro | Rate limit ainda local em memoria | `npm run lint`, `npm run build` |
| `POST /api/campaigns/publish` | Auth e role, mas payload manual | Zod, same-origin, rate limit, logging estruturado | Publicacao ainda depende de checks profundos no service layer | `npm run lint`, `npm run build` |
| `POST /api/compliance/validate` | Auth por billing, payload manual | Zod, same-origin, rate limit, erro/log seguro | Rate limit ainda local em memoria | `npm run lint`, `npm run build` |
| `GET /api/creative-requests` | Auth apenas indireta via repository | `401` explicita para sessao ausente | Escopo fino segue no repository | `npm run lint`, `npm run build` |
| `POST /api/creative-requests` | Payload manual, `console.error` | Zod, same-origin, rate limit, logging estruturado | Upload/anexos continuam fluxo separado | `npm run lint`, `npm run build` |
| `PATCH /api/creative-requests/[id]` | Payload manual, sem rate limit | Zod, same-origin, rate limit, logging estruturado | Role/ownership detalhado continua no repository | `npm run lint`, `npm run build` |
| `POST /api/creative-requests/[id]/comments` | Payload manual, sem rate limit | Zod, same-origin, rate limit, logging estruturado | Sanitizacao de conteudo ainda simples | `npm run lint`, `npm run build` |
| `POST /api/creative-requests/[id]/attachments` | Auth indireta, validacao manual de arquivo | Mantida validacao de tamanho; sem mudanca funcional grande neste lote | MIME real/antivirus continuam pendentes | `npm run lint`, `npm run build` |
| `GET /api/creative-requests/[id]/attachments/[attachmentId]` | Auth indireta, erro com `console.error` | Revisada; sem retorno adicional de dados sensiveis | Download assinado curto depende do repository/storage | `npm run lint`, `npm run build` |
| `POST /api/admin/creative-requests/[id]/comments` | Rota admin com payload manual | Zod, same-origin, rate limit, logging estruturado | Permissao de admin segue garantida no repository, nao no handler | `npm run lint`, `npm run build` |
| `POST /api/dashboard-reminders` | Payload manual, erro inconsistente | Zod, same-origin, rate limit, typecheck corrigido | Regras de negocio de horario seguem no repository | `npm run lint`, `npm run test`, `npm run build` |
| `GET /api/integrations/meta/connect` | Auth/role ok, validacao propria de `returnTo` | Rate limit e helper unico para `returnTo` | Sem CSRF por ser GET, depende do state assinado | `npm run lint`, `npm run build` |
| `GET /api/integrations/meta/callback` | State assinado, mas logging bruto | Rate limit e logging estruturado | Continua dependente de state HMAC e permissao no callback | `npm run lint`, `npm run build` |
| `POST /api/integrations/meta/sync` | Role ok, sem same-origin/rate limit | Same-origin, rate limit, helper unico para `returnTo`, logging seguro | Rate limit ainda local | `npm run lint`, `npm run build` |
| `POST /api/integrations/meta/disconnect` | Role ok, sem same-origin/rate limit | Same-origin, rate limit, helper unico para `returnTo`, logging seguro | Rate limit ainda local | `npm run lint`, `npm run build` |
| `POST /api/integrations/meta/ad-images` | Validacao manual de upload | Same-origin e rate limit adicionados | MIME real/scan continuam pendentes | `npm run lint`, `npm run build` |
| `POST /api/integrations/openai/connect` | Reexport para rota save sem role explicita | Herdou endurecimento da rota save | Fluxo ainda e placeholder `coming_soon` | `npm run lint`, `npm run build` |
| `POST /api/integrations/openai/save` | Auth sem role gerencial explicita | Same-origin, rate limit, `returnTo` seguro, bloqueio para nao-manager | Fluxo ainda e placeholder `coming_soon` | `npm run lint`, `npm run build` |
| `POST /api/integrations/openai/test` | Auth sem role gerencial explicita | Same-origin, rate limit, `returnTo` seguro, bloqueio para nao-manager | Fluxo ainda e placeholder `coming_soon` | `npm run lint`, `npm run build` |
| `POST /api/integrations/openai/disconnect` | Auth sem role gerencial explicita | Same-origin, rate limit, `returnTo` seguro, bloqueio para nao-manager | Fluxo ainda e placeholder `coming_soon` | `npm run lint`, `npm run build` |
| `GET /api/leads` | Auth apenas indireta via repository | Rate limit e `401` explicita para sessao ausente | Query filters continuam interpretados pelo repository | `npm run lint`, `npm run test`, `npm run build` |
| `POST /api/leads` | Payload manual, sem schema | Zod, rate limit, erro seguro e sem confiar em ids de org/role do cliente | Rate limit ainda local | `npm run lint`, `npm run test`, `npm run build` |
| `PATCH /api/leads/[id]` | Payload manual | Zod, rate limit, erro seguro | Ownership detalhado permanece no repository | `npm run lint`, `npm run test`, `npm run build` |
| `DELETE /api/leads/[id]` | Auth indireta e sem logging estruturado | Mantido fluxo com resposta segura; logging melhor no handler | Auditoria explicita de delete ainda pode evoluir | `npm run lint`, `npm run test`, `npm run build` |
| `GET /api/leads/[id]/comments` | Auth indireta e `console.error` | Logging estruturado, resposta segura | Escopo fino por lead segue no repository | `npm run lint`, `npm run build` |
| `POST /api/leads/[id]/comments` | Payload manual, sem rate limit | Zod, rate limit, logging estruturado | Rate limit ainda local | `npm run lint`, `npm run build` |
| `GET /api/leads/export` | Exportacao massiva sem rate limit | Validacao de query e rate limit | Continua retornando CSV com PII legitima ao usuario autorizado; falta trilha de auditoria dedicada | `npm run lint`, `npm run test`, `npm run build` |
| `DELETE /api/leads/import-batches/[batchId]` | Auth indireta, `console.error` | Logging estruturado e resposta segura | Auditoria dedicada do undo segue pendente | `npm run lint`, `npm run build` |
| `POST /api/meta/leads/import` | Payload manual, aceitava `organizationId` do cliente | Zod, same-origin, rate limit; `organizationId` continua revalidado server-side | Rate limit ainda local; importacao depende do service layer | `npm run lint`, `npm run build` |
| `GET /api/meta/leads/sources` | State retornava `unauthenticated` | `401` explicita para sessao ausente | Dados sensiveis continuam filtrados pelo service layer | `npm run lint`, `npm run build` |
| `GET /api/meta/webhook` | Verificacao publica intencional | Mensagem de indisponibilidade sanitizada | Continua endpoint publico por desenho | `npm run lint`, `npm run build` |
| `POST /api/meta/webhook` | Webhook publico retornando detalhes demais | Resposta reduzida para contagens; erro de env sanitizado | Payload bruto ainda e persistido para operacao | `npm run lint`, `npm run build` |
| `POST /api/meta/data-deletion` | Erro podia refletir detalhes internos | Rate limit e erros sanitizados | Delecao segue dependente de service role e operacao server-only | `npm run lint`, `npm run build` |
| `POST /api/webhooks/leads` | Webhook publico retornando org/integration/lead inteiro | Resposta reduzida para `ok`, `lead_id`, `status`; auth/rate limit existentes preservados | Rate limit continua local; payload bruto ainda e registrado | `npm run lint`, `npm run build` |
| `POST /api/billing/mercadopago/checkout` | Payload manual, sem same-origin/rate limit | Zod, same-origin, rate limit, logging seguro | Catalogo e efeitos financeiros seguem server-side; rate limit ainda local | `npm run lint`, `npm run build` |
| `POST /api/billing/webhooks/mercadopago` | Webhook publico com mensagens pouco padronizadas | Rate limit e erros seguros/logados | Rate limit ainda local; auditoria financeira ainda pode expandir | `npm run lint`, `npm run build` |
| `POST /api/whatsapp/generate` | Payload manual, sem rate limit | Zod, same-origin, rate limit, logging seguro | Validacao de consentimento/uso operacional segue no dominio WhatsApp | `npm run lint`, `npm run build` |
| `POST /api/whatsapp/send` | Payload manual, sem rate limit | Zod, same-origin, rate limit, logging seguro | Rate limit ainda local; depende do repository para ownership de mensagem/lead | `npm run lint`, `npm run build` |

## Resultado Da Validacao Final

Comandos executados apos as correcoes:

- `npm run lint`
- `npm run test`
- `npm run build`

Resultado final:

- `npm run lint`: passou. Permanecem warnings nao bloqueantes de frontend (`<img>` em `app/dashboard/leads/leads-workspace.tsx` e import nao usado em `src/components/landing/highlight-carousel.tsx`).
- `npm run test`: passou (`28` arquivos, `93` testes).
- `npm run build`: passou. O build tambem confirmou a superficie dinamica das rotas `app/api` apos a remocao dos arquivos duplicados com sufixo ` 2`.

Data da atualizacao: 2026-05-22

- Corrigido: `lead_stage_history` permitia leitura ampla para membros da organização. Agora exige `public.current_profile_can_access_lead(lead_id)`.
- Corrigido: `lead_tasks` usava subquery menos eficiente e segura. Agora usa `public.current_profile_can_access_lead(lead_id)` no SELECT, UPDATE e INSERT.
- Corrigido: `meta_campaign_publication_attempts` permitia leitura ampla para membros. Agora exige `public.current_profile_can_access_campaign(campaign_id)`.
- Otimizado: `meta_ad_image_uploads` substituido subqueries para a função helper de RLS `public.current_profile_organization_id()`.

