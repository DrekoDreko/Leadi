# Tarefas da LeadHealth - prompts para Antigravity

Checklist vivo dos próximos passos da SaaS LeadHealth. Use este arquivo como uma fila de prompts: copie um bloco `txt`, cole no Antigravity e execute uma tarefa por vez.

O `README.md` fica apenas como descrição pública do projeto no GitHub. Este arquivo é operacional.

## Como usar

1. Escolha uma tarefa pendente.
2. Copie somente o bloco `txt` da tarefa.
3. Cole no Antigravity.
4. Depois que a implementação estiver validada, marque a tarefa como concluída neste arquivo.

## Prompt base recomendado

Use este texto junto com qualquer tarefa abaixo quando quiser dar mais contexto ao Antigravity:

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
- **Antigravity:** tarefa que pode ser implementada direto no repositório.
- **Antigravity + Eu:** tarefa que precisa de implementação e também de acesso, revisão, decisão comercial ou teste manual.

## Regra para Supabase via MCP

O MCP Supabase ja esta conectado via Role Key. Para tarefas novas ou pendentes que envolvam leitura, validação ou alteração de dados no Supabase, o Antigravity deve usar o MCP local `leadhealth-supabase` como caminho operacional principal, conforme `docs/mcp-supabase.md`.

- O app continua usando Supabase SSR/client no runtime, mas validações e intervenções de dados feitas pelo Antigravity devem passar pelo MCP.
- Antes de mexer em dados reais, rodar `supabase_status` e confirmar variáveis/allowlist.
- Para inspecionar dados reais, usar `supabase_select` nas tabelas liberadas.
- Para criar, atualizar ou excluir dados reais, usar `supabase_insert`, `supabase_update` ou `supabase_delete` com filtros explícitos e registrar o que foi alterado.
- Como a Role Key ignora RLS, usar operações de escrita apenas com filtros explícitos, escopo mínimo e sem expor dados sensíveis no output.
- Migrations e mudanças de schema continuam versionadas em `supabase/migrations`; depois de aplicar ou orientar aplicação, validar tabelas/dados via MCP nas tabelas liberadas.
- Se uma tarefa criar ou renomear tabela que precise ser consultada pelo Antigravity, atualizar `ALLOWED_TABLES` em `scripts/supabase-mcp.mjs` e a lista de tabelas em `docs/mcp-supabase.md`.
- O painel do Supabase fica apenas para ações externas inevitáveis, como configuração de Auth, Storage, URLs, secrets e execução manual de DDL quando o MCP não cobrir schema.


### F8.4 - Preparar scripts ou instrucoes de migration

- [x] **Antigravity**

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


### F8.6 - Configurar URLs publicas de Meta, webhooks e pagamentos

- [x] **Antigravity + Eu**

```txt
Revise URLs publicas usadas por Meta, webhooks e gateway de pagamento.

Contexto:
- Integracoes externas precisam de URLs estaveis de producao.

Objetivo:
- Garantir que callbacks e webhooks apontem para o dominio correto.

Requisitos para Antigravity:
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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Eu:** revisar termos comerciais, LGPD e politica de privacidade com apoio juridico.

### F9.10 - Teste de uso como vendedor real por 1 dia

- [/] **Antigravity + Eu** (Preparado - veja [walkthrough_teste_uso_real.md](file:///Users/lucasgomesdreko/.gemini/antigravity/brain/85999ead-cddc-45b6-92f1-00c9f98d4bab/walkthrough_teste_uso_real.md))

```txt
Prepare e acompanhe um teste de uso da LeadHealth como vendedor real por 1 dia.

Contexto:
- Eu vou usar o produto como se estivesse vendendo plano de saude empresarial.

Objetivo:
- Transformar friccoes reais em melhorias priorizadas.

Requisitos para Antigravity:
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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

- [x] **Antigravity + Eu**

```txt
Organize feedback dos primeiros beta testers em tarefas executaveis.

Contexto:
- Eu vou coletar duvidas, bugs e pedidos dos usuarios beta.

Objetivo:
- Transformar feedback solto em backlog priorizado no TAREFAS.md.

Requisitos para Antigravity:
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

- [x] **Antigravity**

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

- [x] **Antigravity**

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

### B5 - Integracoes com WhatsApp oficial ou provedor externo

- [x] **Antigravity**

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

### B7 - Relatorios de ROI por campanha, origem e vendedor

- [x] **Antigravity**

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

- [x] **Antigravity**

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

### B9 - Evoluir publicacao controlada com contas Meta conectadas

- [x] **Antigravity + Eu**

```txt
Ajude a decidir quando evoluir de rascunho controlado para publicacao real via Meta Marketing API.

Contexto:
- A publicacao real depende da conta Meta conectada pela propria organizacao, permissoes aprovadas e revisao antes de ativacao.

Objetivo:
- Criar uma matriz de decisao para evoluir de preparo de rascunho para publicacao autorizada.

Requisitos para Antigravity:
- Listar requisitos tecnicos, riscos, permissoes e custos.
- Comparar rascunho local, rascunho enviado pausado e publicacao controlada.
- Transformar decisao em roadmap se for aprovado.

Parte manual:
- Eu devo decidir com base em clientes, volume, App Review e permissao Marketing API.

Criterios de aceite:
- Existe recomendacao clara de quando publicar via contas conectadas.
```
