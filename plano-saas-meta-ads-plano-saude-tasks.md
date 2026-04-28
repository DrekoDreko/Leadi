# SaaS de Leads para Plano de Saúde Empresarial — Plano de Execução em Tasks

> **Objetivo do projeto:** criar uma plataforma para vendedores de plano de saúde empresarial gerarem campanhas com IA, captarem leads via formulário do Facebook/Instagram, acompanharem vendas em CRM e solicitarem criativos/design/vídeos dentro do sistema.

---

## Como usar este arquivo

Use este documento como checklist de implementação.

Cada task tem:

- **Objetivo:** o que precisa ser entregue.
- **O que fazer:** instruções práticas.
- **Como implementar com Codex:** prompt ou direção técnica.
- **Critérios de aceite:** como saber que a task ficou pronta.
- **Manual:** ações que você precisa fazer fora do código.

Marque cada item quando concluir:

```md
- [ ] pendente
- [x] concluído
```

## Status atual do projeto — atualizado em 2026-04-27

O projeto já tem uma primeira versão visual em Next.js, TypeScript e Tailwind.

### Implementado agora

- Landing page pública em `/`.
- Dashboard mockado em `/dashboard`.
- Login visual em `/login`.
- Página visual de planos em `/pricing`.
- Componentes `BrandMark` e `MockDashboardPreview`.
- Dados mockados de leads, Kanban, campanha, agenda e navegação em `src/data/mock.ts`.
- `.env.example` com variáveis para Supabase, OpenAI, pagamentos, Meta e banco.
- `.gitignore` ignorando `node_modules`, builds e arquivos locais de ambiente.
- README atualizado com páginas, escopo e próximos passos.

### Ainda não implementado

- Autenticação real.
- Supabase, banco, migrations, RLS e multi-tenancy.
- CRUD real de leads, campanhas ou pedidos.
- Importação CSV.
- Integração OpenAI.
- Integrações Meta, Make/Zapier, Mercado Pago ou Stripe.
- Páginas públicas de termos e privacidade.
- Área admin real.
- Testes automatizados.

### Observação

Itens marcados como parciais abaixo representam telas ou blocos visuais já criados, mas ainda sem persistência, autenticação, IA real ou integração externa.

---

# 1. Visão inicial do produto

## 1.1. Produto que será criado

- [x] Definir o produto como **CRM + IA + captação via Meta Lead Ads**.

### Objetivo

Criar uma SaaS para vendedores de plano de saúde empresarial, com foco em:

- redução de custo com plano de saúde;
- MEI, ME, LTDA e empresas;
- captação via formulário do Facebook/Instagram;
- acompanhamento dos leads em CRM;
- IA para criar anúncios e mensagens de WhatsApp;
- área para solicitar design, vídeo e campanha completa.

### Produto inicial

O MVP não precisa criar campanhas automaticamente no Meta Ads no primeiro momento.

O produto inicial deve permitir:

1. vendedor criar conta;
2. vendedor cadastrar leads;
3. vendedor importar leads;
4. vendedor gerar texto de anúncio com IA;
5. vendedor gerar mensagem de WhatsApp com IA;
6. vendedor solicitar design/vídeo;
7. administrador acompanhar pedidos;
8. vendedor acompanhar os leads em funil.

---

# 2. Stack recomendada

## 2.1. Stack simples para começar

- [x] Usar stack simples para acelerar o MVP.

### Recomendação

Use:

- **Next.js** para frontend e backend inicial;
- **Supabase** para banco, autenticação e storage;
- **PostgreSQL** como banco;
- **Prisma** opcional, se quiser ORM fora do Supabase client;
- **Tailwind CSS** para interface;
- **OpenAI API** para IA;
- **Mercado Pago ou Stripe** para pagamentos;
- **Vercel** para hospedagem;
- **Make/Zapier** opcional para automação inicial com Meta Leads.

### Decisão prática

Para começar mais rápido:

```txt
Next.js + Supabase + Tailwind + OpenAI API
```

Depois, se crescer, separar backend em NestJS ou FastAPI.

---

# 3. Preparação do repositório

## 3.1. Criar repositório

- [ ] Criar repositório no GitHub.

**Status atual:** parcial. O projeto local Next.js já existe, mas a criação/publicação no GitHub não foi confirmada neste workspace.

### Manual

1. Entre no GitHub.
2. Clique em **New repository**.
3. Nome sugerido: `leadhealth-saas`.
4. Marque como privado no início.
5. Crie o repositório vazio.

### Como implementar com Codex

Depois de criar o repositório, abra o projeto no seu editor e peça ao Codex:

```txt
Crie a estrutura inicial de uma SaaS chamada LeadHealth.

Stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API

Objetivo:
CRM e IA para vendedores de plano de saúde empresarial.

Crie:
- estrutura de pastas
- layout base
- dashboard inicial
- configuração de ambiente
- README com instruções
```

### Critérios de aceite

- Repositório criado.
- Projeto roda localmente.
- Existe uma página inicial.
- Existe um README básico.

---

## 3.2. Criar arquivo `.env.example`

- [x] Criar `.env.example`.

### Objetivo

Documentar todas as variáveis necessárias.

### Conteúdo sugerido

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=

MERCADO_PAGO_ACCESS_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_REDIRECT_URI=
META_GRAPH_API_VERSION=v22.0

DATABASE_URL=
```

### Como implementar com Codex

```txt
Crie um arquivo .env.example com todas as variáveis necessárias para:
- Supabase
- OpenAI
- pagamentos
- integração futura com Meta
- URL da aplicação

Também atualize o README explicando como copiar .env.example para .env.local.
```

### Critérios de aceite

- `.env.example` existe.
- README explica como configurar ambiente local.
- `.env.local` está ignorado no `.gitignore`.

---

# 4. Documentação inicial do produto

## 4.1. Criar pasta `/docs`

- [ ] Criar documentação base.

### Arquivos

Crie:

```txt
/docs/product-requirements.md
/docs/mvp-roadmap.md
/docs/database-schema.md
/docs/ai-prompts.md
/docs/meta-ads-playbook.md
/docs/compliance-health-ads.md
/docs/pricing.md
/docs/manual-meta-setup.md
```

### Como implementar com Codex

```txt
Crie uma pasta /docs com os seguintes arquivos:
- product-requirements.md
- mvp-roadmap.md
- database-schema.md
- ai-prompts.md
- meta-ads-playbook.md
- compliance-health-ads.md
- pricing.md
- manual-meta-setup.md

Preencha cada arquivo com uma primeira versão resumida, baseada no produto:
SaaS para vendedores de plano de saúde empresarial criarem campanhas com IA, captarem leads via Meta Lead Ads e acompanharem vendas em CRM.
```

### Critérios de aceite

- Pasta `/docs` criada.
- Todos os arquivos existem.
- Documentação explica claramente o MVP.

---

# 5. Modelagem do banco de dados

## 5.1. Criar tabela de organizações

- [ ] Criar tabela `organizations`.

### Objetivo

Permitir que cada vendedor, corretora ou empresa tenha seu próprio espaço.

### Campos sugeridos

```sql
organizations
- id uuid primary key
- name text not null
- slug text unique
- owner_user_id uuid
- plan text default 'free'
- status text default 'active'
- created_at timestamp
- updated_at timestamp
```

### Como implementar com Codex

```txt
Crie o schema de banco para multi-tenancy simples.

Primeira tabela:
organizations

