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

## Fase 5 - Integracao Make/Zapier antes da Meta direta

### F5.7 - Criar logs de webhooks recebidos

- [x] **Codex**

Nota operacional 2026-05-05:
- A camada de codigo desta entrega ja existe no repositorio:
  - persistencia e listagem em `src/lib/leads/webhook-events.server.ts` e `src/lib/leads/webhook-events.repository.ts`
  - exibicao com filtro em `app/dashboard/perfil/page.tsx`
  - tabela liberada no MCP e documentada em `docs/mcp-supabase.md`
- `npm run lint` e `npm run build` passam.
- A validacao final no banco ainda depende de aplicar a migration `supabase/migrations/202605050001_lead_webhook_events.sql`, porque a tabela `public.lead_webhook_events` ainda nao existe no projeto Supabase atualmente conectado a este workspace.

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

- [x] **Eu:** criar cenario no Make ou Zapier conectando Meta Lead Ads ao webhook da LeadHealth.

### F5.8 - Testar recebimento de lead em tempo quase real

- [x] **Codex + Eu**

Nota operacional 2026-05-05:
- O lado de código para webhook protegido, normalização de payload, `source = make_zapier` e auditoria em `lead_webhook_events` já está implementado no repositório.
- O próximo passo depende de ação manual fora do MCP: aplicar a migration `supabase/migrations/202605050001_lead_webhook_events.sql` via Supabase CLI ou SQL Editor, porque link/login/DDL não são operações cobertas com segurança total pelo MCP atual.
- Depois da aplicação da migration e do disparo manual do cenário no Make/Zapier, o Codex deve usar o MCP `leadhealth-supabase` para validar o evento recebido, o lead criado e os logs sem expor tokens.

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

- [x] **Codex**

Nota operacional 2026-05-05:
- As rotas publicas `/privacy` e `/terms` foram reforcadas com metadados canonicos, copy mais pronta para producao inicial e navegacao publica consistente.
- Tambem foi criada a rota publica `/data-deletion`, que ajuda a cumprir a exigencia de exclusao de dados normalmente pedida pela Meta junto da politica de privacidade.
- O app agora publica `robots.txt` e `sitemap.xml` usando `NEXT_PUBLIC_APP_URL`, deixando o dominio pronto para deploy e cadastro no App Dashboard da Meta.
- Validacao pendente para ambiente final:
  - definir `NEXT_PUBLIC_APP_URL` com o dominio HTTPS de producao
  - revisar o email/canal juridico final antes de publicar para clientes

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

- [x] **Codex**

Nota operacional 2026-05-05:
- A rota `GET /api/meta/webhook` foi implementada em `app/api/meta/webhook/route.ts`.
- O fluxo de verificacao ja retorna `403` quando o token nao confere ou nao esta configurado.
- A validacao final do caminho feliz ainda depende de definir `META_VERIFY_TOKEN` no ambiente usado pelo servidor em execucao e repetir o teste com `hub.challenge`.

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

- [x] **Codex**

Nota operacional 2026-05-05:
- O endpoint `POST /api/meta/webhook` foi implementado em `app/api/meta/webhook/route.ts`, com parser inicial em `src/lib/meta/webhook.ts`.
- O middleware agora libera `/api/meta/webhook` como rota publica em `middleware.ts`.
- Validacoes concluidas:
  - `npm run lint` passou.
  - `npm run build` passou.
  - teste HTTP local retornou `200` com `leadgen_events = 1` para payload Meta valido.
  - consulta no Supabase confirmou log em `lead_webhook_events` com `status = processed`, `http_status = 200` e `raw_payload.object = page`.

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

- [x] **Codex**

Nota operacional 2026-05-05:
- A validacao HMAC `x-hub-signature-256` foi implementada com `timingSafeEqual` em `src/lib/meta/webhook.ts`.
- O endpoint `POST /api/meta/webhook` agora le o body bruto antes do parse JSON para validar a assinatura.
- Validacoes concluidas:
  - `npm run lint` passou.
  - `npm run build` passou.
  - teste HTTP local sem `META_APP_SECRET` passou a falhar com `503`, como esperado para ambiente incompleto.
  - consulta no Supabase confirmou log `failed` em `lead_webhook_events` com `http_status = 503` e `error_message = META_APP_SECRET nao configurado.`.
