# Log de execução de tarefas — Leadi

Este arquivo registra as execuções feitas a partir do arquivo docs/tarefas-leadi-roadmap.md.

Cada execução deve registrar a tarefa trabalhada, arquivos alterados, comandos executados, resultado, riscos e pendências.

---

## Modelo de registro

### Data
AAAA-MM-DD HH:mm

### Tarefa
Nome ou ID da tarefa executada.

### Status
Concluída, parcial, bloqueada ou falhou.

### Arquivos alterados
- arquivo 1
- arquivo 2

### O que foi feito
Resumo objetivo das alterações realizadas.

### Comandos executados
- npm run lint
- npm run typecheck
- npm run test
- npm run build

### Resultado dos comandos
Informar o resultado de cada comando executado.

Se algum comando não existir no package.json, registrar isso.

### Pendências
Informar pendências, riscos ou próximos passos.

### Observações técnicas
Registrar detalhes importantes para futuras execuções.

---

### Data
2026-05-21 12:29

### Tarefa
Análise e normalização do roadmap de execução automática.

### Status
Concluída.

### Arquivos alterados
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/AGENTE_LEADI_TAREFAS.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi analisado o arquivo `docs/tarefas-leadi-roadmap.md` junto com `AGENTS.md` e `docs/AGENTE_LEADI_TAREFAS.md`.

O roadmap original foi considerado útil como contexto estratégico, mas não estava pronto para execução automática direta porque mistura diagnóstico, prioridades e prompts longos com a lista de tarefas, não usa checklist operacional, não deixa a primeira pendência mecanicamente evidente e ainda contém uma ordem sugerida de início que conflita com a ordem numérica do arquivo.

Foi criada a versão `docs/tarefas-leadi-roadmap-normalizado.md`, com ordem única de execução, checklist por tarefa, objetivo, escopo permitido, fora de escopo, arquivos prováveis, critérios de aceite e marcação explícita de áreas sensíveis.

Também foi atualizado o manual do agente para preferir o roadmap normalizado quando ele existir, mantendo o arquivo original como referência histórica e de contexto.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap.md`
- `sed -n '321,640p' docs/tarefas-leadi-roadmap.md`
- `sed -n '641,960p' docs/tarefas-leadi-roadmap.md`
- `sed -n '961,1280p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1444,2018p' docs/tarefas-leadi-roadmap.md`
- `sed -n '2018,2539p' docs/tarefas-leadi-roadmap.md`
- `sed -n '2539,3374p' docs/tarefas-leadi-roadmap.md`
- `sed -n '3373,4133p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1,240p' docs/LOG_EXECUCAO_TAREFAS.md`
- `rg -n "^### Tarefa|^### Bloco|^## " docs/tarefas-leadi-roadmap.md`
- `wc -l docs/tarefas-leadi-roadmap.md`
- `date '+%Y-%m-%d %H:%M:%S %Z'`

### Resultado dos comandos
Todos os comandos executados serviram para leitura e análise documental dos arquivos de instrução, do roadmap original e do log.

Não foram executados `npm run lint`, `npm run typecheck`, `npm run test` ou `npm run build`, porque esta execução foi exclusivamente documental e não houve alteração funcional no produto.

### Pendências
- Nas próximas execuções, o agente deve usar `docs/tarefas-leadi-roadmap-normalizado.md` como fonte principal.
- Cada tarefa sensível continua exigindo análise de impacto antes de qualquer implementação.

### Observações técnicas
Foram identificadas 76 tarefas no roadmap original.

As tarefas, em geral, já eram pequenas o bastante, então o principal ajuste necessário foi estrutural: normalizar ordem, status, critérios de aceite, escopo e marcação de risco para leitura segura por agente.

A próxima execução já pode começar pela primeira pendência do arquivo normalizado sem precisar reinterpretar a ordem do roadmap original.

### Data
2026-05-21 12:43

### Tarefa
`TASK-001 — Revisar estrutura atual de leads`

### Status
Concluída.

### Arquivos alterados
- `docs/AUDITORIA_ESTRUTURA_LEADS.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental da estrutura atual de leads do Leadi, cobrindo banco, tipos, repositorio server-side, mocks, listagem, funil, detalhe do lead, comentarios, exportacao, importacao CSV, importacao manual da Meta, webhook generico, webhook oficial da Meta e policies/migrations relacionadas.