Campos:
- id
- name
- slug
- owner_user_id
- plan
- status
- created_at
- updated_at

Use Supabase/PostgreSQL.
Crie migrations e tipos TypeScript.
```

### Critérios de aceite

- Organização pode ser criada.
- Usuário fica vinculado a uma organização.
- Todas as futuras tabelas terão `organization_id`.

---

## 5.2. Criar tabela de usuários/perfis

- [ ] Criar tabela `profiles`.

### Objetivo

Guardar dados complementares do usuário autenticado.

### Campos sugeridos

```sql
profiles
- id uuid primary key
- auth_user_id uuid unique
- organization_id uuid
- name text
- email text
- phone text
- role text default 'seller'
- avatar_url text
- created_at timestamp
- updated_at timestamp
```

### Roles iniciais

```txt
admin
seller
designer
manager
```

### Como implementar com Codex

```txt
Crie a tabela profiles ligada ao usuário autenticado do Supabase Auth.

Implemente roles:
- admin
- seller
- designer
- manager

Garanta que cada profile pertença a uma organization.
```

### Critérios de aceite

- Ao criar conta, cria profile.
- Profile tem `organization_id`.
- Sistema sabe se usuário é admin ou vendedor.

---

## 5.3. Criar tabela de leads

- [ ] Criar tabela `leads`.

### Objetivo

Armazenar os leads captados manualmente, via CSV ou futuramente via Meta.

### Campos sugeridos

```sql
leads
- id uuid primary key
- organization_id uuid not null
- assigned_user_id uuid
- name text
- phone text
- email text
- city text
- state text
- cnpj_type text
- has_active_cnpj boolean
- cnpj_age_range text
- lives_count integer
- current_monthly_cost_range text
- objective text
- source text
- source_campaign text
- source_adset text
- source_ad text
- meta_lead_id text
- status text
- score integer
- ai_summary text
- notes text
- created_at timestamp
- updated_at timestamp
```

### Status iniciais

```txt
new
whatsapp_contacted
responded
diagnosis
proposal_sent
closed
lost
```

### Como implementar com Codex

```txt
Crie a tabela leads para CRM.

A tabela deve suportar:
- leads manuais
- leads importados por CSV
- leads vindos do Meta Lead Ads futuramente

Crie tipos TypeScript, validações e enum de status.
```

### Critérios de aceite

- Lead pode ser criado.
- Lead pode ser editado.
- Lead pode mudar de status.
- Lead pertence a uma organização.

---

## 5.4. Criar tabela de campanhas planejadas

- [ ] Criar tabela `campaign_plans`.

### Objetivo

Guardar campanhas geradas pela IA, mesmo antes de serem publicadas no Meta.

### Campos sugeridos

```sql
campaign_plans
- id uuid primary key
- organization_id uuid
- created_by_user_id uuid
- name text
- persona text
- angle text
- city text
- budget_daily numeric
- budget_monthly numeric
- main_text text
- headline text
- description text
- creative_idea text
- form_questions jsonb
- audience_suggestion text
- whatsapp_script text
- compliance_risk text
- compliance_notes text
- status text
- created_at timestamp
- updated_at timestamp
```

### Status

```txt
draft
generated
approved
needs_revision
sent_to_design
ready_to_publish
published_manually
```

### Como implementar com Codex

```txt
Crie a tabela campaign_plans para armazenar campanhas geradas por IA.

Inclua:
- textos do anúncio
- título
- descrição
- ideias de criativo
- perguntas sugeridas para formulário Meta
- sugestão de público
- risco de compliance
- status da campanha
```

### Critérios de aceite

- Campanha gerada pela IA fica salva.
- Vendedor pode editar.
- Vendedor pode aprovar.
- Admin pode ver campanhas aprovadas.

---

## 5.5. Criar tabela de pedidos de criativo

- [ ] Criar tabela `creative_orders`.

### Objetivo

Permitir que o vendedor solicite design, vídeo ou campanha completa.

### Campos sugeridos

```sql
creative_orders
- id uuid primary key
- organization_id uuid
- campaign_plan_id uuid
- requested_by_user_id uuid
- type text
- title text
- description text
- reference_files jsonb
- logo_url text
- brand_colors text
- deadline date
- price numeric
- payment_status text
- production_status text
- delivery_url text
- admin_notes text
- created_at timestamp
- updated_at timestamp
```

### Tipos

```txt
ad_copy
static_design
short_video
full_campaign
meta_setup
```

### Status de produção

```txt
requested
in_production
waiting_client
delivered
approved
cancelled
```

### Como implementar com Codex

```txt
Crie a tabela creative_orders.

Ela deve permitir:
- pedido de design estático
- pedido de vídeo curto
- pedido de campanha completa
- upload de logo e referências
- controle de pagamento
- controle de produção
- entrega do arquivo final
```

### Critérios de aceite

- Vendedor pode abrir pedido.
- Admin pode mudar status.
- Admin pode anexar entrega.
- Vendedor vê pedidos dele.

---

# 6. Autenticação e multiusuário

## 6.1. Implementar cadastro/login

- [ ] Implementar autenticação.

**Status atual:** parcial. Existe a página `/login`, mas ela é apenas visual e ainda não autentica com Supabase.

### Objetivo

Permitir que vendedores criem conta e acessem o sistema.

### Como implementar com Codex

```txt
Implemente autenticação usando Supabase Auth.

Páginas:
- /login
- /register
- /forgot-password
- /dashboard

Ao registrar:
- criar usuário no Supabase Auth
- criar profile
- criar organization inicial com o nome informado
- redirecionar para dashboard
```

### Critérios de aceite

- Usuário cria conta.
- Usuário faz login.
- Usuário acessa dashboard.
- Usuário não autenticado não vê área interna.

---

## 6.2. Proteger dados por organização

- [ ] Implementar isolamento por organização.

### Objetivo

Um vendedor não pode ver leads de outro vendedor.

### Como implementar com Codex

```txt
Implemente isolamento por organization_id em todas as consultas.

Toda tabela principal deve ter organization_id.
Toda query deve filtrar pela organização do usuário logado.
Crie helpers para obter currentOrganization.
Se usar Supabase RLS, crie policies básicas por organization_id.
```

### Critérios de aceite

- Usuário A não vê leads do usuário B.
- Admin geral pode ver tudo, se necessário.
- Consultas sempre usam `organization_id`.

---

# 7. Dashboard inicial

## 7.1. Criar dashboard do vendedor

- [ ] Criar página `/dashboard`.

**Status atual:** parcial. A página `/dashboard` existe com métricas, CRM de leads, tabela, funil Kanban visual, campanha sugerida, compliance, WhatsApp e pedido criativo, mas ainda usa dados mockados e não consulta banco.

### Objetivo

Mostrar visão geral da operação do vendedor.

### Cards iniciais

```txt
Leads novos
Leads em atendimento
Propostas enviadas
Vendas fechadas
Taxa de conversão
Campanhas criadas
Pedidos de criativo abertos
```

### Como implementar com Codex

```txt
Crie um dashboard limpo para vendedores.

Use cards com métricas:
- total de leads
- leads novos
- leads em diagnóstico
- propostas enviadas
- vendas fechadas
- campanhas geradas
- pedidos de criativo

