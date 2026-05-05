# Tarefas da LeadHealth - prompts para Codex

Checklist vivo dos próximos passos da SaaS LeadHealth. Use este arquivo como uma fila de prompts: copie um bloco `txt`, cole no Codex e execute uma tarefa por vez.

O `README.md` fica apenas como descrição pública do projeto no GitHub. Este arquivo é operacional.

## Como usar

1. Escolha uma tarefa pendente.
2. Copie somente o bloco `txt` da tarefa.
3. Cole no Codex.
4. Depois que a implementação estiver validada, marque a tarefa como concluída neste arquivo.

## Prompt base recomendado

Use este texto junto com qualquer tarefa abaixo quando quiser dar mais contexto ao Codex:

```txt
Você está trabalhando no projeto LeadHealth, uma SaaS CRM + IA para vendedores de plano de saúde empresarial.

Stack atual:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase SSR
- Rotas API dentro de app/api
- MCP Supabase local `leadhealth-supabase` conectado via Role Key, implementado em `scripts/supabase-mcp.mjs` e documentado em `docs/mcp-supabase.md`

Antes de implementar:
- leia README.md, TAREFAS.md e package.json;
- se a tarefa envolver Supabase, leia também docs/mcp-supabase.md;
- inspecione os arquivos relacionados à tarefa;
- preserve o estilo visual e os padrões existentes;
- não reverta alterações do usuário;
- mantenha o escopo pequeno.

Depois de implementar:
- quando a tarefa envolver dados Supabase, valide consultas/alterações pelo MCP `leadhealth-supabase` usando as ferramentas permitidas;
- rode npm run lint;
- rode npm run build se a mudança tocar rotas, páginas, tipos ou banco;
- atualize TAREFAS.md marcando a tarefa como concluída somente se tudo estiver validado;
- explique quais arquivos foram alterados e como testar.
```

## Legenda

- **Eu:** tarefa que depende de conta, decisão, credencial, validação de negócio ou ação manual fora do código.
- **Codex:** tarefa que pode ser implementada direto no repositório.
- **Codex + Eu:** tarefa que precisa de implementação e também de acesso, revisão, decisão comercial ou teste manual.

## Regra para Supabase via MCP

O MCP Supabase ja esta conectado via Role Key. Para tarefas novas ou pendentes que envolvam leitura, validação ou alteração de dados no Supabase, o Codex deve usar o MCP local `leadhealth-supabase` como caminho operacional principal, conforme `docs/mcp-supabase.md`.

- O app continua usando Supabase SSR/client no runtime, mas validações e intervenções de dados feitas pelo Codex devem passar pelo MCP.
- Antes de mexer em dados reais, rodar `supabase_status` e confirmar variáveis/allowlist.
- Para inspecionar dados reais, usar `supabase_select` nas tabelas liberadas.
- Para criar, atualizar ou excluir dados reais, usar `supabase_insert`, `supabase_update` ou `supabase_delete` com filtros explícitos e registrar o que foi alterado.
- Como a Role Key ignora RLS, usar operações de escrita apenas com filtros explícitos, escopo mínimo e sem expor dados sensíveis no output.
- Migrations e mudanças de schema continuam versionadas em `supabase/migrations`; depois de aplicar ou orientar aplicação, validar tabelas/dados via MCP nas tabelas liberadas.
- Se uma tarefa criar ou renomear tabela que precise ser consultada pelo Codex, atualizar `ALLOWED_TABLES` em `scripts/supabase-mcp.mjs` e a lista de tabelas em `docs/mcp-supabase.md`.
- O painel do Supabase fica apenas para ações externas inevitáveis, como configuração de Auth, Storage, URLs, secrets e execução manual de DDL quando o MCP não cobrir schema.

## Prioridade imediata

- [x] **Eu:** criar ou confirmar o projeto Supabase da LeadHealth.
- [x] **Eu:** copiar `.env.example` para `.env.local`.
- [x] **Eu:** preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`.
- [x] **Eu:** aplicar a migration `supabase/migrations/202604280001_phase_1_core.sql`; **Codex:** validar o banco pelo MCP Supabase.
- [x] **Eu:** criar a primeira conta em `/login` e confirmar se a organização/perfil foram criados.

### P0.1 - Criar formulario de novo lead

- [x] **Codex**

```txt
Implemente o formulario de criacao de lead no CRM da LeadHealth.

Contexto:
- A API POST /api/leads ja existe.
- A tela principal de leads esta em app/dashboard/leads.
- Existe workspace visual de leads em app/dashboard/leads/leads-workspace.tsx.
- Use os tipos e normalizacoes existentes em src/lib/leads.

Objetivo:
- Permitir criar um lead real pela interface do dashboard.

Requisitos:
- Criar modal, painel lateral ou pagina interna para novo lead.
- Campos minimos: nome, email, telefone, cidade, interesse, orcamento, etapa, origem, proximo contato e observacoes.
- Enviar os dados para POST /api/leads.
- Exibir loading, erro e sucesso.
- Atualizar a lista de leads apos criar sem exigir reload manual, se possivel.
- Manter fallback/mock quando Supabase nao estiver configurado.

Criterios de aceite:
- Usuario logado consegue criar lead real no Supabase.
- Validacoes basicas aparecem antes ou depois da chamada.
- Erros da API aparecem de forma amigavel.
- npm run lint passa.
```

### P0.2 - Criar edicao de lead

- [x] **Codex**

```txt
Implemente a edicao de leads no CRM da LeadHealth.

Contexto:
- A API PATCH /api/leads/:id ja existe.
- A tela de leads e o popup/detalhe ja existem em app/dashboard/leads e src/components/dashboard/lead-details-popup.tsx.

Objetivo:
- Permitir editar os dados de um lead existente pela interface.

Requisitos:
- Criar estado de edicao no detalhe do lead ou em modal dedicado.
- Permitir editar campos comerciais principais: nome, email, telefone, cidade, etapa, interesse, orcamento, proximo contato, observacoes e ultima interacao.
- Chamar PATCH /api/leads/:id.
- Atualizar a UI apos salvar.
- Tratar loading, erro, sucesso e cancelamento.
- Preservar dados mockados quando Supabase nao estiver configurado.

Criterios de aceite:
- Alteracoes persistem no Supabase.
- UI nao perde o lead selecionado depois de salvar.
- Mensagens de erro sao compreensiveis.
- npm run lint passa.
```

### P0.3 - Criar exclusao de lead com confirmacao

- [x] **Codex**

```txt
Implemente exclusao de leads no CRM da LeadHealth.

Contexto:
- A API DELETE /api/leads/:id ja existe.
- A exclusao deve estar disponivel a partir da tela/detalhe de leads.

Objetivo:
- Permitir remover um lead com confirmacao clara para evitar exclusoes acidentais.

Requisitos:
- Adicionar acao de excluir no detalhe ou linha/card do lead.
- Abrir confirmacao antes de chamar a API.
- Chamar DELETE /api/leads/:id.
- Remover o lead da UI apos sucesso.
- Exibir estado de loading e erro.
- Evitar exclusao silenciosa.

Criterios de aceite:
- Lead real e removido do Supabase.
- Cancelar confirmacao nao altera nada.
- UI fica consistente apos excluir.
- npm run lint passa.
```

### P0.4 - Testar fluxo real de leads

- [x] **Codex + Eu**

```txt
Prepare e execute uma validacao tecnica do fluxo real de login e CRUD de leads.

Contexto:
- Eu vou fornecer/confirmar que o Supabase esta configurado no .env.local.
- O fluxo envolve /login, /dashboard/leads e as APIs de leads.

Objetivo:
- Verificar ponta a ponta: login, criacao, edicao e exclusao de leads.

Requisitos para Codex:
- Inspecionar se o projeto tem dados reais ou fallback mockado.
- Rodar npm run lint e npm run build.
- Se possivel, iniciar o app localmente e validar o fluxo pelo navegador.
- Registrar bugs encontrados com arquivos e passos de reproducao.
- Corrigir problemas pequenos encontrados durante a validacao.

Parte manual:
- Eu devo criar/usar uma conta real no Supabase.
- Eu devo confirmar visualmente no app; o Codex deve validar os dados pelo MCP Supabase.

Criterios de aceite:
- Fluxo real funciona sem quebrar fallback local.
- Bugs encontrados estao corrigidos ou documentados.
```

## Fase 1 - Base real do CRM

- [x] **Codex:** criar base visual em Next.js, TypeScript e Tailwind.
- [x] **Codex:** criar landing page em `/`.
- [x] **Codex:** criar dashboard visual em `/dashboard`.
- [x] **Codex:** criar pagina de login em `/login`.
- [x] **Codex:** criar pagina de planos em `/pricing`.
- [x] **Codex:** criar clientes Supabase para server/browser.
- [x] **Codex:** criar middleware para refresh de sessao.
- [x] **Codex:** criar migration com organizacoes, perfis, leads e RLS.
- [x] **Codex:** criar API basica de leads.
- [x] **Codex:** preparar campos de origem para Meta Lead Ads.
- [x] **Codex:** criar fallback para dados mockados quando Supabase nao estiver configurado.
- [x] **Codex:** proteger paginas internas para redirecionar usuario nao logado quando o Supabase estiver configurado.
- [x] **Codex:** persistir proximo contato, observacoes, interesse, orcamento e ultima interacao.

### F1.1 - Melhorar estados de carregamento, erro e vazio

- [x] **Codex**

```txt
Melhore os estados de carregamento, erro e vazio no workspace de leads da LeadHealth.

Contexto:
- A tela principal de leads esta em app/dashboard/leads.
- O workspace visual esta em app/dashboard/leads/leads-workspace.tsx.
- O app precisa funcionar com Supabase real e fallback mockado.

Objetivo:
- Deixar a experiencia de leads clara quando dados estao carregando, falhando ou vazios.

Requisitos:
- Criar estados visuais para loading, erro, vazio sem filtros e vazio com filtros.
- Adicionar acoes uteis: tentar novamente, limpar filtros, criar lead.
- Evitar textos longos explicando o produto.
- Manter layout profissional e consistente com o dashboard.

Criterios de aceite:
- Loading nao parece tela quebrada.
- Erro mostra acao de retry.
- Lista vazia orienta a proxima acao.
- npm run lint passa.
```

### F1.2 - Adicionar filtros reais de leads

- [x] **Codex**

```txt
Implemente filtros reais para leads no dashboard.

