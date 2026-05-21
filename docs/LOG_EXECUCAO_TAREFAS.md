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