Adicione links rápidos:
- Novo lead
- Gerar campanha com IA
- Solicitar design/vídeo
- Importar CSV
```

### Critérios de aceite

- Dashboard carrega dados reais do banco.
- Métricas respeitam organização do usuário.
- Visual é simples e responsivo.

---

# 8. CRM de leads

## 8.1. Criar listagem de leads

- [ ] Criar página `/dashboard/leads`.

**Status atual:** parcial. Existe uma listagem visual de leads dentro de `/dashboard`, com busca e botões de filtro/importação/novo lead apenas mockados. A rota dedicada `/dashboard/leads` ainda não existe.

### Objetivo

Permitir que o vendedor veja todos os leads.

### Funcionalidades

```txt
Tabela de leads
Busca por nome/telefone
Filtro por status
Filtro por cidade
Filtro por origem
Ordenação por data
Botão de novo lead
```

### Como implementar com Codex

```txt
Crie a página de listagem de leads com:
- tabela responsiva
- filtros por status, cidade e origem
- busca por nome e telefone
- botão "Novo lead"
- clique no lead abre detalhes
```

### Critérios de aceite

- Lista leads reais.
- Filtros funcionam.
- Busca funciona.
- Usuário só vê leads da própria organização.

---

## 8.2. Criar cadastro manual de lead

- [ ] Criar formulário de novo lead.

### Campos

```txt
Nome
WhatsApp
E-mail
Cidade
Estado
Tipo de CNPJ
Possui CNPJ ativo?
Tempo de CNPJ
Quantidade de vidas
Faixa de custo mensal atual
Objetivo
Origem
Observações
```

### Observação importante

No formulário interno da sua SaaS você pode coletar mais informações do que no formulário do Meta, desde que tenha consentimento e política de privacidade clara.

Evite coletar dados médicos, como doenças, tratamentos, medicamentos ou histórico de saúde.

### Como implementar com Codex

```txt
Crie formulário de novo lead com validação.

Campos:
- nome
- telefone
- email
- cidade
- estado
- tipo de CNPJ
- possui CNPJ ativo
- tempo de CNPJ
- quantidade de vidas
- faixa de custo mensal atual
- objetivo
- origem
- observações

Ao salvar, criar lead com status new.
```

### Critérios de aceite

- Formulário valida telefone.
- Lead salva no banco.
- Redireciona para detalhe do lead.
- Status inicial é `new`.

---

## 8.3. Criar tela de detalhe do lead

- [ ] Criar página `/dashboard/leads/[id]`.

### Objetivo

Permitir acompanhar todo o histórico do lead.

### Seções

```txt
Dados principais
Status do funil
Resumo da IA
Observações
Histórico de contatos
Mensagens de WhatsApp geradas
Botão "Gerar abordagem com IA"
Botão "Gerar diagnóstico"
```

### Como implementar com Codex

```txt
Crie a tela de detalhe do lead.

Ela deve mostrar:
- dados cadastrais
- status atual
- score do lead
- resumo gerado por IA
- observações
- botões para mudar status
- botão para gerar mensagem de WhatsApp
```

### Critérios de aceite

- Lead abre corretamente.
- Status pode ser alterado.
- Observações podem ser salvas.
- Botão de IA aparece.

---

## 8.4. Criar funil Kanban

- [ ] Criar visão Kanban dos leads.

**Status atual:** parcial. O Kanban visual já aparece no dashboard e no preview da landing, mas ainda não tem drag and drop nem persistência.

### Colunas

```txt
Novo lead
Chamado no WhatsApp
Respondeu
Em diagnóstico
Proposta enviada
Fechado
Perdido
```

### Como implementar com Codex

```txt
Crie uma visualização Kanban para leads.

Cada coluna representa um status.
Permita arrastar e soltar lead entre colunas.
Ao mover, atualizar status no banco.
```

### Critérios de aceite

- Leads aparecem em colunas.
- Drag and drop muda status.
- Atualização persiste no banco.

---

# 9. Importação manual de leads

## 9.1. Criar importação CSV

- [ ] Criar importação de CSV.

### Objetivo

Antes da integração com Meta, você pode exportar leads do Meta e importar no CRM.

### Campos aceitos no CSV

```txt
name
phone
email
city
state
cnpj_type
lives_count
source_campaign
created_at
```

### Como implementar com Codex

```txt
Crie uma tela /dashboard/leads/import.

Ela deve:
- aceitar upload CSV
- mostrar prévia dos dados
- mapear colunas
- validar telefone/nome
- importar leads para organization_id do usuário
- exibir erros de linhas inválidas
```

### Critérios de aceite

- Upload funciona.
- Prévia aparece antes de importar.
- Linhas válidas são salvas.
- Linhas inválidas mostram erro.

---

# 10. Gerador de campanhas com IA

## 10.1. Criar formulário de briefing

- [ ] Criar página `/dashboard/campaigns/new`.

**Status atual:** parcial. Há um bloco visual de campanha sugerida por IA no dashboard, mas ainda não existe formulário de briefing nem rota dedicada.

### Objetivo

O vendedor preenche dados simples e a IA gera campanha.

### Campos do briefing

```txt
Nome da campanha
Cidade/estado
Tipo de público: MEI, ME, LTDA, familiar, empresa pequena
Objetivo: redução de custo, cotação, diagnóstico, plano empresarial
Orçamento mensal estimado
Quantidade desejada de leads
Tipo de criativo: imagem, vídeo, carrossel
Operadoras que trabalha: Bradesco, SulAmérica, Amil, outras
Tom de comunicação: consultivo, direto, premium
```

### Como implementar com Codex

```txt
Crie uma página para gerar campanha com IA.

O usuário preenche um briefing com:
- cidade
- público
- objetivo
- orçamento
- tipo de criativo
- operadoras
- tom de comunicação

Ao enviar, chamar CampaignPlannerService.
Salvar resultado em campaign_plans.
```

### Critérios de aceite

- Formulário existe.
- Chama IA.
- Resultado é salvo no banco.
- Usuário vê a campanha gerada.

---

## 10.2. Criar `CampaignPlannerService`

- [ ] Criar serviço de IA para campanhas.

### Objetivo

Gerar estrutura de anúncio para Meta Lead Ads.

### Saída esperada

```json
{
  "main_text": "...",
  "headline": "...",
  "description": "...",
  "creative_idea": "...",
  "form_questions": ["Nome", "WhatsApp", "Cidade"],
  "audience_suggestion": "...",
  "whatsapp_script": "...",
  "compliance_risk": "low",
  "compliance_notes": "..."
}
```

### Prompt base

```txt
Você é um especialista em geração de leads para plano de saúde empresarial no Brasil.

Contexto:
A oferta é redução de custo com plano de saúde, usando análise de migração para plano empresarial, MEI, ME ou LTDA.

Crie uma campanha segura para Meta Ads.

Regras:
- Não prometa economia garantida.
- Não diga "economize 50% garantido".
- Não pergunte sobre doença, tratamento ou condição médica.
- Não implique que você sabe que a pessoa paga caro.
- Não peça operadora atual no formulário Meta.
- Não peça informações de seguro no formulário Meta.
- Foque em análise, diagnóstico e alternativas empresariais.

Retorne:
- texto principal
- título
- descrição
- ideia de criativo
- perguntas seguras para formulário Meta
- sugestão geral de público
- mensagem inicial de WhatsApp
- risco de compliance
- observações
```

### Como implementar com Codex

```txt
Implemente CampaignPlannerService usando OpenAI API.

O serviço recebe o briefing da campanha e retorna JSON estruturado com:
- main_text
- headline
- description
- creative_idea
- form_questions
- audience_suggestion
- whatsapp_script
- compliance_risk
- compliance_notes

