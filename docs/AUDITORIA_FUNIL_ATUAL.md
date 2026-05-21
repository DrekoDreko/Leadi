# Auditoria do funil atual

Data da auditoria: 2026-05-21
Tarefa: `TASK-002 -- Revisar funil atual`
Escopo: auditoria tecnica documental do funil atual, sem alteracao funcional do SaaS.

## 1. Visao geral do funil atual

O funil atual do Leadi usa seis etapas comerciais:

- `new` -> `Novo lead`
- `qualification` -> `Qualificacao`
- `proposal` -> `Proposta`
- `negotiation` -> `Negociacao`
- `won` -> `Venda`
- `lost` -> `Perdido`

No banco e nos tipos compartilhados, a etapa e armazenada como enum tecnico em ingles (`LeadStage`).

Na UI operacional, o lead trafega quase sempre como `Lead.stage: string` com label em portugues. Isso vale para listagem, funil, popup do lead, filtros e exportacao.

O funil visual em `/dashboard/funil` funciona como um kanban com drag and drop. Ao mover um card, a UI traduz a coluna para o enum tecnico e envia `PATCH /api/leads/[id]` com `stage` em ingles. A resposta volta como `Lead` de UI com label em portugues.

Conclusao do desenho atual: existe um contrato real coerente no banco, mas o fluxo ponta a ponta nao usa uma unica fonte de verdade. A consistencia depende de camadas de traducao repetidas entre repositorio, filtros, popup e componentes de funil.

## 2. Arquivos encontrados relacionados ao funil

Arquivos principais analisados:

- `app/dashboard/funil/page.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/lib/leads/stages.ts`
- `src/lib/leads/filters.ts`
- `src/lib/leads/normalization.ts`
- `src/lib/leads/repository.ts`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `app/api/leads/export/route.test.ts`
- `src/data/mock.ts`
- `src/lib/imports/csv.ts`
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/reports/commercial-report.server.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/202604280001_phase_1_core.sql`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`
- `src/lib/workspaces/permissions.ts`

## 3. Estagios encontrados no projeto

### 3.1 Banco e tipos compartilhados

Fonte:

- `supabase/migrations/202604280001_phase_1_core.sql`
- `src/lib/supabase/database.types.ts`

Valores encontrados:

- `new`
- `qualification`
- `proposal`
- `negotiation`
- `won`
- `lost`

### 3.2 Traducao central existente

Fonte:

- `src/lib/leads/stages.ts`
- `src/lib/leads/repository.server.ts`

Mapeamento encontrado:

- `new` -> `Novo lead`
- `qualification` -> `Qualificacao`
- `proposal` -> `Proposta`
- `negotiation` -> `Negociacao`
- `won` -> `Venda`
- `lost` -> `Perdido`

Observacao importante:

- `src/lib/leads/stages.ts` e o lugar mais proximo de uma tabela oficial de etapas para a UI.
- Mesmo assim, o repositorio server-side declara outro mapa proprio (`stageLabels`) em vez de reutilizar diretamente a tabela de `src/lib/leads/stages.ts`.

### 3.3 UI de listagem, filtros e funil

Fontes:

- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/lib/leads/filters.ts`
- `src/components/dashboard/lead-details-popup.tsx`

Labels encontradas na UI:

- `Novo lead`
- `Qualificacao`
- `Proposta`
- `Negociacao`
- `Venda`
- `Perdido`

### 3.4 Mocks

Fonte:

- `src/data/mock.ts`
- `src/lib/meta/manual-lead-import.server.ts`

Os mocks tambem usam labels em portugues:

- `Novo lead`
- `Qualificacao`
- `Proposta`
- `Negociacao`

Observacao:

- `src/data/mock.ts` nao inclui `Venda` nem `Perdido` na lista `kanbanColumns`, embora o funil real trabalhe com seis colunas.

## 4. Diferencas entre mock, UI, API e banco

### 4.1 Banco e API aceitam enum tecnico; UI opera com label traduzida

O banco e a API esperam `LeadStage` em ingles.

Exemplos:

- `PATCH /api/leads/[id]` aceita `stage` como string e o repositorio normaliza com `normalizeLeadStage`.
- `buildLeadInsert` e `buildLeadUpdate` gravam enum tecnico no banco.
- `mapLeadRowToLead` traduz o enum para label de UI.

Risco:

- como a API usa `z.string()` para `stage` e a normalizacao tem fallback silencioso para `new`, um valor invalido pode ser aceito e rebaixado para `new` sem erro explicito.

### 4.2 Filtros de URL circulam em portugues

Fonte:

- `src/lib/leads/filters.ts`
- `app/api/leads/export/route.test.ts`

O filtro `stage` usado em URL, UI e exportacao trabalha com labels em portugues, nao com enum tecnico.

Exemplo:

- `stage=Novo%20lead`

Depois o servidor converte para enum cru com `getSupabaseStageValue`.

Risco:

- qualquer mudanca futura de copy ou renomeacao visual quebra filtros, exportacao e links salvos sem mudar o schema do banco.

### 4.3 O funil visual depende de comparacoes textuais locais

Fonte:

- `app/dashboard/funil/sales-funnel-workspace.tsx`

Exemplos encontrados:

- `openLeads` usa `!["Venda", "Perdido"].includes(lead.stage)`
- `wonLeads` usa `lead.stage === "Venda"`
- `proposalLeads` usa `lead.stage === "Proposta"`
- o drag and drop compara `lead.stage` com `getLeadStageLabel(nextStage)`

Risco:

- o comportamento do funil depende de labels literais espalhadas no componente, nao apenas da tabela central de etapas.

### 4.4 Listagem e popup tambem operam sobre o contrato traduzido

Fontes:

- `app/dashboard/leads/leads-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`

Exemplos:

- metricas da listagem contam `Novo lead`, `Qualificacao` e `Proposta` por comparacao textual;
- o popup converte `lead.stage` com `stageToValue`, procurando o label em `stageOptions`.

Risco:

- se a representacao visual divergir da lista oficial, a edicao do lead e os contadores podem ficar inconsistentes.

### 4.5 Mock e banco nao compartilham o mesmo tipo de `stage`

Fonte:

- `src/data/mock.ts`
- `src/lib/supabase/database.types.ts`

O tipo `Lead` usado pela UI declara `stage: string`.

Risco:

- como a UI nao carrega o enum tecnico no tipo principal do lead, erros de consistencia so aparecem em runtime ou em pontos isolados de traducao.

## 5. Fonte atual de verdade do funil

Nao existe uma fonte unica de verdade ponta a ponta.

O estado atual e este:

- fonte oficial de persistencia: enum `public.lead_stage` no banco;
- fonte mais proxima de catalogo de UI: `src/lib/leads/stages.ts`;
- traducao efetivamente usada na leitura server-side: `stageLabels` em `src/lib/leads/repository.server.ts`;
- filtros e metricas: regras proprias em `src/lib/leads/filters.ts`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/leads/leads-workspace.tsx` e `src/lib/reports/commercial-report.server.ts`.

Diagnostico:

- existe uma base tecnica confiavel no banco;
- existe uma tabela de traducao razoavel na camada de UI;
- mas o produto ainda depende de duplicacao de listas, labels e regras em varios lugares.

## 6. Riscos em filtros, metricas e movimentacao de leads

### 6.1 Filtros por etapa

Os filtros funcionam hoje, mas dependem de labels em portugues na URL.

Riscos:

- quebra por renomeacao de copy;
- inconsistencias entre links, exportacao e selects;
- maior custo de manutencao para internacionalizacao ou ajuste de UX.

### 6.2 Contadores e metricas

Existem metricas em pelo menos tres camadas:

- listagem (`app/dashboard/leads/leads-workspace.tsx`);
- funil (`app/dashboard/funil/sales-funnel-workspace.tsx`);
- relatorios (`src/lib/reports/commercial-report.server.ts`).