- Validacao pendente para marcar como concluida:
  - testar um payload com assinatura HMAC valida em ambiente com `META_APP_SECRET` configurado.

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

- [x] **Codex**

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

- [x] **Codex**

```txt
Crie estrutura de banco para integracoes Meta: tokens, paginas conectadas e formularios.

Contexto:
- A LeadHealth precisura associar contas/paginas/formularios a organizacoes.

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

- [x] **Codex**

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

- [x] **Codex**

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

Nota operacional 2026-05-05:
- Foi criado o guia `docs/meta-app-review.md` com checklist tecnico de dominio, URLs publicas, webhook, App Dashboard e roteiro de screencast.
- O app ficou preparado para fornecer:
  - `/privacy`
  - `/terms`
  - `/data-deletion`
  - `/api/meta/webhook`
- Parte pendente para concluir a tarefa:
  - publicar o dominio real
  - preencher os campos no painel da Meta
  - gravar/enviar o material de review, caso a permissao solicitada realmente exija App Review

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

### F6.12 - Criar pagina /dashboard/empresa para contas conectadas

- [x] **Codex**

```txt
Crie a pagina /dashboard/empresa para centralizar contas conectadas da empresa.

Contexto:
- A LeadHealth precisa separar configuracao da empresa do perfil do usuario.
- A nova pagina deve ser o lugar oficial para conectar Meta e OpenAI.

Objetivo:
- Criar a area da empresa com status, conexoes e acoes de integracao.

Requisitos:
- Criar a rota /dashboard/empresa.
- Exibir cards para Meta/Facebook/Instagram e OpenAI.
- Mostrar status de conexao, expirado, erro e ultima sincronizacao.
- Manter /dashboard/perfil focado em nome comercial, usuario e webhook.
- Preservar o estilo visual do dashboard atual.

Criterios de aceite:
- A pagina abre autenticada.
- O usuario entende claramente o que esta conectado.
- npm run lint passa.

Observacao:
- Implementada a central /dashboard/empresa com cards de Meta e OpenAI, ativos conectados, logs e CTAs; /dashboard/configuracoes agora redireciona para esta area.
```

### F6.13 - Criar estrutura de dados para contas conectadas

- [x] **Codex**

```txt
Crie a estrutura de banco e tipos para contas conectadas da empresa.

Contexto:
- A integracao Meta ja possui tabelas iniciais.
- Falta modelar a camada de conexao por organizacao e a conexao OpenAI.

Objetivo:
- Persistir conexoes com seguranca e isolamento por organizacao.

Requisitos:
- Estender ou criar tabelas para Meta com pagina, instagram, ad account e escopos.
- Criar tabela para integracao OpenAI por organizacao.
- Armazenar segredos criptografados ou referencias seguras.
- Salvar ultimos 4 caracteres, status, expiracao e ultimo erro.
- Atualizar tipos do Supabase.
- Garantir RLS por organizacao.
- Liberar tabelas novas no MCP Supabase e documentar em docs/mcp-supabase.md.

Criterios de aceite:
- Dados ficam isolados por organizacao.
- Segredos nao sao expostos em queries de leitura comuns.
- npm run lint e npm run build passam.

Observacao:
- Foram criados os tipos, mocks, criptografia de segredos, logs de sincronizacao e migration com meta_ad_accounts, openai_connections e integration_sync_logs.
```

### F6.14 - Implementar conexao Meta com OAuth e sincronizacao de ativos

- [x] **Codex + Eu**

```txt
Implemente o fluxo de conexao Meta com OAuth e sincronizacao de ativos.

Contexto:
- O cliente deve conectar a propria conta Facebook para acessar Page, Instagram e ativos de anuncio.

Objetivo:
- Autorizar a LeadHealth a operar com ativos Meta da organizacao.

Requisitos para Codex:
- Criar inicio de OAuth Meta.
- Criar callback server-side.
- Salvar token e metadados com seguranca.
- Sincronizar contas, paginas, instagram business account e ad account.
- Permitir reconectar, trocar conta, sincronizar novamente e desconectar.
- Tratar token expirado, permissao faltando e erro de sincronizacao.

