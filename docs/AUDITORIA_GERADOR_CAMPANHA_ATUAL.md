# Auditoria do gerador de campanha atual

Data da auditoria: 2026-05-21
Tarefa: `TASK-004 -- Revisar gerador de campanha atual`
Escopo: auditoria tecnica documental do fluxo de geracao de campanha, sem alteracao funcional do SaaS.

## 1. Visao geral

O gerador de campanha atual do Leadi ja cobre um fluxo real de ponta a ponta para preparar campanhas de Meta Ads com apoio de IA:

- a pagina server-side carrega contexto de autenticacao, conexoes Meta, templates, saldo de creditos, contagem de leads e snapshot de billing;
- a UI guia o usuario em sete etapas, com validacao local e payload padronizado;
- a rota `POST /api/campaigns/generate` valida origem, rate limit, autenticacao e debito de creditos;
- a geracao de texto usa OpenAI com guardrails de compliance locais;
- o resultado e persistido em `campaigns` e pode abrir um pedido criativo relacionado.

Conclusao curta: o modulo ja resolve bem a parte de briefing guiado, geracao de copy e persistencia do resultado. O que ainda esta raso e a camada operacional entre "gerar" e "operar campanha de verdade", especialmente em rascunho, historico visivel, publicacao e leitura de falhas.

## 2. Arquivos analisados

- `app/dashboard/campanhas/campaign-generator.tsx`
- `app/dashboard/campanhas/campaign-generator.test.tsx`
- `app/dashboard/criacoes/campanhas/page.tsx`
- `app/api/campaigns/generate/route.ts`
- `app/api/campaigns/questions/route.ts`
- `app/api/campaigns/route.ts`
- `app/api/campaigns/publish/route.ts`
- `src/lib/campaigns/repository.server.ts`
- `src/lib/campaigns/types.ts`
- `src/lib/creative-requests/repository.server.ts`
- `src/lib/openai/index.ts`

## 3. O que o gerador ja resolve hoje

### 3.1 Entrada guiada e com contexto comercial

O componente `CampaignGenerator` organiza o fluxo em sete etapas:

1. escolha de template seguro;
2. conexoes da campanha;
3. publico, oferta e regiao;
4. observacoes e tom;
5. modo de publicacao;
6. criativo;
7. resumo final.

Pontos positivos:

- existem templates prontos para acelerar o preenchimento;
- os campos principais sao validados antes do submit;
- o payload final ja inclui publico, oferta, regiao, diferencial, notas, briefing criativo e ids Meta;
- a tela considera o saldo de creditos antes de permitir a geracao.

### 3.2 Integracao com contexto real do workspace

A pagina `app/dashboard/criacoes/campanhas/page.tsx` nao entrega uma tela isolada. Ela monta o gerador com dados reais do workspace:

- `getConnectedAccountsForCurrentUser()`
- `getSystemTemplates("campaign")`
- `getCurrentAiBalance()`
- `getPublishedCampaignsCountForCurrentUser()`
- `getLeadsCountForCurrentUser()`
- `getCurrentBillingSnapshot()`
- `getCampaignsForCurrentUser(4)`

Isso mostra que o modulo ja nasceu conectado ao SaaS real, e nao apenas como mock visual.

### 3.3 Geracao server-side com guardrails

A rota `POST /api/campaigns/generate` faz uma trilha razoavelmente solida:

- valida same-origin;
- aplica rate limit;
- valida payload com `zod`;
- exige contexto autenticado de billing;
- consulta conexao Meta da organizacao;
- debita creditos via `runAiActionWithCredits()`;
- gera texto estruturado com `generateCampaignText()`;
- acrescenta notas locais de compliance;
- tenta persistir a campanha;
- opcionalmente cria pedido criativo relacionado.

Pontos positivos:

- a chamada OpenAI fica server-side;
- a cobranca de creditos fica acoplada ao ato real de geracao;
- as restricoes de compliance sao reforcadas no backend, nao so na UI;
- o salvamento ocorre por `organization_id`, preservando o contexto multi-tenant.

### 3.4 Persistencia do resultado

`saveCampaignForCurrentUser()` grava no banco tanto os campos operacionais quanto o payload de entrada e o resultado da IA:

- dados de conexao Meta;
- modo e status de publicacao;
- publico, oferta, regiao e diferencial;
- campos textuais gerados;
- `input_payload`;
- `result_payload`.

Isso da ao produto uma base real para auditoria, historico futuro e reuso de campanhas.

### 3.5 Continuidade com criativos

Quando o usuario escolhe solicitar criativo, o fluxo pode abrir um pedido em `creative_requests`. Isso e um passo importante porque liga a geracao de texto a uma operacao interna posterior, em vez de encerrar a experiencia apenas na copy.

## 4. Onde o modulo ainda esta raso

### 4.1 Salvar rascunho ainda nao existe de verdade

O gargalo mais explicito esta no proprio componente:

- `handleSaveDraft()` ainda tem `TODO`;
- o aviso atual diz que o rascunho foi salvo apenas na sessao;
- nao existe endpoint dedicado para persistir rascunho sem gerar campanha.

Impacto:

- o usuario precisa gerar ou perder o trabalho;
- o fluxo nao atende bem iteracoes comerciais longas;
- a etapa de revisao operacional fica fragil.

