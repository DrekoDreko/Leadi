# Auditoria da integracao Meta atual

Data: 2026-05-21
Status: diagnostico documental concluido

## Objetivo

Fechar um diagnostico curto e acionavel do estado real da integracao Meta no Leadi, cobrindo OAuth, sincronizacao de ativos, webhook e importacao manual de leads.

Esta auditoria complementa `docs/meta-review-production-check.md`: aquele arquivo registra blockers observados em producao; este documento separa os riscos por codigo, ambiente e dados para orientar as proximas tarefas do roadmap.

## Arquivos auditados

- `app/api/integrations/meta/connect/route.ts`
- `app/api/integrations/meta/callback/route.ts`
- `app/api/integrations/meta/sync/route.ts`
- `app/api/meta/webhook/route.ts`
- `app/api/meta/leads/import/route.ts`
- `app/api/meta/leads/sources/route.ts`
- `app/dashboard/perfil/meta/page.tsx`
- `app/dashboard/empresa/page.tsx`
- `src/lib/integrations/meta-graph.server.ts`
- `src/lib/integrations/repository.server.ts`
- `src/lib/integrations/oauth-state.server.ts`
- `src/lib/integrations/crypto.server.ts`
- `src/lib/meta/config.ts`
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/meta/webhook-processing.server.ts`
- `src/lib/env/server.ts`
- `src/lib/integrations/meta-graph.server.test.ts`
- `docs/meta-review-production-check.md`
- `docs/meta-app-review.md`

## Veredito

A integracao Meta ja existe de ponta a ponta no codigo e nao esta em estado de "stub". O problema principal hoje nao e ausencia de fluxo, e sim fragilidade operacional: o funcionamento real depende de segredos validos, token descriptografavel, `SUPABASE_SERVICE_ROLE_KEY` disponivel no servidor e ativos Meta previamente sincronizados por organizacao.

Em resumo:

- OAuth existe e tem protecao de estado, rate limit e checagem de permissao.
- Sync existe e persiste paginas, contas de anuncio e formularios.
- Webhook existe e valida assinatura antes de processar eventos.
- Importacao manual existe e consegue buscar leads reais por formulario.
- O maior risco real esta em ambiente e dados sincronizados, nao em falta de rotas.

## Fluxo atual mapeado

1. O usuario autenticado com permissao de owner/admin inicia o OAuth em `GET /api/integrations/meta/connect`.
2. O sistema gera um `state` assinado com HMAC e TTL de 10 minutos em `src/lib/integrations/oauth-state.server.ts`.
3. O callback em `GET /api/integrations/meta/callback` troca o `code` por token, consulta `/me` e salva a conexao.
4. A mesma etapa de callback ja dispara sincronizacao de paginas, contas de anuncio e formularios via `syncMetaOrganizationAssets()`.
5. A area `/dashboard/perfil/meta` le os snapshots locais de `meta_integrations`, `meta_pages`, `meta_ad_accounts`, `meta_forms` e logs de sync.
6. O webhook em `POST /api/meta/webhook` valida assinatura, resolve a organizacao pela pagina/formulario Meta e cria o lead no CRM.
7. A importacao manual em `POST /api/meta/leads/import` busca leads reais por formulario e cria os registros no CRM com tratamento de duplicidade.

## O que esta solido no codigo

- O `state` do OAuth e assinado, expira em 10 minutos e sanitiza `returnTo`.
- `connect`, `callback`, `sync` e `import` usam rate limit; `sync` e `import` ainda exigem same-origin.
- O webhook valida `x-hub-signature-256`, limita payload e registra eventos processados ou falhos.
- A resolucao da organizacao no webhook e defensiva: erro se um mesmo `form_id` ou `page_id` aparecer ativo em mais de uma organizacao.
- A area Meta do dashboard ja tem pagina dedicada (`/dashboard/perfil/meta`), e `/dashboard/empresa` e apenas alias de redirecionamento.
- Ja existe pelo menos um teste cobrindo troca de token OAuth e sync parcial de ativos.

## Blockers reais por fluxo

### 1. OAuth

Estado atual:

- O inicio do OAuth depende de sessao valida e `canManageConnections`.
- A troca do `code` e a consulta de perfil estao implementadas em `src/lib/integrations/meta-graph.server.ts`.

Blockers de ambiente:

- `META_APP_ID` e `META_APP_SECRET` sao obrigatorios para iniciar e concluir o OAuth.
- `INTEGRATIONS_SECRET_KEY` e obrigatoria, mesmo nao aparecendo em `requireIntegrationEnv("meta_oauth")`, porque:
- ela assina o `state` em `createMetaOAuthState()`;
- ela cifra o token salvo em `saveMetaConnectionSnapshot()`;
- ela descriptografa o token em usos futuros.
- `SUPABASE_SERVICE_ROLE_KEY` e obrigatoria para o callback funcionar de verdade, porque `resolveMetaOAuthStateIdentity()` usa admin client.

Blockers de codigo:

- A validacao de ambiente do fluxo `meta_oauth` nao explicita `INTEGRATIONS_SECRET_KEY` nem `SUPABASE_SERVICE_ROLE_KEY`; na pratica, o usuario recebe `meta=missing`, mas sem distinguir claramente qual dependencia faltou.

Blockers de dados:

- Mesmo com OAuth concluido, a experiencia pode continuar "vazia" se a sincronizacao inicial nao trouxer paginas, formularios e contas de anuncio.

### 2. Sync de ativos

Estado atual:

- `POST /api/integrations/meta/sync` reaproveita o token salvo por organizacao e atualiza snapshots locais de paginas, contas de anuncio e formularios.

Blockers de ambiente:

- O sync depende de token Meta salvo e descriptografavel.
- Se `INTEGRATIONS_SECRET_KEY` mudar entre ambientes ou estiver ausente, `resolveMetaAccessTokenForOrganization()` falha silenciosamente e o sync volta como `meta=missing&sync=failed`.

Blockers de codigo:

- O sync tolera falha parcial e grava `warning` quando, por exemplo, `adaccounts` falha mas `pages` e `forms` continuam. Isso e bom para disponibilidade, mas tambem permite estado parcialmente operacional sem diagnostico fino na interface.

Blockers de dados:

- Sem `meta_pages`, `meta_forms` e `meta_ad_accounts` preenchidos para a organizacao, a area Meta perde valor operacional e o restante do fluxo fica comprometido.
- A producao ja tem evidencia desse risco em `docs/meta-review-production-check.md`, que relata conexao ativa sem ativos sincronizados.

### 3. Webhook

Estado atual:

- `GET /api/meta/webhook` responde ao challenge da Meta.
- `POST /api/meta/webhook` valida assinatura, parseia `leadgen`, resolve a organizacao e cria o lead no CRM.

Blockers de ambiente:

- `META_APP_SECRET` e `META_VERIFY_TOKEN` sao obrigatorios para verificacao e assinatura.
- `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_URL` sao obrigatorios para processar e persistir o lead.
- O webhook tambem depende de token Meta descriptografavel para buscar os dados completos do lead na Graph API.

Blockers de codigo:

- O processamento depende de mapeamento previo de `meta_forms` ou `meta_pages`. Se o sync nao rodou ou ficou incompleto, o webhook nao consegue resolver a organizacao e falha com erro operacional.
- Nao ha fila de retry propria nem mecanismo de replay descrito no codigo lido; a trilha atual e baseada em log de evento.

Blockers de dados:

- Se a mesma pagina ou formulario estiver duplicado como ativo em mais de uma organizacao, o webhook aborta por seguranca.
- Sem ativos sincronizados, eventos de lead podem chegar, ser autenticados, mas nao serem roteados para o tenant correto.

### 4. Importacao manual de leads

Estado atual:

- `GET /api/meta/leads/sources` lista fontes elegiveis.
- `POST /api/meta/leads/import` importa leads reais, com deduplicacao e archivamento automatico quando aplicavel.

Blockers de ambiente:

- A importacao depende de sessao valida, `SUPABASE_SERVICE_ROLE_KEY` e token Meta descriptografavel.

Blockers de codigo:

- A importacao por `campaign` e `ad` ainda depende do conjunto de formularios sincronizados. O fluxo busca leads por formulario e so depois filtra por campanha ou anuncio.
- Na pratica, se nao houver formularios elegiveis em `meta_forms`, importar por campanha/anuncio tambem fica inviavel.

Blockers de dados:

- Fontes locais e fontes da Graph podem divergir quando a conexao existe, mas o token nao pode ser validado.
- O estado `hasConnection=true` com `canImport=false` ja esta previsto no codigo e tende a sinalizar exatamente esse tipo de inconsistencia operacional.

## Separacao objetiva dos problemas

### Problemas de codigo

- Mensagens de erro e validacoes de ambiente ainda misturam "Meta ausente" com falta de `INTEGRATIONS_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- O sync parcial grava warnings, mas a leitura operacional da interface ainda nao explicita bem o que faltou.
- A importacao por campanha/anuncio depende indiretamente de formularios sincronizados, o que nao fica obvio para o usuario.
- A cobertura automatizada ainda e pequena para os cenarios mais sensiveis: callback com ambiente incompleto, webhook sem ativos sincronizados e importacao com token nao descriptografavel.

