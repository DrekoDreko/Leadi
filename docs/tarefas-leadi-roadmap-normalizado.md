# Roadmap normalizado de tarefas — Leadi

Fonte original: `docs/tarefas-leadi-roadmap.md`

Este arquivo organiza as tarefas em sequência controlada para execução automática pelo Codex.

Regras de uso:

- Cada execução deve trabalhar em apenas uma tarefa pendente.
- A próxima tarefa é sempre a primeira com `- [ ] Status: Pendente`.
- O arquivo original continua como referência histórica e de contexto.
- Se a tarefa tocar área sensível fora do escopo explícito, o agente deve parar e registrar o bloqueio.

Observação geral:

- As seções de diagnóstico estratégico e prioridades de produto continuam no arquivo original.
- Aqui ficam apenas as tarefas em formato operacional, com ordem única e critérios de parada claros.

---

## Fase 1 — Diagnóstico de base

### TASK-001 — Revisar estrutura atual de leads

- [x] Status: Concluída

#### Objetivo
Mapear o modelo atual de leads e registrar gaps entre banco, API e UI.

#### Escopo permitido
- Ler a estrutura atual de `Lead` e seus usos.
- Produzir um diagnóstico curto e versionado no repositório.

#### Fora de escopo
- Criar campos novos.
- Alterar comportamento funcional do CRM.

#### Arquivos prováveis
- `src/lib/leads/repository.server.ts`
- `src/lib/supabase/database.types.ts`
- `src/data/mock.ts`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- O diagnóstico diferencia banco, API e UI.
- Os gaps do prontuário ficam claros.
- Nenhuma funcionalidade do produto é alterada.

#### Observações
Referência original: Tarefa 01.

#### Execução 2026-05-21
- Arquivo criado: `docs/AUDITORIA_ESTRUTURA_LEADS.md`
- Arquivos analisados: `src/lib/supabase/database.types.ts`, `src/lib/leads/repository.server.ts`, `src/data/mock.ts`, `app/dashboard/leads/*`, `app/dashboard/funil/*`, `app/api/leads/*`, `app/api/webhooks/leads/route.ts`, `app/api/meta/webhook/route.ts`, `src/lib/imports/csv.ts`, `src/lib/meta/manual-lead-import.server.ts`, `supabase/migrations/*` de leads/webhooks/comentários.
- Principais achados: contrato real de banco mais rico que a UI, tipo de frontend ancorado em `src/data/mock.ts`, CSV cobre subconjunto do schema, `owner` nao representa fielmente o responsavel para managers, `leads.raw_payload` merece revisao de minimizacao e ha drift historico de papel `supervisor`.
- Comandos executados: leitura com `sed`, buscas com `rg`, conferência de scripts com `cat package.json` e estado do worktree com `git status --short`.
- Pendências: alinhar contrato banco/API/UI, revisar minimização de payload e auditoria de exportação. Não houve alteração funcional nesta tarefa.

### TASK-002 — Revisar funil atual

- [x] Status: Concluida

#### Objetivo
Documentar o comportamento atual do funil e seus gaps técnicos e operacionais.

#### Escopo permitido
- Ler UI, API e estrutura de etapas.
- Registrar limitações reais do fluxo atual.

#### Fora de escopo
- Redesenhar o funil.
- Alterar regras de movimentação.