O problema e que:

- listagem e funil contam por labels traduzidas;
- relatorios contam por enum tecnico cru;
- os conjuntos de metricas nao sao derivados de um mesmo helper.

Riscos:

- divergencia de numeros entre telas;
- mudancas futuras obrigarem ajuste manual em varios pontos;
- bugs discretos se uma etapa for renomeada ou reordenada.

### 6.3 Movimentacao entre etapas

O drag and drop envia o enum tecnico correto para a API, o que e um ponto positivo.

Mesmo assim, ha fragilidades:

- a UI faz otimistic update usando label traduzida;
- a comparacao de "ja esta na etapa" tambem usa label traduzida;
- a API aceita `stage` generico e normaliza silenciosamente.

Riscos:

- etapa invalida cair para `new`;
- regressao silenciosa se a traducao local divergir;
- dificuldade de rastrear erros porque nao ha validacao forte do payload de etapa.

### 6.4 Regras de conclusao e perda

Hoje, `Venda` e `Perdido` funcionam como etapas finais na UI e nos relatorios, mas nao existe camada explicita de regra de negocio para:

- fechamento obrigatorio;
- motivo de perda;
- bloqueio de regressao;
- data de entrada em etapa;
- historico formal de transicao.

Risco:

- o funil visual pode parecer mais maduro do que o estado real do modelo comercial.

## 7. Riscos de nomenclatura e UX

### 7.1 Stage, status, pipeline, funil e kanban

Termos encontrados:

- `stage` no banco, API, filtros internos e relatorios;
- `Funil` e `kanban` na UI;
- `Pipeline operacional` no texto do funil;
- `status` em varios lugares do produto, inclusive fora do CRM.

Diagnostico:

- dentro do CRM, `stage` e o termo tecnico dominante;
- na UX, o usuario ve `funil`, `etapa` e `kanban`;
- isso nao chega a ser erro, mas ainda nao existe glossario unico documentado.

### 7.2 Vendedor, consultor, corretor, supervisor e manager

No contexto do funil e relatorios:

- a UX operacional fala em `consultor`;
- a role tecnica atual e `seller`;
- `manager` aparece como conceito na aplicacao e na documentacao de seguranca;
- `supervisor` ainda aparece em migrations e fluxos historicos;
- `corretor` e `corretora` aparecem mais em marketing e onboarding do que no funil em si.

Riscos:

- drift de nomenclatura entre produto, regras e banco;
- documentacao funcional depender de `supervisor`, embora a camada atual normalize para `admin`;
- confusao entre papel comercial exibido ao usuario e role tecnica salva no sistema.

### 7.3 Funil visual versus status real do lead

O card mostra uma etapa legivel, mas o status real persistido esta escondido atras da traducao server-side.

Risco:

- o produto transmite uma percepcao de funil unificado, enquanto internamente ainda existem DTOs traduzidos, filtros em label e metricas descentralizadas.

## 8. Riscos de multi-tenant ou dados pessoais

### 8.1 Isolamento multi-tenant

Pontos positivos encontrados:

- consultas usam `organization_id`;
- sellers sao filtrados por `owner_profile_id`;
- managers veem a organizacao inteira;
- RLS hardening recente reforca `manager` ou `owner_profile_id = current_profile_id()`.

Fontes:

- `src/lib/leads/repository.server.ts`
- `supabase/migrations/202605200002_supabase_hardening_rls.sql`

Risco residual:

- telas que usem service role ou consultas futuras fora do repositorio principal podem fugir do padrao se nao reaplicarem a mesma regra.

### 8.2 Dados pessoais no funil

O funil exibe e trafega nome, telefone, email, cidade, interesse e observacoes.

Risco residual:

- nao ha trilha propria de auditoria para mudanca de etapa;
- sem historico formal, fica mais dificil comprovar quem alterou o estado comercial do lead;
- `raw_payload` do lead continua sendo area sensivel relevante para revisao de minimizacao, embora nao seja tema exclusivo desta tarefa.