Contexto:
- Os leads possuem campos como etapa, origem, cidade, score e datas.
- A UI de leads esta em app/dashboard/leads.
- A camada de dados esta em src/lib/leads/repository.ts e APIs em app/api/leads.

Objetivo:
- Filtrar leads por etapa, origem, cidade, score e periodo usando dados reais.

Requisitos:
- Adicionar controles de filtro na interface.
- Fazer filtros funcionarem com Supabase real.
- Manter filtros funcionando com fallback mockado.
- Atualizar rota/API/repositorio se necessario.
- Preservar busca e ordenacao existentes, se houver.

Criterios de aceite:
- Cada filtro altera a lista exibida.
- Filtros combinados funcionam.
- Ha acao para limpar filtros.
- npm run lint passa.
```

### F1.3 - Atualizar etapa do lead pelo Kanban

- [x] **Codex**

```txt
Permita atualizar a etapa do lead pelo Kanban ou por uma acao rapida.

Contexto:
- O CRM usa etapas de funil.
- A API PATCH /api/leads/:id pode persistir alteracoes.
- A tela de leads deve continuar responsiva e simples.

Objetivo:
- Mudar a etapa de um lead sem abrir um formulario completo.

Requisitos:
- Implementar drag and drop no Kanban ou uma acao rapida por seletor/botoes.
- Persistir a nova etapa via PATCH /api/leads/:id.
- Atualizar UI imediatamente ou apos sucesso com estado claro.
- Tratar erro revertendo ou avisando o usuario.
- Manter acessivel em telas menores.

Criterios de aceite:
- Etapa muda na UI e no Supabase.
- Falha da API nao deixa UI inconsistente.
- npm run lint passa.
```

### F1.4 - Criar busca server-side para leads reais

- [x] **Codex**

```txt
Implemente busca server-side para leads reais.

Contexto:
- A busca atual pode estar no cliente ou mockada.
- A rota GET /api/leads e o repositorio de leads devem ser usados como fonte real.

Objetivo:
- Buscar leads por nome, email, telefone, cidade ou empresa sem carregar tudo no cliente.

Requisitos:
- Adicionar parametro de busca na API GET /api/leads.
- Implementar consulta segura no Supabase.
- Conectar o campo de busca da UI ao parametro.
- Aplicar debounce ou evitar chamadas excessivas.
- Manter fallback mockado com comportamento equivalente.

Criterios de aceite:
- Busca funciona com dados reais.
- Busca vazia volta para a lista normal.
- Busca combina com filtros existentes se houver.
- npm run lint passa.
```

### F1.5 - Adicionar paginacao ou carregamento incremental

- [x] **Codex**

```txt
Adicione paginacao ou carregamento incremental para a lista de leads.

Contexto:
- O CRM pode crescer para muitos leads.
- A API GET /api/leads deve evitar retornar tudo sempre.

Objetivo:
- Carregar leads em paginas ou por "carregar mais".

Requisitos:
- Escolher a abordagem mais simples e consistente com a UI atual.
- Adicionar parametros limit/offset ou page/pageSize na API.
- Retornar metadados suficientes para saber se ha mais resultados.
- Atualizar a UI com loading incremental.
- Manter filtros e busca funcionando junto com paginacao.

Criterios de aceite:
- Lista inicial carrega uma quantidade limitada.
- Usuario consegue carregar mais ou navegar paginas.
- Filtros resetam a paginacao corretamente.
- npm run lint passa.
```

### F1.6 - Revisar tipos gerados de banco

- [x] **Codex**

```txt
Revise e atualize os tipos de banco usados pelo Supabase.

Contexto:
- Os tipos atuais estao em src/lib/supabase/database.types.ts.
- As migrations estao em supabase/migrations.

Objetivo:
- Garantir que os tipos TypeScript reflitam as tabelas e colunas reais usadas pelo app.

Requisitos:
- Comparar database.types.ts com as migrations existentes.
- Corrigir tipos defasados manualmente se nao houver CLI configurada.
- Ajustar usos quebrados no repositorio, APIs e componentes.
- Nao alterar schema SQL sem necessidade.

Criterios de aceite:
- Tipos batem com as migrations versionadas.
- TypeScript nao usa any desnecessario para tabelas principais.
- npm run lint e npm run build passam.
```

### F1.7 - Validar campos comerciais do lead

- [x] **Codex + Eu**

```txt
Prepare uma revisao dos campos do lead para validar se eles cobrem o processo comercial real.

Contexto:
- O lead precisa atender vendedores de plano de saude empresarial.
- Campos atuais incluem contato, origem, etapa, interesse, orcamento, observacoes e informacoes Meta.

Objetivo:
- Identificar lacunas do modelo de lead antes de ampliar o produto.

Requisitos para Codex:
- Mapear campos existentes na migration, tipos, repositorio, API e UI.
- Criar uma proposta objetiva de campos faltantes ou campos que devem mudar.
- Separar mudancas obrigatorias do MVP e melhorias futuras.
- Se houver mudancas pequenas e seguras, implementar com migration e UI.

Parte manual:
- Eu devo validar se os campos fazem sentido para a rotina comercial real.

Criterios de aceite:
- Existe uma lista clara de campos aprovados.
- Mudancas implementadas possuem migration e ajustes de UI/API.
```

## Fase 2 - Captura manual e CSV

- [x] **Codex:** normalizar telefone brasileiro e salvar `phone_e164`.
- [x] **Codex:** validar duplicidade por email, telefone e `meta_lead_id`.

### F2.1 - Criar cadastro manual de lead

- [x] **Codex**

```txt
Crie ou finalize o cadastro manual de leads na LeadHealth.

Contexto:
- Esta tarefa pode reaproveitar o formulario de novo lead se ele ja existir.
- A API POST /api/leads deve ser a fonte de persistencia.

Objetivo:
- Permitir que vendedores cadastrem leads manualmente de forma rapida.

Requisitos:
- Criar modal, pagina ou drawer de cadastro manual.
- Validar nome e pelo menos um contato: email ou telefone.
- Aplicar normalizacao de telefone existente.
- Mostrar erro de duplicidade quando a API retornar conflito.
- Registrar origem apropriada para lead manual.

Criterios de aceite:
- Lead manual aparece imediatamente na lista.
- Dados sao salvos no Supabase.
- Duplicados sao tratados de forma clara.
- npm run lint passa.
```

### F2.2 - Criar importacao CSV com upload, preview e mapeamento

- [x] **Codex**

```txt
Implemente importacao CSV de leads.

Contexto:
- A LeadHealth precisa importar listas de leads, inclusive exportacoes do Meta Lead Ads.
- Ainda nao ha fluxo completo de CSV.

Objetivo:
- Permitir upload de CSV, preview e mapeamento de colunas para o modelo de leads.

Requisitos:
- Criar tela ou modal de importacao.
- Aceitar arquivo .csv.
- Ler cabecalhos e primeiras linhas para preview.
- Permitir mapear colunas para nome, email, telefone, cidade, origem, interesse e observacoes.
- Validar dados antes de importar.
- Criar endpoint/API se necessario.
- Usar parser confiavel ou implementacao simples robusta para CSV com aspas e virgulas.

Criterios de aceite:
- Usuario ve preview antes de confirmar.
- Mapeamento pode ser ajustado.
- Importacao nao cria leads sem confirmacao.
- npm run lint passa.
```

### F2.3 - Aceitar CSV exportado do Meta Lead Ads

- [x] **Codex**

```txt
Adapte a importacao CSV para reconhecer exportacoes do Meta Lead Ads.

Contexto:
- O Meta Lead Ads exporta colunas com nomes variaveis conforme formulario.
- A LeadHealth deve facilitar o mapeamento automatico quando possivel.

Objetivo:
- Detectar colunas comuns do Meta e sugerir mapeamento automaticamente.

Requisitos:
- Criar heuristica de mapeamento para nome, email, telefone, cidade e campos de interesse.
- Preservar colunas desconhecidas em raw_payload ou observacoes, se o modelo permitir.
- Registrar origem como meta_lead_ads ou csv_import_meta quando apropriado.
- Manter mapeamento manual como fallback.

Criterios de aceite:
- CSV tipico do Meta abre com sugestoes preenchidas.
- Usuario ainda pode corrigir as colunas.
- npm run lint passa.
```

### F2.4 - Criar relatorio de importacao CSV

- [x] **Codex**

```txt
Crie relatorio de resultado para importacoes CSV.

Contexto:
- Importacoes podem gerar criados, ignorados, duplicados e erros.

Objetivo:
- Mostrar ao usuario o resultado da importacao de forma auditavel.

Requisitos:
- Ao finalizar importacao, exibir totais: criados, ignorados, duplicados e erros.
- Exibir lista resumida de erros por linha.
- Permitir baixar ou copiar o relatorio, se simples de implementar.
- Nao interromper a importacao inteira por uma linha invalida.

Criterios de aceite:
- Usuario entende exatamente o que entrou e o que falhou.
- Duplicados sao contados separadamente.
- npm run lint passa.
```

### F2.5 - Registrar origem csv_import

- [x] **Codex**

```txt
Garanta que leads importados por CSV sejam salvos com source = csv_import.

Contexto:
- A origem do lead e importante para filtros, relatorios e automacoes futuras.

Objetivo:
- Persistir a origem correta em todos os leads importados por CSV.

Requisitos:
- Verificar enums/tipos aceitos para source.
- Ajustar API, repositorio ou importador CSV.
- Garantir que source manual, meta e webhook continuem funcionando.
- Adicionar fallback se o CSV trouxer uma origem propria.

Criterios de aceite:
- Todo lead importado via CSV recebe source = csv_import, salvo regra explicita do Meta.
- Filtros por origem conseguem encontrar esses leads.
- npm run lint passa.
```

### F2.6 - Criar desfazer importacao recente

- [x] **Codex**

```txt
Avalie e implemente uma opcao simples para desfazer importacao CSV recente, se viavel.

Contexto:
- Importacoes podem criar muitos leads por engano.

Objetivo:
- Permitir desfazer a ultima importacao sem afetar leads antigos.

Requisitos:
- Verificar se o schema permite identificar um lote de importacao.
- Se nao permitir, criar migration para import_batch_id ou tabela de importacoes.
- Adicionar botao de desfazer apos importacao concluida.
- Confirmar antes de excluir.
- Remover apenas leads daquele lote e da organizacao atual.