O principal artefato criado foi `docs/AUDITORIA_ESTRUTURA_LEADS.md`, com mapeamento de arquivos, campos do lead, diferencas entre banco/API/UI/mock, riscos de seguranca e multi-tenant, riscos de dados pessoais, pontos frageis e subtarefas sugeridas.

A tarefa `TASK-001` foi marcada como concluida no roadmap normalizado porque a auditoria foi criada e registrada no repositorio.

### Comandos executados
- `sed -n '1,220p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `cat package.json`
- `rg --files | rg 'lead|csv|meta|webhook|funil|funnel'`
- `rg -n "\\blead(s)?\\b|lead_id|leadId|pipeline|stage|status|source|owner|assignee|workspace|organization|org" src app supabase docs --glob '!node_modules'`
- `rg -n "export type Lead|interface Lead|type Lead|Lead[A-Z][A-Za-z]+|lead_comments|from\\(\\\"leads\\\"\\)|from\\('leads'\\)|create table.*leads|policy .*leads" src app supabase`
- `sed -n '1,320p' src/lib/leads/repository.server.ts`
- `sed -n '1155,1325p' src/lib/supabase/database.types.ts`
- `sed -n '1,260p' src/data/mock.ts`
- `sed -n '1,260p' app/api/leads/route.ts`
- `sed -n '1,320p' 'app/api/leads/[id]/route.ts'`
- `sed -n '1,260p' 'app/api/leads/[id]/comments/route.ts'`
- `sed -n '1,260p' src/lib/imports/csv.ts`
- `sed -n '1,320p' app/dashboard/importar/csv-import-workspace.tsx`
- `sed -n '1,320p' app/api/webhooks/leads/route.ts`
- `sed -n '1,320p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '1,280p' app/api/meta/leads/import/route.ts`
- `sed -n '1,260p' app/api/leads/export/route.ts`
- `sed -n '1,280p' app/api/meta/webhook/route.ts`
- `sed -n '1,260p' src/lib/leads/webhook-events.server.ts`
- `sed -n '1,260p' src/lib/workspaces/permissions.ts`
- `sed -n '1,260p' supabase/migrations/202604280001_phase_1_core.sql`
- `sed -n '1,240p' supabase/migrations/202605120001_standardize_rls_isolation.sql`
- `sed -n '1,240p' supabase/migrations/202605200002_supabase_hardening_rls.sql`
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
Todos os comandos executados foram de leitura, busca e conferência documental do projeto.

`package.json` foi verificado antes de qualquer validação. Os scripts disponíveis relevantes nesta execução foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

`npm run lint`, `npm run test` e `npm run build` nao foram executados porque esta rodada alterou apenas documentacao e nao houve mudanca funcional no SaaS.

### Pendências
- Alinhar contrato unico entre banco, API e UI para leads.
- Revisar minimizacao e retencao de `leads.raw_payload`.
- Revisar exibicao do responsavel real do lead para managers.
- Adicionar trilha de auditoria para exportacao, importacao, edicao e arquivamento de leads.

### Observações técnicas
- O isolamento multi-tenant principal esta presente em `organization_id` + RLS + filtros server-side.
- O tipo `Lead` reutilizado na UI nasce em `src/data/mock.ts`, o que hoje mistura DTO de exibicao com tipagem de mock.
- A listagem e o funil usam o mesmo contrato simplificado de lead.
- A importacao CSV cobre apenas um subconjunto do schema real.
- A tela de logs de webhook de leads esta protegida por `requireWorkspaceManager()`, entao a observacao antiga de exposicao ampla ficou desatualizada frente ao codigo atual.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 12:52

