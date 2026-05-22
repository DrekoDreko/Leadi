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
2026-05-21 23:43

### Tarefa
`TASK-025 — Mostrar campanhas ativas`

### Status
Parcial.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/campaigns/repository.server.ts`
- `src/lib/campaigns/types.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao dashboard um indicador operacional para campanhas ativas ou prontas, alimentado por um novo resumo server-side de campanhas da organizacao atual.

O repositório de campanhas passou a calcular contagens de campanhas publicadas, prontas para a proxima acao e pausadas com base em `publication_status` e `publish_mode`, preservando o filtro multi-tenant por `organization_id`.

Na interface, a lateral do dashboard agora exibe um card dedicado com contagem consolidada e lista curta das campanhas mais recentes em operacao, sem alterar publicacao real, billing, Meta Ads ou metricas financeiras.

Tambem foram atualizados os testes do dashboard para cobrir a passagem do resumo operacional e a renderizacao do novo bloco.

### Comandos executados
- `git status --short`
- `rg -n "publicationStatus|publishMode|pending_review|ready_to_prepare|draft_created|published|paused" app/dashboard src/lib/campaigns -g'*.ts' -g'*.tsx'`
- `sed -n '260,520p' src/lib/campaigns/repository.server.ts`
- `git diff -- app/dashboard/dashboard-home.tsx`
- `git diff -- app/dashboard/page.tsx`
- `git diff -- app/dashboard/page.test.tsx`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1,120p' app/dashboard/page.tsx`
- `sed -n '1,120p' app/dashboard/page.test.tsx`
- `sed -n '1,220p' app/dashboard/dashboard-home.tsx`
- `sed -n '220,420p' app/dashboard/dashboard-home.tsx`
- `sed -n '420,520p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,240p' src/lib/campaigns/repository.server.ts`
- `sed -n '240,520p' src/lib/campaigns/repository.server.ts`
- `sed -n '1,220p' src/lib/campaigns/types.ts`
- `sed -n '1,220p' app/dashboard/dashboard-home.test.tsx`
- `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`, sem indicio de regressao especifica da `TASK-025`.

`npm run build` iniciou normalmente e chegou em `Creating an optimized production build ...`, mas nao concluiu nem retornou saida adicional dentro da janela de monitoramento desta execucao, entao o resultado ficou inconclusivo no ambiente atual.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar os testes.
- Reexecutar `npm run build` ate a conclusao para confirmar a validacao final da tarefa.
- Somente depois dessas validacoes a `TASK-025` deve ser marcada como concluida no roadmap.

### Observações técnicas
- Esta rodada foi mantida fora de areas sensiveis de Meta Ads, billing, webhooks, autenticação e variaveis de ambiente.
- Havia alteracoes locais preexistentes no dashboard relacionadas a outras tarefas; a implementacao da `TASK-025` foi encaixada sem reverter essas mudancas.

### Data
2026-05-21 23:22

### Tarefa
`TASK-022 — Mostrar novos leads`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/dashboard-home.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao dashboard principal uma nova metrica operacional de `Novos leads`, mantendo o conjunto anterior de indicadores e preservando o layout principal da tela.

O calculo passou a considerar leads recebidos nos ultimos sete dias por `receivedAt`, e a nota operacional do card informa quantos desses leads ainda estao na etapa `Novo lead` com base no `stage` atual. A mesma normalizacao de etapas do projeto passou a ser usada tambem nas metricas de propostas, vendas e leads ativos para evitar inconsistencias entre labels e valores tecnicos.

Tambem foi criado um teste unitario focado na regra de calculo dessa metrica para cobrir o recorte temporal e a leitura da etapa atual sem depender da renderizacao completa da tela.

### Comandos executados
- `sed -n '1,220p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `rg -n "TASK-022|^- \\[ \\]|^## \\[ \\]|Pendente" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '730,810p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '810,860p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,260p' src/components/dashboard/widgets.tsx`
- `sed -n '1,240p' app/dashboard/page.tsx`
- `sed -n '1,240p' src/lib/leads/stages.ts`
- `sed -n '1028,1082p' docs/tarefas-leadi-roadmap.md`
- `npm run test -- app/dashboard/dashboard-home.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`.