Criterios de aceite:
- Desfazer remove somente leads importados no lote selecionado.
- Acao exige confirmacao.
- RLS/organizacao sao respeitadas.
- npm run lint e npm run build passam.
```

- [x] **Eu:** exportar um CSV real ou de teste do Meta Lead Ads para validar o importador.

### F2.7 - Testar CSV com colunas reais do Meta

- [x] **Codex + Eu**

```txt
Teste a importacao CSV usando nomes de colunas reais do Meta Lead Ads.

Contexto:
- Eu vou fornecer um CSV real ou de teste exportado do Meta.
- O importador CSV deve reconhecer ou permitir mapear as colunas.

Objetivo:
- Validar que o fluxo funciona com arquivo realista.

Requisitos para Codex:
- Rodar o app localmente.
- Importar o CSV fornecido.
- Corrigir problemas de encoding, separador, cabecalho ou mapeamento.
- Documentar qualquer coluna que precise de tratamento especial.

Parte manual:
- Eu devo fornecer o CSV e confirmar que os dados importados fazem sentido.

Criterios de aceite:
- CSV realista importa sem ajuste manual excessivo.
- Duplicados e erros aparecem corretamente no relatorio.
```

## Fase 3 - IA para campanhas, compliance e WhatsApp

- [x] **Eu:** criar chave da OpenAI API.
- [x] **Eu:** preencher `OPENAI_API_KEY` no `.env.local` e depois no ambiente de producao.
- [x] **Codex:** criar tela de revisao de campanha em `/dashboard/campanhas`.
- [x] **Codex:** criar geracao de mensagem de WhatsApp por lead.

### F3.1 - Criar camada de servico para OpenAI

- [x] **Codex**

```txt
Crie a camada de servico para uso da OpenAI API na LeadHealth.

Contexto:
- A chave OPENAI_API_KEY sera configurada no ambiente.
- O app usa Next.js App Router.
- As chamadas devem ocorrer no servidor, nunca no browser.

Objetivo:
- Ter um modulo central para gerar textos de campanha, compliance e WhatsApp com IA.

Requisitos:
- Criar servico em src/lib/openai ou caminho equivalente.
- Ler OPENAI_API_KEY apenas no servidor.
- Tratar ausencia de chave com erro amigavel.
- Expor funcoes pequenas para geracao de campanha, perguntas e mensagens.
- Evitar expor dados sensiveis no console.

Criterios de aceite:
- Nenhuma chave vai para bundle client-side.
- Servico pode ser chamado por rotas API/server actions.
- npm run lint e npm run build passam.
```

### F3.2 - Criar gerador de campanha segura

- [x] **Codex**

```txt
Implemente gerador de campanha segura para plano de saude empresarial.

Contexto:
- A tela /dashboard/campanhas ja existe visualmente.
- O produto precisa gerar textos para Meta Ads com cuidado de compliance.

Objetivo:
- Gerar campanha com headline, texto principal, descricao, CTA e publico sugerido.

Requisitos:
- Criar rota API ou server action para gerar campanha.
- Usar o servico OpenAI central.
- Pedir inputs minimos: publico, oferta, regiao, diferencial e tom.
- Evitar promessas medicas, atributos sensiveis ou linguagem discriminatoria.
- Mostrar loading, erro e resultado na tela.

Criterios de aceite:
- Usuario gera campanha pela UI.
- Resultado tem campos separados e copiaveis.
- Ausencia de OPENAI_API_KEY mostra erro amigavel.
- npm run lint passa.
```

### F3.3 - Gerar perguntas seguras para formulario Meta

- [x] **Codex**

```txt
Adicione geracao de perguntas seguras para formulario Meta Lead Ads.

Contexto:
- Formularios de lead para saude/seguro precisam evitar perguntas sensiveis.
- A tela de campanhas pode exibir sugestoes de perguntas.

Objetivo:
- Gerar perguntas de qualificacao comercial seguras para plano de saude empresarial.

Requisitos:
- Usar servico OpenAI central.
- Gerar perguntas sobre empresa, quantidade de vidas, regiao, prazo e contato.
- Evitar perguntar sobre condicoes de saude, diagnosticos, idade sensivel ou dados discriminatorios.
- Exibir alerta quando pergunta sugerida exigir revisao manual.

Criterios de aceite:
- Perguntas aparecem junto da campanha ou em secao propria.
- Texto e facil de copiar.
- npm run lint passa.
```

### F3.4 - Criar validador de compliance

- [x] **Codex**

```txt
Crie validador de compliance para textos de campanhas de plano de saude.

Contexto:
- O app deve ajudar a evitar linguagem sensivel em anuncios Meta.
- Ja existe pagina /dashboard/compliance.

Objetivo:
- Analisar texto e apontar riscos de linguagem sensivel, promessa exagerada ou segmentacao proibida.

Requisitos:
- Criar UI para colar texto e validar.
- Criar rota API ou server action.
- Usar regras locais simples e, se OPENAI_API_KEY existir, analise com IA.
- Retornar nivel de risco, motivos e sugestoes de reescrita.
- Deixar claro que a validacao nao substitui revisao juridica/comercial.

Criterios de aceite:
- Texto problematico gera alertas objetivos.
- Texto seguro recebe aprovacao com ressalvas.
- npm run lint passa.
```

### F3.5 - Salvar campanhas geradas no banco

- [x] **Codex**

```txt
Implemente persistencia de campanhas geradas no Supabase.

Contexto:
- A tela /dashboard/campanhas ja existe.
- Ainda e necessario salvar historico por organizacao.

Objetivo:
- Salvar campanhas geradas para consulta posterior.

Requisitos:
- Criar migration para tabela de campanhas, se ainda nao existir.
- Incluir organizacao, usuario, inputs, resultado, status e timestamps.
- Criar repositorio/API para salvar e listar campanhas.
- Atualizar UI para exibir historico.
- Respeitar RLS por organizacao.

Criterios de aceite:
- Campanha gerada aparece no historico apos reload.
- Usuarios nao acessam campanhas de outra organizacao.
- npm run lint e npm run build passam.
```

### F3.6 - Salvar historico de mensagens geradas

- [x] **Codex**

```txt
Salve o historico de mensagens de WhatsApp geradas por lead.

Contexto:
- A LeadHealth ja possui geracao visual de mensagem de WhatsApp.
- O historico ajuda o vendedor a acompanhar contato.

Objetivo:
- Persistir mensagens geradas por lead e organizacao.

Requisitos:
- Criar migration/tabela se necessario.
- Relacionar mensagem ao lead, usuario e organizacao.
- Salvar texto, etapa, tom e timestamps.
- Mostrar historico no detalhe do lead ou tela de WhatsApp.
- Respeitar RLS.

Criterios de aceite:
- Mensagens continuam visiveis apos reload.
- Historico e isolado por organizacao.
- npm run lint e npm run build passam.
```

### F3.7 - Criar botao copiar mensagem

- [x] **Codex**

```txt
Adicione botao para copiar mensagens de WhatsApp geradas.

Contexto:
- A tela de WhatsApp/campanhas ja exibe mensagens geradas.

Objetivo:
- Facilitar copiar a mensagem para enviar manualmente ao lead.

Requisitos:
- Adicionar botao com icone de copiar.
- Usar Clipboard API no client.
- Mostrar feedback visual de copiado.
- Tratar erro quando clipboard nao estiver disponivel.

Criterios de aceite:
- Clique copia exatamente o texto da mensagem.
- Feedback some depois de alguns segundos.
- npm run lint passa.
```

### F3.8 - Criar variacoes de mensagem por etapa do funil

- [x] **Codex**

```txt
Implemente variacoes de mensagens de WhatsApp por etapa do funil.

Contexto:
- Leads possuem etapas comerciais.
- Mensagens devem mudar conforme etapa: novo, contato, proposta, negociacao, fechado ou perdido.

Objetivo:
- Gerar/copiar mensagens mais adequadas ao momento comercial do lead.

Requisitos:
- Mapear etapas existentes no app.
- Criar templates locais ou prompts de IA por etapa.
- Permitir escolher tom da mensagem, se simples.
- Integrar com lead selecionado.
- Manter linguagem profissional e segura para plano de saude empresarial.

Criterios de aceite:
- Cada etapa gera mensagem diferente e coerente.
- Mensagem usa dados do lead quando disponiveis.
- npm run lint passa.
```

### F3.9 - Revisar prompts com exemplos reais

- [x] **Codex + Eu**

```txt
Revise os prompts de IA da LeadHealth com exemplos reais do mercado de plano de saude empresarial.

Contexto:
- Eu vou fornecer exemplos de textos, abordagens e objecoes reais.
- O Codex deve transformar isso em prompts melhores e seguros.

Objetivo:
- Melhorar qualidade dos textos gerados sem aumentar risco de compliance.

Requisitos para Codex:
- Localizar prompts/templates existentes.
- Propor ajustes com base nos exemplos fornecidos.
- Implementar mudancas aprovadas.
- Testar resultados com entradas representativas.

Parte manual:
- Eu devo aprovar tom, oferta e exemplos finais.

Criterios de aceite:
- Prompts geram textos mais parecidos com a operacao real.
- Compliance continua restritivo.
```

### F3.10 - Testar risco de reprovacao Meta

- [x] **Codex + Eu**

```txt
Monte uma bateria de testes para risco de reprovacao Meta em textos de campanha.

Contexto:
- A LeadHealth nao deve vender compliance como garantia absoluta.
- O objetivo e reduzir riscos obvios antes de publicar.

Objetivo:
- Testar textos reais e exemplos limite contra o validador de compliance.

Requisitos para Codex:
- Criar lista de exemplos seguros, duvidosos e proibidos.
- Rodar os exemplos no validador.
- Ajustar regras locais quando houver falso negativo claro.
- Documentar limitacoes.

Parte manual:
- Eu devo revisar os resultados com criterio comercial e juridico quando necessario.

Criterios de aceite:
- Validador pega exemplos sensiveis obvios.
- Ha documentacao curta sobre limitacoes e revisao humana.
```

## Fase 4 - Pedidos de criativo e operacao interna

### F4.1 - Criar tabela de pedidos de criativo

- [x] **Codex**

```txt
Crie a estrutura de banco para pedidos de criativo.

Contexto:
- Existe pagina visual /dashboard/pedidos.
- O produto precisa receber pedidos de design, video ou campanha completa.

Objetivo:
- Persistir pedidos de criativo por organizacao.

Requisitos:
- Criar migration Supabase para creative_requests ou nome consistente.
- Campos: organizacao, solicitante, tipo, titulo, briefing, status, prioridade, prazo, arquivos, timestamps.
- Criar RLS por organizacao.
- Atualizar database.types.ts.