### 4.2 Historico existe no backend, mas quase nao aparece na UX atual

`getCampaignsForCurrentUser()` carrega campanhas reais ou mocks, mas o `CampaignGenerator` usa apenas `historyMessage` e `historyMode`.

Na pratica:

- o backend ja sabe listar historico;
- o frontend atual nao exibe uma lista operacional das campanhas geradas;
- o usuario nao enxerga bem o que acabou de ser salvo nem retoma facilmente campanhas anteriores.

Impacto:

- o modulo persiste mais do que a interface consegue operacionalizar;
- parte do valor do repositorio de campanhas fica invisivel para o usuario final.

### 4.3 A mensagem de sucesso nao reflete exatamente o que aconteceu

Depois de gerar, a UI mostra:

- "Recebemos a solicitação. Retornaremos com o valor e o andamento da campanha na área Validador de campanha."

Mas o fluxo real:

- ja gerou o texto na hora;
- pode ja ter salvo a campanha;
- pode ja ter criado pedido criativo.

Impacto:

- a mensagem parece de fila assíncrona, enquanto a geracao principal e sincrona;
- a expectativa operacional do usuario pode ficar confusa.

### 4.4 Persistencia parcial e silenciosa em caso de falha

Se a geracao funcionar e o `saveCampaignForCurrentUser()` falhar:

- a rota faz `console.error`;
- o request continua respondendo com sucesso se houver campanha gerada;
- `savedCampaign` pode voltar `null`.

Impacto:

- o usuario pode acreditar que a campanha ficou registrada quando nao ficou;
- a equipe perde observabilidade sobre falhas de persistencia;
- o resultado funcional fica parcialmente entregue, mas sem um diagnostico claro na resposta.

### 4.5 Fluxo de publicacao ainda esta desacoplado da experiencia principal

Existe rota de publicacao (`POST /api/campaigns/publish`) com checagem de permissao e publicacao pausada na Meta, mas o gerador atual nao fecha esse ciclo dentro da mesma experiencia.

Hoje o modulo cobre bem:

- preparar;
- gerar;
- registrar.

Ainda cobre de forma incompleta:

- revisar historico;
- retomar campanha;
- publicar acompanhando status e falhas na mesma jornada.

### 4.6 O modulo depende fortemente de conexoes Meta ja sincronizadas

A validacao da UI exige pagina, conta de anuncio e formulario de lead. Isso ajuda a manter o fluxo consistente, mas tambem torna o gerador pouco resiliente quando a conexao existe e os ativos nao estao sincronizados por completo.

Impacto:

- parte dos gargalos reais de uso nao esta na copy nem no prompt, e sim na disponibilidade dos ativos Meta;
- o gerador fica operacionalmente dependente do estado de outra integracao.

## 5. Separacao objetiva dos gargalos

### 5.1 Gargalos de UX e produto

- salvar rascunho real ainda nao existe;
- historico de campanhas nao esta exposto como area operacional;
- a mensagem de sucesso nao comunica bem o estado real da geracao;
- a jornada "gerar -> revisar -> publicar" ainda nao esta fechada.

### 5.2 Gargalos de backend e operacao

- falha de persistencia da campanha nao bloqueia a resposta bem-sucedida;
- o fluxo depende de Meta conectada e ativos sincronizados;
- o modulo ainda tem comportamento de degradacao para mocks quando o Supabase nao esta configurado.

### 5.3 Gargalos de confiabilidade

- o componente possui testes de interface basicos, mas a cobertura automatizada do fluxo ponta a ponta ainda e pequena;
- cenarios sensiveis como falha ao salvar, falha ao criar pedido criativo e diferenca entre geracao concluida e publicacao pendente ainda merecem testes especificos.

## 6. Riscos sensiveis envolvidos

Embora a tarefa atual seja apenas documental, o modulo toca areas sensiveis:

- autenticacao e contexto de billing;
- debito de creditos de IA;
- OpenAI server-side;
- conexoes Meta e ids operacionais;
- persistencia por organizacao;
- pedidos criativos ligados ao workspace.

Qualquer evolucao futura precisa preservar:

- isolamento por `organization_id`;
- checagens server-side de autenticacao e permissao;
- cobranca de creditos no backend;
- nao exposicao de segredos ou chaves no client.

## 7. Priorizacao recomendada

1. Criar persistencia real de rascunho sem consumo de credito.
2. Expor historico operacional de campanhas na propria experiencia de campanhas.
3. Melhorar a sinalizacao de sucesso parcial quando a geracao funciona, mas o salvamento falha.
4. Aproximar a jornada de geracao da jornada de revisao e publicacao.
5. Expandir testes para os cenarios de persistencia, credito e degradacao operacional.

## 8. Conclusao

O gerador de campanha do Leadi nao esta raso na camada de geracao. Ele ja tem UI estruturada, backend real, consumo de creditos, persistencia e conexao com criativos.

O que ainda esta raso e a camada de operacao depois da geracao:

- falta rascunho real;
- falta historico visivel;
- falta leitura clara de sucesso parcial;
- falta uma experiencia mais continua entre gerar, revisar e publicar.

Em outras palavras: o modulo ja sabe criar campanha com IA. O proximo salto de maturidade e transformar essa geracao em operacao comercial mais confiavel e retomavel.