`npm run lint` concluiu com sucesso e reportou apenas warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O processo repetiu os mesmos warnings de lint fora do escopo e exibiu a mensagem informativa de `Dynamic server usage` para `/dashboard`, sem impedir a compilacao final.

`npm run test -- app/dashboard/dashboard-home.test.ts` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`, indicando indisponibilidade do binario de testes nesta maquina.

O script `npm run typecheck` nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar a suite e validar o teste novo automaticamente.

### Observações técnicas
- A tarefa nao alterou autenticacao, Supabase, schema, billing, webhooks, integracoes externas ou variaveis de ambiente.
- O ajuste ficou concentrado no dashboard e em teste unitario de regra de negocio leve.

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

### Data
2026-05-21 17:15

### Tarefa
`TASK-009 — Adicionar histórico manual de contato`

### Status
Concluída.

### Arquivos alterados
- `src/lib/leads/comments.ts`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/[id]/comments/route.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada a funcionalidade de registrar interações manuais de contato no prontuário do lead. 
Sem alterar o schema do Supabase, o backend foi ajustado para utilizar um prefixo interno (`[CONTACT_LOG]`) na coluna `body` da tabela de `lead_comments`, permitindo diferenciar os tipos (`comment` vs `contact`). A API e a UI foram atualizadas para expor essa distinção, adicionando um seletor visual na hora do registro e um destaque com o selo "Contato" na listagem de comentários.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes fora do escopo desta tarefa.
- `npm run build`: concluído com sucesso. O build registrou a mensagem informativa já existente de `Dynamic server usage` em `/dashboard`, sem bloquear a geração final.

### Pendências
- Nenhuma.

### Observações técnicas
- A abordagem do prefixo (`[CONTACT_LOG]`) atendeu aos requisitos sem precisar alterar o banco de dados (que é uma área sensível).

### Data
2026-05-21 17:18

### Tarefa
`TASK-010 — Adicionar tarefas por lead`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210004_lead_tasks.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada a base de tarefas operacionais por lead sem reaproveitar `dashboard_reminders`. A migration nova adiciona a tabela `public.lead_tasks`, enums de status e prioridade, índices, trigger de `updated_at` e policies de RLS alinhadas ao isolamento por organização e ao vínculo obrigatório com `leads`.

Em `src/lib/supabase/database.types.ts`, a tipagem compartilhada passou a refletir a nova entidade e seus enums. Em `src/lib/leads/repository.server.ts`, foram adicionados contratos mínimos para listar, criar e atualizar tarefas por lead, com validação de título, prazo, prioridade, responsável e controle de permissão por perfil, além de fallback mock para ambientes sem Supabase configurado.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `rg -n "\[ \]|Status: Pendente|## \[ \]" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '320,620p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' package.json`
- `rg --files supabase/migrations src/lib/supabase src/lib/leads | rg "repository\.server|database\.types|migrations"`
- `rg -n "dashboard_reminders|lead task|lead_tasks|taska|tarefa" src app supabase`
- `sed -n '1,280p' src/lib/leads/repository.server.ts`
- `sed -n '1,240p' supabase/migrations/202605140002_dashboard_reminders.sql`
- `sed -n '1,260p' src/lib/dashboard-reminders/repository.server.ts`
- `sed -n '240,420p' src/lib/supabase/database.types.ts`
- `sed -n '1,260p' supabase/migrations/202605060002_lead_comments.sql`
- `sed -n '430,620p' src/lib/supabase/database.types.ts`
- `sed -n '300,430p' docs/tarefas-leadi-roadmap.md`
- `git status --short`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.
- Expor essa nova base em API e UI futuras sem misturar a entidade com `dashboard_reminders`.

### Observações técnicas
- A modelagem nova mantém a separação entre tarefa operacional por lead e lembrete de calendário do dashboard.
- A migration mexe em banco, multi-tenant, permissões e dados de leads, mas ficou restrita ao escopo mínimo pedido pela tarefa.
- O repositório já deixa a base pronta para fluxos futuros de UI/dashboard sem alterar autenticação, billing, integrações Meta, OpenAI ou variáveis de ambiente.

### Data
2026-05-21 17:59

### Tarefa
`TASK-011 — Adicionar status do funil ao prontuário`

### Status
Concluída.

### Arquivos alterados
- `src/lib/leads/stages.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi centralizado o metadado da etapa comercial do lead em `src/lib/leads/stages.ts`, adicionando descrição, tom visual e normalização para aceitar tanto o `value` técnico quanto o label exibido na UI.