Criterios de aceite:
- Migration aplica sem erro.
- RLS impede acesso entre organizacoes.
- npm run lint e npm run build passam.
```

### F4.2 - Criar formulario de pedido

- [x] **Codex**

```txt
Implemente formulario de pedido de design, video ou campanha completa.

Contexto:
- A tela /dashboard/pedidos ja existe.
- A tabela de pedidos pode precisar ser criada antes.

Objetivo:
- Permitir que vendedores solicitem criativos ou operacao manual.

Requisitos:
- Criar formulario com tipo de pedido, titulo, objetivo, briefing, prazo desejado e observacoes.
- Persistir no Supabase.
- Exibir estados de loading, erro e sucesso.
- Mostrar o pedido criado na lista.

Criterios de aceite:
- Pedido fica salvo apos reload.
- Campos obrigatorios sao validados.
- npm run lint passa.
```

### F4.3 - Permitir anexos com Supabase Storage

- [x] **Codex**

```txt
Adicione anexos aos pedidos usando Supabase Storage.

Contexto:
- Pedidos podem precisar de logos, referencias e materiais.

Objetivo:
- Permitir upload de arquivos ligados ao pedido.

Requisitos:
- Criar bucket/instrucoes ou migration SQL de policies se aplicavel.
- Implementar upload client/server de forma segura.
- Salvar metadados dos arquivos no pedido ou tabela relacionada.
- Limitar tamanho e tipos de arquivo.
- Respeitar organizacao do usuario.

Criterios de aceite:
- Usuario anexa arquivo a um pedido.
- Arquivo pode ser listado/baixado por usuario autorizado.
- npm run lint e npm run build passam.
```

### F4.4 - Criar status do pedido

- [x] **Codex**

```txt
Implemente fluxo de status para pedidos de criativo.

Contexto:
- Status esperados: recebido, em producao, aguardando revisao, aprovado, entregue.

Objetivo:
- Permitir acompanhar a evolucao de cada pedido.

Requisitos:
- Garantir que o schema suporte os status.
- Mostrar status na lista e detalhe do pedido.
- Permitir atualizacao de status em area apropriada.
- Registrar timestamps relevantes se simples.

Criterios de aceite:
- Status aparece visualmente e persiste.
- Status invalido nao e aceito.
- npm run lint passa.
```

### F4.5 - Criar area do vendedor para acompanhar pedidos

- [x] **Codex**

```txt
Crie a experiencia do vendedor para acompanhar pedidos.

Contexto:
- Vendedor precisa ver os pedidos da propria organizacao.

Objetivo:
- Listar pedidos, status, prazo e detalhes de cada solicitacao.

Requisitos:
- Atualizar /dashboard/pedidos com lista real.
- Adicionar filtros por status e tipo.
- Criar detalhe simples do pedido.
- Exibir estado vazio com acao de novo pedido.

Criterios de aceite:
- Lista mostra pedidos reais da organizacao.
- Filtros funcionam.
- npm run lint passa.
```

### F4.6 - Criar area admin inicial para pedidos

- [x] **Codex**

```txt
Crie uma area admin inicial para visualizar pedidos de todas as organizacoes.

Contexto:
- A operacao interna precisa acompanhar pedidos.
- O app ainda pode nao ter sistema completo de papeis.

Objetivo:
- Permitir visualizacao operacional dos pedidos sem quebrar seguranca.

Requisitos:
- Verificar se existe papel admin no schema/perfil.
- Se nao existir, propor e implementar caminho minimo com migration.
- Criar rota de dashboard admin ou secao protegida.
- Listar pedidos com organizacao, solicitante, status e prazo.
- Bloquear acesso para usuarios nao admin.

Criterios de aceite:
- Admin ve pedidos de todas as organizacoes.
- Usuario comum nao acessa area admin.
- npm run lint e npm run build passam.
```

### F4.7 - Criar comentarios internos no pedido

- [x] **Codex**

```txt
Implemente comentarios internos em pedidos de criativo.

Contexto:
- Pedidos podem precisar de conversa entre vendedor e operacao.

Objetivo:
- Permitir registrar comentarios no pedido.

Requisitos:
- Criar tabela de comentarios relacionada ao pedido, se necessario.
- Salvar autor, texto, visibilidade e timestamps.
- Mostrar comentarios no detalhe do pedido.
- Permitir adicionar novo comentario.
- Respeitar RLS/organizacao.

Criterios de aceite:
- Comentarios persistem apos reload.
- Comentarios aparecem em ordem cronologica.
- npm run lint e npm run build passam.
```

- [ ] **Eu:** definir quais tipos de pacote serao vendidos: design, video, setup Meta, consultoria ou operacao mensal.
- [ ] **Eu:** definir prazos, preco e escopo de cada pacote.

### F4.8 - Testar fluxo completo de pedido

- [ ] **Codex + Eu**

```txt
Teste o fluxo completo de pedido ate entrega manual.

Contexto:
- Eu vou validar o processo comercial real de pedido.

Objetivo:
- Garantir que um vendedor consegue solicitar e acompanhar um pedido ate entrega.

Requisitos para Codex:
- Testar criacao, listagem, detalhe, comentarios, anexos e mudanca de status.
- Validar no MCP Supabase os registros criados/alterados em `creative_requests` e tabelas relacionadas liberadas.
- Corrigir bugs pequenos encontrados.
- Registrar lacunas que dependem de decisao de negocio.

Parte manual:
- Eu devo confirmar tipos de pacote, prazos e como a entrega manual sera feita.

Criterios de aceite:
- Pedido percorre todos os status esperados.
- Vendedor consegue entender o andamento.
```

Nota Codex 2026-05-05:
- Validacao tecnica parcial executada: `npm run lint` e `npm run build` passaram.
- MCP/Supabase operacional para `creative_requests` e `creative_request_comments` via service role.
- Bloqueio de configuracao resolvido: `.env.local` agora tem `NEXT_PUBLIC_SUPABASE_ANON_KEY` e o app reconhece Supabase como configurado.
- Continua pendente: validar login real no navegador, testar pedido real com uma sessao autenticada e confirmar tipos de pacote, prazos e entrega manual.

## Fase 5 - Integracao Make/Zapier antes da Meta direta

### F5.1 - Criar endpoint de webhook para automacoes

- [x] **Codex**

```txt
Crie endpoint de webhook para receber leads de Make/Zapier.

Contexto:
- Antes da integracao oficial Meta, o app deve receber leads por automacao.

Objetivo:
- Permitir que Make ou Zapier envie payloads de lead para a LeadHealth.

Requisitos:
- Criar rota POST em app/api/webhooks/leads ou caminho consistente.
- Validar metodo, content-type e payload.
- Converter payload para o modelo de leads.
- Retornar respostas claras para sucesso e erro.
- Nao exigir sessao de usuario, mas exigir token secreto em tarefa separada ou nesta se simples.

Criterios de aceite:
- Webhook cria lead real.
- Payload invalido retorna 400.
- npm run lint e npm run build passam.
```

### F5.2 - Exigir token secreto por organizacao ou integracao

- [x] **Codex**

```txt
Proteja webhooks com token secreto por organizacao ou integracao.

Contexto:
- Webhooks publicos nao podem criar leads sem autenticacao.

Objetivo:
- Exigir um token para aceitar leads externos.

Requisitos:
- Criar schema para token de integracao, se necessario.
- Validar token via header Authorization ou x-leadhealth-token.
- Associar token a uma organizacao.
- Nunca salvar token em texto puro se for viavel usar hash.
- Retornar 401 para token ausente/invalido.

Criterios de aceite:
- Webhook sem token nao cria lead.
- Token valido cria lead na organizacao correta.
- npm run lint e npm run build passam.
```

### F5.3 - Mapear payload recebido para leads

- [x] **Codex**

```txt
Implemente mapeamento flexivel de payload de webhook para o modelo de leads.

Contexto:
- Make/Zapier podem enviar campos com nomes diferentes.

Objetivo:
- Converter payloads comuns em leads consistentes.

Requisitos:
- Aceitar campos comuns: name/nome, email, phone/telefone, city/cidade, source/origem, interest/interesse.
- Normalizar telefone.
- Validar duplicidade usando regras existentes.
- Salvar campos extras em raw_payload, se o schema permitir.
- Validar pelo MCP Supabase que leads de teste gravam campos normalizados e payload bruto conforme esperado.
- Documentar formato recomendado.

Criterios de aceite:
- Payloads com nomes em PT ou EN funcionam.
- Campos extras nao quebram a importacao.
- npm run lint passa.
```

### F5.4 - Salvar source = make_zapier

- [ ] **Codex**

```txt
Garanta que leads vindos do webhook Make/Zapier sejam salvos com source = make_zapier.

Contexto:
- Origem correta sera usada em filtros e relatorios.

Objetivo:
- Identificar leads de automacao externa.

Requisitos:
- Atualizar enum/tipos se necessario.
- Definir source padrao do webhook como make_zapier.
- Permitir sobrescrever somente se for uma origem aceita e segura.
- Garantir que filtros por origem reconhecam make_zapier.
- Conferir pelo MCP Supabase que leads criados pelo webhook ficam com `source = make_zapier`.

Criterios de aceite:
- Todo lead do webhook possui source = make_zapier por padrao.
- npm run lint passa.
```

### F5.5 - Registrar payload bruto

- [ ] **Codex**

```txt
Registre o payload bruto recebido em webhooks.

Contexto:
- Logs ajudam a auditar problemas de integracao.

Objetivo:
- Salvar raw_payload de forma ligada ao lead ou a um log de webhook.

Requisitos:
- Verificar se leads ja possui raw_payload.
- Se necessario, criar tabela de webhook_events.
- Se criar `webhook_events`, liberar a tabela no MCP Supabase e documentar em `docs/mcp-supabase.md`.
- Salvar payload, headers seguros, status do processamento e erro.
- Evitar salvar segredos/tokens.
- Validar registros salvos via MCP Supabase sem expor headers sensiveis.

Criterios de aceite:
- Cada webhook recebido possui registro auditavel.
- Tokens nao ficam expostos nos dados salvos.
- npm run lint e npm run build passam.
```

### F5.6 - Criar tela de instrucoes Make/Zapier

- [ ] **Codex**

```txt
Crie tela de instrucoes para conectar Make/Zapier.

Contexto:
- O vendedor precisa copiar URL do webhook e token.