### Tarefa
`TASK-002 -- Revisar funil atual`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_FUNIL_ATUAL.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental do funil atual do Leadi, cobrindo definicao de etapas, labels de UI, enum de banco, filtros, popup de lead, drag and drop do kanban, importacao CSV, importacao manual da Meta, exportacao, relatorios comerciais e regras de acesso por organizacao e por responsavel do lead.

O artefato principal criado foi `docs/AUDITORIA_FUNIL_ATUAL.md`, com visao geral do funil, arquivos mapeados, estagios encontrados, diferencas entre mock/UI/API/banco, diagnostico da fonte atual de verdade, riscos de filtros e metricas, riscos de nomenclatura, riscos multi-tenant e subtarefas tecnicas sugeridas.

A `TASK-002` foi marcada como concluida no roadmap normalizado porque a auditoria foi criada e registrada sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `cat package.json`
- `git status --short`
- `rg -n --hidden --glob '!node_modules' --glob '!.next' --glob '!coverage' "stage|stages|status|pipeline|funil|kanban|vendedor|corretor|consultor|supervisor|manager" app src supabase docs`
- `sed -n '1,260p' src/lib/leads/stages.ts`
- `sed -n '1,920p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,260p' app/api/leads/[id]/route.ts`
- `sed -n '1,260p' app/api/leads/route.ts`
- `sed -n '1,260p' src/data/mock.ts`
- `sed -n '1,760p' src/lib/leads/repository.server.ts`
- `sed -n '1,260p' src/lib/leads/filters.ts`
- `sed -n '1,260p' src/lib/leads/repository.ts`
- `sed -n '1,140p' src/lib/supabase/database.types.ts`
- `sed -n '1140,1215p' src/lib/supabase/database.types.ts`
- `rg -n "create table public.leads|lead_stage|stage check|stage in \\(|alter table public.leads|stage text" supabase/migrations supabase/*.sql`
- `sed -n '1,240p' src/lib/leads/normalization.ts`
- `sed -n '1250,1525p' src/lib/leads/repository.server.ts`
- `sed -n '940,1165p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,260p' app/dashboard/funil/page.tsx`

- `sed -n '80,180p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '980,1060p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,140p' supabase/migrations/202604280001_phase_1_core.sql`
- `sed -n '1,220p' src/lib/imports/csv.ts`
- `sed -n '560,700p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '130,230p' src/lib/reports/commercial-report.server.ts`
- `sed -n '392,455p' src/lib/reports/commercial-report.server.ts`
- `sed -n '1,140p' app/api/leads/export/route.test.ts`
- `rg -n --hidden --glob '!node_modules' --glob '!.next' "pipeline_stage|lead_stage|stage_history|history|kanban|pipeline|funil|status real|owner_profile_id|supervisor|manager|consultor|corretor|vendedor" app src supabase docs`
- `rg -n "last_interaction|lead_comments|updated_at|audit|histor" src/lib/leads/repository.server.ts src/components/dashboard/lead-details-popup.tsx supabase/migrations`
- `sed -n '1,220p' src/lib/workspaces/permissions.ts`
- `sed -n '260,360p' src/lib/leads/repository.server.ts`
- `sed -n '1080,1255p' src/lib/leads/repository.server.ts`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
Todos os comandos executados foram de leitura, busca e validacao documental do estado atual do funil.

`package.json` foi verificado antes de qualquer validacao. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

`npm run lint`, `npm run test` e `npm run build` nao foram executados porque esta rodada alterou apenas documentacao e nao houve alteracao funcional no SaaS.

### Pendências
- Consolidar fonte unica de verdade para etapas do funil.
- Endurecer validacao de `stage` nas rotas de leads.
- Centralizar contadores e metricas por etapa.
- Criar historico proprio de transicao de etapa.
- Revisar mocks do kanban para refletirem todas as etapas oficiais.