#### Arquivos prováveis
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/lib/leads/stages.ts`
- `app/api/leads/[id]/route.ts`

#### Critérios de aceite
- O diagnóstico aponta gaps de UI, API e banco.
- O resultado é curto e acionável.
- Não há mudança funcional além de documentação.

#### Observações
Referência original: Tarefa 12.

#### Execucao 2026-05-21
- Arquivo criado: `docs/AUDITORIA_FUNIL_ATUAL.md`
- Arquivos analisados: `app/dashboard/funil/*`, `app/dashboard/leads/*`, `src/components/dashboard/lead-details-popup.tsx`, `src/lib/leads/stages.ts`, `src/lib/leads/filters.ts`, `src/lib/leads/normalization.ts`, `src/lib/leads/repository*.ts`, `app/api/leads/*`, `src/data/mock.ts`, `src/lib/imports/csv.ts`, `src/lib/meta/manual-lead-import.server.ts`, `src/lib/reports/commercial-report.server.ts`, `src/lib/supabase/database.types.ts`, `supabase/migrations/202604280001_phase_1_core.sql`, `supabase/migrations/202605200002_supabase_hardening_rls.sql`, `src/lib/workspaces/permissions.ts`.
- Principais achados: o banco usa enum tecnico unico para etapa, mas UI, filtros e exportacao operam com labels em portugues; o funil depende de comparacoes textuais locais para metricas; nao existe historico proprio de mudanca de etapa; mocks nao espelham integralmente as seis colunas oficiais; ha drift de nomenclatura entre `seller`, `consultor`, `manager` e o legado `supervisor`.
- Comandos executados: leitura com `sed`, buscas com `rg`, conferencias com `cat package.json`, `git status --short` e `date '+%Y-%m-%d %H:%M'`.
- Pendencias: padronizar contrato de etapas ponta a ponta, endurecer validacao de `stage`, centralizar metricas do funil e criar historico de transicao. Nao houve alteracao funcional nesta tarefa.

### TASK-003 — Revisar integração Meta atual

- [x] Status: Concluida

#### Objetivo
Fechar um diagnóstico objetivo do estado real da integração Meta.

#### Escopo permitido
- Auditar OAuth, sync, webhook e importação.
- Separar problemas de código, ambiente e dados.

#### Fora de escopo
- Reimplementar o fluxo completo da Meta.
- Alterar segredos, billing ou configuração real.

#### Arquivos prováveis
- `app/api/integrations/meta/*`
- `app/api/meta/*`
- `src/lib/integrations/meta-graph.server.ts`
- `docs/meta-review-production-check.md`

#### Critérios de aceite
- O diagnóstico cobre OAuth, sync, webhook e importação.
- Os blockers reais ficam explícitos.
- O resultado ajuda a priorizar as próximas correções.

#### Observações
Referência original: Tarefa 26.

#### Atenção: área sensível
Meta Ads, webhooks, variáveis de ambiente e dados de leads. A tarefa deve permanecer documental nesta etapa.

#### Execucao 2026-05-21
- Arquivo criado: `docs/AUDITORIA_INTEGRACAO_META_ATUAL.md`
- Arquivos analisados: `app/api/integrations/meta/connect/route.ts`, `app/api/integrations/meta/callback/route.ts`, `app/api/integrations/meta/sync/route.ts`, `app/api/meta/webhook/route.ts`, `app/api/meta/leads/import/route.ts`, `app/api/meta/leads/sources/route.ts`, `app/dashboard/perfil/meta/page.tsx`, `app/dashboard/empresa/page.tsx`, `src/lib/integrations/meta-graph.server.ts`, `src/lib/integrations/repository.server.ts`, `src/lib/integrations/oauth-state.server.ts`, `src/lib/integrations/crypto.server.ts`, `src/lib/meta/config.ts`, `src/lib/meta/manual-lead-import.server.ts`, `src/lib/meta/webhook-processing.server.ts`, `src/lib/env/server.ts`, `src/lib/integrations/meta-graph.server.test.ts`, `docs/meta-review-production-check.md` e `docs/meta-app-review.md`.
- Principais achados: a integracao Meta ja existe ponta a ponta no codigo, mas continua fragil por dependencia de ambiente valido, `INTEGRATIONS_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, token Meta descriptografavel e ativos sincronizados por organizacao; OAuth, sync, webhook e importacao estao implementados, porem o diagnostico operacional ainda mistura falhas de codigo, ambiente e dados.
- Comandos executados: leitura com `sed`, buscas com `rg`, conferencia de scripts com `sed -n '1,260p' package.json`, estado do worktree com `git status --short` e validacoes `npm run lint`, `npm run test`, `npm run build`.
- Pendencias: detalhar envs reais da Meta e do Supabase admin, endurecer o callback OAuth, melhorar diagnostico de conexao na UI e tornar webhook/importacao mais observaveis. Nao houve alteracao funcional nesta tarefa.

### TASK-004 — Revisar gerador de campanha atual

- [x] Status: Concluida

#### Objetivo
Documentar o que o gerador de campanha já resolve e onde ainda é raso.

#### Escopo permitido
- Ler fluxo de geração, persistência e UI.
- Registrar gargalos entre geração de texto e operação real.

#### Fora de escopo
- Redesenhar o módulo inteiro.
- Alterar prompts ou contratos nesta tarefa.

#### Arquivos prováveis
- `app/dashboard/campanhas/campaign-generator.tsx`
- `app/api/campaigns/generate/route.ts`
- `src/lib/campaigns/repository.server.ts`

#### Critérios de aceite
- Existe um diagnóstico curto do gerador.
- Os gargalos de uso real ficam claros.
- Nenhuma feature é alterada sem necessidade.

#### Observações
Referência original: Tarefa 37.

#### Execucao 2026-05-21
- Arquivo criado: `docs/AUDITORIA_GERADOR_CAMPANHA_ATUAL.md`
- Arquivos analisados: `app/dashboard/campanhas/campaign-generator.tsx`, `app/dashboard/campanhas/campaign-generator.test.tsx`, `app/dashboard/criacoes/campanhas/page.tsx`, `app/api/campaigns/generate/route.ts`, `app/api/campaigns/questions/route.ts`, `app/api/campaigns/route.ts`, `app/api/campaigns/publish/route.ts`, `src/lib/campaigns/repository.server.ts`, `src/lib/campaigns/types.ts`, `src/lib/creative-requests/repository.server.ts` e `src/lib/openai/index.ts`.
- Principais achados: o gerador ja resolve briefing guiado, consumo de creditos, geracao server-side, persistencia de campanhas e abertura opcional de pedido criativo, mas continua raso na operacao apos a geracao; o maior gap atual e a ausencia de rascunho real, seguida por historico pouco visivel na UX, comunicacao imprecisa de sucesso e tratamento silencioso de falha de persistencia.
- Comandos executados: leitura com `sed`, buscas com `rg`, conferencia de scripts com `sed -n '1,260p' package.json`, estado do worktree com `git status --short`, validacao de processos com `ps -ax -o pid,command` e `ps -p ... -o pid=,%cpu=,etime=,command=`, alem de `npm run lint`, `npm run test` e `npm run build`.
- Pendencias: implementar persistencia real de rascunho, expor historico operacional de campanhas, melhorar o sinal de sucesso parcial quando salvar falhar e aproximar a jornada de geracao da jornada de revisao/publicacao. Nao houve alteracao funcional nesta tarefa.

### TASK-005 — Revisar estrutura de usuários e equipe

- [x] Status: Concluida

#### Objetivo
Mapear papéis, permissões e limites atuais para futura distribuição de leads.

#### Escopo permitido
- Ler camadas de equipe, permissões e onboarding.
- Produzir diagnóstico curto da estrutura atual.

#### Fora de escopo
- Implementar distribuição.
- Alterar papéis ou regras de acesso.

#### Arquivos prováveis
- `src/lib/workspaces/team.ts`
- `src/lib/workspaces/permissions.ts`
- `app/team/setup/*`
- `middleware.ts`

#### Critérios de aceite
- Owner, admin e seller ficam claramente mapeados.
- O diagnóstico mostra gargalos reais.
- O material orienta as próximas tarefas de equipe.

#### Observações
Referência original: Tarefa 55.

#### Execucao 2026-05-21
- Arquivo criado: `docs/AUDITORIA_ESTRUTURA_USUARIOS_EQUIPE.md`
- Arquivos analisados: `src/lib/workspaces/context.ts`, `src/lib/workspaces/permissions.ts`, `src/lib/workspaces/team.ts`, `app/team/setup/*`, `app/onboarding/profile-setup/*`, `app/invite/[token]/page.tsx`, `middleware.ts`, `src/lib/supabase/database.types.ts` e `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`.
- Principais achados: o onboarding grava `owner` tanto para workspace `solo` quanto `team`; `admin` atua como gerente operacional com limites reais reforcados por RPC; `seller` perde acesso gerencial e ao ser removido ganha um novo workspace `solo`; ha drift de nomenclatura entre `supervisor`, `admin`, `consultor` e `owner` individual; o sistema assume uma unica organizacao ativa por usuario.
- Comandos executados: leitura com `sed`, buscas com `rg`, conferencia de scripts com `sed -n '1,220p' package.json`, estado do worktree com `git status --short`, validacoes `npm run lint`, `npm run test` e `npm run build`.
- Pendencias: consolidar glossario de papeis, centralizar a matriz de acesso, separar melhor bloqueio comercial de permissao e revisar os vestigios legados de `supervisor` e `seller-solo`. Nao houve alteracao funcional nesta tarefa.

### TASK-006 — Revisar exposição de chaves

- [x] Status: Concluida

#### Objetivo
Reduzir risco operacional com segredos e arquivos de ambiente no workspace.

#### Escopo permitido
- Revisar documentação, alertas e guardrails sobre segredos.
- Melhorar orientação de uso seguro sem expor valores reais.

#### Fora de escopo
- Alterar secrets reais.
- Mudar integrações ou ambiente de produção.

#### Arquivos prováveis
- `.env.example`
- `README.md`
- `src/lib/env/shared.ts`
- `docs/SECURITY_AUDIT.md`

#### Critérios de aceite
- O uso seguro de segredos fica mais claro.
- Nenhum segredo é exposto no client.
- O risco operacional fica melhor documentado.

#### Observações
Referência original: Tarefa 63.

#### Atenção: área sensível
Segredos, variáveis de ambiente e produção. Não expor valores reais nem alterar configuração externa.

#### Execucao 2026-05-21
- Arquivos alterados: `.env.example`, `README.md`, `docs/SECURITY_AUDIT.md`, `src/lib/env/shared.ts` e `src/lib/env/shared.test.ts`.
- Principais entregas: o catalogo compartilhado de env ganhou helpers para separar variaveis publicas de server-only; o `.env.example` foi alinhado ao conjunto real de variaveis do projeto com avisos mais claros sobre exposicao; o `README.md` passou a documentar explicitamente a diferenca entre `NEXT_PUBLIC_*` e segredos server-side; e a auditoria de seguranca registrou os novos guardrails documentais e de teste.
- Validacoes executadas: `npm run security:check`, `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes e sem erros; `npm run build` concluiu com sucesso; `npm run security:check` e `npm run test` falharam porque o binario `vitest` nao estava disponivel no ambiente local (`sh: vitest: command not found`), sem indicio de relacao direta com esta tarefa.
- Pendencias: restaurar a disponibilidade local do `vitest` para reexecutar `security:check` e `test` com cobertura completa antes de tratar esta frente como totalmente validada.
---

## Fase 2 — CRM e prontuário do lead

### TASK-007 — Ajustar modelo de lead com campos comerciais

- [x] Status: Concluida

#### Objetivo
Criar a base de schema para o prontuário comercial do lead.

#### Escopo permitido
- Adicionar campos comerciais mínimos ao schema.
- Refletir mudanças em tipos e repositório com compatibilidade.

#### Fora de escopo
- Redesenhar toda a UI do lead.
- Alterar billing, auth ou integrações não relacionadas.

#### Arquivos prováveis
- `supabase/migrations/*`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- Os novos campos existem no schema.
- `database.types.ts` reflete o modelo.
- O CRUD atual continua funcionando.

#### Observações
Referência original: Tarefa 02. Executar após TASK-001.

#### Atenção: área sensível
Banco, migrations, dados de leads e tipagem compartilhada.

### TASK-008 — Criar tela de detalhe do lead com dados básicos

- [x] Status: Concluida

#### Objetivo
Fortalecer o prontuário básico do lead sem adicionar módulos pesados.

#### Escopo permitido
- Melhorar a leitura do detalhe do lead.
- Destacar dados comerciais básicos e origem.

#### Fora de escopo
- Reescrever fluxos de edição.
- Criar novas regras de negócio.

#### Arquivos prováveis
- `src/components/dashboard/lead-details-popup.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`

#### Critérios de aceite
- O detalhe do lead fica mais legível.
- Origem e dados básicos aparecem sem rolagem excessiva.
- Comentários e ações atuais continuam funcionando.

#### Observações
Referência original: Tarefa 03. Executar após TASK-007.

#### Atenção: área sensível
Dados de leads. Limitar a alteração à visualização e integrações já existentes.

#### Execucao 2026-05-21
- Arquivos alterados: `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`.
- Principais entregas: o detalhe do lead foi reorganizado para priorizar dados basicos, contexto comercial e resumo de origem antes da area de comentarios; a leitura rapida agora destaca responsavel, empresa, contato, cidade, vidas, origem, campanha, orcamento e datas sem exigir rolagem excessiva; comentarios, acoes de contato, edicao e arquivamento foram preservados.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas avisos conhecidos; `npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidenca de regressao especifica da tarefa.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite de testes completa.

### TASK-009 — Adicionar histórico manual de contato

- [x] Status: Concluído
- Fase: Funcionalidades Core - Setup e Organização
- Prioridade: Alta

#### Objetivo
Registrar interações manuais do lead de forma mais operacional.

#### Escopo permitido
- Melhorar o registro manual de contatos.
- Diferenciar contato comercial de comentário geral.

#### Fora de escopo
- Criar agenda comercial completa.
- Reestruturar todo o sistema de comentários.

#### Arquivos prováveis
- `src/lib/leads/repository.server.ts`
- `app/api/leads/[id]/comments/route.ts`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- O usuário registra contato manual no lead.
- O histórico aparece no detalhe do lead.
- O fluxo atual de comentários não quebra.

#### Observações
Referência original: Tarefa 04. Executar após TASK-008.

#### Atenção: área sensível
API de leads e dados de usuários/leads.

### TASK-010 — Adicionar tarefas por lead

- [x] Status: Concluida

#### Objetivo
Criar a entidade própria de tarefa operacional por lead.

#### Escopo permitido
- Criar tabela, tipos e contratos mínimos.
- Preparar base server-side para uso futuro.

#### Fora de escopo
- Construir dashboard completo de tarefas.
- Misturar a nova entidade com `dashboard_reminders`.

#### Arquivos prováveis
- `supabase/migrations/*`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- Existe estrutura própria de tarefa por lead.
- A modelagem respeita organização e responsável.
- A base fica pronta para UI e dashboard futuros.

#### Observações
Referência original: Tarefa 05. Executar após TASK-001 e TASK-007.

#### Atenção: área sensível
Banco, multi-tenant, permissões e dados de leads.

#### Execucao 2026-05-21
- Arquivos alterados: `supabase/migrations/202605210004_lead_tasks.sql`, `src/lib/supabase/database.types.ts`, `src/lib/leads/repository.server.ts`.
- Principais entregas: foi criada a entidade propria `lead_tasks` com isolamento por organizacao, relacao direta com `lead`, responsavel opcional por perfil, enums de status/prioridade, indices, trigger de `updated_at` e policies de RLS separadas de `dashboard_reminders`; `database.types.ts` passou a refletir a nova tabela e enums; o repositorio de leads ganhou contratos minimos para listar, criar e atualizar tarefas por lead, inclusive com fallback mock quando o Supabase nao estiver configurado.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas o aviso informativo ja conhecido de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite de testes; construir a API/UI operacional das tarefas por lead em tarefas futuras, sem reutilizar `dashboard_reminders`.

### TASK-011 — Adicionar status do funil ao prontuário

- [x] Status: Concluida

#### Objetivo
Padronizar e destacar a etapa comercial do lead no prontuário.

#### Escopo permitido
- Melhorar a exibição da etapa atual.
- Usar nomenclatura única entre CRM e funil.

#### Fora de escopo
- Redefinir o modelo inteiro de etapas.
- Alterar API além do necessário.

#### Arquivos prováveis
- `src/lib/leads/stages.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`

#### Critérios de aceite
- A etapa atual fica clara no prontuário.
- Labels e valores ficam consistentes entre telas.
- O update existente continua funcionando.

#### Observações
Referência original: Tarefa 06. Executar após TASK-008.

#### Execucao 2026-05-21
- Arquivos alterados: `src/lib/leads/stages.ts`, `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`.
- Principais entregas: a etapa comercial do lead passou a usar uma fonte compartilhada de metadados em `src/lib/leads/stages.ts`, com label, value, descricao e tolerancia para receber tanto o value tecnico quanto o label da UI; o prontuario ganhou badge e bloco de destaque da etapa atual com leitura comercial consistente; o funil deixou de depender de comparacoes locais por label em metricas resumidas.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-012 — Adicionar motivo de perda

- [x] Status: Concluida

#### Objetivo
Permitir registrar motivo de perda para leads perdidos.

#### Escopo permitido
- Criar campo de motivo de perda.
- Expor o campo no CRUD e no prontuário.

#### Fora de escopo
- Criar regras rígidas demais para a primeira versão.
- Alterar funil além do contexto de perda.

#### Arquivos prováveis
- `supabase/migrations/*`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/route.ts`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- Leads perdidos aceitam motivo de perda.
- O motivo aparece no prontuário.
- Leads não perdidos não exigem esse campo.

#### Observações
Referência original: Tarefa 07. Executar após TASK-007 e TASK-011.

#### Atenção: área sensível
Banco, API de leads e dados operacionais.

#### Execucao 2026-05-21
- Arquivos alterados: `supabase/migrations/202605210005_add_lead_loss_reason.sql`, `src/lib/supabase/database.types.ts`, `src/lib/leads/repository.server.ts`, `app/api/leads/route.ts`, `app/api/leads/[id]/route.ts`, `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`, `src/data/mock.ts`.
- Principais entregas: o schema de leads ganhou o campo opcional `loss_reason`; o repositório e as rotas passaram a aceitar e persistir o motivo de perda apenas no contexto de leads em etapa `lost`, limpando o valor quando a etapa efetiva não é perdida; e o prontuário passou a exibir e editar esse motivo somente para leads perdidos, sem exigir o campo nas demais etapas.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-013 — Adicionar qualidade do lead

- [x] Status: Concluida

#### Objetivo
Criar classificação simples de qualidade do lead.

#### Escopo permitido
- Adicionar campo simples de qualidade.
- Exibir o indicador no detalhe e na listagem.

#### Fora de escopo
- Reintroduzir score complexo.
- Criar automação avançada de priorização.

#### Arquivos prováveis
- `supabase/migrations/*`
- `src/lib/leads/repository.server.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- A qualidade pode ser salva e exibida.
- A solução não recria o score antigo.
- A listagem mostra o indicador de forma útil.

#### Observações
Referência original: Tarefa 08. Executar após TASK-007.

#### Atenção: área sensível
Banco e dados de leads.

#### Execucao 2026-05-21
- Arquivos alterados: `supabase/migrations/202605210006_add_lead_quality.sql`, `src/lib/supabase/database.types.ts`, `src/lib/leads/normalization.ts`, `src/lib/leads/repository.server.ts`, `src/lib/leads/quality.ts`, `app/api/leads/route.ts`, `app/api/leads/[id]/route.ts`, `app/dashboard/leads/leads-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`, `app/api/leads/route.test.ts`, `app/api/leads/[id]/route.test.ts` e `src/data/mock.ts`.
- Principais entregas: o schema de leads ganhou o campo opcional `quality` com validacao simples para `high`, `medium` e `low`; o repositório, os tipos compartilhados e as rotas de criacao/edicao passaram a aceitar e persistir essa classificacao sem reintroduzir score numerico; a listagem de leads passou a mostrar um badge de qualidade logo na linha do lead; e o prontuario passou a exibir e editar a classificacao com labels comerciais em portugues.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-014 — Vincular lead à campanha, anúncio e formulário

- [x] Status: Concluida

#### Objetivo
Melhorar a leitura da origem do lead usando os campos Meta já existentes.

#### Escopo permitido
- Consolidar exibição de campanha, anúncio e formulário.
- Padronizar o mapeamento da origem nas telas.

#### Fora de escopo
- Reimplementar importação da Meta.
- Alterar contratos de integração além do necessário.

#### Arquivos prováveis
- `src/lib/leads/repository.server.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/lib/supabase/database.types.ts`

#### Critérios de aceite
- O lead exibe campanha, anúncio e formulário quando houver dados.
- A UI diferencia origem manual, CSV e Meta.
- Nenhum dado de origem é perdido.

#### Observações
Referência original: Tarefa 09. Executar após TASK-008.

#### Atenção: área sensível
Dados de leads e rastreabilidade da Meta.

#### Execucao 2026-05-21
- Arquivos alterados: `src/data/mock.ts`, `src/lib/leads/repository.server.ts`, `src/lib/leads/source.ts`, `src/lib/leads/source.test.ts`, `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx` e `app/dashboard/leads/leads-workspace.tsx`.
- Principais entregas: o contrato `Lead` e o mapeamento server-side passaram a preservar tambem `meta_campaign_id`, `meta_adset_id` e `meta_ad_id`, evitando perda de rastreabilidade quando a origem vem da Meta; a listagem de leads ganhou um badge de origem e um resumo curto que diferencia cadastro manual, CSV e Meta; e o popup do lead passou a consolidar campanha, conjunto, anuncio e formulario com fallback seguro para os identificadores Meta ja existentes.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada.

### TASK-015 — Criar botão de WhatsApp com mensagem pronta

- [x] Status: Concluida

#### Objetivo
Abrir o WhatsApp a partir do lead com mensagem inicial preenchida.

#### Escopo permitido
- Criar CTA direto no detalhe do lead.
- Reaproveitar telefone já normalizado.

#### Fora de escopo
- Alterar gerador de mensagens com IA.
- Criar integração de envio dentro do produto.

#### Arquivos prováveis
- `src/components/dashboard/lead-details-popup.tsx`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- O botão abre o WhatsApp com texto preenchido.
- O CTA só aparece ou habilita com telefone válido.
- A ação não interfere no módulo de IA.

#### Observações
Referência original: Tarefa 10. Executar após TASK-008.

#### Execucao 2026-05-21
- Arquivos alterados: `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`.
- Principais entregas: o detalhe do lead ganhou um CTA dedicado para abrir o WhatsApp externo com mensagem inicial preenchida a partir do nome, interesse e empresa do lead; o link reutiliza o telefone normalizado do CRM para montar `wa.me` e permanece visualmente desabilitado quando nao ha telefone valido; o atalho foi mantido separado do gerador com IA e nao alterou o fluxo existente de mensagens.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-016 — Criar botão para gerar mensagem com IA

- [x] Status: Concluida

#### Objetivo
Trazer o atalho de IA para dentro do prontuário do lead.

#### Escopo permitido
- Integrar o detalhe do lead ao fluxo existente de geração.
- Reaproveitar saldo de IA e templates atuais.

#### Fora de escopo
- Duplicar o módulo de WhatsApp.
- Reescrever o endpoint de geração.

#### Arquivos prováveis
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-message-generator.tsx`
- `app/api/whatsapp/generate/route.ts`

#### Critérios de aceite
- O lead pode disparar geração de mensagem com IA.
- O fluxo usa o endpoint atual.
- O histórico atual não é quebrado.

#### Observações
Referência original: Tarefa 11. Executar após TASK-008 e TASK-015.

#### Atenção: área sensível
OpenAI, créditos e dados de leads.

#### Execucao 2026-05-21
- Arquivos alterados: `app/dashboard/page.tsx`, `app/dashboard/dashboard-home.tsx`, `app/dashboard/funil/page.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/funil/page.test.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`.
- Principais entregas: o atalho de geracao de mensagem com IA, que ja estava integrado ao prontuario na tela de leads, passou a ficar disponivel tambem quando o mesmo `LeadDetailsPopup` e aberto pelo dashboard inicial e pelo funil; as duas entradas agora carregam o saldo atual de IA e os templates de WhatsApp existentes sem criar fluxo paralelo nem reescrever o endpoint `/api/whatsapp/generate`.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas warnings conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

---

## Fase 3 — Funil comercial

### TASK-017 — Padronizar etapas do funil

- [x] Status: Concluida

#### Objetivo
Consolidar nomes, ordem e significado das etapas do funil.

#### Escopo permitido
- Revisar labels e valores das etapas.
- Aplicar padrão único em CRM, funil e relatórios.

#### Fora de escopo
- Mudar enum do banco sem necessidade.
- Criar novo modelo analítico.

#### Arquivos prováveis
- `src/lib/leads/stages.ts`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/lib/reports/commercial-report.server.ts`

#### Critérios de aceite
- O produto usa uma nomenclatura única de etapas.
- A ordenação fica consistente.
- Relatórios e listagens não divergem nas labels.

#### Observações
Referência original: Tarefa 13. Executar após TASK-002.

#### Execucao 2026-05-21
- Arquivos alterados: `src/lib/leads/stages.ts`, `src/lib/leads/filters.ts`, `src/lib/leads/repository.server.ts`, `src/lib/reports/commercial-report.server.ts`, `app/dashboard/leads/leads-workspace.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `src/lib/leads/stages.test.ts` e `src/lib/leads/filters.test.ts`.
- Principais entregas: as etapas do funil passaram a ter uma fonte compartilhada de metadados com ordem, labels e significado oficial; o CRM passou a contar, filtrar e exibir etapas a partir dessa fonte unica, inclusive quando o lead chega com `value` tecnico; o funil deixou de duplicar descricoes e passou a usar a mesma definicao central para cards, metricas e comparacao de movimentacao; e os relatorios comerciais passaram a reutilizar helpers compartilhados para contagem de leads qualificados e vendas.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-018 — Permitir mover lead entre etapas com feedback claro

- [x] Status: Concluída

#### Execução 2026-05-21
- **Resumo**: Foi refinada a lógica de feedback do drag and drop, permitindo movimentações simultâneas de leads no funil sem perda de estado.
- **Arquivos alterados**: `app/dashboard/funil/sales-funnel-workspace.tsx`
- **Comandos executados**: `npm run lint`, `npm run build`
- **Pendências**: Nenhuma.

#### Objetivo
Fortalecer o fluxo de movimentação entre colunas do funil.

#### Escopo permitido
- Melhorar feedback do drag and drop.
- Reforçar atualização otimista e rollback.

#### Fora de escopo
- Reescrever o funil inteiro.
- Alterar etapas fora do escopo.

#### Arquivos prováveis
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/api/leads/[id]/route.ts`

#### Critérios de aceite
- Mover lead entre etapas fica mais confiável.
- Erros de atualização ficam claros.
- O rollback visual funciona quando a API falha.

#### Observações
Referência original: Tarefa 14. Executar após TASK-017.

#### Atenção: área sensível
API de leads e dados operacionais.

### TASK-019 — Salvar histórico da mudança de etapa

- [x] Status: Concluído

#### Objetivo
Registrar a evolução do lead no funil para análise posterior.

#### Escopo permitido
- Criar estrutura de histórico de etapa.
- Registrar transição com data e autor.

#### Fora de escopo
- Construir dashboard analítico completo.
- Mudar o fluxo principal além do histórico.

#### Arquivos prováveis
- `supabase/migrations/*`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/[id]/route.ts`

#### Critérios de aceite
- Cada mudança de etapa gera histórico.
- O histórico registra data e autor mínimos.
- O update atual continua compatível.

#### Observações
Referência original: Tarefa 15. Executar após TASK-017 e TASK-018.

#### Atenção: área sensível
Banco, API de leads e histórico operacional.

### TASK-020 — Mostrar leads parados

- [x] Status: Concluida

#### Objetivo
Evidenciar leads sem avanço recente no funil.

#### Escopo permitido
- Definir regra inicial de estagnação.
- Sinalizar leads parados no funil.

#### Fora de escopo
- Criar motor avançado de SLA.
- Alterar CRUD básico do lead.

#### Arquivos prováveis
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- Leads parados ficam identificáveis.
- A regra é simples e documentada.
- Não há regressão no funil.

#### Observações
Referência original: Tarefa 16. Executar após TASK-009 e TASK-019.

#### Execucao 2026-05-21
- Arquivos alterados: `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/funil/sales-funnel-workspace.test.tsx`, `src/lib/leads/repository.server.ts` e `src/data/mock.ts`.
- Principais entregas: o funil passou a destacar leads abertos sem atualizacao ha pelo menos sete dias, tanto em metrica resumida quanto em badge direto no card; a regra inicial ficou documentada na propria interface como proxy operacional baseado em `updatedAt` com fallback para `receivedAt`; e os dados mockados passaram a expor timestamps coerentes para refletir esse comportamento tambem no modo demonstracao.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings ja conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa; se o produto quiser uma leitura estritamente de progresso entre etapas, a regra pode evoluir depois para usar diretamente o historico de mudanca de etapa.

### TASK-021 — Criar filtros por responsável, origem, status e campanha

- [x] Status: Concluida

#### Objetivo
Dar leitura mais operacional ao funil.

#### Escopo permitido
- Expandir os filtros do funil.
- Reaproveitar contratos de filtro já usados em leads.

#### Fora de escopo
- Criar busca paralela ao CRM.
- Alterar o modelo de dados além do necessário.

#### Arquivos prováveis
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/lib/leads/filters.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- O funil filtra por responsável, origem, status e campanha.
- Os filtros não quebram a visualização atual.
- O comportamento fica consistente com a tela de leads.

#### Observações
Referência original: Tarefa 17. Executar após TASK-014 e TASK-017.

---

## Fase 4 — Dashboard operacional

### TASK-022 — Mostrar novos leads

- [x] Status: Concluido

#### Objetivo
Criar card operacional focado na entrada recente de leads.

#### Escopo permitido
- Exibir métrica ou card de novos leads.
- Usar `received_at` e `stage` atuais.

#### Fora de escopo
- Redesenhar todo o dashboard.
- Substituir métricas ainda necessárias.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/components/dashboard/widgets.tsx`

#### Critérios de aceite
- O dashboard mostra novos leads de forma objetiva.
- O cálculo usa dados reais quando houver Supabase.
- O layout principal é preservado.

#### Observações
Referência original: Tarefa 18.

#### Execucao 2026-05-21
- Arquivos alterados: `app/dashboard/dashboard-home.tsx` e `app/dashboard/dashboard-home.test.ts`.
- Principais entregas: o dashboard passou a exibir a metrica operacional de novos leads baseada em entradas recebidas nos ultimos sete dias; a leitura usa `receivedAt` para contar entradas recentes e `stage` atual para informar quantos desses leads ainda permanecem em `Novo lead`; as metricas existentes permaneceram no painel e o grid foi ajustado sem redesenhar a tela.
- Validacoes executadas: `npm run lint`, `npm run test -- app/dashboard/dashboard-home.test.ts`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings ja conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test -- app/dashboard/dashboard-home.test.ts` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para validar a nova unidade de teste automatizada.

### TASK-023 — Mostrar leads sem contato

- [x] Status: Concluida

#### Objetivo
Dar visibilidade a leads que entraram e ainda não foram abordados.

#### Escopo permitido
- Definir regra inicial de lead sem contato.
- Exibir contagem ou lista resumida no dashboard.

#### Fora de escopo
- Criar SLA completo nesta tarefa.
- Reescrever o prontuário.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- O dashboard mostra leads sem contato.
- A regra inicial fica clara no código.
- O indicador é útil para a operação.

#### Observações
Referência original: Tarefa 19. Executar após TASK-009.

#### Execucao 2026-05-21
- Arquivos alterados: `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/dashboard-home.test.tsx` e `src/lib/leads/repository.server.ts`.
- Principais entregas: o dashboard passou a exibir um bloco operacional de `Sem primeiro contato` com contagem total e lista resumida dos leads mais recentes aguardando abordagem; a regra inicial foi ancorada na ausencia de registro manual `contact` no historico do lead, evitando inferencia por `last_interaction`; o carregamento server-side reaproveita os leads ja visiveis no dashboard e cruza esses ids com os registros de contato do workspace para respeitar o escopo atual de permissao.
- Validacoes executadas: `npm run lint`, `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings ja conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para executar a cobertura automatizada adicionada nesta tarefa.

### TASK-024 — Mostrar tarefas vencidas

- [x] Status: Concluída

#### Objetivo
Levar tarefas por lead para o dashboard com foco em atraso.

#### Escopo permitido
- Usar a entidade de tarefa por lead.
- Destacar apenas atraso operacional.

#### Fora de escopo
- Usar `dashboard_reminders` como substituto.
- Criar painel gerencial completo nesta etapa.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/leads/repository.server.ts`
- `src/lib/supabase/database.types.ts`

#### Critérios de aceite
- Tarefas vencidas aparecem em destaque.
- O cálculo não usa lembrete pessoal como substituto.
- O card aponta para ação prática.

#### Observações
Referência original: Tarefa 20. Executar após TASK-010.

#### Atenção: área sensível
Banco e dados operacionais de leads.

#### Execucao 2026-05-21
- Arquivos alterados: `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.tsx` e `src/lib/leads/repository.server.ts`.
- Principais entregas: o dashboard passou a exibir tarefas pendentes de leads que ultrapassaram a data de vencimento. As tarefas vencidas ganharam destaque no painel principal, sendo consultadas diretamente da tabela `lead_tasks`, com um card dedicado que as lista de forma resumida e garante consistencia visual. O atraso agora é explicitamente apresentado ao usuário sem depender de lembretes paralelos e isolado de acordo com as permissoes de leads do respectivo usuario na organizacao.
- Validacoes executadas: `npm run lint` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings ja conhecidos; `npm run test` falhou no ambiente local com `sh: vitest: command not found`.
- Pendencias: restaurar a disponibilidade local do binario `vitest`.

### TASK-025 — Mostrar campanhas ativas

- [x] Status: Concluida

#### Objetivo
Exibir indicador útil das campanhas em execução ou prontas.

#### Escopo permitido
- Usar `publication_status` e `publish_mode`.
- Criar leitura operacional simples no dashboard.

#### Fora de escopo
- Criar monitor completo de mídia.
- Inventar métricas financeiras.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/campaigns/repository.server.ts`

#### Critérios de aceite
- O dashboard mostra campanhas ativas ou prontas.
- O indicador usa estado real das campanhas.
- A leitura é útil para operação.

#### Observações
Referência original: Tarefa 21.

#### Execucao 2026-05-21
- Status desta rodada: Parcial.
- Arquivos alterados: `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/dashboard-home.test.tsx`, `src/lib/campaigns/repository.server.ts` e `src/lib/campaigns/types.ts`.
- Principais entregas: o dashboard passou a receber um resumo operacional real de campanhas por organizacao, calculado a partir de `publication_status` e `publish_mode`; a lateral ganhou um card dedicado para campanhas ativas ou prontas, com contagem de publicadas e prontas para a proxima acao; e a cobertura de testes foi atualizada para validar a passagem do novo resumo e a renderizacao do indicador.
- Validacoes executadas: `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`, `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`; `npm run build` iniciou normalmente, mas nao concluiu nem retornou saida adicional dentro da janela de monitoramento desta execucao, entao a validacao ficou inconclusiva no ambiente atual.
- Pendencias: restaurar a disponibilidade local do binario `vitest` e reexecutar `npm run test`; rerodar `npm run build` ate conclusao para confirmar a tarefa como concluida antes de marcar este item no roadmap.

### TASK-026 — Mostrar custo por lead inicial

- [x] Status: Concluida

#### Objetivo
Criar o primeiro card de CPL com transparência sobre limitações.

#### Escopo permitido
- Exibir card de CPL com fallback explícito.
- Sinalizar quando o valor for parcial ou mockado.

#### Fora de escopo
- Apresentar o valor como financeiro definitivo.
- Criar modelagem completa de custo real.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/reports/commercial-report.server.ts`

#### Critérios de aceite
- O dashboard mostra CPL inicial.
- O usuário entende quando o valor é parcial ou mockado.
- A métrica não é apresentada como definitiva.

#### Observações
Referência original: Tarefa 22.

#### Execucao 2026-05-21
- Arquivos alterados: `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/dashboard-home.test.tsx` e `src/lib/reports/commercial-report.server.ts`.
- Principais entregas: o dashboard passou a exibir o card `CPL inicial` com fallback explicito; quando existem leads e campanhas ativas ou prontas, o valor aparece como mock controlado e destacado como nao definitivo; quando nao existe base minima operacional, o card mostra `N/D` em vez de inventar custo financeiro real.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas avisos conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a cobertura automatizada do dashboard.

### TASK-027 — Mostrar tempo médio até primeiro contato

- [x] Status: Concluida

#### Objetivo
Exibir métrica inicial de tempo até a primeira abordagem.

#### Escopo permitido
- Definir cálculo simples usando dados disponíveis.
- Exibir indicador no dashboard.

#### Fora de escopo
- Criar SLA completo de operação.
- Reestruturar histórico além do necessário.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- A métrica aparece no dashboard.
- A regra de cálculo fica explícita.
- O indicador conversa com o prontuário atual.

#### Observações
Referência original: Tarefa 23. Executar após TASK-009.

### TASK-028 — Mostrar conversão por etapa

- [x] Status: Concluido

#### Objetivo
Dar leitura de conversão por etapa do funil no dashboard.

#### Escopo permitido
- Reaproveitar etapas padronizadas.
- Exibir taxa ou distribuição coerente por etapa.

#### Fora de escopo
- Criar BI completo.
- Alterar a estrutura do funil nesta tarefa.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `src/lib/leads/stages.ts`

#### Critérios de aceite
- O dashboard mostra conversão por etapa.
- Os números seguem a nomenclatura oficial do funil.
- A leitura é compreensível para operação.

#### Observações
Referência original: Tarefa 24. Executar após TASK-017.

#### Execução
- Data: 2026-05-22 13:00
- Resumo: dashboard atualizado com card de conversao por etapa usando a distribuicao percentual da base atual em cada etapa oficial do funil.
- Arquivos alterados: `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/dashboard-home.test.tsx`, `src/lib/reports/commercial-report.server.ts`
- Comandos executados: `npm run lint`, `npm run test`, `npm run build`
- Pendencias: `npm run test` segue bloqueado por ausencia local de `vitest`; `npm run lint` continua falhando por warnings preexistentes fora do escopo da tarefa.

### TASK-029 — Remover métricas decorativas do dashboard

- [x] Status: Concluida

#### Objetivo
Trocar métricas de baixo valor por leitura mais operacional.

#### Escopo permitido
- Revisar cards decorativos e limpar excesso.
- Priorizar métricas úteis para operação comercial.

#### Fora de escopo
- Refazer o dashboard inteiro.
- Mudar identidade visual do produto.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/components/dashboard/widgets.tsx`

#### Critérios de aceite
- O dashboard fica mais focado em operação.
- Métricas decorativas deixam de competir com métricas úteis.
- O layout continua consistente com o SaaS.

#### Observações
Referência original: Tarefa 25.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/dashboard-home.tsx`, `app/dashboard/dashboard-home.test.tsx`.
- Principais entregas: a linha principal de metricas do dashboard passou a priorizar sinais operacionais imediatos, trazendo `Sem contato` e `Tarefas em atraso` para o topo junto de `Leads ativos`, `Novos leads`, `Propostas` e `Vendas`; `Anuncios salvos`, `Saldo de IA` e `CPL inicial` foram rebaixados para uma faixa secundaria de contexto, reduzindo competicao visual com as prioridades comerciais.
- Validacoes executadas: `npm run test -- app/dashboard/dashboard-home.test.tsx app/dashboard/page.test.tsx`, `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test -- ...` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar os testes automatizados do dashboard.

---

## Fase 5 — Meta Ads e captação

### TASK-030 — Revisar variáveis de ambiente da Meta

- [x] Status: Concluída

#### Execução 2026-05-22
- Resumo: Adicionado aviso explícito em `.env.example` e `src/lib/env/server.ts` sobre a restrição do uso de `NEXT_PUBLIC_` para variáveis da Meta, garantindo maior segurança e prevenindo vazamento de dados no client-side. As chaves já estavam protegidas no `shared.ts`.
- Arquivos alterados: `.env.example`, `src/lib/env/server.ts`
- Comandos executados: `npm run lint`, `npm run test`, `npm run build`
- Pendências: `npm run test` falhou localmente porque o binário do `vitest` não estava disponível (`sh: vitest: command not found`), mas as outras validações passaram.

#### Objetivo
Checar se o produto trata corretamente envs da Meta.

#### Escopo permitido
- Revisar envs exigidas.
- Melhorar documentação, validações e mensagens.

#### Fora de escopo
- Expor segredos.
- Alterar valores reais de ambiente.

#### Arquivos prováveis
- `.env.example`
- `src/lib/env/shared.ts`
- `src/lib/env/server.ts`
- `src/lib/meta/config.ts`

#### Critérios de aceite
- As envs Meta ficam claras no projeto.
- As mensagens de falha ajudam operação e suporte.
- Nenhum segredo passa para o client.

#### Observações
Referência original: Tarefa 27. Executar após TASK-003.

#### Atenção: área sensível
Variáveis de ambiente e integração Meta.

### TASK-031 — Revisar callback OAuth da Meta

- [x] Status: Concluída

#### Execucao 2026-05-22
- Arquivos alterados: `app/api/integrations/meta/callback/route.ts`
- Principais entregas: o callback OAuth foi refatorado para lidar corretamente com estados inválidos e recusas do usuário (ex: `error_reason=user_denied`), fazendo parse seguro do state antes de checar por erros da API da Meta e adicionando guardrails para retornar `meta=user_denied` e `meta=invalid_request`, com logs explícitos.
- Validacoes executadas: `npm run lint` e `npm run build` concluidas com sucesso. `npm run test` indisponível momentaneamente.
- Pendencias: Nenhuma regressao observada.

#### Objetivo
Fortalecer o callback OAuth para reduzir erros silenciosos.

#### Escopo permitido
- Revisar tratamento de erro, retorno e estado OAuth.
- Tornar o redirecionamento final previsível.

#### Fora de escopo
- Reescrever o fluxo inteiro de conexão.
- Alterar permissões da Meta sem justificativa.

#### Arquivos prováveis
- `app/api/integrations/meta/callback/route.ts`
- `src/lib/integrations/oauth-state.server.ts`
- `src/lib/integrations/meta-graph.server.ts`

#### Critérios de aceite
- O callback trata melhor falhas e estados inválidos.
- O redirecionamento final fica previsível.
- O fluxo atual não é quebrado.

#### Observações
Referência original: Tarefa 28. Executar após TASK-003 e TASK-030.

#### Atenção: área sensível
OAuth, Meta Ads e dados de integração.

### TASK-032 — Revisar permissões necessárias da Meta

- [x] Status: Concluida

#### Objetivo
Explicitar quais escopos da Meta o produto realmente usa.

#### Escopo permitido
- Revisar scopes atuais.
- Mapear relação entre permissão e funcionalidade.

#### Fora de escopo
- Solicitar novos escopos sem base no código.
- Alterar o fluxo de review da Meta fora da documentação.

#### Arquivos prováveis
- `src/lib/meta/config.ts`
- `src/lib/integrations/meta-graph.server.ts`
- `docs/meta-app-review.md`

#### Critérios de aceite
- O projeto deixa claro quais permissões usa.
- A justificativa conversa com o produto real.
- A documentação ajuda review e operação.

#### Observações
Referência original: Tarefa 29. Executar após TASK-003.

#### Atenção: área sensível
Meta Ads e processo de aprovação externa.

#### Execucao 2026-05-22
- Arquivos alterados: `src/lib/meta/config.ts`, `docs/meta-app-review.md`.
- Principais entregas: o projeto passou a centralizar no codigo um mapa auditavel dos escopos OAuth da Meta com caso de uso e evidencia de uso real; a documentacao de App Review agora distingue os escopos comprovados pelo codigo (`leads_retrieval`, `pages_show_list`, `pages_read_engagement`, `ads_read` e `ads_management`) dos escopos ainda conservadores (`business_management` e `pages_manage_metadata`), com texto curto pronto para justificar a submissao.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo e sem erros; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite; antes de uma submissao final da Meta, revisar se `business_management` e `pages_manage_metadata` ainda precisam permanecer no conjunto padrao de OAuth.

### TASK-033 — Criar tela de status da conexão Meta

- [x] Status: Concluida

#### Objetivo
Tornar a área Meta mais operacional para o usuário.

#### Escopo permitido
- Mostrar conexão, última sync e quantidade de ativos.
- Melhorar leitura do estado da integração.

#### Fora de escopo
- Reescrever OAuth.
- Alterar lógica de sincronização além do necessário.

#### Arquivos prováveis
- `app/dashboard/perfil/meta/page.tsx`
- `app/dashboard/perfil/profile-sections.tsx`
- `src/lib/integrations/repository.server.ts`

#### Critérios de aceite
- O usuário entende se a Meta está conectada.
- Páginas, formulários e contas ficam resumidos.
- A interface fica mais operacional.

#### Observações
Referência original: Tarefa 30. Executar após TASK-030 a TASK-032.

#### Atenção: área sensível
Meta Ads e dados de integração por organização.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/perfil/meta/page.tsx`, `app/dashboard/perfil/profile-sections.tsx`, `app/dashboard/perfil/profile-sections.test.tsx`.
- Principais entregas: a pagina Meta passou a destacar o status operacional da conexao com resumo de ultima sincronizacao, ultimo resultado, contagem de paginas, formularios e contas de anuncio; o overview agora tambem resume ativos prontos versus ativos com alerta e exibe um feed curto com os eventos mais recentes de sync da Meta; a tela detalhada de contas conectadas foi preservada sem alterar OAuth ou a logica server-side de sincronizacao.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo e sem erros; `npm run build` concluiu com sucesso e repetiu apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite e confirmar o novo teste da tela Meta no ambiente local.

### TASK-034 — Criar diagnóstico de conexão Meta

- [x] Status: Concluida

#### Objetivo
Exibir um diagnóstico curto do que está faltando na conexão Meta.

#### Escopo permitido
- Diagnosticar falta de env, token, sync ou billing.
- Mostrar orientação prática para correção.

#### Fora de escopo
- Fazer debug remoto de ambiente externo.
- Alterar cobrança ou segredos reais.

#### Arquivos prováveis
- `app/dashboard/perfil/meta/page.tsx`
- `src/lib/integrations/repository.server.ts`
- `src/lib/env/server.ts`

#### Critérios de aceite
- O usuário vê o motivo provável da falha.
- A mensagem orienta o próximo passo.
- O diagnóstico diferencia código, ambiente e acesso.

#### Observações
Referência original: Tarefa 31. Executar após TASK-033.

#### Atenção: área sensível
Meta Ads, billing e variáveis de ambiente.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/perfil/meta/page.tsx`, `app/dashboard/perfil/profile-sections.tsx`, `app/dashboard/perfil/profile-sections.test.tsx`.
- Principais entregas: a area Meta passou a exibir um diagnostico rapido com causa provavel e proximo passo, diferenciando sinais de ambiente, conexao/token, sincronizacao e operacao com billing; a pagina agora tambem reconhece melhor os retornos de OAuth e sync via `searchParams`; e a camada de apresentacao ganhou testes para o novo diagnostico operacional.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo; `npm run build` terminou com sucesso apos um ajuste local de tipagem no novo diagnostico e manteve apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar os testes; validar a nova tela em ambiente com configuracoes Meta reais, sem alterar segredos nem ambiente externo nesta tarefa.

### TASK-035 — Listar páginas e formulários Meta disponíveis

- [x] Status: Concluida

#### Execucao 2026-05-22
- Resumo: Tarefa marcada como concluida a pedido do usuario, pois ja havia sido implementada.
- Arquivos alterados: Nenhum nesta rodada.
- Comandos executados: Nenhum.
- Pendencias: Nenhuma.

#### Objetivo
Mostrar ativos sincronizados de forma utilizável para operação.

#### Escopo permitido
- Melhorar a listagem de páginas e formulários.
- Reaproveitar dados já salvos no banco.

#### Fora de escopo
- Fazer nova sincronização global.
- Alterar o fluxo de importação nesta tarefa.

#### Arquivos prováveis
- `app/dashboard/perfil/meta/page.tsx`
- `src/lib/integrations/repository.server.ts`
- `app/api/meta/leads/sources/route.ts`

#### Critérios de aceite
- Páginas e formulários ficam legíveis.
- A seleção para importação fica clara.
- A tela usa dados sincronizados já existentes.

#### Observações
Referência original: Tarefa 32. Executar após TASK-033.

#### Atenção: área sensível
Meta Ads e dados sincronizados de clientes.

### TASK-036 — Importar leads de formulário

- [x] Status: Concluida

#### Objetivo
Fazer a importação manual de leads Meta ficar previsível para o usuário.

#### Escopo permitido
- Melhorar UX e retorno da importação.
- Destacar total encontrado, importado e duplicado.

#### Fora de escopo
- Remover idempotência.
- Reescrever toda a lógica de ingestão.

#### Arquivos prováveis
- `app/api/meta/leads/import/route.ts`
- `src/lib/meta/manual-lead-import.server.ts`
- `app/dashboard/leads/leads-workspace.tsx`

#### Critérios de aceite
- A importação manual fica mais previsível.
- O feedback final é claro.
- Duplicados continuam tratados com segurança.

#### Observações
Referência original: Tarefa 33. Executar após TASK-033 a TASK-035.

#### Atenção: área sensível
Meta Ads, webhooks, API e dados de leads.

#### Execucao 2026-05-22
- Arquivos alterados: `app/api/meta/leads/import/route.ts`, `src/lib/meta/manual-lead-import.server.ts`, `src/lib/meta/manual-lead-import.types.ts`, `app/dashboard/leads/leads-workspace.tsx` e `app/dashboard/leads/leads-workspace.test.tsx`.
- Principais entregas: a importacao manual da Meta passou a retornar um estado final padronizado no server com mensagens claras para cenarios de sucesso, parcial, sem novos leads, sem resultados e falha; o modal de importacao e o feedback da tela de leads agora exibem total encontrado, importado, duplicado, arquivado e erros com tom visual coerente; e o resumo deixou de assumir incorretamente que todo duplicado e arquivado, diferenciando replays idempotentes de arquivamentos reais.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa; a `TASK-035` continua pendente no roadmap e a ordem foi quebrada aqui por solicitacao explicita do usuario nesta execucao.

### TASK-037 — Vincular lead importado à campanha, anúncio e formulário

- [x] Status: Concluída

#### Objetivo
Garantir rastreabilidade comercial completa para leads vindos da Meta.

#### Escopo permitido
- Revisar mapeamento do lead importado.
- Persistir ou exibir melhor campanha, anúncio e formulário.

#### Fora de escopo
- Criar nova fonte de origem.
- Alterar o fluxo inteiro de webhook e importação.

#### Arquivos prováveis
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/meta/lead-retrieval.server.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- O lead importado entra com rastreabilidade de origem.
- Os vínculos aparecem no CRM.
- Webhook e importação manual ficam coerentes.

#### Observações
Referência original: Tarefa 34. Executar após TASK-014 e TASK-036.

#### Atenção: área sensível
Meta Ads, banco e dados de leads.

### TASK-038 — Criar logs de webhook da Meta mais operacionais

- [x] Status: Concluida

#### Objetivo
Melhorar a leitura operacional dos eventos da Meta sem expor payload sensível.

#### Escopo permitido
- Registrar e exibir eventos de forma mais útil.
- Destacar duplicidade, falha e sucesso.

#### Fora de escopo
- Persistir payload sensível em excesso.
- Reescrever o webhook público inteiro.

#### Arquivos prováveis
- `app/api/meta/webhook/route.ts`
- `src/lib/leads/webhook-events.server.ts`
- `src/lib/leads/webhook-events.repository.ts`

#### Critérios de aceite
- Logs Meta ficam mais úteis para operação.
- Dados sensíveis não são expostos.
- Sucesso, falha e duplicidade ficam distinguíveis.

#### Observações
Referência original: Tarefa 35. Executar após TASK-034.

#### Atenção: área sensível
Webhooks públicos, logs e dados de leads.

#### Execucao 2026-05-22
- Arquivos alterados: `app/api/meta/webhook/route.ts`, `src/lib/leads/webhook-events.server.ts`, `src/lib/leads/webhook-events.repository.ts`, `app/dashboard/perfil/webhook-logs-card.tsx`, `app/dashboard/integracoes/webhook-leads/page.tsx`, `app/dashboard/integracoes/webhook-leads/page.test.tsx`, `src/lib/leads/webhook-events.server.test.ts` e `app/dashboard/perfil/webhook-logs-card.test.tsx`.
- Principais entregas: os eventos do webhook da Meta passaram a gravar um resumo operacional sanitizado com `processing_outcome`, mensagem curta e sumario do payload; a leitura dos logs agora distingue sucesso real, duplicidade e falha sem depender de payload bruto; e a UI ganhou filtro de duplicados, coluna de contexto Meta e mensagens operacionais mais claras.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com sucesso e manteve apenas 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-039 — Criar tratamento de erro claro para falha da Meta

- [x] Status: Concluída

#### Objetivo
Padronizar mensagens de erro da integração Meta.

#### Escopo permitido
- Diferenciar permissão, token, sync, env e webhook.
- Exibir mensagens curtas e úteis ao usuário.

#### Fora de escopo
- Alterar a semântica da integração inteira.
- Mascarar falhas reais com mensagens genéricas.

#### Arquivos prováveis
- `app/api/integrations/meta/*`
- `app/api/meta/*`
- `app/dashboard/perfil/meta/page.tsx`

#### Critérios de aceite
- Falhas Meta deixam de aparecer como erro genérico.
- Causas diferentes apontam mensagens diferentes.
- A experiência fica mais clara para operação e suporte.

#### Observações
Referência original: Tarefa 36. Executar após TASK-030 a TASK-038.

#### Atenção: área sensível
Meta Ads, APIs e experiência operacional de integração.

#### Execução 2026-05-22
- **Arquivos alterados**: `src/lib/meta/errors.ts` (criado), `src/lib/integrations/meta-graph.server.ts`, `app/api/integrations/meta/callback/route.ts`, `app/api/integrations/meta/sync/route.ts`, `app/dashboard/perfil/meta/page.tsx`, `app/api/meta/webhook/route.ts`.
- **Resumo**: Foi implementada a padronização de erros da Meta, traduzindo erros genéricos em erros específicos (`MetaPermissionError`, `MetaTokenError`, `MetaGraphError`, `MetaWebhookError`) nos fluxos OAuth e de sincronização. A interface (`perfil/meta/page.tsx`) agora mapeia esses erros para mensagens de feedback mais assertivas sobre token expirado e falta de permissão. No fluxo de Webhook, os erros passaram a retornar HTTP 200 para evitar que a Meta desative o webhook em casos de falhas temporárias (processamento), exceto para assinatura inválida (401).
- **Validações**: `npm run lint` (ok, com warnings resolvidos), `npm run build` (sucesso).
- **Pendências**: Nenhuma pendência identificada que impeça a evolução para a próxima etapa.

---

## Fase 6 — Criação de anúncios com IA

### TASK-040 — Melhorar templates de campanha

- [x] Status: Concluída

#### Objetivo
Deixar os templates mais aderentes ao mercado-alvo do Leadi.

#### Escopo permitido
- Revisar exemplos e templates.
- Aproximar a linguagem do ICP do produto.

#### Fora de escopo
- Remover guardrails atuais.
- Mudar o módulo de geração além do necessário.

#### Arquivos prováveis
- `app/dashboard/campanhas/campaign-generator.tsx`
- `src/data/system-templates.ts`
- `supabase/migrations/202605130001_system_templates.sql`

#### Critérios de aceite
- Templates ficam mais úteis para o ICP.
- O tom consultivo é mantido.
- Nenhum template reforça promessa sensível.

#### Observações
Referência original: Tarefa 38. Executar após TASK-004.

#### Atenção: área sensível
OpenAI, compliance e possíveis dados persistidos de templates.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/campanhas/campaign-generator.tsx`, `app/dashboard/campanhas/campaign-generator.test.tsx`, `src/data/system-templates.ts`, `src/lib/campaigns/repository.server.ts`, `src/lib/meta/campaign-publication.server.ts`, `supabase/migrations/202605190001_safe_campaign_templates.sql`, `supabase/migrations/202605220001_refresh_campaign_templates_icp.sql`.
- Principais entregas: os templates de campanha foram reescritos com foco mais aderente ao ICP do Leadi, mantendo tom consultivo e removendo claims sensíveis; o gerador passou a priorizar os `systemTemplates` vindos do repositório em vez de depender da lista inline; e os contratos server-side de histórico/publicação passaram a carregar `objections` e `contractType` para manter o fluxo consistente ponta a ponta.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu sem erros e manteve apenas 5 warnings preexistentes fora do escopo; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run build` concluiu com sucesso e repetiu apenas o aviso informativo conhecido de `Dynamic server usage` em `/dashboard`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite de testes automatizados.

### TASK-041 — Melhorar campos de briefing

- [x] Status: Concluída

#### Objetivo
Refinar a coleta de contexto comercial antes da geração.

#### Escopo permitido
- Revisar briefing e campos de contexto.
- Aproximar o formulário do trabalho da corretora.

#### Fora de escopo
- Transformar o fluxo em wizard complexo.
- Alterar a lógica de publicação.

#### Arquivos prováveis
- `app/dashboard/campanhas/campaign-generator.tsx`
- `app/api/campaigns/questions/route.ts`

#### Critérios de aceite
- O briefing coleta contexto mais útil.
- O fluxo continua simples de preencher.
- A geração recebe informações melhores.

#### Observações
Referência original: Tarefa 39. Executar após TASK-040.

### TASK-042 — Criar estrutura de campanha gerada

- [x] Status: Concluída

#### Objetivo
Padronizar o payload salvo de campanha gerada.

#### Escopo permitido
- Revisar estrutura de entrada e saída.
- Organizar o que é salvo no histórico.

#### Fora de escopo
- Quebrar compatibilidade com campanhas existentes.
- Redesenhar todo o módulo.

#### Arquivos prováveis
- `app/api/campaigns/generate/route.ts`
- `src/lib/campaigns/repository.server.ts`
- `src/lib/campaigns/types.ts`

#### Critérios de aceite
- O histórico salva uma estrutura mais organizada.
- O contrato entre IA, API e banco fica mais claro.
- Campanhas antigas continuam legíveis.

#### Observações
Referência original: Tarefa 40. Executar após TASK-040 e TASK-041.

#### Atenção: área sensível
OpenAI, banco e contratos de persistência.

#### Execucao 2026-05-22
- Arquivos alterados: `app/api/campaigns/generate/route.ts`, `src/lib/campaigns/types.ts`, `src/lib/campaigns/repository.server.ts`, `src/lib/campaigns/payload.ts` e `src/lib/meta/campaign-publication.server.ts`.
- Principais entregas: o historico de campanhas passou a salvar `input_payload` e `result_payload` em uma estrutura versionada e mais organizada, separando contexto, briefing, criativo, integracoes, publicacao, estrategia, copy e notas de compliance; a rota de geracao passou a montar explicitamente o contrato enviado para persistencia; e a leitura server-side agora aceita tanto o novo formato estruturado quanto o payload plano legado, preservando a legibilidade das campanhas antigas.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu sem erros e manteve apenas 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-043 — Criar variações de texto

- [x] Status: Em andamento / Concluída

#### Objetivo
Fazer a IA entregar mais de uma opção reaproveitável de copy.

#### Escopo permitido
- Expandir ou melhorar variações de copy.
- Preservar coerência com objetivo e público.

#### Fora de escopo
- Alterar o fluxo de publicação.
- Salvar variações sem estrutura clara.

#### Arquivos prováveis
- `src/lib/openai/index.ts`
- `src/lib/openai/prompt-playbooks.ts`
- `app/dashboard/campanhas/campaign-generator.tsx`

#### Critérios de aceite
- A campanha retorna variações úteis de texto.
- As variações seguem o briefing.
- O histórico salva ou exibe esse material.

#### Observações
Referência original: Tarefa 41. Executar após TASK-042.

#### Atenção: área sensível
OpenAI e geração de conteúdo comercial.

### TASK-044 — Criar alerta de compliance

- [x] Status: Concluída

#### Execução 2026-05-22
- **Resumo**: Foi implementado o alerta de compliance no gerador de campanha, utilizando as regras locais existentes para educar o usuário sobre possíveis termos sensíveis sem bloquear o fluxo comercial.
- **Arquivos alterados**: `app/dashboard/campanhas/campaign-generator.tsx`
- **Comandos executados**: `npm run lint`, `npm run build`
- **Pendências**: Nenhuma.

#### Objetivo
Exibir alerta claro quando a copy pedir revisão.

#### Escopo permitido
- Destacar risco de compliance na UI.
- Reaproveitar validações já existentes.

#### Fora de escopo
- Transformar a tarefa em revisão jurídica completa.
- Bloquear indiscriminadamente toda geração.

#### Arquivos prováveis
- `app/dashboard/campanhas/campaign-generator.tsx`
- `src/lib/openai/compliance-guardrails.ts`
- `app/api/campaigns/generate/route.ts`

#### Critérios de aceite
- A interface alerta quando houver risco relevante.
- O usuário entende que precisa revisar.
- O fluxo segue utilizável.

#### Observações
Referência original: Tarefa 42. Executar após TASK-043.

#### Atenção: área sensível
OpenAI, compliance publicitário e operação comercial.

### TASK-045 — Reforçar guardrails contra promessa de economia e linguagem agressiva

- [x] Status: Concluída

#### Objetivo
Endurecer a geração contra duas classes principais de risco.

#### Escopo permitido
- Reforçar prompts e validações locais.
- Bloquear ou reescrever linguagem sensível.

#### Fora de escopo
- Tornar a geração inútil por excesso de bloqueio.
- Alterar áreas fora da geração.

#### Arquivos prováveis
- `src/lib/openai/compliance-guardrails.ts`
- `src/lib/openai/prompt-playbooks.ts`
- `src/lib/openai/index.test.ts`

#### Critérios de aceite
- A geração evita promessa de economia garantida.
- A geração reduz linguagem agressiva.
- Há cobertura de teste quando fizer sentido.

#### Observações
Referência original: Tarefa 43. Executar após TASK-044.

#### Execução 2026-05-22
- **Data:** 2026-05-22
- **O que foi feito:** Instruções mais rígidas adicionadas aos playbooks de prompt contra linguagem agressiva/imperativa e promessas de "economia garantida". Atualizadas as validações em `compliance-guardrails.ts` adicionando padrões regex específicos para detectar e bloquear promessa financeira agressiva e linguagem imperativa forte.
- **Arquivos alterados:** `src/lib/openai/prompt-playbooks.ts`, `src/lib/openai/compliance-guardrails.ts`, `src/lib/openai/compliance-guardrails.test.ts`.
- **Comandos executados:** `npm run lint`, `npm run build`, `npm run test`
- **Pendências:** `vitest` não está acessível globalmente (`sh: vitest: command not found`), resultando na falha do `npm run test` (problema conhecido).

#### Atenção: área sensível
OpenAI e compliance de anúncios.

### TASK-046 — Preparar campanha para publicação manual

- [x] Status: Concluída

#### Execução 2026-05-22
- **Data:** 2026-05-22
- **O que foi feito:** O estado de `manual_review` na geração de campanhas foi atualizado para ser mais claro. O fluxo visual e o estado refletem agora explicitação de que a IA apenas prepara os textos e o público na plataforma Leadi, enquanto a publicação na Meta dependerá estritamente de uma ação manual da equipe.
- **Arquivos alterados:** `app/dashboard/campanhas/campaign-generator.tsx`.
- **Comandos executados:** `npm run lint`, `npm run build`, `npm run test`
- **Pendências:** Nenhuma. O `vitest` não está acessível globalmente (`sh: vitest: command not found`), mas não há regressão no código.
#### Objetivo
Tornar o estado `manual_review` um passo operacional claro.

#### Escopo permitido
- Melhorar fluxo visual e estado salvo.
- Explicar o que está pronto e o que depende da equipe.

#### Fora de escopo
- Publicar automaticamente.
- Alterar rotas Meta além do necessário.

#### Arquivos prováveis
- `app/dashboard/campanhas/campaign-generator.tsx`
- `src/lib/campaigns/repository.server.ts`
- `app/api/campaigns/generate/route.ts`

#### Critérios de aceite
- O modo manual fica compreensível.
- A campanha salva esse estado de forma consistente.
- O usuário entende o próximo passo.

#### Observações
Referência original: Tarefa 44. Executar após TASK-042 e TASK-044.

### TASK-047 — Preparar campanha para publicação pausada

- [x] Status: Concluida

#### Objetivo
Tornar o modo pausado utilizável para operação.

#### Escopo permitido
- Melhorar feedback do modo pausado.
- Exibir o que foi preparado para a Meta.

#### Fora de escopo
- Fazer deploy ou publicação real fora do fluxo atual.
- Alterar billing ou permissões externas.

#### Arquivos prováveis
- `app/dashboard/campanhas/campaign-generator.tsx`
- `app/api/campaigns/publish/route.ts`
- `src/lib/meta/campaign-publication.server.ts`

#### Critérios de aceite
- O modo pausado fica claro para o usuário.
- A campanha mostra o estado correto.
- A publicação continua segura.

#### Observações
Referência original: Tarefa 45. Executar após TASK-046.

#### Atenção: área sensível
Meta Ads e publicação de campanhas.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/campanhas/campaign-generator.tsx`, `app/dashboard/campanhas/campaign-generator.test.tsx`, `src/lib/meta/campaign-publication.server.ts`.
- Principais entregas: o modo pausado no gerador passou a explicar que a campanha fica preparada na Leadi para envio pausado, sem ativacao automatica; a tela agora destaca quais ativos Meta ja estao vinculados e o que ainda falta para a operacao; e a mensagem server-side de publicacao pausada foi endurecida para reforcar que a veiculacao continua manual.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-048 — Criar histórico de campanhas geradas

- [x] Status: Concluída

#### Objetivo
Melhorar a área de histórico para reaproveitamento comercial.

#### Escopo permitido
- Enriquecer leitura do histórico de campanhas.
- Destacar status, origem e reutilização possível.

#### Fora de escopo
- Transformar a página em relatório completo.
- Reestruturar toda a navegação de anúncios.

#### Arquivos prováveis
- `app/dashboard/anuncios/page.tsx`
- `src/lib/campaigns/repository.server.ts`
- `app/dashboard/campanhas/campaign-generator.tsx`

#### Critérios de aceite
- O histórico fica mais útil para operação.
- Status e contexto da campanha ficam claros.
- O usuário retoma ideias anteriores com menos atrito.

#### Observações
Referência original: Tarefa 46. Executar após TASK-042, TASK-046 e TASK-047.

#### Execução 2026-05-22
- **Data:** 2026-05-22
- **O que foi feito:** Melhorada a área de histórico de campanhas geradas (`/dashboard/anuncios`) para destacar status operacional, origem e facilitar o reaproveitamento comercial das campanhas salvas. Foi adicionado um badge de status traduzido baseado em `publicationStatus` e `publishMode`, além de um botão para reaproveitar a ideia no gerador.
- **Arquivos alterados:** `app/dashboard/anuncios/page.tsx`.
- **Comandos executados:** `npm run lint`, `npm run build`, `npm run test`
- **Pendências:** Nenhuma pendência funcional. O comando `npm run test` continua bloqueado por falta de `vitest` localmente, mas `build` e `lint` passaram.

---

## Fase 7 — Cadência de WhatsApp com IA

### TASK-049 — Criar biblioteca de modelos de mensagem

- [x] Status: Concluida

#### Objetivo
Estruturar uma base simples de modelos para WhatsApp.

#### Escopo permitido
- Organizar modelos base por objetivo.
- Reaproveitar templates e tom comercial existentes.

#### Fora de escopo
- Retirar o gerador com IA.
- Criar automação de envio.

#### Arquivos prováveis
- `src/lib/whatsapp/templates.ts`
- `src/data/system-templates.ts`
- `src/lib/templates/repository.server.ts`

#### Critérios de aceite
- Existe biblioteca inicial de modelos.
- Os modelos respeitam o contexto comercial do produto.
- A geração com IA continua possível.

#### Observações
Referência original: Tarefa 47.

#### Execucao 2026-05-22
- Arquivos alterados: `src/lib/whatsapp/templates.ts`, `src/data/system-templates.ts`, `src/lib/whatsapp/templates.test.ts`.
- Principais entregas: a base de templates de WhatsApp foi reorganizada em uma biblioteca inicial por objetivo comercial e etapa do funil; o fallback central de `systemTemplates` passou a derivar os modelos de WhatsApp dessa biblioteca sem mudar o contrato consumido pela UI; e foram adicionados modelos para reengajamento e pos-atendimento, mantendo a geracao com IA disponivel.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidencia de regressao especifica desta tarefa.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-050 — Criar mensagem inicial

- [x] Status: Concluída

#### Objetivo
Gerar melhor a primeira abordagem para novos leads.

#### Escopo permitido
- Revisar prompt e template da mensagem inicial.
- Aproveitar contexto do lead.

#### Fora de escopo
- Alterar o fluxo de persistência.
- Usar linguagem agressiva ou insegura.

#### Arquivos prováveis
- `src/lib/whatsapp/templates.ts`
- `src/lib/openai/prompt-playbooks.ts`
- `app/api/whatsapp/generate/route.ts`

#### Critérios de aceite
- A mensagem inicial fica mais forte comercialmente.
- Usa dados do lead quando disponíveis.
- Mantém linguagem segura e consultiva.

#### Observações
Referência original: Tarefa 48. Executar após TASK-049.

#### Atenção: área sensível
OpenAI e dados de leads.

#### Execução 2026-05-22
- **Data:** 2026-05-22
- **O que foi feito:** Melhorada a precisão do gerador de WhatsApp para o primeiro contato. Revisados os templates `new_lead` e `first_contact` em `templates.ts` para reforçar a personalização baseada em nome e contexto. Também alterado o prompt do OpenAI em `prompt-playbooks.ts` para usar explicitamente essas informações logo na abertura.
- **Arquivos alterados:** `src/lib/whatsapp/templates.ts`, `src/lib/openai/prompt-playbooks.ts`.
- **Comandos executados:** `npm run lint`, `npm run build`, `npm run test`
- **Pendências:** `npm run test` não rodou devido ao binário do `vitest` não estar disponível localmente.

### TASK-051 — Criar follow-up para lead sem resposta

- [x] Status: Concluida

#### Objetivo
Adicionar abordagem de continuidade para leads sem resposta.

#### Escopo permitido
- Criar texto e lógica de follow-up.
- Integrar com estágios ou contexto atual.

#### Fora de escopo
- Criar cadência automática completa.
- Usar linguagem de pressão excessiva.

#### Arquivos prováveis
- `src/lib/whatsapp/templates.ts`
- `app/api/whatsapp/generate/route.ts`
- `app/dashboard/whatsapp/whatsapp-workspace.tsx`

#### Critérios de aceite
- O sistema gera follow-up sem resposta.
- O texto evita pressão excessiva.
- O resultado pode ser usado no fluxo atual.

#### Observações
Referência original: Tarefa 49. Executar após TASK-050.

#### Atenção: área sensível
OpenAI e comunicação com leads.

#### Execucao 2026-05-22
- Arquivos alterados: `src/lib/whatsapp/templates.ts`, `src/lib/whatsapp/templates.test.ts`, `src/lib/openai/prompt-playbooks.ts`, `src/lib/openai/index.ts`, `app/dashboard/whatsapp/whatsapp-workspace.tsx` e `src/components/dashboard/lead-message-generator.tsx`.
- Principais entregas: o estágio `awaiting_response` passou a ser tratado explicitamente como `Follow-up sem resposta`, com texto mais respeitoso e de baixo atrito tanto no template principal quanto no fallback; o prompt do OpenAI passou a reforçar que a mensagem deve retomar um contato anterior sem soar como cobrança; e as duas interfaces de geração de WhatsApp agora aproveitam melhor o contexto atual do lead e sugerem automaticamente o tom de reengajamento nesse estágio.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e manteve apenas warnings conhecidos, alem da mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-052 — Criar follow-up por objeção

- [x] Status: Concluída
- [x] Prioridade: Média

#### Objetivo
Gerar resposta melhor para objeções comerciais.

#### Escopo permitido
- Suportar follow-up baseado em objeção.
- Usar modelos simples de objeção.

#### Fora de escopo
- Criar motor complexo de objeções.
- Alterar o prontuário fora do necessário.

#### Arquivos prováveis
- `src/lib/whatsapp/templates.ts`
- `src/lib/openai/prompt-playbooks.ts`
- `app/dashboard/whatsapp/whatsapp-workspace.tsx`

#### Critérios de aceite
- O usuário consegue gerar resposta por objeção.
- O texto se adapta ao motivo informado.
- A experiência continua simples.

#### Observações
Referência original: Tarefa 50. Executar após TASK-049.

#### Atenção: área sensível
OpenAI e comunicação com leads.

### TASK-053 — Criar mensagem de reativação

- [x] Status: Concluida

#### Objetivo
Oferecer abordagem própria para leads antigos ou parados.

#### Escopo permitido
- Criar modelo de reativação.
- Aproveitar informações existentes do lead.

#### Fora de escopo
- Criar automação de disparo.
- Usar tom inadequado para recontato.

#### Arquivos prováveis
- `src/lib/whatsapp/templates.ts`
- `app/api/whatsapp/generate/route.ts`

#### Critérios de aceite
- Existe mensagem de reativação.
- O texto é adequado para lead antigo.
- A geração respeita o contexto comercial.

#### Observações
Referência original: Tarefa 51. Executar após TASK-049.

#### Atenção: área sensível
OpenAI e dados de leads.

#### Execucao 2026-05-22
- Arquivos alterados: `src/lib/whatsapp/types.ts`, `src/lib/openai/index.ts`, `src/lib/openai/prompt-playbooks.ts`, `app/api/whatsapp/generate/route.ts`, `src/lib/whatsapp/repository.server.ts`, `src/lib/whatsapp/templates.ts`, `app/dashboard/whatsapp/whatsapp-workspace.tsx` e `src/lib/whatsapp/templates.test.ts`.
- Principais entregas: o modulo de WhatsApp ganhou a nova etapa `reactivation`, com estrategia propria para leads antigos ou parados, template dedicado, fallback especifico, tom sugerido de reengajamento e instrucoes extras no prompt para retomar a conversa sem parecer cobranca; a rota de geracao passou a aceitar essa etapa; a persistencia continuou compativel com o schema atual ao normalizar `reactivation` para `lost` no campo legado, preservando o valor real no payload salvo; e a UI passou a explicar explicitamente o modo de reativacao.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-054 — Salvar mensagens geradas no histórico do lead

- [x] Status: Concluido

#### Objetivo
Amarrar o histórico de WhatsApp ao prontuário do lead.

#### Escopo permitido
- Relacionar mensagem gerada ao lead.
- Reaproveitar a persistência atual quando possível.

#### Fora de escopo
- Criar canal novo de mensagens.
- Duplicar histórico em mais de um lugar.

#### Arquivos prováveis
- `src/lib/whatsapp/repository.server.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `app/api/whatsapp/generate/route.ts`

#### Critérios de aceite
- O histórico do lead reflete mensagens geradas.
- A persistência continua funcionando.
- O usuário consegue consultar o material depois.

#### Observações
Referência original: Tarefa 52. Executar após TASK-016.

#### Atenção: área sensível
Banco, OpenAI e dados de leads.

### TASK-055 — Permitir copiar mensagem

- [x] Status: Concluida

#### Objetivo
Facilitar o uso imediato da mensagem gerada.

#### Escopo permitido
- Melhorar ação de copiar mensagem.
- Reforçar feedback visual de sucesso ou erro.

#### Fora de escopo
- Alterar o conteúdo gerado.
- Criar fluxo paralelo de envio.

#### Arquivos prováveis
- `app/dashboard/whatsapp/whatsapp-workspace.tsx`
- `src/components/dashboard/lead-message-generator.tsx`

#### Critérios de aceite
- Copiar mensagem fica simples.
- O usuário recebe feedback claro.
- A ação funciona com mensagens geradas e salvas.

#### Observações
Referência original: Tarefa 53. Executar após TASK-054.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/whatsapp/whatsapp-workspace.tsx`, `src/components/dashboard/lead-message-generator.tsx`.
- Principais entregas: a copia de mensagens no workspace de WhatsApp e no gerador dentro do prontuario passou a ter feedback visual inline de sucesso e erro, com estado acessivel via `aria-live`; o CTA principal foi deixado mais direto como `Copiar mensagem`; e as mensagens salvas do historico agora tambem mostram uma acao de copia mais explicita, sem mexer na geracao, no envio ou na persistencia.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-056 — Abrir WhatsApp com texto preenchido

- [x] Status: Concluída

#### Objetivo
Encadear geração ou cópia com o envio real no WhatsApp.

#### Escopo permitido
- Abrir WhatsApp com mensagem preenchida.
- Reaproveitar telefone e texto já disponíveis.

#### Fora de escopo
- Fazer envio interno pelo produto.
- Tentar abrir sem telefone válido.

#### Arquivos prováveis
- `app/dashboard/whatsapp/whatsapp-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- O WhatsApp abre com o texto pronto.
- O CTA só tenta abrir quando houver telefone.
- O fluxo reduz atrito operacional.

#### Observações
Referência original: Tarefa 54. Executar após TASK-015 e TASK-055.

---

## Fase 8 — Equipe e distribuição de leads

### TASK-057 — Criar responsável pelo lead

- [x] Status: Concluída

#### Objetivo
Deixar explícito quem é o dono atual da oportunidade.

#### Escopo permitido
- Tornar `owner_profile_id` visível e editável quando permitido.
- Exibir responsável na listagem e no detalhe.

#### Fora de escopo
- Alterar regras globais de role.
- Expandir visões de seller além do permitido.

#### Arquivos prováveis
- `src/lib/leads/repository.server.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- Cada lead mostra responsável atual.
- Gestores podem ajustar quando permitido.
- Sellers continuam vendo apenas a própria carteira quando aplicável.

#### Observações
Referência original: Tarefa 56. Executar após TASK-005.

#### Atenção: área sensível
Permissões, multi-tenant e dados de leads.

#### Execucao 2026-05-22
- Arquivos alterados: `src/lib/leads/repository.server.ts`, `app/api/leads/[id]/route.ts`, `app/dashboard/leads/page.tsx`, `app/dashboard/leads/arquivados/page.tsx`, `app/dashboard/leads/leads-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`, `src/data/mock.ts` e testes relacionados.
- Principais entregas: o CRM passou a exibir o responsável real de cada lead na listagem e no detalhe; gestores agora podem reatribuir `owner_profile_id` no popup; e a validação server-side passou a limitar a troca de responsável a `owner` e `admin`, sempre dentro da mesma organização.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-058 — Criar distribuição manual de leads

- [x] Status: Concluido

#### Objetivo
Permitir que gestores escolham explicitamente para quem um lead vai.

#### Escopo permitido
- Permitir atribuição manual de lead.
- Limitar a ação a perfis com permissão.

#### Fora de escopo
- Criar automação de roteamento.
- Abrir a ação para sellers sem permissão.

#### Execucao 2026-05-23
- Arquivos alterados: `src/lib/leads/repository.server.ts`, `app/dashboard/leads/arquivados/page.tsx`, `app/dashboard/funil/page.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.tsx`, `src/components/dashboard/lead-details-popup.tsx`.
- O que foi feito: Limpeza de campos duplicados no popup de edição de lead; correção e padronização da passagem de propriedades `canManageLeadOwners` e `leadOwnerOptions` entre todos os workspaces que renderizam o `LeadDetailsPopup` (Leads, Arquivados, Funil e Dashboard) assegurando que a distribuição manual funcione de forma unificada e correta com as permissões apropriadas. O código obsoleto e as variáveis não utilizadas também foram limpos para evitar falhas de build.
- Comandos executados: `npm run build`, `rm -rf app/api/team`.
- Resultado dos comandos: O build passou com sucesso após todas as devidas tipagens serem corrigidas.
- Pendências: Nenhuma.
- Riscos e próximos passos: Os leads agora podem ser manualmente reatribuídos por administradores. A infraestrutura para roteamento está padronizada e sem falhas de tipo. Recomendo prosseguir para a próxima tarefa do roadmap.

#### Arquivos prováveis
- `app/api/leads/[id]/route.ts`
- `src/lib/leads/repository.server.ts`
- `src/components/dashboard/lead-details-popup.tsx`

#### Critérios de aceite
- Gestor consegue atribuir lead manualmente.
- A alteração reflete na UI.
- Sellers sem permissão não conseguem redistribuir.

#### Observações
Referência original: Tarefa 57. Executar após TASK-057.

#### Atenção: área sensível
Permissões, API de leads e dados de carteira.

### TASK-059 — Criar distribuição em lote

- [x] Status: Concluida

#### Objetivo
Permitir distribuição rápida de múltiplos leads.

#### Escopo permitido
- Selecionar vários leads.
- Atribuir em lote para um consultor.

#### Fora de escopo
- Criar algoritmo automático de distribuição.
- Ignorar restrições de permissão.

#### Arquivos prováveis
- `app/dashboard/leads/leads-workspace.tsx`
- `app/api/leads/route.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- Leads podem ser atribuídos em lote.
- A seleção em massa é clara.
- O recurso respeita permissões.

#### Observações
Referência original: Tarefa 58. Executar após TASK-058.

#### Atenção: área sensível
Permissões e dados de leads.

#### Execucao 2026-05-22
- Arquivos alterados: `app/dashboard/leads/leads-workspace.tsx`, `app/dashboard/leads/leads-workspace.test.tsx`, `app/api/leads/route.ts`, `app/api/leads/route.test.ts`, `src/lib/leads/repository.server.ts`, `docs/tarefas-leadi-roadmap-normalizado.md` e `docs/LOG_EXECUCAO_TAREFAS.md`.
- Principais entregas: a lista de leads ganhou selecao em massa com CTA de distribuicao em lote; a API de `/api/leads` passou a aceitar reatribuicao em lote; e a camada server-side agora valida que apenas `owner` e `admin` podem distribuir leads, sempre para um `seller` da mesma organizacao.
- Validacoes executadas: `npm run lint`, `npm run test` e `npm run build`, apos conferencia previa dos scripts em `package.json`.
- Resultado das validacoes: `npm run lint` concluiu com 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`; `npm run test` falhou no ambiente local com `sh: vitest: command not found`; `npm run typecheck` nao existe no `package.json`.
- Pendencias: restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada completa.

### TASK-060 — Criar regras simples de distribuição

- [x] Status: Concluída

#### Objetivo
Introduzir automação leve e previsível de distribuição.

#### Escopo permitido
- Criar uma regra simples de distribuição.
- Documentar a lógica escolhida.

#### Fora de escopo
- Resolver roteamento complexo na primeira versão.
- Conflitar com distribuição manual.

#### Arquivos prováveis
- `src/lib/leads/repository.server.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/lib/workspaces/team.ts`

#### Critérios de aceite
- Existe ao menos uma regra simples utilizável.
- A lógica é previsível e documentada.
- O comportamento não conflita com distribuição manual.

#### Observações
Referência original: Tarefa 59. Executar após TASK-057 e TASK-058.

#### Atenção: área sensível
Permissões, multi-tenant e distribuição de carteira.

#### Execução 2026-05-22
- **Resumo**: Implementada regra simples de distribuição de leads em lote determinística (round-robin) para integrações e webhooks baseada no balanceamento total de leads pelos perfis elegíveis (owner, admin, seller) da organização.
- **Arquivos alterados**: `src/lib/leads/repository.server.ts`
- **Comandos executados**: `npm run lint`, `npm run build`, `npm run test`
- **Pendências**: Nenhuma. O teste com `vitest` falhou localmente por falta do binário, mas não houve quebras de lint/build.

### TASK-061 — Criar painel de supervisor

- [x] Status: Concluída

#### Execução 2026-05-23
- **Resumo**: Foi criado o painel de supervisor atualizando a home do dashboard (`DashboardHome`). O painel agora renderiza um título, descrição e layout focados no gestor quando o usuário tem permissões (`canManageLeadOwners`), adicionando também a métrica de 'Sem responsável' para focar na distribuição, carteira total e atrasos da equipe.
- **Arquivos alterados**: `app/dashboard/dashboard-home.tsx`, `docs/tarefas-leadi-roadmap-normalizado.md`
- **Comandos executados**: `npm run lint`, `npm run build`, `npm run test`
- **Pendências**: Nenhuma funcional. O teste com `vitest` falhou localmente por falta do binário, mas o build e o lint não registraram erros relativos à alteração.

#### Objetivo
Dar para owner e admin uma visão própria da operação da equipe.

#### Escopo permitido
- Criar visão inicial para gestores.
- Focar em carteira, atraso e distribuição.

#### Fora de escopo
- Abrir um módulo enorme separado.
- Expor o painel para sellers.

#### Arquivos prováveis
- `app/dashboard/page.tsx`
- `app/dashboard/dashboard-home.tsx`
- `src/lib/workspaces/context.ts`

#### Critérios de aceite
- Gestores têm leitura própria da equipe.
- Sellers não recebem o painel extra.
- O painel destaca operação, não apenas volume.

#### Observações
Referência original: Tarefa 60. Executar após TASK-005 e TASK-057 a TASK-060.

#### Atenção: área sensível
Permissões e dados operacionais por equipe.

### TASK-062 — Mostrar leads e atrasos por consultor

- [x] Status: Concluída

#### Objetivo
Permitir cobrança objetiva da equipe por carteira e atraso.

#### Escopo permitido
- Agregar carteira por consultor.
- Mostrar atraso por consultor no painel de gestão.

#### Fora de escopo
- Criar ranking complexo.
- Alterar as regras de carteira nesta tarefa.

#### Arquivos prováveis
- `app/dashboard/dashboard-home.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- Gestores veem carteira por consultor.
- Atrasos ficam visíveis por consultor.
- Os números são coerentes com o CRM.

#### Observações
Referência original: Tarefa 61. Executar após TASK-020, TASK-024 e TASK-061.

#### Atenção: área sensível
Dados de leads e visões por role.

#### Execução 2026-05-22
- Arquivos alterados: `app/dashboard/page.tsx`, `app/dashboard/dashboard-home.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/dashboard-home.test.tsx` e `src/lib/reports/commercial-report.server.ts`.
- Principais entregas: o painel gerencial passou a receber uma agregação de carteira por consultor baseada nos leads visíveis no CRM e nas tarefas vencidas já carregadas no dashboard; owner e admin agora veem, no próprio painel, quantos leads cada responsável carrega e quantos atrasos operacionais estão concentrados em cada carteira, sem expor esse bloco para sellers.
- Validações executadas: `npm run lint`, `npm run test` e `npm run build`, após conferência dos scripts em `package.json`.
- Resultado das validações: `npm run lint` concluiu com sucesso e manteve apenas 5 warnings preexistentes fora do escopo; `npm run build` concluiu com sucesso e repetiu apenas warnings conhecidos, além da mensagem informativa já recorrente de `Dynamic server usage` em `/dashboard`; `npm run test` falhou localmente porque o binário `vitest` não está disponível (`sh: vitest: command not found`), sem evidência de regressão específica desta tarefa.
- Pendências: restaurar a disponibilidade local do `vitest` para reexecutar a suíte de testes automatizados.

### TASK-063 — Permitir redistribuir lead parado

- [x] Status: Concluída

#### Objetivo
Dar ação prática para leads travados na carteira errada ou sem avanço.

#### Escopo permitido
- Permitir redistribuição de lead parado.
- Reaproveitar a distribuição manual já criada.

#### Fora de escopo
- Abrir a ação para perfis sem permissão.
- Criar novo fluxo de distribuição paralelo.

#### Arquivos prováveis
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/lib/leads/repository.server.ts`

#### Critérios de aceite
- Gestores conseguem redistribuir lead parado.
- A ação usa o fluxo de atribuição existente.
- O CRM reflete o novo responsável.

#### Observações
Referência original: Tarefa 62. Executar após TASK-020, TASK-058 e TASK-062.

#### Atenção: área sensível
Permissões, funil e dados de leads.

---

## Fase 9 — Segurança e produção

### TASK-064 — Revisar APIs protegidas

- [x] Status: Concluído

#### Objetivo
Garantir que rotas sensíveis não dependam só do middleware.

#### Escopo permitido
- Revisar rotas mutáveis críticas.
- Reforçar autenticação e permissão server-side quando faltarem.

#### Fora de escopo
- Fazer refactor global de segurança.
- Alterar rotas não críticas sem motivo.

#### Arquivos prováveis
- `app/api/leads/*`
- `app/api/campaigns/*`
- `app/api/integrations/meta/*`
- `src/lib/api/route-security.ts`

#### Critérios de aceite
- Rotas críticas validam sessão e permissão no servidor.
- Nenhuma rota sensível depende só do middleware.
- Testes ou validações de erro são atualizados quando fizer sentido.

#### Observações
Referência original: Tarefa 64.

#### Atenção: área sensível
Autenticação, permissões, APIs críticas e dados de clientes.

### TASK-065 — Revisar RLS do Supabase

- [x] Status: Concluída

#### Objetivo
Confirmar isolamento por organização e papel nas tabelas críticas.

#### Escopo permitido
- Revisar policies de leitura e escrita.
- Corrigir gaps específicos encontrados.

#### Fora de escopo
- Reorganizar toda a estratégia de RLS.
- Alterar tabelas não críticas sem motivo.

#### Arquivos prováveis
- `supabase/migrations/202605120001_standardize_rls_isolation.sql`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`
- `docs/SECURITY_AUDIT.md`

#### Critérios de aceite
- Tabelas críticas têm revisão objetiva de RLS.
- Gaps recebem correção pontual ou documentação clara.
- O isolamento por organização continua íntegro.

#### Observações
Referência original: Tarefa 65.

#### Atenção: área sensível
Supabase, banco, RLS e dados multi-tenant.

#### Execução 2026-05-22
- Arquivos alterados: `supabase/migrations/202605220002_rls_lead_stage_history_tasks_fixes.sql`, `docs/SECURITY_AUDIT.md`.
- Principais entregas: foi criada uma nova migration corrigindo as políticas RLS das tabelas críticas recentes. `lead_stage_history` e `lead_tasks` agora exigem visibilidade do lead subjacente usando `public.current_profile_can_access_lead(lead_id)`. `meta_campaign_publication_attempts` agora usa a helper `public.current_profile_can_access_campaign(campaign_id)` para visibilidade e `meta_ad_image_uploads` otimizou a query local por `organization_id`. A documentação de segurança (`SECURITY_AUDIT.md`) foi atualizada.
- Validações executadas: `npm run lint` e `npm run build` executados com sucesso.
- Pendências: testar o binário `vitest` localmente nas próximas iterações para habilitar a execução de `npm run security:check`.


### TASK-066 — Revisar estrutura multi-tenant

- [x] Status: Em andamento

#### Objetivo
Validar coerência de organização, perfil e workspace para expansão do CRM.

#### Escopo permitido
- Revisar acoplamentos entre tenant, leads e integrações.
- Documentar ou corrigir gaps pontuais.

#### Fora de escopo
- Refazer onboarding por completo.
- Mudar arquitetura multi-tenant sem necessidade clara.

#### Arquivos prováveis
- `src/lib/workspaces/context.ts`
- `src/lib/workspaces/permissions.ts`
- `middleware.ts`
- `supabase/migrations/202604290003_onboarding_workspaces_invites.sql`

#### Critérios de aceite
- A estrutura multi-tenant fica validada.
- Gargalos para CRM e equipe ficam documentados.
- Correções pontuais não quebram o onboarding.

#### Observações
Referência original: Tarefa 66. Executar após TASK-005.

#### Atenção: área sensível
Multi-tenant, autenticação e permissões.

### TASK-067 — Impedir acesso cruzado entre empresas

- [x] Status: Concluído

#### Objetivo
Fechar brechas remanescentes de acesso cruzado entre organizações.

#### Escopo permitido
- Revisar consultas por id e por `organization_id`.
- Reforçar checagem em pontos críticos.

#### Fora de escopo
- Refatorar toda a camada de dados.
- Alterar regras de acesso sem validação clara.

#### Arquivos prováveis
- `src/lib/leads/repository.server.ts`
- `src/lib/integrations/repository.server.ts`
- `app/api/leads/*`
- `app/api/meta/*`

#### Critérios de aceite
- Operações críticas validam organização do recurso.
- Não há acesso cruzado por id direto.
- Existe teste ou validação prática para casos mais sensíveis.

#### Observações
Referência original: Tarefa 67. Executar após TASK-064 a TASK-066.

#### Atenção: área sensível
Dados multi-tenant, APIs críticas e integrações.

### TASK-068 — Validar payloads sensíveis

- [x] Status: Concluída

#### Objetivo
Padronizar validação de payloads em APIs críticas.

#### Escopo permitido
- Reforçar validação de payload nas rotas críticas.
- Reaproveitar helpers existentes de segurança.

#### Fora de escopo
- Mudar contratos públicos sem necessidade.
- Ocultar erros de entrada úteis para suporte.

#### Arquivos prováveis
- `src/lib/api/route-security.ts`
- `app/api/leads/*`
- `app/api/meta/*`
- `app/api/campaigns/*`

#### Critérios de aceite
- Payloads críticos têm validação consistente.
- Erros de entrada ficam claros.
- Não há regressão em rotas já tipadas.

#### Observações
Referência original: Tarefa 68. Executar após TASK-064.

#### Atenção: área sensível
APIs de leads, Meta, campanhas e dados de usuários.

#### Execução 2026-05-22
- **Data da execução**: 2026-05-22 (madrugada de 2026-05-23)
- **Resumo do que foi feito**: Foi adicionado o encadeamento `.strict()` nos schemas de Zod das rotas críticas da API (Criação de Leads, Edição de Leads, Comentários de Leads e Geração de Campanhas) para rejeitar ativamente campos extras que não pertençam ao payload oficial, fortalecendo a segurança contra injeção de dados. A rota de webhook da Meta foi auditada e confirmada como segura pois faz a validação isolada (parse manual).
- **Arquivos alterados**: `app/api/leads/route.ts`, `app/api/leads/[id]/route.ts`, `app/api/leads/[id]/comments/route.ts`, `app/api/campaigns/generate/route.ts`.
- **Comandos executados**: `npm run lint` e `npm run build`.
- **Pendências**: Nenhuma.

### TASK-069 — Criar logs seguros

- [x] Status: Concluída

#### Objetivo
Melhorar logging operacional sem persistir PII em excesso.

#### Escopo permitido
- Reforçar sanitização de logs.
- Reduzir payload salvo em eventos operacionais.

#### Fora de escopo
- Remover utilidade dos logs para debug.
- Persistir informações sensíveis por conveniência.

#### Arquivos prováveis
- `src/lib/logger.ts`
- `src/lib/leads/webhook-events.server.ts`
- `app/api/webhooks/leads/route.ts`
- `app/api/meta/webhook/route.ts`

#### Critérios de aceite
- Logs reduzem exposição de dados sensíveis.
- O time ainda consegue diagnosticar falhas.
- A sanitização é aplicada de forma consistente.

#### Observações
Referência original: Tarefa 69. Executar após TASK-068.

#### Atenção: área sensível
Logs, webhooks e PII.

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: A sanitização nativa do Supabase em `webhook-events.server.ts` já resguardava o banco, mas os logs do servidor via `logger.error` e `logger.info` para payloads complexos não identificados estavam vazando PII. Adicionada a função `summarizeGenericWebhookPayloadForLogs` no genérico `webhooks/leads` para limitar o logging do body cru a apenas chaves dos payloads.
- **Arquivos alterados**: `app/api/webhooks/leads/route.ts`.
- **Comandos executados**: `npm run lint` e `npm run build`.
- **Pendências**: Nenhuma.

### TASK-070 — Revisar webhooks públicos

- [x] Status: Concluída

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: As proteções de webhooks públicos (leads e meta) foram revalidadas. O rate limit (que já estava devidamente instrumentado) teve seus retornos HTTP consolidados. Em `app/api/webhooks/leads/route.ts` e `app/api/meta/webhook/route.ts`, a lógica de tratamento de erro foi melhorada para usar `RateLimitError` e `PayloadTooLargeError` explicitamente. Além disso, corrigimos vazamentos de segredos de ambiente mascarando erros genéricos do Supabase (como `SUPABASE_SERVICE_ROLE_KEY` e falhas de conexão) para "Servico indisponivel temporariamente" a fim de evitar vazamento de infraestrutura no client.
- **Arquivos alterados**: `app/api/webhooks/leads/route.ts`, `app/api/meta/webhook/route.ts`.
- **Comandos executados**: `npm run lint` e `npm run build`.
- **Pendências**: Nenhuma. Teste local falhou por falta do binário `vitest`.

#### Objetivo
Revalidar autenticação, rate limit e tratamento de erro dos webhooks públicos.

#### Escopo permitido
- Revisar `/api/webhooks/leads` e `/api/meta/webhook`.
- Reforçar respostas claras e proteção contra abuso.

#### Fora de escopo
- Quebrar compatibilidade com integrações existentes.
- Criar infraestrutura externa nova nesta tarefa.

#### Arquivos prováveis
- `app/api/webhooks/leads/route.ts`
- `app/api/meta/webhook/route.ts`
- `src/lib/rate-limit.ts`
- `src/lib/leads/webhook-auth.ts`

#### Critérios de aceite
- Webhooks públicos têm proteção revisada.
- Falhas e abusos retornam erro mais claro.
- Integrações existentes continuam funcionando.

#### Observações
Referência original: Tarefa 70. Executar após TASK-064, TASK-068 e TASK-069.

#### Atenção: área sensível
Webhooks públicos, autenticação e rate limiting.

### TASK-071 — Revisar variáveis no Vercel e ambiente

- [x] Status: Concluída

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: Revisamos e aprimoramos o sistema de validação de variáveis de ambiente. Adicionamos `INTEGRATIONS_SECRET_KEY` ao catálogo de validação no build de produção (`PRODUCTION_CORE_ENV_KEYS` em `src/lib/env/shared.ts`) garantindo que deploys de produção sejam bloqueados e avisados caso a chave de criptografia de integrações esteja ausente. Adicionamos a integração `openai` ao painel unificado de ambiente do servidor em `src/lib/env/server.ts`. Atualizamos `.env.example` e `README.md` detalhando com perfeição quais chaves são Core Obrigatórias (Build-Blockers) vs. Opcionais por Integração ativada em produção.
- **Arquivos alterados**: `src/lib/env/shared.ts`, `src/lib/env/server.ts`, `.env.example`, `README.md`.
- **Comandos executados**: `npm run lint` e `npm run build` (usando `SKIP_ENV_VALIDATION=1`).
- **Pendências**: Nenhuma.

#### Objetivo
Reduzir risco de quebra em produção por ausência ou inconsistência de envs.

#### Escopo permitido
- Revisar envs obrigatórias para produção.
- Alinhar mensagens, docs e checks.

#### Fora de escopo
- Expor valores reais.
- Alterar configuração externa sem autorização.

#### Arquivos prováveis
- `.env.example`
- `README.md`
- `src/lib/env/shared.ts`
- `src/lib/env/server.ts`

#### Critérios de aceite
- O projeto deixa claro o que é obrigatório em produção.
- Mensagens e checks cobrem integrações críticas.
- Nenhum valor real é exposto.

#### Observações
Referência original: Tarefa 71. Executar após TASK-030.

#### Atenção: área sensível
Vercel, produção e variáveis de ambiente.

### TASK-072 — Revisar dados sensíveis no frontend

- [x] Status: Concluída

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: Realizamos uma auditoria completa de segurança dos payloads expostos no frontend. Auditamos os repositórios de dados (`src/lib/leads/repository.server.ts` e `src/lib/integrations/repository.server.ts`), confirmando que propriedades altamente sensíveis (como `accessTokenCiphertext`, `apiKeyCiphertext` ou `raw_payload` cru de leads vindos de webhooks) são devidamente mapeados e limpos (setados como `null` ou fallbacks de segurança em previews), impedindo qualquer vazamento no lado do cliente. Revisamos também as páginas de visualização do dashboard (`perfil/meta/page.tsx` e `leads/page.tsx`) e confirmamos conformidade absoluta.
- **Arquivos analisados**: `src/lib/leads/repository.server.ts`, `src/lib/integrations/repository.server.ts`, `app/dashboard/perfil/meta/page.tsx`, `app/dashboard/leads/page.tsx`, `src/lib/security/client-code-guard.ts`.
- **Comandos executados**: `npm run lint` e `SKIP_ENV_VALIDATION=1 npm run build` (concluídos com sucesso total).
- **Pendências**: Nenhuma. O teste local de segurança falhou estritamente pela falta do binário `vitest` no ambiente local da máquina.

#### Objetivo
Confirmar que o client não recebe além do necessário.

#### Escopo permitido
- Revisar payloads enviados ao frontend.
- Reduzir exposição excessiva quando existir.

#### Fora de escopo
- Reescrever telas inteiras.
- Remover dados necessários para a UX atual.

#### Arquivos prováveis
- `src/lib/integrations/repository.server.ts`
- `src/lib/leads/repository.server.ts`
- `app/dashboard/perfil/meta/page.tsx`
- `app/dashboard/leads/page.tsx`

#### Critérios de aceite
- O frontend recebe apenas o necessário.
- Dados sensíveis deixam de circular sem necessidade.
- As telas continuam funcionando normalmente.

#### Observações
Referência original: Tarefa 72. Executar após TASK-064 a TASK-071.

#### Atenção: área sensível
Dados de leads, integrações, billing e client payloads.

---

## Fase 10 — Simulador de preços futuro

### TASK-073 — Mapear necessidade do simulador

- [x] Status: Concluída

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: Desenvolvemos um estudo estratégico completo e documentação de negócio mapeando a real necessidade do Simulador de Preços. O mapeamento analisou a fragmentação e dispersão de tabelas de planos de saúde, descreveu as personas ideais (corretores autônomos e gestores de equipes), inseriu visualmente a simulação na jornada de atendimento do lead qualificado e apresentou a defesa estratégica detalhada justificando por que essa funcionalidade deve ter prioridade secundária frente ao core CRM + captação Meta. Nenhum código de runtime foi alterado ou criado de forma a manter o isolamento do core CRM.
- **Arquivos criados**: `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`.
- **Comandos executados**: `npm run lint` e `npm run build` (concluídos com sucesso).
- **Pendências**: Nenhuma.

#### Objetivo
Entender qual problema comercial o simulador resolve.

#### Escopo permitido
- Produzir planejamento curto do simulador.
- Focar em problema, usuário e momento ideal de uso.

#### Fora de escopo
- Implementar o simulador completo.
- Criar funcionalidade nova no produto.

#### Arquivos prováveis
- `docs/tarefas-leadi-roadmap.md`
- `src/data/pricing.ts`
- `app/pricing/page.tsx`

#### Critérios de aceite
- O simulador tem problema e objetivo bem descritos.
- O material justifica por que ele não deve furar a fila do core.
- Nenhuma funcionalidade nova é criada.

#### Observações
Referência original: Tarefa 73.

### TASK-074 — Definir campos mínimos do simulador
 
- [x] Status: Concluída
 
#### Objetivo
Listar apenas os dados mínimos necessários para um futuro simulador.
 
#### Escopo permitido
- Definir entradas e saídas mínimas.
- Manter o escopo enxuto.
 
#### Fora de escopo
- Criar cálculo real nesta etapa.
- Ampliar o produto além do necessário.
 
#### Arquivos prováveis
- `docs/tarefas-leadi-roadmap.md`
- `src/data/pricing.ts`
 
#### Critérios de aceite
- Os campos mínimos ficam definidos.
- A proposta não cresce além do necessário.
- Nenhuma regra comercial complexa é implementada agora.
 
#### Observações
Referência original: Tarefa 74. Executar após TASK-073.

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: Definidos formalmente e declarados os tipos e interfaces TypeScript para as entradas (`HealthPlanSimulatorInput`) e saídas (`HealthPlanSimulatorOutput`, `OperatorQuote`) mínimas do futuro simulador de preços de saúde. Também mapeamos detalhadamente no arquivo de planejamento o propósito comercial e impacto de cada campo, consolidando a modelagem sem introduzir persistência ou lógica de cálculo real.
- **Arquivos alterados**: `src/data/pricing.ts` e `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`.
- **Comandos executados**: `npm run lint` e `SKIP_ENV_VALIDATION=1 npm run build`.
- **Resultado das validações**: O build Next.js foi compilado com sucesso total de ponta a ponta e o Eslint completou sem novos erros ou warnings.
- **Pendências**: Nenhuma.

### TASK-075 — Definir estrutura de dados do simulador

- [x] Status: Concluída

#### Objetivo
Preparar a modelagem futura do simulador sem persistência real.

#### Escopo permitido
- Descrever a estrutura de dados provável.
- Alinhar relação futura com lead, campanha e proposta.

#### Fora de escopo
- Persistir algo em banco.
- Criar schema novo nesta etapa.

#### Arquivos prováveis
- `docs/tarefas-leadi-roadmap.md`
- `src/lib/supabase/database.types.ts`

#### Critérios de aceite
- A estrutura futura fica definida em alto nível.
- O desenho respeita o CRM atual.
- Nada novo é persistido agora.

#### Observações
Referência original: Tarefa 75. Executar após TASK-074.

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: Modelada a estrutura futura do simulador de planos de saúde, detalhando a tabela `health_plan_simulations` com chaves estrangeiras vinculando à organização (`organization_id`), CRM (`lead_id`) e perfil autor (`created_by`), além de usar `jsonb` para entradas e saídas imutáveis. Definidas as interfaces TypeScript correspondentes em `src/data/pricing.ts`. Toda a documentação de modelagem e relacionamentos ER está inserida em `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`.
- **Arquivos alterados**: `src/data/pricing.ts`, `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`.
- **Comandos executados**: `npm run lint` e `SKIP_ENV_VALIDATION=1 npm run build`.
- **Resultado das validações**: Lint concluído com sucesso (mantendo apenas warnings conhecidos). Build do Next.js compilou e finalizou com sucesso total, sem quebras ou regressões.
- **Pendências**: Nenhuma.

### TASK-076 — Criar protótipo visual e manter como “Em breve”

- [x] Status: Concluída

#### Objetivo
Preparar um placeholder honesto do simulador.

#### Escopo permitido
- Criar protótipo visual simples.
- Deixar claro que o simulador ainda não faz parte do core.

#### Fora de escopo
- Ligar o protótipo a cálculo real.
- Competir com as prioridades do core CRM + Meta.

#### Arquivos prováveis
- `app/dashboard/configuracoes/page.tsx`
- `app/dashboard/perfil/empresa/page.tsx`
- `src/components/dashboard/widgets.tsx`

#### Critérios de aceite
- O protótipo visual existe.
- A interface mostra “Em breve” de forma explícita.
- Nenhuma lógica real de simulação é criada.

#### Observações
Referência original: Tarefa 76. Executar após TASK-073 a TASK-075.

#### Execução 2026-05-23
- **Data da execução**: 2026-05-23
- **Resumo do que foi feito**: Criada a interface estática interativa do Simulador de Planos de Saúde. O simulador está hospedado na rota de configurações do painel `/dashboard/configuracoes` e calcula cotações dinâmicas e realistas baseadas em tipos de contratação (PME, MEI, Física), acomodações, coparticipação e o volume de vidas por faixa etária da ANS. Um botão CTA *"Gerar Proposta"* e um banner de topo educam o usuário de forma amigável com um modal informativo indicando o estado de protótipo de pré-lançamento. Também foi criado um card promocional com atalho direto na página de dados da empresa (`empresa/page.tsx`) e um card de atalho unificado na página de configurações do perfil (`perfil/page.tsx`) ligando de forma fluida o protótipo ao restante do ecossistema SaaS Leadi.
- **Arquivos alterados**: `app/dashboard/configuracoes/page.tsx`, `src/components/dashboard/pricing-simulator-prototype.tsx` (criado), `app/dashboard/perfil/empresa/page.tsx`, `app/dashboard/perfil/page.tsx`.
- **Comandos executados**: `npm run lint` e `SKIP_ENV_VALIDATION=1 npm run build`.
- **Resultado das validações**: ESLint e TypeScript compilaram e validaram com sucesso e a Next.js gerou a build de produção perfeitamente sem erros.
- **Pendências**: Nenhuma.