Valide o JSON antes de salvar.
```

### Critérios de aceite

- Serviço retorna JSON válido.
- Campanha fica salva em `campaign_plans`.
- Texto gerado respeita regras de compliance.
- Em caso de erro da IA, sistema mostra mensagem amigável.

---

## 10.3. Criar tela de resultado da campanha

- [ ] Criar página `/dashboard/campaigns/[id]`.

### Objetivo

O vendedor vê, edita e aprova a campanha.

### Seções

```txt
Texto principal
Título
Descrição
Ideia de criativo
Perguntas do formulário
Sugestão de público
Mensagem de WhatsApp
Risco de compliance
Botão: Aprovar
Botão: Solicitar design
Botão: Solicitar vídeo
Botão: Revisar com IA
```

### Como implementar com Codex

```txt
Crie uma tela de detalhe da campanha.

Permita:
- visualizar textos
- editar manualmente
- salvar alterações
- rodar validador de compliance
- aprovar campanha
- criar pedido de design/vídeo a partir da campanha
```

### Critérios de aceite

- Campanha abre corretamente.
- Usuário edita textos.
- Usuário aprova.
- Usuário cria pedido de design/vídeo.

---

# 11. Validador de compliance com IA

## 11.1. Criar `AdComplianceService`

- [ ] Criar validador de anúncio.

**Status atual:** parcial. O dashboard exibe um checklist visual de compliance, mas ainda não existe serviço, regra fixa, IA ou bloqueio real.

### Objetivo

Reduzir risco de reprovação no Meta Ads e evitar linguagem sensível.

### Regras principais

Evitar anúncios que:

- prometem economia garantida;
- afirmam ou insinuam que o usuário está pagando caro;
- mencionam doenças, tratamentos, remédios ou condições médicas;
- perguntam se a pessoa possui plano de saúde;
- pedem nome da operadora atual no formulário do Meta;
- pedem informações de seguro no formulário do Meta;
- fazem pressão financeira;
- usam linguagem discriminatória.

### Exemplos de frases arriscadas

```txt
Você está pagando caro no plano de saúde?
Seu plano não cobre seu tratamento?
Você tem doença preexistente?
Economize 50% garantido.
Está sem condições de pagar seu plano?
Qual sua operadora atual?
Você possui plano de saúde?
```

### Exemplos de versões seguras

```txt
Faça uma análise de alternativas empresariais para plano de saúde.

Avalie opções de plano empresarial para MEI, ME ou LTDA.

Solicite um diagnóstico consultivo para reorganizar custos com plano de saúde.

Compare possibilidades de contratação empresarial com especialistas.
```

### Como implementar com Codex

```txt
Crie AdComplianceService.

Entrada:
- texto principal
- título
- descrição
- perguntas do formulário

Saída:
- approved: boolean
- risk: low | medium | high
- issues: string[]
- safer_version: string
- notes: string

Implemente também uma camada de regras fixas antes de chamar IA.
Bloqueie termos sensíveis com regex/listas.
```

### Critérios de aceite

- Serviço identifica frases arriscadas.
- Serviço sugere versão segura.
- Campanhas de risco alto não podem ser aprovadas sem revisão manual.
- Existem testes automatizados.

---

## 11.2. Criar testes do validador

- [ ] Criar testes automatizados.

### Casos de teste

```txt
"Economize 50% garantido" => risco alto
"Você tem doença preexistente?" => risco alto
"Qual sua operadora atual?" em formulário Meta => risco alto
"Faça uma análise de alternativas empresariais" => risco baixo
```

### Como implementar com Codex

```txt
Crie testes unitários para AdComplianceService.

Inclua casos:
- promessa garantida
- pergunta médica
- pergunta de seguro
- linguagem financeira invasiva
- versão segura
```

### Critérios de aceite

- Testes passam.
- Bloqueios funcionam.
- O serviço não depende apenas da IA.

---

# 12. Gerador de mensagens de WhatsApp

## 12.1. Criar `WhatsAppScriptService`

- [ ] Criar IA para mensagens de WhatsApp.

**Status atual:** parcial. O dashboard mostra uma mensagem de WhatsApp mockada, mas ainda não há serviço de geração, histórico ou cópia persistida.

### Objetivo

Ajudar o vendedor a abordar e recuperar leads.

### Tipos de mensagem

```txt
Primeiro contato
Follow-up após 2 horas
Follow-up após 1 dia
Follow-up após 3 dias
Mensagem de proposta
Mensagem para lead perdido
Mensagem para pedir documentos/informações
```

### Prompt base

```txt
Você é um consultor comercial de plano de saúde empresarial.

Crie uma mensagem curta de WhatsApp para o lead.

Contexto:
O lead solicitou uma análise para avaliar alternativas de plano de saúde empresarial.

Regras:
- Seja educado e consultivo.
- Não prometa economia garantida.
- Não peça dados médicos.
- Não faça pressão.
- Faça uma pergunta simples para avançar a conversa.
```

### Como implementar com Codex

```txt
Crie WhatsAppScriptService.

Entrada:
- dados do lead
- status atual
- objetivo da mensagem

Saída:
- mensagem curta
- tom consultivo
- próxima pergunta recomendada
```

### Critérios de aceite

- Mensagem é curta.
- Linguagem é segura.
- Vendedor pode copiar.
- Mensagem fica salva no histórico do lead.

---

# 13. Score e qualificação de lead

## 13.1. Criar `LeadScoringService`

- [ ] Criar score automático.

### Objetivo

Classificar leads por potencial comercial.

### Critérios de score

Lead quente:

```txt
CNPJ ativo
ME, LTDA ou MEI com tempo suficiente
3 ou mais vidas
Interesse em plano empresarial
Cidade atendida
Respondeu WhatsApp
```

Lead médio:

```txt
CNPJ ativo, mas poucas vidas
MEI recente
Ainda está comparando
Não informou todos os dados
```

Lead frio:

```txt
Não tem CNPJ
Busca plano individual barato
Não quer conversar
Dados incompletos
```

### Como implementar com Codex

```txt
Crie LeadScoringService.

Entrada:
- dados do lead

Saída:
- score de 0 a 100
- classificação: frio, médio, quente
- motivo do score
- próxima ação sugerida

Use regras fixas primeiro.
Depois, opcionalmente, use IA para gerar resumo.
```

### Critérios de aceite

- Cada lead recebe score.
- Score aparece no CRM.
- Score atualiza quando dados mudam.
- Próxima ação é exibida.

---

# 14. Área de pedidos de design/vídeo

## 14.1. Criar formulário de pedido

- [ ] Criar página `/dashboard/creative-orders/new`.

**Status atual:** parcial. O dashboard tem um bloco visual de pedido criativo, mas ainda não existe formulário, upload, storage ou rota dedicada.

### Objetivo

O vendedor solicita design, vídeo ou campanha completa.

### Campos

```txt
Tipo de pedido
Campanha relacionada
Título do pedido
Descrição
Objetivo
Cidade
Público
Tipo de criativo
Upload de logo
Upload de referências
Cores da marca
Observações
```

### Tipos de pedido

```txt
Script de anúncio
Design estático
Vídeo curto
Campanha completa
Setup Meta Ads
```

### Como implementar com Codex

```txt
Crie uma tela de pedido de criativo.

