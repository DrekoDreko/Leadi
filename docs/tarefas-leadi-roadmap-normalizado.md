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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-011 — Adicionar status do funil ao prontuário

- [ ] Status: Pendente

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

### TASK-012 — Adicionar motivo de perda

- [ ] Status: Pendente

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

### TASK-013 — Adicionar qualidade do lead

- [ ] Status: Pendente

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

### TASK-014 — Vincular lead à campanha, anúncio e formulário

- [ ] Status: Pendente

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

### TASK-015 — Criar botão de WhatsApp com mensagem pronta

- [ ] Status: Pendente

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

### TASK-016 — Criar botão para gerar mensagem com IA

- [ ] Status: Pendente

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

---

## Fase 3 — Funil comercial

### TASK-017 — Padronizar etapas do funil

- [ ] Status: Pendente

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

### TASK-018 — Permitir mover lead entre etapas com feedback claro

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-021 — Criar filtros por responsável, origem, status e campanha

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-023 — Mostrar leads sem contato

- [ ] Status: Pendente

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

### TASK-024 — Mostrar tarefas vencidas

- [ ] Status: Pendente

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

### TASK-025 — Mostrar campanhas ativas

- [ ] Status: Pendente

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

### TASK-026 — Mostrar custo por lead inicial

- [ ] Status: Pendente

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

### TASK-027 — Mostrar tempo médio até primeiro contato

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-029 — Remover métricas decorativas do dashboard

- [ ] Status: Pendente

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

---

## Fase 5 — Meta Ads e captação

### TASK-030 — Revisar variáveis de ambiente da Meta

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-033 — Criar tela de status da conexão Meta

- [ ] Status: Pendente

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

### TASK-034 — Criar diagnóstico de conexão Meta

- [ ] Status: Pendente

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

### TASK-035 — Listar páginas e formulários Meta disponíveis

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-037 — Vincular lead importado à campanha, anúncio e formulário

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-039 — Criar tratamento de erro claro para falha da Meta

- [ ] Status: Pendente

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

---

## Fase 6 — Criação de anúncios com IA

### TASK-040 — Melhorar templates de campanha

- [ ] Status: Pendente

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

### TASK-041 — Melhorar campos de briefing

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-043 — Criar variações de texto

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

#### Atenção: área sensível
OpenAI e compliance de anúncios.

### TASK-046 — Preparar campanha para publicação manual

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-048 — Criar histórico de campanhas geradas

- [ ] Status: Pendente

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

---

## Fase 7 — Cadência de WhatsApp com IA

### TASK-049 — Criar biblioteca de modelos de mensagem

- [ ] Status: Pendente

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

### TASK-050 — Criar mensagem inicial

- [ ] Status: Pendente

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

### TASK-051 — Criar follow-up para lead sem resposta

- [ ] Status: Pendente

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

### TASK-052 — Criar follow-up por objeção

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-054 — Salvar mensagens geradas no histórico do lead

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-056 — Abrir WhatsApp com texto preenchido

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-058 — Criar distribuição manual de leads

- [ ] Status: Pendente

#### Objetivo
Permitir que gestores escolham explicitamente para quem um lead vai.

#### Escopo permitido
- Permitir atribuição manual de lead.
- Limitar a ação a perfis com permissão.

#### Fora de escopo
- Criar automação de roteamento.
- Abrir a ação para sellers sem permissão.

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

- [ ] Status: Pendente

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

### TASK-060 — Criar regras simples de distribuição

- [ ] Status: Pendente

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

### TASK-061 — Criar painel de supervisor

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-063 — Permitir redistribuir lead parado

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-066 — Revisar estrutura multi-tenant

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-069 — Criar logs seguros

- [ ] Status: Pendente

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

### TASK-070 — Revisar webhooks públicos

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

- [ ] Status: Pendente

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

### TASK-075 — Definir estrutura de dados do simulador

- [ ] Status: Pendente

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

### TASK-076 — Criar protótipo visual e manter como “Em breve”

- [ ] Status: Pendente

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