### Problemas de ambiente

- Segredos da Meta precisam estar corretos no ambiente servidor: `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`.
- O servidor precisa de `INTEGRATIONS_SECRET_KEY` estavel para state OAuth e cifragem de token.
- O servidor precisa de `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` para callback, webhook, sync e importacao.
- `docs/meta-review-production-check.md` ja registra ausencia ou vazio de parte dessas variaveis no ambiente de producao auditado.

### Problemas de dados e operacao

- A conexao Meta pode existir sem ativos sincronizados, gerando UI conectada com operacao vazia.
- Webhook e importacao dependem de `meta_forms` e `meta_pages` coerentes por tenant.
- A demonstracao de `pages_show_list` e `leads_retrieval` fica fraca quando a organizacao de review nao possui pagina, formulario ou conta de anuncio sincronizados.

## Riscos sensiveis

- O fluxo toca segredos, dados de leads, multi-tenant e webhook publico.
- O token da Meta nao pode ser tratado apenas como dado de UI; toda garantia real esta no servidor.
- O webhook so e seguro porque assinatura, roteamento por tenant e persistencia continuam server-side.
- Qualquer ajuste futuro em callback, webhook, importacao ou token precisa preservar isolamento por `organization_id`.

## Drift de documentacao encontrado

- `docs/meta-app-review.md` orienta a mostrar `/dashboard/empresa` como area de conexao. No codigo atual, essa rota apenas redireciona para `/dashboard/perfil/meta`.
- Isso nao quebra o produto, mas a documentacao operacional e o screencast de review devem preferir a rota canonica `/dashboard/perfil/meta`.

## Priorizacao recomendada das proximas correcoes

1. TASK-030: revisar e explicitar todas as envs realmente exigidas pela integracao Meta, incluindo `INTEGRATIONS_SECRET_KEY` e dependencias de Supabase admin.
2. TASK-031: revisar o callback OAuth e melhorar diagnostico de falha por ambiente ausente.
3. TASK-034: criar diagnostico de conexao Meta na UI para diferenciar token ausente, token nao descriptografavel e ativos nao sincronizados.
4. TASK-035 e TASK-036: melhorar leitura operacional das fontes e do fluxo de importacao.
5. TASK-038 e TASK-039: tornar logs e mensagens de erro do webhook/importacao mais acionaveis.

## Conclusao

O Leadi ja tem base funcional real para integracao Meta, mas ela ainda esta fragil na operacao. O blocker dominante nao e "falta implementar Meta"; e tornar o fluxo observavel, configuravel e demonstravel em ambiente real.

As proximas tarefas devem priorizar:

- clareza de ambiente;
- diagnostico de conexao;
- leitura operacional de sync, webhook e importacao;
- testes para cenarios de falha mais provaveis.