## 9. Pontos frageis

- Nao ha fonte unica de verdade ponta a ponta para o catalogo de etapas.
- `src/lib/leads/stages.ts` e `stageLabels` em `repository.server.ts` duplicam o mesmo mapa.
- O tipo principal da UI usa `stage: string`, nao `LeadStage`.
- Filtros, metricas e drag and drop dependem de labels em portugues espalhadas pelo codigo.
- A API de update nao valida `stage` como enum forte; ela aceita string e normaliza com fallback.
- Nao existe historico dedicado de mudanca de etapa.
- `src/data/mock.ts` tem funil parcial em `kanbanColumns`, sem `Venda` e `Perdido`.
- Importacao CSV nao trabalha a etapa como campo de negocio; novos leads tendem a nascer no fluxo padrao.
- Importacao manual da Meta no modo mock tambem fixa `Novo lead`.
- O funil esta preparado para entrada de leads de Meta, CSV e manual no sentido de origem e persistencia, mas nao diferencia regras de etapa por origem.

## 10. Recomendacoes tecnicas

1. Consolidar um catalogo unico de etapas reutilizavel por banco, repositorio, filtros, popup, listagem, funil e relatorios.
2. Parar de duplicar o mapa de traducao entre `src/lib/leads/stages.ts` e `src/lib/leads/repository.server.ts`.
3. Fortalecer a validacao de `stage` nas rotas `POST /api/leads` e `PATCH /api/leads/[id]` com enum explicito, evitando fallback silencioso para `new`.
4. Separar com clareza `valor persistido` e `label exibida`, sem usar somente `string` generica no tipo principal da UI.
5. Centralizar contadores e classificacoes de etapa em helpers compartilhados, em vez de comparacoes textuais locais.
6. Criar historico proprio de transicao de etapa antes de evoluir automacoes, SLA ou analise comercial mais fina.
7. Documentar oficialmente a nomenclatura funcional do produto: `etapa`, `funil`, `consultor`, `manager`, `seller`, `admin`, `owner`.
8. Revisar mocks para refletirem exatamente as seis etapas oficiais e nao induzirem leitura incompleta do kanban.

## 11. Subtarefas sugeridas para o roadmap

Subtarefas sugeridas a partir desta auditoria:

- Padronizar contrato de etapa entre banco, API e UI.
- Remover fallback silencioso de `stage` invalido para `new`.
- Centralizar metricas e contadores do funil em helper compartilhado.
- Criar historico de mudanca de etapa do lead.
- Revisar filtros de etapa para nao dependerem de copy em portugues.
- Atualizar mocks do funil para espelhar integralmente as etapas oficiais.
- Formalizar nomenclatura de papeis comerciais e gerenciais no CRM.

Observacao:

- o roadmap normalizado ja antecipa parte desses temas em tarefas futuras como padronizacao de etapas, fortalecimento do fluxo de movimentacao e registro da evolucao do lead no funil.

## 12. Conclusao

Status da avaliacao: `parcial`

O funil atual esta funcional para operacao basica:

- carrega leads reais por organizacao;
- respeita escopo de seller versus manager;
- movimenta cards entre etapas;
- permite editar etapa via popup e via kanban;
- conecta origem manual, CSV e Meta ao mesmo campo `stage`.

Mesmo assim, a base atual ainda e insuficiente para tratar o funil como modelo plenamente consolidado:

- nao ha fonte unica de verdade ponta a ponta;
- ha duplicacao de listas e traducao de etapas;
- filtros e metricas dependem de labels visuais;
- nao existe trilha propria de historico de etapa;
- a API ainda aceita `stage` frouxo com fallback silencioso.

Diagnostico final:

- pronto para uso operacional basico;
- parcial para evolucao segura;
- insuficiente como base final de padronizacao do funil sem tarefas tecnicas complementares.