O vendedor deve conseguir:
- escolher tipo de pedido
- vincular a uma campanha gerada
- enviar logo/imagens de referência
- informar observações
- enviar pedido para o admin
```

### Critérios de aceite

- Pedido é salvo.
- Arquivos são enviados para storage.
- Admin recebe/visualiza pedido.
- Vendedor acompanha status.

---

## 14.2. Criar painel administrativo de pedidos

- [ ] Criar página `/admin/creative-orders`.

### Objetivo

Você acompanhará todos os pedidos.

### Status

```txt
Solicitado
Em produção
Aguardando cliente
Entregue
Aprovado
Cancelado
```

### Como implementar com Codex

```txt
Crie painel administrativo para pedidos de criativo.

Admin deve conseguir:
- listar pedidos
- filtrar por status
- abrir detalhes
- mudar status
- adicionar notas internas
- anexar arquivo final
- marcar como entregue
```

### Critérios de aceite

- Admin vê todos os pedidos.
- Vendedor vê apenas pedidos da própria organização.
- Status é atualizado corretamente.

---

# 15. Upload de criativos pelo vendedor

## 15.1. Criar upload de imagem/vídeo

- [ ] Permitir upload de criativo no app.

### Objetivo

O vendedor poderá subir a própria imagem ou vídeo no sistema.

### Formatos iniciais

```txt
Imagem: JPG, PNG, WEBP
Vídeo: MP4, MOV
Tamanho máximo inicial: definir conforme infraestrutura
```

### Observação

No começo, esse upload serve para armazenamento e revisão manual.

No futuro, o mesmo arquivo poderá ser enviado para a Meta Marketing API.

### Como implementar com Codex

```txt
Implemente upload de arquivos usando Supabase Storage.

Permita upload de:
- logo
- imagem de anúncio
- vídeo de anúncio
- referência visual

Salve URL do arquivo no banco.
Valide tipo e tamanho.
```

### Critérios de aceite

- Upload funciona.
- Arquivo aparece na tela do pedido/campanha.
- Arquivos são protegidos por organização.
- Sistema valida formatos.

---

# 16. Pagamentos

## 16.1. Definir planos

- [ ] Criar planos iniciais.

**Status atual:** parcial. A página `/pricing` existe com planos Solo, Equipe e Operação, mas ainda não há `/docs/pricing.md`, banco de planos, assinaturas ou pagamentos.

### Sugestão

```txt
CRM Básico — R$ 97/mês
CRM + IA — R$ 297/mês
Gestão Assistida — R$ 697/mês
```

### Produtos avulsos

```txt
Script de anúncio — R$ 47
Design estático — R$ 147
Vídeo curto — R$ 397
Campanha completa — R$ 697
Setup Meta Ads — R$ 497
```

### Como implementar com Codex

```txt
Crie arquivo /docs/pricing.md com os planos e produtos avulsos.

Depois crie estrutura no banco:
- plans
- subscriptions
- orders
- payments
```

### Critérios de aceite

- Planos estão documentados.
- Produtos avulsos estão documentados.
- Sistema tem estrutura para cobrança.

---

## 16.2. Implementar cobrança simples

- [ ] Integrar Mercado Pago ou Stripe.

### Recomendação inicial

Se o público for Brasil, Mercado Pago ou Asaas podem ser mais simples.

Se quiser SaaS global, Stripe.

### Como implementar com Codex

```txt
Implemente uma primeira versão de pagamento usando checkout externo.

Requisitos:
- usuário escolhe plano ou produto avulso
- sistema cria pedido
- redireciona para checkout
- recebe webhook de pagamento aprovado
- atualiza payment_status
```

### Critérios de aceite

- Pedido é criado.
- Usuário consegue pagar.
- Webhook atualiza status.
- Admin vê pedidos pagos.

---

# 17. Operação manual inicial com Meta Ads

## 17.1. Criar processo manual para configurar anúncio

- [ ] Documentar processo manual.

### Objetivo

Antes de automatizar Meta Ads, você ou alguém da empresa configura manualmente o anúncio com base no que a SaaS gerou.

### Processo

1. Vendedor gera campanha na SaaS.
2. Vendedor aprova texto.
3. Vendedor solicita design/vídeo ou envia criativo.
4. Você revisa texto e criativo.
5. Você entra no Gerenciador de Anúncios da Meta.
6. Cria campanha de geração de leads.
7. Cria formulário instantâneo.
8. Cola textos gerados pela IA.
9. Sobe imagem/vídeo.
10. Define orçamento.
11. Publica campanha.
12. Leads são exportados/importados ou enviados por automação.

### Como implementar com Codex

```txt
Crie uma página interna /admin/manual-meta-checklist.

Essa página deve mostrar um checklist para o administrador configurar campanha manualmente:
- copiar texto principal
- copiar título
- copiar descrição
- baixar criativo
- ver perguntas do formulário
- registrar ID da campanha Meta
- marcar campanha como publicada manualmente
```

### Critérios de aceite

- Admin consegue ver checklist.
- Admin copia textos facilmente.
- Admin marca campanha como publicada.
- CampaignPlan muda status para `published_manually`.

---

# 18. Formulário do Facebook/Instagram

## 18.1. Definir perguntas seguras para formulário Meta

- [ ] Criar padrão de formulário.

**Status atual:** parcial. A landing e o mock de campanha já usam perguntas seguras como nome, WhatsApp, cidade, CNPJ ativo, tipo de CNPJ, quantidade de pessoas e melhor horário, mas ainda não existe validação automática no gerador de campanha.

### Perguntas recomendadas

Use perguntas simples:

```txt
Nome
Telefone/WhatsApp
Cidade
Você possui CNPJ ativo?
Tipo de CNPJ: MEI, ME, LTDA ou outro
Quantidade aproximada de pessoas para incluir
Melhor horário para contato
```

### Evitar no formulário Meta

Evite perguntas como:

```txt
Qual sua operadora atual?
Você possui plano de saúde?
Quanto você paga hoje?
Qual seu número de apólice?
Você tem doença?
Faz tratamento?
Seu plano cobre seu tratamento?
```

### Motivo

A Meta tem regras sensíveis para Lead Ads e restringe solicitações de informações de saúde e de seguro sem permissão prévia.

### Como implementar com Codex

```txt
No CampaignPlannerService, garanta que as perguntas sugeridas para formulário Meta sigam uma lista segura.

Nunca sugerir:
- operadora atual
- apólice
- doença
- tratamento
- pergunta direta se a pessoa tem plano de saúde
- valor exato do plano atual

Permitir:
- nome
- telefone
- cidade
- CNPJ ativo
- tipo de CNPJ
- quantidade aproximada de vidas
- melhor horário
```

### Critérios de aceite

- IA não sugere perguntas sensíveis.
- Validador bloqueia perguntas proibidas.
- Admin vê alerta sobre formulário Meta.

---

# 19. Captação de leads do Meta — 3 níveis

## 19.1. Nível 1: exportar e importar CSV

- [ ] Começar com CSV.

### Manual

1. Crie campanha no Meta com formulário instantâneo.
2. Espere leads entrarem.
3. No Meta Business Suite ou Gerenciador de Anúncios, exporte os leads em CSV.
4. Entre na SaaS.
5. Vá em **Importar leads**.
6. Envie o CSV.
7. Verifique os dados.
8. Importe.

### Vantagem

Rápido, sem API, sem App Review.

### Desvantagem

Manual e mais lento.

### Critérios de aceite

- Você consegue rodar campanha sem integração técnica.
- Leads aparecem no CRM após importação.

---

## 19.2. Nível 2: usar Make/Zapier

- [ ] Integrar de forma semi-automática.

### Manual

1. Crie conta no Make ou Zapier.
2. Escolha gatilho: **Facebook Lead Ads — New Lead**.
3. Conecte a conta do Facebook.
4. Escolha página e formulário.
5. Configure ação: enviar dados para webhook da sua SaaS.
6. Na SaaS, crie endpoint para receber o lead.
7. Teste com lead falso.
8. Confira se lead entrou no CRM.

### Como implementar com Codex

```txt
Crie endpoint POST /api/integrations/meta-leads/import-webhook.