No prontuário, `src/components/dashboard/lead-details-popup.tsx` passou a destacar a etapa atual com badge e bloco próprio dentro do contexto comercial, além de reaproveitar a nomenclatura compartilhada no cabeçalho, no resumo de origem e no modo de edição. Em `app/dashboard/funil/sales-funnel-workspace.tsx`, os indicadores resumidos deixaram de comparar labels hardcoded e passaram a usar os values compartilhados, reduzindo drift entre CRM e funil. A cobertura de teste do popup foi ampliada para validar esse destaque e a normalização de etapa.

### Comandos executados
- `git status --short`
- `sed -n '1,220p' package.json`
- `sed -n '1,240p' src/lib/leads/stages.ts`
- `sed -n '1,120p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '400,760p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '760,1125p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1180,1265p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,120p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '120,220p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '780,860p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,220p' src/components/dashboard/lead-details-popup.test.tsx`
- `rg -n "stage|etapa|pipeline" src/lib/leads/stages.ts src/components/dashboard/lead-details-popup.tsx app/dashboard/funil/sales-funnel-workspace.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa permaneceu restrita à UI e aos helpers de etapa, sem alterar banco, autenticação, Supabase, billing, Meta Ads, OpenAI ou variáveis de ambiente.
- A normalização compartilhada reduz o risco de drift entre labels em português e values técnicos nas telas que consomem `lead.stage`.

### Data
2026-05-21 18:18

### Tarefa
`TASK-012 — Adicionar motivo de perda`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210005_add_lead_loss_reason.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `src/data/mock.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado o campo opcional `loss_reason` ao schema de leads por meio de uma migration pequena e compatível, com reflexo nos tipos compartilhados do Supabase e no contrato server-side do repositório de leads.

As rotas `app/api/leads/route.ts` e `app/api/leads/[id]/route.ts` passaram a aceitar o novo campo no CRUD, enquanto `src/lib/leads/repository.server.ts` ficou responsável por persistir o motivo apenas quando a etapa efetiva do lead é `lost`, limpando o valor quando a etapa não representa perda.

No prontuário, `src/components/dashboard/lead-details-popup.tsx` passou a mostrar um bloco de "Motivo de perda" somente para leads perdidos e a liberar a edição desse texto no modo de edição apenas nesse contexto. A cobertura de `src/components/dashboard/lead-details-popup.test.tsx` foi ampliada para verificar a exibição e edição condicional do motivo.