Objetivo:
- Orientar configuracao externa sem texto excessivo.

Requisitos:
- Criar secao no dashboard para integracoes.
- Mostrar URL do webhook.
- Permitir gerar/copiar token de integracao.
- Mostrar exemplo curto de payload JSON.
- Adicionar botao copiar para URL e token.
- Validar pelo MCP Supabase que o token/integracao foi criado para a organizacao correta, sem revelar token puro quando houver hash.

Criterios de aceite:
- Usuario consegue configurar Make/Zapier com as informacoes da tela.
- Token nao e exibido de forma insegura depois de gerado, se houver hash.
- npm run lint passa.
```

### F5.7 - Criar logs de webhooks recebidos

- [ ] **Codex**

```txt
Crie visualizacao de logs de webhooks recebidos.

Contexto:
- Usuario precisa entender se a automacao esta enviando dados corretamente.

Objetivo:
- Listar eventos recentes de webhook, status e erros.

Requisitos:
- Criar tabela/API se ainda nao existir.
- Se criar tabela de logs, liberar a tabela no MCP Supabase e documentar em `docs/mcp-supabase.md`.
- Exibir data, origem, status, lead criado e mensagem de erro.
- Permitir filtrar por sucesso/erro.
- Respeitar organizacao.
- Conferir pelo MCP Supabase que eventos de teste aparecem na tabela de logs e apontam para o lead correto.

Criterios de aceite:
- Logs aparecem apos chamadas reais ao webhook.
- Erros ajudam a corrigir o payload.
- npm run lint passa.
```

- [ ] **Eu:** criar cenario no Make ou Zapier conectando Meta Lead Ads ao webhook da LeadHealth.

### F5.8 - Testar recebimento de lead em tempo quase real

- [ ] **Codex + Eu**

```txt
Teste recebimento de lead via Make/Zapier em tempo quase real.

Contexto:
- Eu vou configurar o cenario no Make ou Zapier.
- O Codex deve validar endpoint, logs e criacao de lead.

Objetivo:
- Confirmar que um lead vindo da automacao aparece no CRM.

Requisitos para Codex:
- Validar URL, token e payload esperado.
- Acompanhar logs do app.
- Conferir pelo MCP Supabase o evento recebido, o lead criado e `source = make_zapier`.
- Corrigir problemas de mapeamento ou autenticacao.
- Documentar passos finais de configuracao.

Parte manual:
- Eu devo disparar o teste no Make/Zapier.

Criterios de aceite:
- Lead aparece no dashboard pouco depois do disparo.
- Log mostra sucesso ou erro compreensivel.
```

## Fase 6 - Meta Lead Ads oficial

- [ ] **Eu:** criar ou confirmar conta Meta for Developers.
- [ ] **Eu:** criar app da Meta para a LeadHealth.
- [ ] **Eu:** obter `META_APP_ID` e `META_APP_SECRET`.
- [ ] **Eu:** definir `META_VERIFY_TOKEN`.
- [ ] **Eu:** configurar dominio, politica de privacidade e termos exigidos pela Meta.

### F6.1 - Criar paginas publicas de privacidade e termos

- [ ] **Codex**

```txt
Crie paginas publicas de politica de privacidade e termos da LeadHealth.

Contexto:
- A Meta e gateways podem exigir URLs publicas.
- O conteudo deve ser um rascunho operacional, nao aconselhamento juridico definitivo.

Objetivo:
- Ter /privacy e /terms ou rotas equivalentes publicas.

Requisitos:
- Criar paginas com layout consistente com o site.
- Incluir linguagem de rascunho para SaaS CRM com leads, Supabase, IA e integracoes.
- Evitar prometer conformidade juridica absoluta.
- Adicionar links no rodape ou navegacao publica.

Criterios de aceite:
- Paginas abrem sem login.
- Conteudo e claro e editavel.
- npm run lint passa.
```

### F6.2 - Criar GET /api/meta/webhook para verificacao

- [ ] **Codex**

```txt
Implemente endpoint GET /api/meta/webhook para verificacao da Meta.

Contexto:
- A Meta usa hub.mode, hub.verify_token e hub.challenge.
- META_VERIFY_TOKEN deve vir do ambiente.

Objetivo:
- Permitir verificacao do webhook no painel da Meta.

Requisitos:
- Criar rota GET em app/api/meta/webhook/route.ts.
- Validar verify token.
- Retornar challenge quando token estiver correto.
- Retornar 403 quando token estiver incorreto.
- Nao expor segredo em logs.

Criterios de aceite:
- Requisicao GET com token correto retorna challenge.
- Token errado retorna 403.
- npm run lint e npm run build passam.
```

### F6.3 - Criar POST /api/meta/webhook para eventos leadgen

- [ ] **Codex**

```txt
Implemente endpoint POST /api/meta/webhook para eventos leadgen.

Contexto:
- A Meta envia eventos de leadgen para o webhook.
- O endpoint inicialmente pode registrar evento antes de buscar detalhes do lead.

Objetivo:
- Receber eventos da Meta sem quebrar e preparar processamento.

Requisitos:
- Aceitar POST com payload da Meta.
- Validar estrutura basica de entry/changes.
- Registrar evento em tabela/log, se ja existir.
- Retornar 200 rapidamente para eventos validos.
- Tratar payload invalido com 400.
- Validar pelo MCP Supabase que eventos de teste ficam registrados sem expor segredos.

Criterios de aceite:
- Endpoint aceita payload de teste da Meta.
- Eventos leadgen sao identificados.
- npm run lint e npm run build passam.
```

### F6.4 - Validar assinatura dos eventos Meta

- [ ] **Codex**

```txt
Adicione validacao de assinatura dos eventos enviados pela Meta.

Contexto:
- A Meta envia assinatura em header como x-hub-signature-256.
- META_APP_SECRET deve ser usado para validar HMAC.

Objetivo:
- Rejeitar eventos falsos no webhook oficial.

Requisitos:
- Ler body bruto ou implementar forma compativel com Next.js para calcular HMAC.
- Comparar assinatura com timing-safe comparison.
- Retornar 401/403 para assinatura invalida.
- Manter logs sem expor segredos.

Criterios de aceite:
- Payload com assinatura invalida e rejeitado.
- Payload valido passa.
- npm run lint e npm run build passam.
```

### F6.5 - Criar servico para buscar dados do lead pelo leadgen_id

- [ ] **Codex**

```txt
Crie servico para buscar dados do lead na Meta pelo leadgen_id.

Contexto:
- Evento leadgen traz ID, mas os dados do formulario precisam ser buscados na Graph API.

Objetivo:
- Obter dados completos do lead para salvar no CRM.

Requisitos:
- Criar servico server-side para Meta Graph API.
- Usar versao configuravel META_GRAPH_API_VERSION.
- Usar token apropriado de pagina/integracao.
- Mapear field_data para modelo de lead.
- Tratar erros e limites da API.

Criterios de aceite:
- Servico possui funcao clara para buscar leadgen_id.
- Erros sao propagados com mensagens uteis.
- npm run lint passa.
```

### F6.6 - Criar estrutura para tokens, paginas e formularios Meta

- [ ] **Codex**

```txt
Crie estrutura de banco para integracoes Meta: tokens, paginas conectadas e formularios.

Contexto:
- A LeadHealth precisara associar contas/paginas/formularios a organizacoes.

Objetivo:
- Preparar persistencia segura para integracao oficial Meta.

Requisitos:
- Criar migrations para tabelas de integracoes Meta.
- Campos minimos: organizacao, page_id, page_name, form_id, form_name, token criptografado ou referencia segura, status e timestamps.
- Criar RLS por organizacao.
- Atualizar tipos.
- Liberar as novas tabelas no MCP Supabase e documentar em `docs/mcp-supabase.md`.
- Nao implementar OAuth completo se nao for necessario nesta tarefa.
- Validar pelo MCP Supabase a existencia dos registros de integracao e o isolamento por organizacao com dados controlados.

Criterios de aceite:
- Schema suporta paginas e formularios conectados.
- Dados ficam isolados por organizacao.
- npm run lint e npm run build passam.
```

### F6.7 - Salvar leads diretos com source = meta_lead_ads

- [ ] **Codex**

```txt
Salve leads recebidos pela integracao oficial Meta com source = meta_lead_ads.

Contexto:
- Leads vindos do webhook oficial devem ser distinguiveis de CSV e Make/Zapier.

Objetivo:
- Persistir leads Meta no modelo principal de leads.

Requisitos:
- Mapear dados buscados na Graph API para lead.
- Salvar meta_lead_id.
- Salvar source = meta_lead_ads.
- Preservar raw_payload/evento.
- Respeitar duplicidade por meta_lead_id.
- Conferir pelo MCP Supabase o lead criado, `meta_lead_id`, `source` e payload/evento relacionado.

Criterios de aceite:
- Evento Meta cria lead real.
- Duplicata do mesmo meta_lead_id nao cria outro lead.
- npm run lint passa.
```

### F6.8 - Tratar duplicidade por meta_lead_id

- [ ] **Codex**

```txt
Reforce tratamento de duplicidade por meta_lead_id.

Contexto:
- A Meta pode reenviar eventos.
- O app ja possui alguma validacao de duplicidade.

Objetivo:
- Garantir idempotencia para leads Meta.

Requisitos:
- Verificar constraint/index no banco.
- Ajustar repositorio/API para upsert ou erro controlado.
- Garantir que reenviar evento nao duplica lead.
- Registrar no log quando evento for duplicado.
- Validar idempotencia pelo MCP Supabase comparando contagem de leads por `meta_lead_id`.

Criterios de aceite:
- Mesmo meta_lead_id processado duas vezes gera apenas um lead.
- Resposta do webhook continua adequada para evitar retries desnecessarios.
- npm run lint e npm run build passam.
```

### F6.9 - Configurar webhook no painel da Meta

- [ ] **Codex + Eu**

```txt
Prepare e acompanhe configuracao do webhook no painel da Meta.

Contexto:
- Eu vou acessar o Meta for Developers.
- O Codex deve garantir que endpoints e variaveis estejam prontos.

Objetivo:
- Validar webhook oficial da Meta no app.

Requisitos para Codex:
- Conferir GET /api/meta/webhook.
- Conferir META_VERIFY_TOKEN.
- Fornecer URL esperada e checklist de teste.
- Corrigir erros de verificacao se aparecerem.

Parte manual:
- Eu devo configurar a URL e o token no painel da Meta.