Esse endpoint receberá dados de Make/Zapier:
- name
- phone
- email
- city
- form_id
- campaign_name
- ad_name

Valide os dados e crie um lead no CRM.
Inclua secret token simples no header para segurança.
```

### Critérios de aceite

- Make/Zapier consegue enviar lead para SaaS.
- Lead entra no CRM automaticamente.
- Endpoint valida token.
- Duplicados são evitados por telefone/email/meta_lead_id.

---

## 19.3. Nível 3: integração direta com Meta Lead Ads

- [ ] Implementar integração oficial.

### Objetivo

Receber leads em tempo real diretamente da Meta.

### O que será necessário

Você precisará de:

```txt
Conta Meta Developer
App da Meta
Business Manager
Página do Facebook
Conta de anúncios
Formulário Lead Ads
Webhook público HTTPS
Permissão leads_retrieval
Possivelmente pages_manage_ads
App Review para produção
Política de privacidade pública
URL de termos de uso
```

### Como funciona tecnicamente

```txt
Pessoa preenche formulário no Facebook/Instagram
↓
Meta envia evento para webhook da SaaS
↓
Webhook recebe leadgen_id
↓
SaaS chama Graph API para buscar dados do lead
↓
SaaS salva lead no CRM
↓
IA calcula score
↓
Vendedor recebe notificação
```

### Como implementar com Codex

```txt
Implemente integração direta com Meta Lead Ads.

Crie:
- /api/meta/oauth/start
- /api/meta/oauth/callback
- /api/meta/webhook
- MetaLeadService
- MetaTokenService
- MetaPageService
- MetaLeadRetrievalService

Fluxo:
1. Usuário conecta conta Meta.
2. Sistema salva access token.
3. Usuário escolhe página.
4. Sistema assina webhook de leadgen.
5. Quando Meta enviar leadgen_id, buscar lead pela Graph API.
6. Salvar no CRM.
```

### Critérios de aceite

- Webhook passa na verificação da Meta.
- Lead de teste chega.
- SaaS busca dados do lead.
- Lead aparece no CRM.
- Logs registram falhas.

---

# 20. Manual leigo para configurar Meta Developer

## 20.1. Criar conta Meta Developer

- [ ] Criar conta no Meta for Developers.

### Manual passo a passo

1. Acesse: https://developers.facebook.com/
2. Entre com sua conta do Facebook.
3. Complete o cadastro de desenvolvedor.
4. Confirme telefone/e-mail, se solicitado.
5. Acesse **Meus Apps**.
6. Clique em **Criar App**.

### Observação

Use uma conta real, com Business Manager organizado. Evite criar tudo em conta pessoal sem estrutura.

---

## 20.2. Criar app da Meta

- [ ] Criar app para a SaaS.

### Manual

1. No Meta for Developers, clique em **Criar App**.
2. Escolha um tipo de app adequado ao caso. A interface da Meta muda com frequência, então escolha a opção que permita usar APIs de negócios/marketing.
3. Dê um nome ao app.
4. Informe e-mail de contato.
5. Conecte ao Business Manager, se solicitado.
6. Salve o **App ID** e o **App Secret**.

### Onde guardar

No `.env.local`:

```env
META_APP_ID=
META_APP_SECRET=
```

### Critérios de aceite

- App criado.
- App ID copiado.
- App Secret copiado.
- Dados guardados em ambiente seguro.

---

## 20.3. Configurar política de privacidade

- [ ] Criar página de política de privacidade.

### Manual

A Meta costuma exigir URL pública de política de privacidade.

Crie uma página:

```txt
https://seudominio.com/privacy
```

Ela deve explicar:

- quais dados são coletados;
- por que são coletados;
- como são usados;
- como usuário pode pedir exclusão;
- contato da empresa;
- uso de dados vindos da Meta Lead Ads.

### Como implementar com Codex

```txt
Crie página /privacy com uma política de privacidade simples para a SaaS.

Contexto:
A SaaS coleta dados de vendedores e leads para CRM, campanhas e atendimento comercial.
Inclua seção sobre leads vindos de formulários do Facebook/Instagram.
Inclua contato para solicitação de exclusão de dados.

Não use linguagem jurídica perfeita; crie versão inicial para revisão posterior por advogado.
```

### Critérios de aceite

- `/privacy` existe.
- Página está pública.
- Link será usado no app da Meta.
- Futuramente revisar com advogado.

---

## 20.4. Criar webhook público

- [ ] Criar endpoint de webhook.

### Manual/técnico

A Meta precisa chamar uma URL pública da sua SaaS.

Exemplo:

```txt
https://seudominio.com/api/meta/webhook
```

No desenvolvimento local, use ngrok ou similar:

```txt
ngrok http 3000
```

### Como implementar com Codex

```txt
Crie endpoint GET e POST em /api/meta/webhook.

GET:
- usado para verificação da Meta
- recebe hub.mode, hub.verify_token, hub.challenge
- se verify_token for igual ao META_VERIFY_TOKEN, retorna hub.challenge

POST:
- recebe eventos da Meta
- registra payload em log
- se for evento de leadgen, envia para processamento
```

### Critérios de aceite

- GET responde challenge corretamente.
- POST recebe eventos.
- Logs não expõem dados sensíveis em excesso.

---

## 20.5. Solicitar permissões

- [ ] Entender permissões necessárias.

### Permissões prováveis

Para recuperar leads:

```txt
leads_retrieval
pages_manage_ads
pages_read_engagement
```

Para gerenciar anúncios futuramente:

```txt
ads_management
ads_read
business_management
```

### Observação importante

As permissões podem mudar conforme o tipo de app e caso de uso. Confira sempre a documentação atual da Meta.

### Manual para leigo

1. Entre no painel do app da Meta.
2. Vá em **App Review** ou área de permissões.
3. Procure as permissões necessárias.
4. Explique o uso:
   - “A SaaS precisa recuperar leads enviados por formulários do Facebook/Instagram e exibir no CRM do vendedor.”
5. Grave vídeo demonstrando o fluxo, se a Meta pedir:
   - login na SaaS;
   - conectar página;
   - receber lead;
   - mostrar lead no CRM.
6. Envie para análise.

### Critérios de aceite

- Permissões aparecem no app.
- App Review enviado, quando necessário.
- Permissões aprovadas antes de produção pública.

---

# 21. Integração futura para criar campanhas no Meta

## 21.1. Criar estrutura, mas não ativar no MVP

- [ ] Preparar arquitetura.

### Objetivo futuro

Permitir que a SaaS crie campanha pausada no Meta.

### Fluxo futuro

```txt
Vendedor conecta Meta
↓
Vendedor escolhe página e conta de anúncio
↓
Vendedor gera campanha com IA
↓
Vendedor sobe imagem/vídeo
↓
IA valida compliance
↓
SaaS cria campanha pausada
↓
Vendedor ou admin revisa
↓
Campanha é ativada manualmente
```

### Como implementar com Codex

```txt
Crie interfaces e serviços preparados para publicação futura no Meta, mas sem ativar ainda.