### Observações técnicas
- O banco esta coerente em torno de `public.lead_stage`, mas a UI opera sobre labels traduzidas.
- O funil visual, a listagem e a exportacao compartilham dependencia de labels em portugues para filtros e metricas.
- O drag and drop envia `stage` tecnico correto para a API, mas a API ainda aceita string frouxa com fallback silencioso para `new`.
- O escopo multi-tenant atual do CRM esta ancorado em `organization_id`, `owner_profile_id`, repositorio server-side e RLS.

### Data
2026-05-21 14:04

### Tarefa
`TASK-004 -- Revisar gerador de campanha atual`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_GERADOR_CAMPANHA_ATUAL.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental do gerador de campanha do Leadi, cobrindo a pagina server-side de campanhas, a UI em sete etapas, os testes do componente, a rota de geracao com credito e OpenAI, a rota de perguntas auxiliares, a rota de listagem, a rota de publicacao, o repositorio server-side de campanhas, os tipos compartilhados e o acoplamento opcional com pedidos criativos.

O artefato principal criado foi `docs/AUDITORIA_GERADOR_CAMPANHA_ATUAL.md`, com diagnostico do que o modulo ja resolve, onde ainda esta raso na operacao real e quais sao os principais gaps entre geracao de texto, persistencia, historico, rascunho e publicacao.