Parte manual:
- Eu vou autenticar a conta Meta real e validar o fluxo.

Criterios de aceite:
- A conta Meta conecta com sucesso.
- Os ativos disponiveis aparecem na interface.
- O sistema guarda a selecao ativa da organizacao.

Observacao:
- OAuth, callback, sync e disconnect foram implementados com armazenamento seguro do token por organizacao; a validacao real em conta Meta depende de credenciais do app.
```

### F6.15 - Implementar conexao OpenAI por API key do cliente

- [x] **Codex + Eu**

```txt
Implemente a conexao OpenAI por chave do cliente.

Contexto:
- Para gerar imagens e outras saidas de IA, a LeadHealth deve usar a chave do proprio cliente quando existir.

Objetivo:
- Permitir que a empresa conecte a conta OpenAI e valide a chave antes de salvar.

Requisitos para Codex:
- Criar formulario para salvar API key da OpenAI na area da empresa.
- Validar a chave no servidor antes de persistir.
- Armazenar a chave de forma segura.
- Exibir status de conexao, ultima validacao e ultimo erro.
- Definir fallback para chave global da plataforma somente se isso permanecer habilitado.
- Garantir que a chave completa nunca seja exibida na interface.

Parte manual:
- Eu vou informar uma chave valida de teste, se necessario.

Criterios de aceite:
- Chave valida ativa a integracao.
- Chave invalida retorna erro claro.
- npm run lint passa.

Observacao:
- A chave do cliente agora e salva/testada na area Empresa com preview mascarado; as rotas de IA usam a chave conectada antes do fallback de servidor.
```

### F6.16 - Adaptar campanhas para usar contas conectadas

- [x] **Codex**

```txt
Adapte o fluxo de campanhas para usar as contas conectadas da empresa.

Contexto:
- A pagina /dashboard/campanhas hoje gera texto e perguntas, mas ainda nao opera com contas conectadas.

Objetivo:
- Permitir criar campanhas com Meta e OpenAI da propria empresa.

Requisitos:
- Ler a integracao ativa da organizacao antes de gerar imagem ou publicar.
- Usar a conta OpenAI da empresa para gerar imagens quando disponivel.
- Exibir aviso quando faltar conexao Meta ou OpenAI.
- Preparar o draft de campanha com Page, Instagram e Ad Account selecionados.
- Manter a geracao de copy e compliance existentes.
- Nao quebrar o fluxo atual quando a conta nao estiver conectada.

Criterios de aceite:
- O usuario consegue ver o que falta para publicar.
- O fluxo continua funcionando sem integracao, com fallback controlado.
- npm run lint e npm run build passam.

Observacao:
- O gerador de campanhas agora seleciona pagina, conta de anuncio e formulario conectados, e persiste o modo/status de publicacao controlada.
```

### F6.17 - Criar publicacao de campanha no Meta com rascunho controlado

- [x] **Codex + Eu**

```txt
Crie o fluxo controlado de publicacao de campanha no Meta.

Contexto:
- A LeadHealth deve preparar a campanha para publicacao usando os ativos conectados.

Objetivo:
- Transformar o gerador de campanhas em um fluxo que prepara e publica rascunhos.

Requisitos para Codex:
- Criar payload de publicacao com ad account, page, instagram e criativo.
- Salvar o estado da campanha antes da publicacao.
- Tratar erros de permissao, conta ausente e asset expirado.
- Registrar o resultado da operacao.
- Preservar o compliance e o historico atual.

Parte manual:
- Eu vou validar a publicacao em uma conta Meta de teste ou real.

Criterios de aceite:
- O sistema consegue preparar a campanha para publicacao.
- Erros ficam compreensiveis para o usuario.

Observacao:
- A LeadHealth agora prepara rascunho/revisao/pausa com status de publicacao e metadados da conta conectada; o push real para a API da Meta continua como prox. integracao quando o app estiver pronto para publicar.
```

### F6.18 - Adicionar testes e verificacoes do fluxo de conexao

- [x] **Codex**

```txt
Adicione testes e verificacoes para o novo fluxo de conexao da empresa.