Criterios de aceite:
- Meta aceita a verificacao do webhook.
```

### F6.10 - Passar pelo App Review se necessario

- [ ] **Codex + Eu**

```txt
Prepare materiais tecnicos para App Review da Meta, se as permissoes exigirem revisao.

Contexto:
- Algumas permissoes Meta podem exigir justificativa, screencast e URLs publicas.

Objetivo:
- Organizar o que o app precisa demonstrar para a revisao.

Requisitos para Codex:
- Listar permissoes provaveis da integracao Lead Ads.
- Criar checklist tecnico de telas, endpoints e politica de privacidade.
- Ajustar paginas publicas se faltar informacao basica.

Parte manual:
- Eu devo enviar revisao no painel da Meta.

Criterios de aceite:
- Checklist de App Review esta claro e os requisitos tecnicos estao prontos.
```

### F6.11 - Testar lead real vindo de formulario Meta

- [ ] **Codex + Eu**

```txt
Teste um lead real vindo de formulario Meta.

Contexto:
- Eu vou disparar um lead de teste ou real no Meta.
- O Codex deve validar recebimento, processamento e exibicao no CRM.

Objetivo:
- Confirmar integracao oficial ponta a ponta.

Requisitos para Codex:
- Monitorar webhook/logs.
- Verificar busca por leadgen_id.
- Confirmar criacao no Supabase pelo app e por `supabase_select` via MCP `leadhealth-supabase`.
- Corrigir problemas de mapeamento, token ou duplicidade.

Parte manual:
- Eu devo disparar o lead no Meta e autorizar acessos necessarios.

Criterios de aceite:
- Lead do formulario aparece em /dashboard/leads com source = meta_lead_ads.
```

## Fase 7 - Pagamentos e planos

- [ ] **Eu:** escolher gateway inicial: Mercado Pago, Asaas ou Stripe.
- [ ] **Eu:** definir precos finais dos planos Solo, Equipe e Operacao.
- [ ] **Eu:** definir trial, garantia, cancelamento e limites por plano.

### F7.1 - Criar tabelas de planos e assinaturas

- [ ] **Codex**

```txt
Crie tabelas de planos, assinaturas e eventos de pagamento.

Contexto:
- A pagina /pricing existe visualmente.
- O gateway ainda sera definido.

Objetivo:
- Preparar modelo de billing independente do gateway.

Requisitos:
- Criar migration com plans, subscriptions e payment_events.
- Relacionar assinatura a organizacao.
- Incluir status, periodo, gateway, external_id e timestamps.
- Criar RLS por organizacao.
- Atualizar tipos.
- Liberar `plans`, `subscriptions` e `payment_events` no MCP Supabase e documentar em `docs/mcp-supabase.md`.
- Validar pelo MCP Supabase a existencia/retorno das tabelas liberadas e registros controlados de plano/assinatura.

Criterios de aceite:
- Schema suporta Mercado Pago, Asaas ou Stripe.
- Organizacao tem no maximo uma assinatura ativa, se fizer sentido.
- npm run lint e npm run build passam.
```

### F7.2 - Integrar checkout externo

- [x] **Codex**

```txt
Integre checkout externo do gateway escolhido.

Contexto:
- Eu devo informar o gateway escolhido: Mercado Pago, Asaas ou Stripe.
- A integracao deve ser feita server-side.

Objetivo:
- Criar sessao/link de checkout para um plano.

Requisitos:
- Ler credenciais do ambiente.
- Criar rota API para iniciar checkout.
- Associar checkout a organizacao e plano.
- Redirecionar usuario para checkout externo.
- Tratar ausencia de credenciais com erro amigavel.

Criterios de aceite:
- Botao de plano inicia checkout em ambiente de teste.
- Dados sensiveis nao vao para o cliente.
- npm run lint e npm run build passam.
```

### F7.3 - Criar webhook de pagamento

- [x] **Codex**

```txt
Crie webhook para eventos de pagamento aprovado, recusado e cancelado.

Contexto:
- Gateway sera Mercado Pago, Asaas ou Stripe.

Objetivo:
- Atualizar assinatura da organizacao conforme eventos do gateway.

Requisitos:
- Criar endpoint publico de webhook.
- Validar assinatura/token do gateway.
- Registrar payment_events.
- Atualizar subscription status.
- Garantir idempotencia por event_id.

Criterios de aceite:
- Evento aprovado ativa assinatura.
- Evento cancelado/recusado altera status corretamente.
- Reenvio do mesmo evento nao duplica efeitos.
- npm run lint e npm run build passam.
```

### F7.4 - Bloquear ou limitar recursos conforme assinatura

- [ ] **Codex**

```txt
Implemente limites de recursos conforme assinatura.

Contexto:
- Planos terao limites de leads, usuarios, campanhas ou recursos de IA.

Objetivo:
- Bloquear ou limitar recursos quando organizacao nao tiver plano valido.

Requisitos:
- Criar helper server-side para obter assinatura/limites.
- Aplicar bloqueio em recursos principais com mensagens claras.
- Evitar bloquear login e tela de billing.
- Manter fallback local amigavel quando billing nao estiver configurado.
- Conferir pelo MCP Supabase os cenarios de organizacao sem assinatura, assinatura ativa e assinatura inativa.

Criterios de aceite:
- Organizacao sem assinatura ve orientacao para escolher plano.
- Recursos protegidos nao executam so pelo client-side.
- npm run lint e npm run build passam.
```

### F7.5 - Criar tela de billing

- [x] **Codex**

```txt
Crie tela de billing/assinatura no dashboard.

Contexto:
- Usuarios precisam ver plano atual, status e acoes de pagamento.

Objetivo:
- Mostrar assinatura da organizacao e permitir gerenciar plano.

Requisitos:
- Criar rota no dashboard para billing.
- Exibir plano atual, status, periodo e limites.
- Adicionar CTA para escolher/alterar plano.
- Preparar espaco para portal externo do gateway, se existir.

Criterios de aceite:
- Tela mostra dados reais quando assinatura existe.
- Estado vazio orienta escolher plano.
- npm run lint passa.
```

### F7.6 - Fazer compra teste ponta a ponta

- [ ] **Codex + Eu**

```txt
Teste compra ponta a ponta em ambiente sandbox do gateway.

Contexto:
- Eu vou fornecer credenciais sandbox e executar pagamento quando necessario.

Objetivo:
- Confirmar checkout, webhook e ativacao de assinatura.

Requisitos para Codex:
- Rodar app local ou ambiente de teste.
- Validar criacao de checkout.
- Acompanhar webhook.
- Confirmar `subscriptions` e `payment_events` via MCP Supabase.
- Corrigir problemas de assinatura, idempotencia ou status.

Parte manual:
- Eu devo concluir pagamento teste no gateway.

Criterios de aceite:
- A assinatura da organizacao fica ativa apos pagamento aprovado.
```

## Fase 8 - Deploy e producao

- [ ] **Eu:** criar projeto na Vercel.
- [ ] **Eu:** configurar dominio da LeadHealth.
- [ ] **Eu:** configurar variaveis de ambiente de producao.

### F8.1 - Revisar URLs, redirects e callback de autenticacao

- [ ] **Codex**

```txt
Revise NEXT_PUBLIC_APP_URL, redirects e callback de autenticacao para producao.

Contexto:
- O app usa Supabase Auth e rota app/auth/callback.
- Em producao, URLs precisam bater com Vercel/dominio.
- Para validar dados reais de perfil, organizacao e sessao persistida, usar o MCP Supabase.

Objetivo:
- Evitar erro de login ou redirect em deploy.

Requisitos:
- Inspecionar uso de NEXT_PUBLIC_APP_URL.
- Validar callback /auth/callback.
- Garantir que redirects funcionem em localhost e producao.
- Rodar `supabase_status` via MCP e consultar perfis/organizacoes quando a validacao envolver cadastro, sessao ou redirect.
- Atualizar README/.env.example se faltar variavel.

Criterios de aceite:
- Login local continua funcionando.
- Instrucoes de URLs de producao estao claras.
- npm run lint e npm run build passam.
```

### F8.2 - Adicionar verificacao de ambiente para producao

- [ ] **Codex**

```txt
Adicione verificacao de ambiente para producao.

Contexto:
- O app depende de Supabase, OpenAI, Meta e pagamentos conforme recursos.
- O MCP Supabase ja existe e deve ser considerado na verificacao operacional de dados.

Objetivo:
- Detectar variaveis obrigatorias ausentes antes de quebrar em runtime.

Requisitos:
- Criar helper de validacao de ambiente server-side.
- Separar variaveis obrigatorias do core e variaveis opcionais por integracao.
- Documentar variaveis necessarias para o MCP Supabase (`NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`) somente para uso server/local.
- Mostrar erro amigavel em recursos opcionais sem chave.
- Documentar variaveis no README ou .env.example.

Criterios de aceite:
- Build nao expoe segredos.
- Recursos opcionais falham de forma clara.
- npm run lint e npm run build passam.
```

### F8.3 - Rodar build e lint antes do deploy

- [ ] **Codex**

```txt
Execute verificacao pre-deploy do projeto.

Contexto:
- Antes de enviar para producao, precisamos garantir qualidade minima.

Objetivo:
- Rodar lint e build, corrigindo erros encontrados.

Requisitos:
- Rodar npm run lint.
- Rodar npm run build.
- Corrigir erros de TypeScript, lint, rotas e imports.
- Nao fazer refatoracoes fora do escopo.

Criterios de aceite:
- npm run lint passa.
- npm run build passa.
- Se algo depender de variavel externa, documente exatamente o bloqueio.
```

### F8.4 - Preparar scripts ou instrucoes de migration

- [ ] **Codex**

```txt
Prepare scripts ou instrucoes claras para aplicar migrations Supabase.

Contexto:
- Migrations estao em supabase/migrations.
- O MCP Supabase local ja existe para consultar/alterar dados permitidos e validar o estado do banco.
- Mudancas de schema ainda devem ser versionadas em migrations; SQL Editor ou CLI ficam como fallback quando o MCP nao cobrir DDL.

Objetivo:
- Reduzir erro manual ao configurar banco em producao.

Requisitos:
- Atualizar README ou criar docs de deploy/migrations.
- Listar ordem das migrations.
- Explicar o fluxo recomendado: criar/versionar migration, aplicar pelo caminho disponivel e validar dados/tabelas pelo MCP Supabase.
- Documentar comandos do MCP (`supabase_status`, `supabase_select` e, quando necessario, insert/update/delete nas tabelas liberadas).
- Se houver CLI configurada, documentar comandos como alternativa.
- Explicar como aplicar via Supabase SQL Editor apenas como fallback/manual.
- Avisar sobre backup antes de rodar em producao.