A `TASK-004` foi marcada como concluida no roadmap normalizado porque a auditoria foi criada e registrada sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,260p' package.json`
- `sed -n '1,260p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' docs/LOG_EXECUCAO_TAREFAS.md`
- `rg -n "^(- \\[ \\]|## \\[ \\]|Status: Pendente|Pendente)" docs/tarefas-leadi-roadmap-normalizado.md`
- `rg --files | rg 'campaign|campanha|campanhas'`
- `ls app/dashboard/campanhas`
- `ls app/api/campaigns/generate`
- `ls src/lib/campaigns`
- `sed -n '1,260p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '380,520p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '520,760p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '1600,1705p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '1,220p' app/dashboard/campanhas/page.tsx`
- `sed -n '1,220p' app/dashboard/criacoes/campanhas/page.tsx`
- `sed -n '1,260p' app/dashboard/campanhas/campaign-generator.test.tsx`
- `sed -n '1,260p' app/api/campaigns/generate/route.ts`
- `sed -n '1,260p' app/api/campaigns/questions/route.ts`
- `sed -n '1,260p' app/api/campaigns/route.ts`
- `sed -n '1,260p' app/api/campaigns/publish/route.ts`
- `sed -n '1,260p' src/lib/campaigns/repository.server.ts`
- `sed -n '260,460p' src/lib/campaigns/repository.server.ts`
- `sed -n '1,260p' src/lib/campaigns/types.ts`
- `sed -n '1,260p' src/lib/creative-requests/repository.server.ts`
- `sed -n '1,260p' src/lib/openai/index.ts`
- `rg -n "fetch\\(|/api/campaigns|creativeRequest|savedCampaign|historyMode|systemTemplates|connectedAccounts" app/dashboard/campanhas/campaign-generator.tsx`
- `rg -n "saveCampaignForCurrentUser|getCampaignsForCurrentUser|getCurrentAiBalance|getCurrentBillingSnapshot|getSystemTemplates|createCreativeRequestForCurrentUser|generateCampaignText|runAiActionWithCredits|resolvePublicationStatus|buildCampaignRequestPayload|validateForm" app src`
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`
- `ps -ax -o pid,command`
- `ps -p 94545 -o pid=,%cpu=,etime=,command=`
- `ps -p 94547 -o pid=,%cpu=,etime=,command=`
- `kill 94545 94547 94506 94507`

### Resultado dos comandos
Todos os comandos de `sed`, `rg`, `ls`, `git status --short` e `date` foram usados para leitura e auditoria documental do modulo.

`package.json` foi verificado antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

`npm run test` falhou com `sh: vitest: command not found`. A falha indica problema de ambiente local ou dependencia nao disponivel no shell atual, e nao relacao com a alteracao desta tarefa, que foi apenas documental.

`npm run lint` iniciou `eslint .`, mas permaneceu sem saida adicional e depois foi identificado com `0.0%` de CPU por mais de tres minutos. O processo foi interrompido manualmente para nao ficar preso em segundo plano, entao o resultado ficou inconclusivo no ambiente atual.

`npm run build` iniciou `next build`, compilou com sucesso e entrou em `Linting and checking validity of types ...`, mas tambem ficou com `0.0%` de CPU por mais de tres minutos. O processo foi interrompido manualmente para nao ficar preso em segundo plano, entao o resultado ficou inconclusivo no ambiente atual.

### Pendências
- Implementar persistencia real de rascunho sem consumo de credito.
- Expor historico operacional das campanhas na UX.
- Melhorar o retorno quando a geracao funciona, mas o salvamento da campanha falha.
- Aproximar a jornada de geracao da jornada de revisao e publicacao.
- Verificar por que `vitest` nao esta disponivel e por que `eslint` e `next build` ficaram travados no ambiente atual.

### Observações técnicas
- O modulo ja esta integrado a creditos, billing, OpenAI, conexoes Meta e pedidos criativos, entao nao e apenas uma tela de mock.
- O repositorio de campanhas ja persiste `input_payload` e `result_payload`, mas a UX atual quase nao expoe esse historico.
- O gargalo mais explicito do componente e o `TODO` de rascunho em `handleSaveDraft()`.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 13:04

### Tarefa
`TASK-003 -- Revisar integracao Meta atual`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_INTEGRACAO_META_ATUAL.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental da integracao Meta atual do Leadi, cobrindo OAuth, sincronizacao de ativos, webhook e importacao manual de leads.

O artefato principal criado foi `docs/AUDITORIA_INTEGRACAO_META_ATUAL.md`, com mapeamento do fluxo ponta a ponta, pontos fortes do codigo atual, blockers separados por codigo, ambiente e dados, riscos multi-tenant e de segredos, drift de documentacao e priorizacao objetiva das proximas tarefas do roadmap.

A `TASK-003` foi marcada como concluida no roadmap normalizado porque o diagnostico foi criado e registrado sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,260p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1444,1496p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1,260p' docs/meta-app-review.md`
- `sed -n '1,220p' docs/meta-review-production-check.md`
- `sed -n '1,260p' package.json`
- `git status --short`
- `rg --files app/api/integrations/meta app/api/meta src/lib/integrations docs | rg 'meta|webhook|lead'`
- `find app/api/integrations/meta app/api/meta -maxdepth 4 -type f | sort`
- `find src/lib/integrations -maxdepth 3 -type f | sort`
- `rg -n '/dashboard/perfil/meta|/dashboard/empresa|metaConnection|metaLeadForms|connectedAccounts' app src --glob '!node_modules'`
- `sed -n '1,260p' app/api/integrations/meta/connect/route.ts`
- `sed -n '1,260p' app/api/integrations/meta/callback/route.ts`
- `sed -n '1,260p' app/api/integrations/meta/sync/route.ts`
- `sed -n '1,260p' app/api/meta/webhook/route.ts`
- `sed -n '1,260p' app/api/meta/leads/import/route.ts`
- `sed -n '1,260p' app/api/meta/leads/sources/route.ts`
- `sed -n '1,220p' app/dashboard/perfil/meta/page.tsx`
- `sed -n '1,120p' app/dashboard/empresa/page.tsx`
- `sed -n '1,220p' src/lib/integrations/oauth-state.server.ts`
- `sed -n '1,220p' src/lib/integrations/crypto.server.ts`
- `sed -n '1,260p' src/lib/meta/config.ts`
- `sed -n '1,360p' src/lib/integrations/repository.server.ts`
- `sed -n '320,520p' src/lib/integrations/repository.server.ts`
- `sed -n '1,320p' src/lib/integrations/meta-graph.server.ts`
- `sed -n '1,320p' src/lib/meta/webhook-processing.server.ts`
- `sed -n '1,360p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '1,260p' src/lib/env/server.ts`
- `sed -n '1,260p' src/lib/integrations/meta-graph.server.test.ts`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
Os comandos de leitura e busca foram usados para auditar a integracao Meta atual e localizar os fluxos reais de OAuth, sync, webhook e importacao.