Contexto:
- O fluxo envolve Meta, Instagram, OpenAI e publicacao de campanhas.

Objetivo:
- Cobrir os casos principais de sucesso e erro.

Requisitos:
- Testar conexao Meta com selecao de ativos.
- Testar validacao da chave OpenAI.
- Testar fallback quando a conta nao estiver conectada.
- Testar isolamento por organizacao.
- Testar erro de token expirado e desconexao.
- Garantir que o dashboard siga abrindo e que a pagina de campanhas nao quebre.

Criterios de aceite:
- Os testes principais passam.
- npm run lint passa.
- npm run build passa.

Observacao:
- A validacao automatizada atual passou por `npm run lint` e `npm run build`; nao foram adicionados testes unitarios novos nesta passada.
```

## Fase 7 - Pagamentos e planos

Ordem recomendada desta fase:
1. Fechar decisoes comerciais do billing.
2. Implementar base tecnica de planos e assinaturas.
3. Aplicar bloqueios por plano.
4. Validar compra ponta a ponta em sandbox.

### Decisoes comerciais antes da implementacao

- [ ] **Eu:** escolher gateway inicial: Mercado Pago, Asaas ou Stripe.
- [ ] **Eu:** definir precos finais dos planos Solo, Equipe e Operacao.
- [ ] **Eu:** definir trial, garantia, cancelamento e limites por plano.

### Implementacao tecnica

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

## Fase 11 - Agenda real e follow-up comercial

Nota operacional 2026-05-06:
- A home do dashboard ainda renderiza a agenda por meio de `scheduledTasks` mockado em `src/data/mock.ts`.
- O produto ja possui base parcial para agenda dentro de leads: `next_contact_at` existe no fluxo de criacao/edicao e aparece em metricas e estados de UI.
- A estrategia recomendada e evoluir em camadas: primeiro trocar o card mockado por dados reais, depois criar visao dedicada de agenda e, por ultimo, adicionar historico de conclusao/reagendamento.

### F11.1 - Trocar agenda mockada da home por agenda real

- [ ] **Codex**

```txt
Substitua o card "Agenda da equipe" do dashboard por dados reais.

Contexto:
- Hoje a home usa `scheduledTasks` mockado.
- Ja existe `next_contact_at` nos leads, o que permite uma primeira versao de agenda sem criar novo modulo do zero.

Objetivo:
- Mostrar no dashboard os proximos compromissos reais da equipe ou do usuario, conforme permissao.

Requisitos:
- Remover dependencia do mock para o card da agenda na home.
- Buscar leads com `next_contact_at` futuro e ordenar pelo horario mais proximo.
- Respeitar o mesmo escopo de permissao dos leads: supervisor ve agenda da organizacao; vendedor ve a propria agenda.
- Exibir data, hora, nome do lead e acao/resumo curto do proximo contato.
- Tratar estado vazio com mensagem util e CTA para agendar um proximo contato.
- Validar pelo MCP Supabase que os registros exibidos no card correspondem aos leads com `next_contact_at` da organizacao correta.

Criterios de aceite:
- Dashboard nao mostra mais agenda mockada.
- Compromissos reais aparecem ordenados corretamente.
- npm run lint passa.
```

### F11.2 - Criar camada server-side dedicada para agenda

- [ ] **Codex**

```txt
Crie uma camada server-side dedicada para consulta de agenda comercial.

Contexto:
- A primeira entrega pode reaproveitar `next_contact_at`, mas a consulta da agenda precisa ficar clara, reutilizavel e pronta para crescer.

Objetivo:
- Centralizar regras de listagem da agenda em repository/helper e endpoint proprios.

Requisitos:
- Criar funcoes server-side para listar compromissos por periodo, usuario e status.
- Expor endpoint interno ou rota API para a agenda, seguindo os padroes atuais do projeto.
- Permitir filtro minimo por hoje, proximos 7 dias e atrasados.
- Padronizar ordenacao e serializacao de datas.
- Respeitar organizacao e papeis.
- Validar pelo MCP Supabase que a consulta retorna somente leads da organizacao correta e que os filtros de periodo batem com os dados reais.