Crie:
- MetaCampaignService
- MetaAdSetService
- MetaCreativeService
- MetaAdService

Por enquanto, os métodos podem ser mocks ou retornar "not implemented".
Deixe a arquitetura pronta.
```

### Critérios de aceite

- Código está preparado.
- Nenhuma campanha é criada automaticamente ainda.
- O MVP não depende disso.

---

## 21.2. Upload de imagem para Meta futuramente

- [ ] Planejar envio de imagem.

### Conceito

No futuro, o vendedor sobe imagem no app e a SaaS envia para a conta de anúncios da Meta.

### Fluxo técnico

```txt
Upload no app
↓
Arquivo salvo no storage
↓
SaaS envia imagem para endpoint de ad images da Meta
↓
Meta retorna hash da imagem
↓
Hash é usado no criativo
```

### Como implementar com Codex

```txt
Crie método futuro uploadAdImage(adAccountId, imageUrl).

Por enquanto:
- validar formato
- baixar arquivo do storage
- preparar payload
- deixar TODO para chamada real da Meta API
```

### Critérios de aceite

- Estrutura existe.
- Imagem validada.
- Integração real fica para fase posterior.

---

## 21.3. Criar campanha pausada futuramente

- [ ] Planejar campanha pausada.

### Regra do produto

Nunca criar campanha ativa automaticamente no início.

Sempre usar:

```txt
PAUSED
```

### Como implementar com Codex

```txt
Quando a integração com Meta Ads for implementada, todas as campanhas criadas via API devem nascer com status PAUSED.

Crie constante:
DEFAULT_META_CAMPAIGN_STATUS = "PAUSED"

Bloqueie status ACTIVE sem permissão de admin.
```

### Critérios de aceite

- Campanhas via API, quando existirem, nascem pausadas.
- Sistema exige aprovação para ativar.

---

# 22. Relatórios

## 22.1. Criar relatório básico

- [ ] Criar página `/dashboard/reports`.

### Métricas iniciais

```txt
Total de leads
Leads por status
Leads por campanha
Leads por origem
Taxa de conversão manual
Vendas fechadas
Valor de receita informado manualmente
```

### Como implementar com Codex

```txt
Crie página de relatórios com filtros por período.

Métricas:
- total de leads
- leads novos
- propostas enviadas
- fechados
- perdidos
- conversão por campanha
- conversão por origem

Use gráficos simples e tabela.
```

### Critérios de aceite

- Relatório filtra por data.
- Dados vêm do banco.
- Vendedor entende a performance.

---

## 22.2. Criar campos de investimento manual

- [ ] Permitir registrar investimento.

### Objetivo

Antes da integração com Ads Insights, o vendedor/admin informa manualmente quanto foi investido.

### Campos em `campaign_plans`

```txt
manual_spend_amount
manual_leads_count
manual_cpl
manual_sales_count
manual_revenue_amount
```

### Como implementar com Codex

```txt
Adicione campos manuais de performance na campanha:
- valor investido
- leads gerados
- vendas
- receita
- CPL calculado automaticamente

Crie formulário para admin/vendedor atualizar esses dados.
```

### Critérios de aceite

- Usuário registra gasto.
- Sistema calcula CPL.
- Relatório mostra resultado.

---

# 23. Área administrativa

## 23.1. Criar dashboard admin

- [ ] Criar `/admin`.

### Objetivo

Você precisa gerenciar a operação.

### Admin vê

```txt
Organizações/clientes
Usuários
Leads totais
Campanhas geradas
Pedidos de criativo
Pagamentos
Erros de integração
```

### Como implementar com Codex

```txt
Crie dashboard administrativo.

Somente role admin pode acessar.

Mostrar:
- total de clientes
- total de vendedores
- campanhas geradas
- pedidos abertos
- pagamentos pendentes
- últimos leads
```

### Critérios de aceite

- Apenas admin acessa.
- Dados agregados aparecem.
- Admin consegue abrir detalhes.

---

# 24. Landing page da SaaS

## 24.1. Criar página pública

- [x] Criar landing page.

**Status atual:** concluído como versão visual. A página `/` já apresenta proposta, funcionalidades, preview do dashboard, seção de formulário seguro, compliance e CTAs para dashboard/planos. Cadastro real ainda depende da autenticação.

### Seções

```txt
Hero: CRM + IA para vendedores de plano de saúde
Problema: vendedor perde leads e não sabe criar anúncios
Solução: gere campanhas, receba leads e acompanhe vendas
Funcionalidades
Planos
FAQ
CTA para teste
```

### Copy sugerida

```txt
Gere campanhas com IA, organize seus leads e venda mais planos de saúde empresariais.

Uma plataforma para vendedores que querem captar interessados pelo Facebook/Instagram e acompanhar cada oportunidade em um CRM simples.
```

### Como implementar com Codex

```txt
Crie landing page pública para a SaaS.

Público:
vendedores e corretoras de plano de saúde empresarial.

Promessa:
CRM + IA para gerar campanhas, organizar leads e acompanhar vendas.

Inclua CTA:
- Começar agora
- Solicitar demonstração
```

### Critérios de aceite

- Página pública existe.
- CTA leva para cadastro.
- Visual é profissional.

---

# 25. Operação inicial da sua empresa

## 25.1. Definir processo interno

- [ ] Criar SOP operacional.

### Fluxo interno

```txt
1. Cliente/vendedor entra.
2. Escolhe plano ou produto avulso.
3. Gera campanha com IA.
4. Solicita design/vídeo se quiser.
5. Você revisa.
6. Você configura campanha manualmente no Meta.
7. Lead entra via CSV/Make/API.
8. Vendedor acompanha no CRM.
9. Você gera relatório.
```

### Como implementar com Codex

```txt
Crie documento /docs/internal-operations.md.

Explique o passo a passo interno:
- onboarding de vendedor
- criação de campanha
- produção de criativo
- configuração manual do Meta
- importação de leads
- acompanhamento
- suporte
```

### Critérios de aceite

- Processo está documentado.
- Qualquer pessoa da equipe consegue seguir.
- Reduz dependência da sua memória.

---

# 26. Primeiros testes comerciais

## 26.1. Testar internamente

- [ ] Usar a plataforma na própria empresa.

### Objetivo

Antes de vender para outros, usar para sua operação.

### Faça

```txt
Criar campanha de redução de custo
Criar campanha para MEI
Criar campanha para LTDA
Gerar copy
Criar design
Subir campanha manualmente
Captar leads
Importar no CRM
Atender via WhatsApp
Medir conversão
```

### Critérios de aceite

- Pelo menos 3 campanhas testadas.
- Leads entraram no CRM.
- Vendedor conseguiu acompanhar.
- Você identificou gargalos.

---

## 26.2. Colocar 5 vendedores beta

- [ ] Convidar primeiros usuários.

### Oferta beta

```txt
Estou criando uma plataforma com IA para vendedores de plano de saúde gerarem campanhas, captarem leads pelo Facebook/Instagram e acompanharem vendas em CRM.