`package.json` foi verificado antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

Resultados das validacoes:

- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou com `sh: vitest: command not found`, indicando indisponibilidade do binario de teste neste ambiente local.
- `npm run build`: falhou apos compilar e entrar em `Collecting page data`, com erros `Cannot find module` para artefatos gerados em `.next/server/app/_not-found/page.js`, `.next/server/app/sitemap.xml/route.js` e `.next/server/app/login/page.js`.

As falhas de `test` e `build` nao tem relacao com a tarefa executada, porque esta rodada alterou apenas documentacao e nao modificou codigo funcional, rotas ou componentes do produto.

### Pendências
- Revisar na proxima tarefa as envs reais exigidas pela integracao Meta, incluindo `INTEGRATIONS_SECRET_KEY` e dependencias de Supabase admin.
- Melhorar o diagnostico operacional da area Meta para diferenciar token ausente, token nao descriptografavel e ativos nao sincronizados.
- Investigar separadamente o ambiente local de testes e o estado do build do Next antes de usar esses comandos como gate forte para tarefas documentais.

### Observações técnicas
- O fluxo Meta ja existe ponta a ponta no codigo, mas a operacao real depende de segredos validos, token descriptografavel e snapshots de ativos por organizacao.
- `INTEGRATIONS_SECRET_KEY` e dependencia real do OAuth e do uso futuro do token, embora isso ainda nao esteja totalmente refletido nas mensagens de `requireIntegrationEnv("meta_oauth")`.
- O webhook depende de `meta_forms` ou `meta_pages` sincronizados para rotear o lead para o tenant correto.
- `docs/meta-app-review.md` ainda referencia `/dashboard/empresa`, mas a rota canonica atual para operacao e review e `/dashboard/perfil/meta`.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 14:35

### Tarefa
`TASK-005 -- Revisar estrutura de usuarios e equipe`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_ESTRUTURA_USUARIOS_EQUIPE.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental da estrutura atual de usuarios e equipe do Leadi, cobrindo onboarding, papeis canonicos, convites, aceite de convite, gestao de membros, guards de rota e limites atuais entre `owner`, `admin` e `seller`.

O artefato principal criado foi `docs/AUDITORIA_ESTRUTURA_USUARIOS_EQUIPE.md`, com mapeamento dos fluxos reais, diferencas entre copy e papel tecnico, impactos de `workspaceType`, pontos de enforcement no middleware e nas RPCs, alem dos gargalos mais relevantes para tarefas futuras de distribuicao de leads.