### Comandos executados
- `sed -n '1,260p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `ls supabase/migrations | tail -n 20`
- `rg -n "loss_reason|archiveReason|lastInteraction|mapLeadRowToLead|type LeadCreateInput" src/lib/leads/repository.server.ts src/data/mock.ts src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '740,940p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,220p' src/lib/leads/normalization.ts`
- `sed -n '1,220p' supabase/migrations/202605210003_add_commercial_lead_fields.sql`
- `sed -n '1400,1465p' src/lib/leads/repository.server.ts`
- `rg -n "source_campaign|archive_reason|duplicate_of_lead_id|loss_reason" app src | head -n 80`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '421,455p' docs/tarefas-leadi-roadmap-normalizado.md`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`
- `git status --short`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.
- Se a próxima tarefa aproveitar a etapa `lost`, vale considerar relatórios ou filtros futuros baseados em `loss_reason`, sem expandir o escopo agora.

### Observações técnicas
- A tarefa tocou banco, API de leads e dados operacionais, mas ficou restrita ao campo novo e ao prontuário do lead.
- O comportamento foi mantido compatível com o restante do CRM: leads não perdidos não exibem nem exigem motivo de perda.
- O worktree já continha alterações anteriores não relacionadas em outros arquivos; elas foram preservadas e não foram revertidas.

### Data
2026-05-21 18:38

### Tarefa
`TASK-013 — Adicionar qualidade do lead`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210006_add_lead_quality.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/normalization.ts`
- `src/lib/leads/repository.server.ts`
- `src/lib/leads/quality.ts`
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `app/api/leads/route.test.ts`
- `app/api/leads/[id]/route.test.ts`
- `src/data/mock.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao schema de leads o campo opcional `quality`, com validacao simples para os valores `high`, `medium` e `low`, preservando o objetivo da tarefa de criar uma classificacao comercial leve sem reintroduzir o score antigo.

O repositório de leads, os tipos compartilhados do Supabase, os fallbacks mock e as rotas `app/api/leads/route.ts` e `app/api/leads/[id]/route.ts` passaram a aceitar, normalizar e persistir essa classificacao. A nova camada compartilhada `src/lib/leads/quality.ts` centralizou labels e metadados usados pela interface.

Na UI, a listagem em `app/dashboard/leads/leads-workspace.tsx` passou a mostrar um badge de qualidade na linha de cada lead, enquanto `src/components/dashboard/lead-details-popup.tsx` passou a exibir esse indicador no prontuário e permitir sua edicao direta no formulario do lead. Os testes de rota e do popup foram ajustados para cobrir o novo campo.

### Comandos executados
- `rg -n "visibleLeads|selectedLead|lead\\.stage|lead\\.source|render.*lead|map\\(.*lead|quality|qualidade" app/dashboard/leads/leads-workspace.tsx src/components/dashboard/lead-details-popup.tsx src/lib/leads/repository.server.ts src/data/mock.ts`
- `sed -n '260,620p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '620,980p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1540,1915p' src/lib/leads/repository.server.ts`
- `rg -n "loss_reason|lead_quality|quality" src/lib/supabase/database.types.ts supabase/migrations`
- `sed -n '1,220p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '1320,1495p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,220p' app/api/leads/route.test.ts`
- `rg -n "handleSubmit|updateField\\(|validateLeadEditValues|buildLeadUpdatePayload|getLeadEditValues|profileItems|sourceItems" src/components/dashboard/lead-details-popup.tsx`
- `sed -n '220,620p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1040,1185p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,220p' src/lib/leads/normalization.ts`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '430,505p' docs/tarefas-leadi-roadmap-normalizado.md`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `git status --short`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa tocou banco e dados de leads, mas ficou restrita à classificação comercial simples solicitada, sem alterar autenticação, billing, Meta Ads, OpenAI ou variáveis de ambiente.
- O worktree já continha alterações anteriores não relacionadas em outros arquivos; elas foram preservadas e não foram revertidas.

### Data
2026-05-21 19:13

### Tarefa
`TASK-014 — Vincular lead à campanha, anúncio e formulário`

### Status
Concluída.

### Arquivos alterados
- `src/data/mock.ts`
- `src/lib/leads/repository.server.ts`
- `src/lib/leads/source.ts`
- `src/lib/leads/source.test.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma camada compartilhada de leitura da origem do lead em `src/lib/leads/source.ts`, centralizando classificacao da origem, descricao funcional para o popup, resumo compacto para a listagem e consolidacao de campanha, conjunto, anuncio e formulario com fallback para IDs Meta quando os nomes nao estiverem disponiveis.

O contrato `Lead` e o mapeamento em `src/lib/leads/repository.server.ts` passaram a preservar tambem `metaCampaignId`, `metaAdsetId` e `metaAdId`, evitando descarte desses identificadores na passagem do banco para a UI. Os mocks foram enriquecidos para refletir esse caminho completo de origem.

Na interface, `app/dashboard/leads/leads-workspace.tsx` passou a diferenciar visualmente origem manual, CSV e Meta por badge e resumo curto na linha do lead. Em `src/components/dashboard/lead-details-popup.tsx`, o bloco de origem agora mostra campanha, conjunto, anuncio e formulario quando houver dados, sem reimplementar a integracao Meta nem alterar os contratos de ingestao.