Criterios de aceite:
- Uma pessoa consegue aplicar o banco seguindo o documento.
- Ordem das migrations esta clara.
- Existe passo de validacao via MCP depois da aplicacao.
```

### F8.5 - Testar cadastro, login, leads e dashboard no dominio real

- [ ] **Codex + Eu**

```txt
Teste cadastro, login, leads e dashboard no dominio real.

Contexto:
- Eu vou configurar Vercel, dominio e variaveis de ambiente.
- Codex deve usar MCP Supabase para verificar dados reais de perfil/organizacao/leads.

Objetivo:
- Confirmar que o app em producao funciona para o fluxo principal.

Requisitos para Codex:
- Conferir variaveis esperadas.
- Verificar build/deploy se houver acesso.
- Testar rotas publicas e protegidas.
- Conferir pelo MCP se cadastro/login criaram ou atualizaram registros esperados nas tabelas liberadas.
- Corrigir bugs de URL, cookie, callback ou fetch.

Parte manual:
- Eu devo fornecer/confirmar dominio e ambiente Vercel; o MCP Supabase ja esta conectado via Role Key.

Criterios de aceite:
- Usuario consegue entrar e usar leads no dominio real.
```

### F8.6 - Configurar URLs publicas de Meta, webhooks e pagamentos

- [ ] **Codex + Eu**

```txt
Revise URLs publicas usadas por Meta, webhooks e gateway de pagamento.

Contexto:
- Integracoes externas precisam de URLs estaveis de producao.

Objetivo:
- Garantir que callbacks e webhooks apontem para o dominio correto.

Requisitos para Codex:
- Listar todas as URLs publicas do app.
- Conferir se cada rota existe e responde.
- Atualizar README/.env.example com nomes corretos.
- Corrigir hardcodes de localhost.

Parte manual:
- Eu devo configurar essas URLs nos paineis externos.

Criterios de aceite:
- Existe checklist com URL de cada integracao.
- Nenhuma integracao usa localhost em producao.
```

## Fase 9 - Qualidade, seguranca e operacao

### F9.1 - Adicionar testes unitarios de normalizacao

- [ ] **Codex**

```txt
Adicione testes unitarios para normalizacao de leads.

Contexto:
- Existe src/lib/leads/normalization.ts.
- O projeto ainda pode nao ter framework de testes configurado.

Objetivo:
- Garantir normalizacao correta de telefone, email e campos principais.

Requisitos:
- Escolher um framework leve compatibilidade Next/TypeScript.
- Adicionar script de teste em package.json.
- Criar testes para telefone brasileiro, email vazio, duplicidade de formatos e valores invalidos.
- Nao alterar comportamento sem necessidade.

Criterios de aceite:
- npm test passa.
- npm run lint passa.
```

### F9.2 - Adicionar testes de API para CRUD de leads

- [ ] **Codex**

```txt
Adicione testes para APIs de CRUD de leads.

Contexto:
- Rotas estao em app/api/leads.
- Testes automatizados devem usar mocks; validacoes manuais/operacionais devem consultar dados reais pelo MCP Supabase.

Objetivo:
- Cobrir comportamento basico de GET, POST, PATCH e DELETE.

Requisitos:
- Usar mocks para Supabase/repositorio quando necessario.
- Testar sucesso, validacao e erro de duplicidade.
- Separar claramente testes automatizados com mock de validacao manual via MCP Supabase.
- Manter testes rapidos e confiaveis.
- Documentar como rodar.

Criterios de aceite:
- Testes cobrem rotas principais de leads.
- npm test e npm run lint passam.
```

### F9.3 - Adicionar testes basicos de paginas criticas

- [ ] **Codex**

```txt
Adicione testes basicos para paginas criticas.

Contexto:
- Paginas importantes: /, /login, /pricing, /dashboard e /dashboard/leads.

Objetivo:
- Detectar que paginas principais renderizam sem erro.

Requisitos:
- Escolher abordagem simples: testes de componente, smoke tests ou Playwright se ja fizer sentido.
- Cobrir renderizacao basica e textos/acoes principais.
- Evitar suite lenta demais.

Criterios de aceite:
- Testes rodam localmente com comando documentado.
- npm run lint passa.
```

### F9.4 - Revisar RLS

- [ ] **Codex**

```txt
Revise as policies RLS para garantir isolamento por organizacao.

Contexto:
- Migrations Supabase definem organizacoes, perfis, leads e outras tabelas futuras.
- O MCP Supabase deve ser usado para verificar tabelas/dados liberados, lembrando que a Role Key ignora RLS.

Objetivo:
- Evitar acesso cruzado entre organizacoes.

Requisitos:
- Inspecionar todas as migrations.
- Conferir policies de SELECT, INSERT, UPDATE e DELETE.
- Usar `supabase_status` e consultas via MCP nas tabelas liberadas para montar fixtures controladas e conferir dados por organizacao.
- Identificar tabelas sem RLS ou policy incompleta.
- Corrigir com migration nova, nao editando migration antiga ja aplicada, se apropriado.
- Documentar riscos restantes.

Criterios de aceite:
- Tabelas sensiveis possuem RLS habilitado.
- Policies filtram por organizacao.
- npm run lint/build passam se tipos forem alterados.
```

### F9.5 - Adicionar logs controlados para erros de API

- [ ] **Codex**

```txt
Adicione logs controlados para erros de API.

Contexto:
- APIs devem ajudar debug sem vazar segredos ou dados sensiveis.

Objetivo:
- Padronizar logging de erros server-side.

Requisitos:
- Criar helper simples de log, se nao existir.
- Registrar contexto seguro: rota, operacao, status e mensagem.
- Nao logar tokens, chaves, payload completo de dados pessoais ou cookies.
- Aplicar nas APIs principais de leads/webhooks se existirem.
- Validar pelo MCP Supabase que logs persistidos nao contem tokens, cookies ou payload pessoal completo.

Criterios de aceite:
- Erros importantes ficam rastreaveis.
- Dados sensiveis nao aparecem em logs.
- npm run lint passa.
```

### F9.6 - Criar limites de tamanho para payloads e uploads

- [ ] **Codex**

```txt
Implemente limites de tamanho para payloads e uploads.

Contexto:
- Webhooks, CSV e anexos podem receber dados grandes.

Objetivo:
- Reduzir risco operacional e abuso.

Requisitos:
- Definir limites por tipo: JSON webhook, CSV, anexos.
- Validar tamanho antes de processar.
- Retornar erro claro quando exceder.
- Documentar limites na UI ou docs quando fizer sentido.

Criterios de aceite:
- Payload/arquivo acima do limite e rejeitado.
- Erro nao quebra a pagina.
- npm run lint passa.
```

### F9.7 - Melhorar mensagens de erro para usuario final

- [ ] **Codex**

```txt
Melhore mensagens de erro para usuario final nas telas principais.

Contexto:
- Erros tecnicos nao devem aparecer crus para o vendedor.

Objetivo:
- Padronizar mensagens claras em leads, login, campanhas, pedidos e integracoes.

Requisitos:
- Identificar mensagens tecnicas expostas na UI.
- Criar helper ou mapa de mensagens amigaveis se fizer sentido.
- Manter detalhes tecnicos apenas em logs controlados.
- Incluir acoes: tentar novamente, revisar campos, falar com suporte.

Criterios de aceite:
- Usuario entende o que fazer quando algo falha.
- Erros tecnicos continuam disponiveis para debug seguro.
- npm run lint passa.
```

### F9.8 - Adicionar rate limit em endpoints publicos

- [ ] **Codex**

```txt
Adicione rate limit em endpoints publicos de webhook.

Contexto:
- Endpoints publicos podem receber abuso ou repeticoes.

Objetivo:
- Limitar chamadas por token, IP ou organizacao.

Requisitos:
- Escolher solucao simples compativel com Vercel/Next.
- Aplicar em webhooks Make/Zapier e Meta, sem quebrar retries legitimos.
- Retornar 429 com mensagem clara.
- Documentar limitacoes da abordagem local/serverless.

Criterios de aceite:
- Chamadas excessivas sao bloqueadas.
- Chamadas normais continuam funcionando.
- npm run lint e npm run build passam.
```

### F9.9 - Criar rotina ou orientacao de backup Supabase

- [ ] **Codex**

```txt
Crie orientacao de backup para Supabase.

Contexto:
- Backup pode depender do plano Supabase e de operacao manual.
- O MCP Supabase permite consultar/exportar dados permitidos e deve entrar no fluxo operacional de verificacao.

Objetivo:
- Documentar como proteger dados de producao.

Requisitos:
- Criar documento curto em docs ou README.
- Explicar opcoes: backups Supabase, exportacao SQL, CSV de leads, consultas/exportacoes via MCP para tabelas liberadas e cuidados antes de migrations.
- Incluir checklist antes de aplicar migration em producao.
- Nao prometer automacao que nao existe.

Criterios de aceite:
- Existe orientacao clara de backup/restauracao basica.
```

- [ ] **Eu:** revisar termos comerciais, LGPD e politica de privacidade com apoio juridico.

### F9.10 - Teste de uso como vendedor real por 1 dia

- [ ] **Codex + Eu**

```txt
Prepare e acompanhe um teste de uso da LeadHealth como vendedor real por 1 dia.

Contexto:
- Eu vou usar o produto como se estivesse vendendo plano de saude empresarial.

Objetivo:
- Transformar friccoes reais em melhorias priorizadas.

Requisitos para Codex:
- Criar checklist de teste: cadastrar leads, filtrar, gerar mensagem, criar campanha, registrar proximo contato.
- Validar pelo MCP Supabase os registros gerados no teste do dia, sem expor dados pessoais no resumo.
- Corrigir bugs pequenos encontrados.
- Organizar feedback em tarefas objetivas no TAREFAS.md.

Parte manual:
- Eu devo executar o dia de uso e anotar problemas reais.

Criterios de aceite:
- Existe lista priorizada de melhorias baseada no uso real.
```

## Fase 10 - Produto comercial

- [ ] **Eu:** definir nome final, dominio, identidade e promessa principal da LeadHealth.
- [ ] **Eu:** definir ICP: corretor solo, corretora pequena, equipe comercial ou agencia.
- [ ] **Eu:** criar lista dos 10 primeiros usuarios beta.
- [ ] **Eu:** definir oferta beta e preco de entrada.
- [ ] **Eu:** gravar ou escrever onboarding simples para novos usuarios.

### F10.1 - Criar checklist de onboarding no dashboard

- [ ] **Codex**

```txt
Crie checklist de onboarding dentro do dashboard.