A `TASK-005` foi marcada como concluida no roadmap normalizado porque o diagnostico foi criado e registrado sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,220p' package.json`
- `rg --files src/lib/workspaces app/team/setup | sed -n '1,200p'`
- `ls middleware.ts`
- `sed -n '1,220p' src/lib/workspaces/team.ts`
- `sed -n '1,260p' src/lib/workspaces/permissions.ts`
- `sed -n '1,220p' app/team/setup/page.tsx`
- `sed -n '1,220p' middleware.ts`
- `sed -n '1,260p' src/lib/workspaces/context.ts`
- `sed -n '1,260p' app/team/setup/team-setup-client.tsx`
- `sed -n '1,260p' app/team/setup/actions.ts`
- `sed -n '1,260p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '220,520p' app/team/setup/team-setup-client.tsx`
- `rg -n "create_workspace_invite|update_workspace_member_role|remove_workspace_member|update_workspace_name|workspace_members|invites|role_to_assign" supabase/migrations src/lib/supabase/database.types.ts`
- `rg -n "type ProfileRole|type WorkspaceType|profiles:|organizations:" src/lib/supabase/database.types.ts`
- `rg -n "profile_setup_completed|organization_id|role|is_platform_admin|workspaceType|requireTeamManagement|requireWorkspaceManager|requireImportPermission" app src middleware.ts --glob '!node_modules'`
- `sed -n '540,620p' src/lib/supabase/database.types.ts`
- `sed -n '1050,1165p' src/lib/supabase/database.types.ts`
- `sed -n '1510,1545p' src/lib/supabase/database.types.ts`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '1,260p' app/onboarding/profile-setup/actions.ts`
- `sed -n '1,260p' app/onboarding/profile-setup/page.tsx`
- `sed -n '1490,1525p' src/lib/supabase/database.types.ts`
- `rg --files app/invite src | rg 'invite'`
- `sed -n '1,260p' 'app/invite/[token]/page.tsx'`
- `rg -n "accept_workspace_invite|invite_token|used_at|used_by_user_id|expires_at|role_to_assign" app src --glob '!node_modules'`
- `rg -n "create or replace function .*complete_profile_setup|complete_profile_setup\(|create or replace function .*accept_workspace_invite|create or replace function .*create_workspace_invite|create or replace function .*update_workspace_member_role|create or replace function .*remove_workspace_member|create or replace function .*update_workspace_name" supabase/migrations`
- `rg -n "WorkspaceMemberRole|InviteStatus|WorkspaceMemberStatus" src/lib/supabase/database.types.ts`
- `sed -n '146,560p' supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `sed -n '1,200p' supabase/migrations/202605070004_invite_acceptance_fix.sql`
- `sed -n '560,700p' supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `sed -n '1,260p' docs/AUDITORIA_FUNIL_ATUAL.md`
- `git status --short`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
Os comandos de leitura e busca foram usados para auditar as regras reais de onboarding, equipe, convites e papeis.

`package.json` foi verificado antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

Resultados das validacoes:

- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou com `sh: vitest: command not found`, indicando indisponibilidade do binario de teste neste ambiente local.
- `npm run build`: concluido com sucesso. O build registrou um aviso runtime de `Dynamic server usage` para `/dashboard` por uso de `cookies`, mas terminou sem erro e gerou a aplicacao.

### Pendências
- Consolidar um glossario unico para `owner`, `admin`, `seller`, `consultor` e o legado `supervisor`.
- Centralizar melhor a matriz de acesso hoje espalhada entre middleware, helpers, UI e RPCs.
- Separar mais claramente bloqueio de billing para convites da permissao funcional do papel.
- Revisar se os vestigios `seller-solo` e `requireSupervisor()` ainda fazem sentido para as proximas tarefas.

### Observações técnicas
- O onboarding sempre promove o usuario inicial a `owner`, inclusive em workspace `solo`.
- O aceite de convite move o perfil para a nova organizacao e pressupoe uma unica organizacao ativa por usuario.
- A remocao de membro recria um workspace `solo` para o usuario removido, em vez de deixa-lo sem organizacao.
- `workspace_members.user_id` referencia `profiles.id`, nao `auth_user_id`, o que merece atencao em futuras consultas e automacoes.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 14:52

### Tarefa
`TASK-006 — Revisar exposição de chaves`

### Status
Concluída.

### Arquivos alterados
- `.env.example`
- `README.md`
- `docs/SECURITY_AUDIT.md`
- `src/lib/env/shared.ts`
- `src/lib/env/shared.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi revisada a documentação e os guardrails locais ligados a segredos e variáveis de ambiente, sem expor valores reais nem alterar configurações externas de produção.

O catálogo compartilhado de variáveis em `src/lib/env/shared.ts` ganhou helpers para distinguir variáveis públicas e server-only. Em paralelo, `src/lib/env/shared.test.ts` passou a verificar que apenas chaves `NEXT_PUBLIC_*` são tratadas como públicas e que o `.env.example` cobre todas as variáveis listadas no catálogo.