### Comandos executados
- `rg -n "sourceAdset|sourceAd|metaCampaignId|metaAdId|metaFormId|metaPageId|metaConnectedAccountId|sourceCampaign" src app`
- `sed -n '200,520p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '220,420p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,260p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1,260p' app/api/leads/route.test.ts`
- `sed -n '1,320p' 'app/api/leads/[id]/route.test.ts'`
- `sed -n '1,220p' app/api/leads/export/route.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa permaneceu restrita a dados de leads e rastreabilidade da Meta, sem alterar autenticação, Supabase schema, billing, Mercado Pago, OpenAI, webhooks ou variáveis de ambiente.
- O worktree já continha alterações anteriores não relacionadas em outros arquivos; elas foram preservadas e não foram revertidas.

### Data
2026-05-21 19:59

### Tarefa
`TASK-015 — Criar botão de WhatsApp com mensagem pronta`

### Status
Concluida.

### Arquivos alterados
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado um CTA de WhatsApp no detalhe do lead para abrir o `wa.me` com mensagem inicial preenchida a partir do nome, interesse e empresa do lead.

O link passou a reaproveitar o telefone normalizado do CRM, abrindo em nova aba quando houver telefone valido e permanecendo visualmente desabilitado quando o lead nao tiver telefone utilizavel.

O fluxo existente de ligacao, email e geracao de mensagem com IA foi preservado sem alterar integracoes externas nem criar envio dentro do produto.

Tambem foram adicionados testes do popup para cobrir o link com mensagem pronta e o estado desabilitado sem telefone valido.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,220p' package.json`
- `rg -n "comments/route|lead-details-popup|comment|interaction|contact" src app | head -n 200`
- `sed -n '1,260p' src/components/dashboard/lead-details-popup.tsx`
- `rg -n "whatsapp|wa.me|api/whatsapp|formatPhone|normalizePhone|phone" src app | head -n 240`
- `sed -n '1,220p' src/lib/whatsapp/templates.ts`
- `sed -n '430,580p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,180p' src/lib/leads/normalization.ts`
- `sed -n '1,180p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '1328,1368p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,120p' src/data/mock.ts`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`
- `sed -n '540,620p' docs/tarefas-leadi-roadmap-normalizado.md`
- `git diff -- src/components/dashboard/lead-details-popup.tsx src/components/dashboard/lead-details-popup.test.tsx`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- O CTA de WhatsApp foi implementado apenas na camada de UI do prontuario do lead, sem alterar `app/api/whatsapp/*`, billing de creditos, OpenAI, webhooks ou variaveis de ambiente.
- O worktree ja continha alteracoes anteriores nao relacionadas em outros arquivos; elas foram preservadas e nao foram revertidas.

### Data
2026-05-21 22:34

### Tarefa
`TASK-016 — Criar botão para gerar mensagem com IA`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/page.tsx`
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/funil/page.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/funil/page.test.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi habilitado o mesmo atalho de geracao de mensagem com IA do prontuario do lead quando o `LeadDetailsPopup` e aberto a partir do dashboard inicial e do funil comercial.

As paginas de dashboard e funil passaram a carregar e repassar os templates de WhatsApp para o popup, junto com o saldo atual de IA, reaproveitando o fluxo ja existente sem criar endpoint novo nem duplicar consumo de creditos.

Tambem foram adicionados testes para validar o repasse dos templates ao dashboard e ao funil, alem de uma cobertura direta do popup para garantir a exibicao do atalho de IA quando o gerador estiver habilitado.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' package.json`
- `rg -n "Status: Pendente|## \\[ \\]|- \\[ \\]" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '540,610p' docs/tarefas-leadi-roadmap-normalizado.md`
- `rg -n "LeadDetailsPopup|messageGeneratorEnabled|initialPanel=|whatsappTemplates" app src -g '!src/lib/supabase/database.types.ts'`
- `sed -n '1,240p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '210,250p' app/dashboard/dashboard-home.tsx`
- `sed -n '520,575p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,180p' app/dashboard/funil/page.tsx`
- `sed -n '1,120p' app/dashboard/page.tsx`
- `git diff -- app/dashboard/funil/page.tsx app/dashboard/funil/sales-funnel-workspace.tsx app/dashboard/page.tsx app/dashboard/dashboard-home.tsx app/dashboard/page.test.tsx app/dashboard/funil/page.test.tsx src/components/dashboard/lead-details-popup.test.tsx`
- `git status --short`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '571,610p' docs/tarefas-leadi-roadmap-normalizado.md`
- `tail -n 60 docs/LOG_EXECUCAO_TAREFAS.md`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa ficou restrita a UI server/client do prontuario e ao carregamento de templates, sem alterar `app/api/whatsapp/generate/route.ts`, billing de creditos, OpenAI, webhooks, Supabase schema ou variaveis de ambiente.
- O worktree ja continha alteracoes anteriores nao relacionadas em outros arquivos; elas foram preservadas e nao foram revertidas.

### Data
2026-05-21 23:08

### Tarefa
`TASK-018 — Permitir mover lead entre etapas com feedback claro`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A lógica de atualização otimista durante o drag and drop no funil de vendas foi refinada. A variável de estado simples `updatingLeadId` foi substituída por `updatingLeadIds` (um `Set<string>`). Isso permite que múltiplos cards de lead sejam movidos e tenham seu feedback otimista e spinner de carregamento geridos individualmente e de forma concorrente sem perder o estado caso outro lead seja movido simultaneamente. O rollback continuou operando com a restauração baseada na etapa prévia.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes fora do escopo desta tarefa.
- `npm run build`: concluído com sucesso. O build registrou a mensagem informativa já existente de `Dynamic server usage` em `/dashboard`, sem bloquear a geração final.

### Pendências
- Nenhuma.

### Observações técnicas
- A API (`app/api/leads/[id]/route.ts`) já possuía o tratamento correto e retorno amigável de erro de rollback, então a correção ficou isolada no frontend do funil.

### Data
2026-05-21 23:09

### Tarefa
`TASK-017 — Padronizar etapas do funil`

### Status
Concluida.

### Arquivos alterados
- `src/lib/leads/stages.ts`
- `src/lib/leads/filters.ts`
- `src/lib/leads/repository.server.ts`
- `src/lib/reports/commercial-report.server.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/lib/leads/stages.test.ts`
- `src/lib/leads/filters.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma fonte compartilhada para ordem, labels e significado das etapas comerciais em `src/lib/leads/stages.ts`, incluindo helpers reutilizaveis para normalizar `value` tecnico e label comercial sem drift.

O CRM passou a usar essa fonte unica nas metricas, badges e filtros, inclusive quando o lead chega com etapa tecnica em vez da label exibida.

O funil passou a usar as mesmas descricoes centrais nas colunas e metricas, e os relatorios comerciais passaram a contar vendas e etapas qualificadas com os mesmos helpers compartilhados.

Tambem foram adicionados testes unitarios para cobrir a ordem oficial das etapas e a compatibilidade entre filtros do CRM e `values` tecnicos.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' src/lib/leads/stages.ts`
- `sed -n '1,260p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,260p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,260p' src/lib/reports/commercial-report.server.ts`
- `rg -n 'Novo lead|Qualificação|Proposta|Negociação|Venda|Perdido|stage === "new"|stage === "qualification"|stage === "proposal"|stage === "negotiation"|stage === "won"|stage === "lost"|getLeadStageLabel|leadStageOptions|leadStageFilterOptions' src app --glob '!**/.next/**'`
- `sed -n '1,240p' src/lib/leads/filters.ts`
- `git diff -- app/dashboard/funil/sales-funnel-workspace.tsx`
- `git diff -- app/dashboard/leads/leads-workspace.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa ficou restrita a CRM, funil e relatorios, sem alterar enum do banco, migrations, schema do Supabase, billing, OpenAI, Meta Ads, webhooks ou variaveis de ambiente.
- O worktree ja continha alteracoes anteriores nao relacionadas em `src/components/dashboard/shell.tsx`, `src/components/dashboard/shell.test.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/leads/leads-workspace.tsx`, `docs/tarefas-leadi-roadmap-normalizado.md` e `docs/LOG_EXECUCAO_TAREFAS.md`; elas foram preservadas e nao foram revertidas.

### Data
2026-05-22 02:15

### Tarefa
`TASK-019 — Salvar histórico da mudança de etapa`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210007_lead_stage_history.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada a tabela `lead_stage_history` via migration para salvar as transições de etapa de leads no funil, preservando o histórico de quem realizou a mudança e a etapa de origem e destino.
A tipagem do Supabase (`src/lib/supabase/database.types.ts`) foi atualizada.
Em `src/lib/leads/repository.server.ts`, a função `updateLeadForCurrentUser` foi ajustada para registrar uma nova entrada no histórico sempre que a etapa do lead for modificada, garantindo rastreabilidade silenciosa das alterações realizadas pela interface de drag and drop ou de edição de detalhes.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, mantendo os warnings preexistentes.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo problema de ambiente já registrado anteriormente.
- `npm run build`: concluído com sucesso (com aviso informativo já esperado em relação a dynamic server usage de cookies na rota `/dashboard`).

### Pendências
- Exibir os históricos capturados diretamente no prontuário do lead, caso a timeline seja priorizada no futuro.
- Restaurar a disponibilidade local do binário `vitest` para reexecutar testes no ambiente atual.

### Observações técnicas
- A alteração introduziu o armazenamento de histórico e foi acoplada ao repository do backend que realiza as atualizações primárias (e as seguras, sob RLS validado e permissionamento apropriado) de leads do CRM.

### Data
2026-05-21 23:16

### Tarefa
`TASK-020 — Mostrar leads parados`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/funil/sales-funnel-workspace.test.tsx`
- `src/lib/leads/repository.server.ts`
- `src/data/mock.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao funil uma sinalizacao inicial de estagnacao para leads em etapas abertas sem atualizacao ha pelo menos sete dias. A interface agora exibe uma metrica de `Leads parados`, documenta a regra diretamente na tela e marca os cards impactados com badge visual de quantidade de dias sem atualizacao.

Para sustentar a regra sem alterar CRUD nem schema nesta tarefa, o contrato de `Lead` passou a expor `updatedAt`, com fallback para `receivedAt` quando necessario. O mapeamento do repository e os dados mockados foram ajustados para refletir essa informacao tanto no modo Supabase quanto no modo demonstracao.

Tambem foi adicionado um teste de interface cobrindo a marcacao de leads parados e a exclusao de leads fechados dessa contagem.

### Comandos executados
- `git status --short`
- `sed -n '620,980p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '980,1220p' src/lib/leads/repository.server.ts`
- `git diff -- app/dashboard/funil/sales-funnel-workspace.tsx`
- `git diff -- src/lib/leads/repository.server.ts`
- `git diff -- docs/tarefas-leadi-roadmap-normalizado.md docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1650,1815p' src/lib/leads/repository.server.ts`
- `sed -n '1,220p' src/lib/leads/stages.ts`
- `rg -n "updatedAt" app src | head -n 200`
- `sed -n '1,220p' src/lib/leads/repository.ts`
- `sed -n '1,220p' src/lib/billing/subscription-limits.server.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.
- Se a leitura de estagnacao precisar refletir estritamente transicoes de etapa, evoluir a regra para consumir diretamente o historico salvo em `lead_stage_history`.

### Observações técnicas
- A tarefa ficou restrita ao contrato do lead e a UI do funil, sem alterar autenticacao, billing, OpenAI, Meta Ads, webhooks, variaveis de ambiente ou CRUD basico de leads.
- O worktree ja continha alteracoes anteriores nao relacionadas, inclusive em arquivos do proprio fluxo de leads e do roadmap; elas foram preservadas e nao foram revertidas.

### Data
2026-05-21 23:26

### Tarefa
`TASK-023 — Mostrar leads sem contato`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao dashboard uma prioridade operacional de `Sem primeiro contato`, com contagem total e lista resumida dos leads mais recentes aguardando abordagem.

A regra inicial foi mantida simples e explicita no codigo: um lead e considerado sem contato quando nao possui nenhum registro manual do tipo `contact` no historico comercial. Isso evita usar `last_interaction` como fonte de verdade, ja que esse campo tambem pode refletir comentarios gerais.

No carregamento server-side do dashboard, os leads ja visiveis para o usuario passaram a ser cruzados com os ids que possuem contato registrado no workspace atual, preservando o recorte de permissao existente sem alterar auth, schema ou RLS nesta tarefa.

Tambem foram adicionados ajustes de teste para a pagina e um teste dedicado ao novo bloco visual do dashboard.

### Comandos executados
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '1,220p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,260p' app/dashboard/page.tsx`
- `sed -n '1,360p' src/lib/leads/repository.server.ts`
- `sed -n '220,360p' app/dashboard/dashboard-home.tsx`
- `sed -n '360,520p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,140p' src/lib/leads/repository.ts`
- `sed -n '1,140p' src/lib/leads/filters.ts`
- `sed -n '1157,1365p' src/lib/leads/repository.server.ts`
- `sed -n '1365,1485p' src/lib/leads/repository.server.ts`
- `rg -n 'text-coral|bg-coral|text-signal|bg-signal' app src | sed -n '1,80p'`
- `sed -n '1,220p' app/dashboard/dashboard-home.test.tsx`
- `sed -n '1,220p' app/dashboard/page.test.tsx`
- `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, mantendo apenas warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run build`: concluido com sucesso; repetiu apenas os warnings ja conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar os testes automatizados da tarefa.
- Se a operacao precisar priorizar por SLA no futuro, evoluir o bloco para considerar tempo desde `receivedAt` e ordenacao mais rica, sem depender apenas da ausencia de contato.

### Observações técnicas
- O modo mock passou a simular parte dos historicos como `contact` para que a nova prioridade tambem faca sentido no ambiente demonstrativo.
- O worktree ja continha alteracoes previas em arquivos do dashboard, leads, roadmap e migrations; elas foram preservadas e nao foram revertidas.

## 2026-05-21 23:32
- **Tarefa**: TASK-024 — Mostrar tarefas vencidas
- **Arquivos alterados**:
  - `src/lib/leads/repository.server.ts`
  - `app/dashboard/page.tsx`
  - `app/dashboard/dashboard-home.tsx`
- **Resumo**: Foi criada a função `listOverdueLeadTasksForCurrentUser` para buscar tarefas atrasadas diretamente da tabela `lead_tasks`, mapeando lead e etapa. O dashboard foi atualizado para consumir esses dados via server component em `page.tsx` e exibir um novo bloco "Tarefas pendentes" logo acima de "Sem primeiro contato", contendo a listagem resumida de atrasos operacionais.
- **Comandos executados**: `npm run lint` e `npm run build`
- **Resultado dos comandos**: `npm run lint` sem erros (apenas 5 warnings preexistentes); `npm run build` executado com sucesso e mantendo apenas os avisos conhecidos.
- **Pendências**: O binário local do `vitest` não estava disponível para executar `npm run test` com sucesso; restaurar ambiente de testes nas próximas sessões.
- **Riscos**: A leitura de tarefas atrasadas depende de Supabase configurado (do contrário usa `mockLeadTasks`) e está exposta no dashboard; a verificação via RLS blinda o acesso a tasks de outros leads, mas o código servidor faz uma busca global para a organização (que também está contida pelo Row Level Security).
- **Próximos passos**: A próxima tarefa pendente do roadmap deve ser executada após o usuário iniciar uma nova requisição.

### Data
2026-05-21 23:38

### Tarefa
`TASK-026 — Mostrar custo por lead inicial`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao dashboard um card de `CPL inicial` com transparência explícita sobre limitação de dados.

O valor agora só aparece como mock controlado quando já existe uma base operacional mínima de leads e campanhas ativas ou prontas. Quando essa base não existe, o card mostra `N/D`, evitando inventar um custo financeiro definitivo.

Para manter o comportamento centralizado, a regra foi encapsulada em `src/lib/reports/commercial-report.server.ts` e consumida no carregamento server-side do dashboard.

### Comandos executados
- `rg -n "TASK-026|custo por lead|CPL|roi|estimated_cost|cost per lead|custo real|orcamento" docs src app supabase -g '!**/node_modules/**'`
- `sed -n '1230,1288p' docs/tarefas-leadi-roadmap.md`
- `git diff -- app/dashboard/dashboard-home.tsx app/dashboard/page.tsx src/lib/reports/commercial-report.server.ts app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx docs/tarefas-leadi-roadmap-normalizado.md docs/LOG_EXECUCAO_TAREFAS.md`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, mantendo apenas warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um bloqueio de ambiente ja observado em execucoes anteriores.
- `npm run build`: concluido com sucesso; repetiu apenas warnings ja conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar os testes automatizados do dashboard.
- Evoluir o card para custo parcial baseado em dados reais quando a modelagem de custo de campanha existir no produto.

### Observações técnicas
- A tarefa ficou restrita ao dashboard e à camada de relatório server-side, sem alterar autenticação, Supabase, banco, billing, Meta Ads, OpenAI, webhooks ou variáveis de ambiente.
- O worktree já continha alterações prévias em arquivos do dashboard, relatórios, roadmap e testes; elas foram preservadas e não foram revertidas.