Contexto:
- Novos usuarios precisam chegar rapidamente ao primeiro valor.

Objetivo:
- Mostrar passos iniciais para ativacao: criar lead, gerar campanha, copiar mensagem e configurar integracao.

Requisitos:
- Criar componente de checklist no dashboard.
- Marcar passos automaticamente quando houver dados, se simples.
- Permitir ocultar ou concluir manualmente.
- Persistir estado se houver tabela adequada; caso contrario, manter derivado dos dados.
- Se criar tabela de onboarding/checklist, liberar no MCP Supabase e documentar em `docs/mcp-supabase.md`.
- Validar pelo MCP Supabase os sinais usados para marcar passos como concluidos.

Criterios de aceite:
- Usuario novo ve proximos passos claros.
- Checklist nao atrapalha usuario recorrente.
- npm run lint passa.
```

### F10.2 - Criar exemplos prontos de campanhas e mensagens

- [ ] **Codex**

```txt
Crie exemplos prontos de campanhas e mensagens para plano de saude empresarial.

Contexto:
- Exemplos ajudam beta testers sem depender sempre da IA.

Objetivo:
- Disponibilizar templates seguros e editaveis.

Requisitos:
- Criar dados/templates em src/data ou banco, conforme padrao atual.
- Se escolher banco, liberar a tabela de templates no MCP Supabase e documentar em `docs/mcp-supabase.md`.
- Incluir campanhas para MEI, pequenas empresas e reducao de custo empresarial.
- Incluir mensagens de WhatsApp por etapa do funil.
- Evitar linguagem sensivel de saude.
- Exibir templates nas telas de campanhas/WhatsApp.
- Se os exemplos forem salvos no banco, validar criacao/listagem pelo MCP Supabase.

Criterios de aceite:
- Usuario consegue copiar ou usar um exemplo.
- Templates seguem tom profissional.
- npm run lint passa.
```

### F10.3 - Criar indicadores de ativacao

- [ ] **Codex**

```txt
Crie indicadores de ativacao do produto.

Contexto:
- Ativacao inicial pode ser medida por lead criado, campanha gerada, mensagem copiada e pedido enviado.

Objetivo:
- Registrar ou calcular sinais de ativacao por organizacao.

Requisitos:
- Identificar eventos ja detectaveis pelos dados existentes.
- Criar helper/API para calcular status de ativacao.
- Exibir indicadores no dashboard ou onboarding.
- Evitar tracking externo nesta tarefa.
- Conferir pelo MCP Supabase que os indicadores batem com leads, campanhas, mensagens e pedidos reais da organizacao.

Criterios de aceite:
- Dashboard mostra progresso de ativacao.
- Indicadores refletem dados reais quando existem.
- npm run lint passa.
```

### F10.4 - Transformar feedback beta em tarefas

- [ ] **Codex + Eu**

```txt
Organize feedback dos primeiros beta testers em tarefas executaveis.

Contexto:
- Eu vou coletar duvidas, bugs e pedidos dos usuarios beta.

Objetivo:
- Transformar feedback solto em backlog priorizado no TAREFAS.md.

Requisitos para Codex:
- Agrupar feedback por tema: bug, UX, comercial, integracao, performance.
- Criar tarefas pequenas com prompts no mesmo formato deste arquivo.
- Sugerir prioridade P0/P1/P2.
- Nao implementar nada sem escolher uma tarefa.

Parte manual:
- Eu devo fornecer feedback bruto dos beta testers.

Criterios de aceite:
- Feedback vira backlog claro e acionavel.
```

## Backlog futuro

### B1 - Integracao para publicar campanha pausada no Meta Ads

- [ ] **Codex**

```txt
Planeje e implemente a base para publicar campanha pausada no Meta Ads.

Contexto:
- Esta e uma automacao futura e depende de permissao Meta Marketing API.

Objetivo:
- Criar arquitetura minima para enviar campanha para a Meta em modo pausado.

Requisitos:
- Verificar integracao Meta existente.
- Criar servico server-side para Marketing API.
- Nao ativar campanha automaticamente.
- Salvar request/response e status.
- Tratar ausencia de permissoes com erro claro.
- Validar pelo MCP Supabase qualquer registro local de request/status sem salvar token ou payload sensivel.

Criterios de aceite:
- Campanha pode ser enviada como rascunho/pausada em ambiente permitido.
- Falta de permissao e tratada sem quebrar o app.
```

### B2 - Upload de imagens para Meta Marketing API

- [ ] **Codex**

```txt
Implemente base para upload de imagens para Meta Marketing API.

Contexto:
- Futuramente criativos poderao ser enviados para a Meta.

Objetivo:
- Enviar imagem autorizada para biblioteca da conta de anuncios.

Requisitos:
- Criar servico server-side.
- Validar tamanho, formato e permissao.
- Associar imagem a pedido/campanha.
- Registrar retorno da Meta.
- Validar pelo MCP Supabase a associacao entre imagem, pedido/campanha e status local.

Criterios de aceite:
- Upload funciona quando token/permissao existe.
- Erros da Meta sao exibidos de forma amigavel.
```

### B3 - Multiusuario com convites e permissoes

- [ ] **Codex**

```txt
Implemente multiusuario completo com convites e permissoes por papel.

Contexto:
- Organizacoes podem ter equipe comercial e admins.

Objetivo:
- Permitir convidar usuarios e controlar papeis.

Requisitos:
- Criar/ajustar schema de membros e convites.
- Implementar convite por email ou link, conforme infraestrutura disponivel.
- Criar papeis: owner, admin, vendedor.
- Aplicar permissoes em rotas e APIs.
- Validar pelo MCP Supabase membros, convites e organizacao vinculada, usando dados controlados.

Criterios de aceite:
- Owner convida usuario.
- Usuario aceita convite e entra na organizacao correta.
- Permissoes bloqueiam acoes indevidas.
```

### B4 - Kanban com drag and drop persistido

- [ ] **Codex**

```txt
Crie pipeline visual Kanban com drag and drop persistido.

Contexto:
- O CRM precisa de movimentacao visual entre etapas.

Objetivo:
- Arrastar leads entre colunas e salvar nova etapa/ordem.

Requisitos:
- Usar biblioteca confiavel de drag and drop se fizer sentido.
- Persistir etapa e, se houver, ordem dentro da etapa.
- Suportar teclado ou alternativa acessivel.
- Tratar erro revertendo movimento.
- Conferir pelo MCP Supabase etapa/ordem persistidas apos movimentacao.

Criterios de aceite:
- Drag and drop funciona em desktop.
- Mudancas persistem apos reload.
```

### B5 - Integracoes com WhatsApp oficial ou provedor externo

- [ ] **Codex**

```txt
Planeje e implemente base para integracao com WhatsApp oficial ou provedor externo.

Contexto:
- Hoje o produto pode gerar/copiar mensagens manualmente.

Objetivo:
- Preparar envio por WhatsApp via API autorizada.

Requisitos:
- Criar camada de provedor desacoplada.
- Nao enviar mensagens sem opt-in/configuracao explicita.
- Salvar historico e status de envio.
- Tratar erros e limites do provedor.
- Validar pelo MCP Supabase historico/status de envio sem expor conteudo sensivel alem do necessario.

Criterios de aceite:
- Arquitetura suporta trocar provedor.
- Envio real so acontece com credenciais configuradas.
```

### B6 - Scoring automatico de leads

- [ ] **Codex**

```txt
Crie scoring automatico de leads.

Contexto:
- Leads podem ser priorizados por perfil e intencao.

Objetivo:
- Calcular score com base em campos do lead e interacoes.

Requisitos:
- Definir regra inicial local e explicavel.
- Atualizar score ao criar/editar lead.
- Mostrar score na UI e permitir filtro.
- Evitar depender de IA para a primeira versao.
- Conferir pelo MCP Supabase score persistido/atualizado em leads de teste.

Criterios de aceite:
- Score e calculado de forma previsivel.
- Usuario entende por que lead tem score alto.
```

### B7 - Relatorios de ROI por campanha, origem e vendedor

- [ ] **Codex**

```txt
Crie relatorios de ROI por campanha, origem e vendedor.

Contexto:
- Relatorios dependem de dados de origem, status e possivelmente receita/custo.

Objetivo:
- Mostrar indicadores comerciais basicos.

Requisitos:
- Definir metricas disponiveis com dados atuais.
- Criar tela de relatorios ou ampliar /dashboard/relatorios.
- Filtrar por periodo, origem e vendedor.
- Mostrar limitacoes quando custo/receita nao existir.
- Validar pelo MCP Supabase que os numeros exibidos batem com dados agregados reais.

Criterios de aceite:
- Relatorio usa dados reais.
- Numeros nao inventam informacoes ausentes.
```

### B8 - Exportacao de leads e relatorios

- [ ] **Codex**

```txt
Implemente exportacao de leads e relatorios.

Contexto:
- Usuarios podem precisar baixar dados para operacao externa.

Objetivo:
- Exportar CSV com filtros aplicados.

Requisitos:
- Criar endpoint server-side de exportacao.
- Respeitar organizacao e filtros.
- Incluir campos principais do lead.
- Evitar exportar dados de outra organizacao.
- Conferir pelo MCP Supabase que a consulta de exportacao respeita os mesmos filtros e organizacao.

Criterios de aceite:
- CSV baixa corretamente.
- Exportacao respeita filtros e RLS.
```

### B9 - Decidir automacao completa de Meta Ads

- [ ] **Codex + Eu**

```txt
Ajude a decidir quando transformar a operacao manual de Meta Ads em automacao completa.

Contexto:
- Automacao completa aumenta complexidade, risco de compliance e necessidade de permissoes.

Objetivo:
- Criar uma matriz de decisao para evoluir de operacao manual para automacao.

Requisitos para Codex:
- Listar requisitos tecnicos, riscos, permissoes e custos.
- Comparar operacao manual, semi-automatica e automatica.
- Transformar decisao em roadmap se for aprovado.

Parte manual:
- Eu devo decidir com base em clientes, volume e capacidade operacional.

Criterios de aceite:
- Existe recomendacao clara de quando automatizar.
```