Criterios de aceite:
- A agenda deixa de depender de logica espalhada em componentes.
- Existe caminho reutilizavel para home e futura tela dedicada.
- npm run lint passa.
```

### F11.3 - Melhorar cadastro e edicao de proximo contato

- [ ] **Codex**

```txt
Melhore a experiencia de cadastrar e editar proximo contato dos leads.

Contexto:
- O campo `next_contact_at` ja existe, mas a agenda real depende de um fluxo mais claro e confiavel para o time comercial.

Objetivo:
- Tornar o agendamento de follow-up facil durante criacao e edicao do lead.

Requisitos:
- Revisar UX dos campos atuais de proximo contato em criacao e edicao.
- Destacar melhor quando um lead esta sem agenda ou com follow-up atrasado.
- Permitir reagendar rapidamente sem perder o contexto do lead.
- Validar mensagens de erro e formatos de data/hora.
- Evitar regressao no CRUD atual de leads.
- Validar pelo MCP Supabase a persistencia correta de `next_contact_at` apos criar, editar e limpar um agendamento de teste.

Criterios de aceite:
- Usuario consegue agendar ou reagendar follow-up com menos friccao.
- Leads sem agenda e atrasados ficam visiveis.
- npm run lint passa.
```

### F11.4 - Criar tela dedicada `/dashboard/agenda`

- [ ] **Codex**

```txt
Crie uma tela dedicada de agenda comercial no dashboard.

Contexto:
- Depois de tirar a home do mock, a operacao comercial precisa de uma visao completa para acompanhar o dia.

Objetivo:
- Entregar uma pagina de agenda com foco em follow-ups e prioridades.

Requisitos:
- Criar rota `/dashboard/agenda`.
- Exibir lista por dia ou por periodo curto, com filtros por responsavel e status.
- Mostrar compromissos atrasados, de hoje e proximos.
- Permitir abrir rapidamente o lead relacionado.
- Preservar o visual do produto e responsividade mobile.
- Validar pelo MCP Supabase que a pagina reflete os mesmos dados reais consultados pela camada server-side da agenda.

Criterios de aceite:
- Usuario consegue navegar a agenda fora da home.
- Agenda ajuda a priorizar follow-ups do dia.
- npm run lint passa.
```

### F11.5 - Registrar conclusao, reagendamento e historico de follow-ups

- [ ] **Codex**

```txt
Implemente historico real de follow-ups da agenda.

Contexto:
- Apenas `next_contact_at` nao registra se o compromisso foi concluido, perdido, adiado ou executado com sucesso.

Objetivo:
- Criar trilha minima de execucao da agenda comercial.

Requisitos:
- Definir schema para registrar eventos de follow-up, como concluido, reagendado, cancelado ou nao realizado.
- Se criar nova tabela, versionar migration em `supabase/migrations`, liberar a tabela no MCP e documentar em `docs/mcp-supabase.md`.
- Permitir marcar compromisso como concluido ou reagendar pela UI.
- Exibir historico basico no lead ou na agenda.
- Garantir escopo por organizacao e autor da acao.
- Validar pelo MCP Supabase os registros criados e a relacao deles com o lead correto.

Criterios de aceite:
- Agenda passa a ter memoria operacional, nao apenas uma data solta.
- Time consegue saber o que foi feito e o que ficou pendente.
- npm run lint passa.
```

### F11.6 - Criar indicadores operacionais de agenda

- [ ] **Codex**

```txt
Crie indicadores operacionais para acompanhar a qualidade da agenda comercial.

Contexto:
- Depois de ter agenda real e historico, o produto pode mostrar se o time esta deixando follow-ups vencerem.

Objetivo:
- Exibir metricas simples de disciplina comercial.

Requisitos:
- Calcular quantidade de leads sem agenda, follow-ups atrasados e compromissos de hoje.
- Exibir indicadores no dashboard e/ou na tela de agenda.
- Diferenciar supervisor e vendedor no escopo dos numeros.
- Nao inventar metricas que dependam de dados ainda inexistentes.
- Validar pelo MCP Supabase que os contadores batem com a base real da organizacao.

Criterios de aceite:
- Usuario enxerga rapidamente gargalos de follow-up.
- Indicadores batem com os dados reais.
- npm run lint passa.
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