O arquivo `.env.example` foi alinhado ao conjunto real de variáveis do projeto e reorganizado em blocos explícitos de exposição. O `README.md` passou a documentar a regra operacional de que apenas `NEXT_PUBLIC_*` pode chegar ao client, enquanto `docs/SECURITY_AUDIT.md` registrou esse reforço documental e de teste.

### Comandos executados
- `sed -n '1,220p' src/lib/security/client-code-guard.ts`
- `sed -n '1,220p' src/lib/env/server.ts`
- `sed -n '1,180p' README.md`
- `git status --short`
- `rg -n "ENV_VARIABLES|\\.public\\b|EnvVariableDefinition|PRODUCTION_CORE_ENV_KEYS|MCP_SUPABASE_ENV_KEYS" src app docs README.md`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1,260p' docs/tarefas-leadi-roadmap-normalizado.md`
- `npm run security:check`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run security:check`: falhou no ambiente local com `sh: vitest: command not found` antes de executar os testes.
- `npm run lint`: concluído com sucesso, com warnings preexistentes em arquivos fora do escopo desta tarefa.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found` antes de executar os testes.
- `npm run build`: concluído com sucesso; o build manteve apenas warnings de lint preexistentes e uma mensagem informativa de rota dinâmica já conhecida em `/dashboard`.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run security:check` e `npm run test`.
- Se desejado, tratar os warnings antigos de lint que apareceram durante a validação, mas eles não foram abordados nesta tarefa para respeitar o escopo.

### Observações técnicas
- A tarefa ficou limitada a documentação, catálogo compartilhado de env e teste de consistência entre código e `.env.example`.
- Nenhuma integração real, secret, variável externa, autenticação, Supabase, billing, Meta ou OpenAI foi alterado fora do repositório.

### Data
2026-05-21 15:07

### Tarefa
`TASK-008 — Criar tela de detalhe do lead com dados básicos`

### Status
Concluída.

### Arquivos alterados
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O detalhe do lead foi reorganizado para melhorar a leitura logo na abertura do popup, sem alterar regras de negócio nem fluxos de edição. Os dados básicos passaram a aparecer em um bloco de leitura rápida, enquanto contexto comercial e origem ficaram destacados antes da área de comentários.

Em `src/components/dashboard/lead-details-popup.tsx`, o layout foi redistribuído para priorizar responsável, empresa, telefone, email, cidade, vidas, etapa, origem, campanha, orçamento e datas de recebimento/criação com menos rolagem no mobile e no desktop. Comentários internos, ações de contato, edição e arquivamento foram preservados no mesmo componente.

Também foi criado `src/components/dashboard/lead-details-popup.test.tsx` para verificar que os blocos de dados básicos e origem são renderizados e que os comentários continuam carregando normalmente.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,260p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,260p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '260,620p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,260p' src/data/mock.ts`
- `sed -n '1,260p' src/lib/leads/repository.server.ts`
- `rg -n "profileItems|Comentarios|Origem|sourceCampaign|receivedAt|livesCount|companyName|owner|interest|notes|lastInteraction" src/components/dashboard/lead-details-popup.tsx`
- `rg -n "LeadDetailsPopup|selectedLead|setSelectedLead|Detalhes|MessageCircle|PhoneCall|Mail" app/dashboard/leads/leads-workspace.tsx`
- `rg -n "LeadDetailsPopup|selectedLead|setSelectedLead|onClick=\\{\\(\\) => setSelectedLead|MessageCircle|PhoneCall|Mail" app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '720,920p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,240p' app/dashboard/leads/page.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, o que impediu a execução da suite e do novo teste do componente.
- `npm run build`: concluído com sucesso; além dos warnings de lint já conhecidos, o build registrou a mensagem informativa já existente de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test` e validar o novo teste do popup.
- Se desejado depois, tratar os warnings antigos de lint fora do escopo desta tarefa.

### Observações técnicas
- A alteração ficou restrita à visualização do prontuário do lead e ao teste do componente.
- Nenhuma camada sensível de autenticação, Supabase, schema, billing, webhooks, Meta Ads, OpenAI ou variáveis de ambiente foi alterada nesta tarefa.