Vou liberar acesso inicial com preço reduzido para poucos vendedores em troca de feedback.
```

### Meta

```txt
5 vendedores usando
3 vendedores pagando
Feedback semanal
```

### Critérios de aceite

- 5 usuários cadastrados.
- Pelo menos 3 usam semanalmente.
- Pelo menos 1 pagamento realizado.

---

# 27. Checklist de compliance e LGPD

## 27.1. Criar página de termos e privacidade

- [ ] Criar `/terms` e `/privacy`.

### Objetivo

Ter o mínimo para operar com dados de leads.

### Atenção

Você estará lidando com:

- nome;
- telefone;
- e-mail;
- dados comerciais;
- dados de interesse em plano de saúde.

Evite coletar dados médicos.

### Como implementar com Codex

```txt
Crie páginas:
- /terms
- /privacy

Inclua:
- finalidade da coleta
- uso dos dados
- compartilhamento
- exclusão de dados
- contato
- dados vindos de formulários Meta Lead Ads
- aviso de que a plataforma não deve coletar dados médicos sensíveis
```

### Critérios de aceite

- Páginas públicas existem.
- Links aparecem no rodapé.
- App da Meta pode usar URL de privacidade.

---

## 27.2. Criar consentimento interno

- [ ] Adicionar aceite.

### Como implementar com Codex

```txt
No cadastro do usuário, adicione checkbox:
"Li e aceito os Termos de Uso e a Política de Privacidade."

No cadastro/importação de leads, inclua campo source_consent_status ou observação de origem.
```

### Critérios de aceite

- Usuário aceita termos.
- Data do aceite é salva.
- Fonte do lead fica registrada.

---

# 28. Prompts principais para o Codex

## 28.1. Prompt mestre do projeto

Use este prompt quando iniciar o projeto:

```txt
Você é meu engenheiro de software sênior.

Quero construir uma SaaS chamada LeadHealth.

Contexto:
A plataforma é para vendedores de plano de saúde empresarial, com foco em redução de custo, MEI, ME, LTDA e planos empresariais.

O MVP deve ter:
- login
- multi-tenancy por organização
- CRM de leads
- cadastro manual de leads
- importação CSV
- gerador de campanhas com IA
- validador de compliance de anúncios
- gerador de mensagens de WhatsApp
- área de pedidos de design/vídeo
- painel administrativo
- relatórios básicos
- pagamentos simples

Stack:
- Next.js App Router
- TypeScript
- Tailwind
- Supabase
- PostgreSQL
- OpenAI API

Não implemente ainda criação automática de campanhas no Meta.
Prepare a arquitetura para futura integração com Meta Lead Ads e Marketing API.

Crie o projeto por etapas, com código limpo, validações, tipos e componentes reutilizáveis.
```

---

## 28.2. Prompt para revisar o que foi feito

```txt
Revise o projeto atual.

Verifique:
- segurança
- isolamento por organização
- validações
- qualidade do código
- riscos de dados sensíveis
- clareza da arquitetura
- bugs possíveis
- melhorias de UX

Liste problemas por prioridade:
P0 crítico
P1 importante
P2 melhoria
```

---

## 28.3. Prompt para criar uma feature

```txt
Implemente a feature abaixo seguindo a arquitetura existente.

Feature:
[descreva aqui]

Requisitos:
- usar TypeScript
- validar inputs
- respeitar organization_id
- criar componentes reutilizáveis
- atualizar tipos
- criar testes quando fizer sentido
- atualizar documentação em /docs
```

---

## 28.4. Prompt para integração Meta no futuro

```txt
Prepare a integração com Meta Lead Ads.

Objetivo:
Receber leads de formulários do Facebook/Instagram dentro do CRM.

Crie:
- endpoints OAuth
- endpoint de webhook
- serviço para guardar tokens
- serviço para buscar leads
- logs de integração
- tratamento de erros
- documentação manual para configurar app Meta

Não publique campanhas automaticamente.
Apenas receba leads.
```

---

# 29. Roadmap sugerido

## Semana 1

- [ ] Criar repositório.
- [x] Criar projeto Next.js.
- [ ] Configurar Supabase.
- [ ] Criar autenticação.
- [ ] Criar organizações e profiles.
- [x] Criar dashboard inicial visual/mockado.

## Semana 2

- [ ] Criar CRM de leads.
- [ ] Criar cadastro manual.
- [ ] Criar detalhe do lead.
- [ ] Criar Kanban.
- [ ] Criar importação CSV.

## Semana 3

- [ ] Criar gerador de campanhas com IA. Parcial visual no dashboard.
- [ ] Criar validador de compliance. Parcial visual no dashboard.
- [ ] Criar gerador de WhatsApp. Parcial visual no dashboard.
- [ ] Salvar campanhas no banco.

## Semana 4

- [ ] Criar área de pedidos de design/vídeo. Parcial visual no dashboard.
- [ ] Criar painel admin.
- [ ] Criar upload de arquivos.
- [ ] Criar relatórios básicos.

## Semana 5

- [x] Criar landing page.
- [ ] Criar termos e privacidade.
- [ ] Criar cobrança simples. Parcial visual em `/pricing`.
- [ ] Testar internamente.

## Semana 6

- [ ] Rodar campanhas reais manualmente.
- [ ] Importar leads.
- [ ] Atender leads.
- [ ] Ajustar CRM.
- [ ] Convidar vendedores beta.

## Depois da validação

- [ ] Integrar Make/Zapier.
- [ ] Implementar Webhook direto da Meta.
- [ ] Solicitar permissões Meta.
- [ ] Criar integração oficial de Lead Ads.
- [ ] Preparar publicação de campanhas pausadas via API.

---

# 30. Prioridade final

## Faça primeiro

```txt
1. CRM
2. Gerador de campanha com IA
3. Gerador de WhatsApp
4. Pedidos de design/vídeo
5. Importação CSV de leads
6. Teste interno
7. Primeiros vendedores beta
```

## Deixe para depois

```txt
1. Publicar campanha automaticamente no Meta
2. Otimização automática de orçamento
3. Upload direto para API da Meta
4. App mobile
5. White label
6. WhatsApp API avançada
```

---

# 31. Links oficiais úteis

## Meta

- Meta for Developers: https://developers.facebook.com/
- Meta Marketing API: https://developers.facebook.com/docs/marketing-api/
- Lead Ads — Marketing API: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/
- Webhooks para Lead Ads: https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen/
- Recuperação de leads: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving/
- Permissões da Meta: https://developers.facebook.com/docs/permissions/
- Padrões de anúncios da Meta: https://transparency.meta.com/policies/ad-standards/
- Atributos pessoais e privacidade: https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/

## OpenAI

- OpenAI API: https://platform.openai.com/
- Preços da API: https://openai.com/api/pricing/

## Ferramentas

- Supabase: https://supabase.com/
- Vercel: https://vercel.com/
- Make: https://www.make.com/
- Zapier: https://zapier.com/
- Mercado Pago Developers: https://www.mercadopago.com.br/developers/
- Stripe: https://stripe.com/

---

# 32. Observação final

A primeira versão não precisa ser perfeita.

O objetivo inicial é:

```txt
Vendedor gera campanha com IA
↓
Você revisa e configura manualmente no Meta
↓
Lead entra no CRM
↓
Vendedor acompanha e vende
```

Depois que esse fluxo gerar dinheiro, você automatiza:

```txt
Entrada automática de leads
↓
Publicação pausada no Meta
↓
Relatórios automáticos
↓
Otimização
```
