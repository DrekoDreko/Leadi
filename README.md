# LeadHealth

SaaS de CRM com IA para corretores e equipes de planos de saude empresariais. O produto centraliza captacao de leads, funil comercial, campanhas com IA, mensagens de WhatsApp, compliance, pedidos criativos, contas conectadas e gestao de creditos.

## Acesso

O SaaS esta publicado e operando na Vercel:

[https://leadhealth.vercel.app](https://leadhealth.vercel.app)

Login direto:

[https://leadhealth.vercel.app/login](https://leadhealth.vercel.app/login)

## Arquitetura atual

O LeadHealth nao roda mais como ambiente local de produto. A arquitetura operacional atual e baseada em Vercel + Supabase:

- Vercel hospeda o app Next.js, as rotas de API e os webhooks publicos
- GitHub mantem o codigo-fonte e alimenta o fluxo de deploy da Vercel
- Supabase Cloud concentra autenticacao, banco Postgres, storage e contexto multi-tenant
- OpenAI e conectada por organizacao na area Empresa para campanhas, perguntas, compliance assistido e WhatsApp
- Meta e conectada por OAuth para ativos, formularios e recebimento de leads via webhook
- Mercado Pago processa checkout, planos, pacotes de creditos e webhooks de pagamento
- Variaveis de ambiente, secrets e URLs canonicas devem ser configurados no projeto da Vercel

O ambiente local pode ser usado apenas para manutencoes tecnicas pontuais, scripts e validacoes de codigo. Ele nao e mais a forma oficial de executar ou demonstrar o SaaS.

## Stack

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres e Storage
- OpenAI Responses API
- Meta Graph API
- Mercado Pago
- Vercel

## Funcionalidades implementadas

- autenticacao com Supabase Auth
- onboarding de perfil e setup inicial da equipe
- modelo multi-tenant com organizacoes, workspaces, convites, perfis e papeis
- dashboard autenticado com navegacao por perfil e tipo de workspace
- area Empresa para Meta, OpenAI e ativos conectados
- CRM de leads com listagem, filtros, detalhes, comentarios, atualizacao e exclusao
- importacao de leads por CSV
- ingestao de leads por webhook autenticado
- webhook Meta para recebimento de leads reais
- funil comercial por etapa
- geracao de campanhas com IA e historico salvo
- campanhas preparadas com pagina, conta de anuncio e formulario Meta conectados
- validador de compliance com regras locais e analise via OpenAI quando configurada
- geracao de mensagens de WhatsApp com historico salvo
- pedidos criativos com comentarios e anexos
- billing com catalogo, creditos, assinaturas, checkout Mercado Pago e webhook de pagamentos
- area de perfil com nome comercial, token de webhook e logs de eventos recebidos
- fluxo de equipe com membros e convites

## Principais rotas

### Publicas

- `/`: landing page do produto
- `/preview`: preview visual
- `/pricing`: planos e entrada para compra
- `/login`: login e cadastro
- `/invite/[token]`: aceite de convite
- `/privacy`: politica de privacidade publica
- `/terms`: termos de uso publicos
- `/data-deletion`: instrucoes publicas de exclusao de dados

### Onboarding e equipe

- `/onboarding/profile-setup`: conclusao de perfil
- `/team/setup`: configuracao da equipe, membros e convites

### Dashboard

- `/dashboard`: visao geral com indicadores e saldo
- `/dashboard/leads`: CRM de leads
- `/dashboard/funil`: acompanhamento por etapas
- `/dashboard/importar`: importacao CSV
- `/dashboard/campanhas`: gerador e historico de campanhas
- `/dashboard/empresa`: central de contas conectadas da empresa
- `/dashboard/compliance`: revisao de texto e risco
- `/dashboard/whatsapp`: gerador de mensagens para leads
- `/dashboard/pedidos`: pedidos criativos
- `/dashboard/criacoes`: atalhos para novas demandas
- `/dashboard/creditos`: saldo, extrato e compras
- `/dashboard/perfil`: dados da conta, webhook e logs
- `/dashboard/configuracoes`: area reservada de configuracoes
- `/dashboard/relatorios`: area reservada para relatorios

## APIs disponiveis

### Leads

- `GET /api/leads`: lista leads do workspace autenticado
- `POST /api/leads`: cria lead manualmente
- `PATCH /api/leads/[id]`: atualiza lead
- `DELETE /api/leads/[id]`: remove lead
- `POST /api/leads/[id]/comments`: adiciona comentario ao lead
- `POST /api/leads/import-batches/[batchId]`: acompanha lote importado
- `POST /api/webhooks/leads`: recebe leads externos com token do workspace

### Meta

- `GET /api/integrations/meta/connect`: inicia OAuth da Meta
- `GET /api/integrations/meta/callback`: recebe callback OAuth da Meta
- `POST /api/integrations/meta/sync`: sincroniza ativos Meta conectados
- `POST /api/integrations/meta/disconnect`: desconecta a conta Meta
- `GET /api/meta/webhook`: validacao do webhook Meta
- `POST /api/meta/webhook`: recebimento de eventos Meta

### IA e operacao

- `POST /api/campaigns/generate`: gera campanha com consumo de creditos
- `GET /api/campaigns`: lista historico de campanhas
- `POST /api/campaigns/questions`: apoio ao fluxo de perguntas da campanha
- `POST /api/compliance/validate`: analisa risco de compliance
- `POST /api/whatsapp/generate`: gera mensagem para WhatsApp
- `POST /api/integrations/openai/connect`: salva a chave OpenAI da organizacao
- `POST /api/integrations/openai/save`: salva ou atualiza a chave OpenAI da organizacao
- `POST /api/integrations/openai/test`: valida a chave OpenAI conectada
- `POST /api/integrations/openai/disconnect`: desconecta a chave OpenAI da organizacao

### Pedidos criativos

- `GET /api/creative-requests`: lista pedidos
- `POST /api/creative-requests`: cria pedido
- `GET /api/creative-requests/[id]`: consulta pedido
- `PATCH /api/creative-requests/[id]`: atualiza pedido
- `POST /api/creative-requests/[id]/comments`: adiciona comentario
- `POST /api/creative-requests/[id]/attachments`: envia anexo
- `GET /api/creative-requests/[id]/attachments/[attachmentId]`: baixa anexo autorizado

### Billing

- `POST /api/billing/mercadopago/checkout`: cria checkout
- `POST /api/billing/webhooks/mercadopago`: confirma pagamentos

## Variaveis de ambiente na Vercel

Core obrigatorio em Production:

```bash
NEXT_PUBLIC_APP_URL=https://leadhealth.vercel.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Publico e legal recomendado:

```bash
NEXT_PUBLIC_SITE_NAME=LeadHealth
LEGAL_CONTACT_EMAIL=
NEXT_PUBLIC_LEGAL_EMAIL=
```

Integracoes:

```bash
OPENAI_MODEL=gpt-4o-mini
INTEGRATIONS_SECRET_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_REDIRECT_URI=https://leadhealth.vercel.app/api/integrations/meta/callback
META_GRAPH_API_VERSION=v22.0
DATABASE_URL=
```

Observacoes:

- `NEXT_PUBLIC_APP_URL` deve apontar para `https://leadhealth.vercel.app` ou para o dominio customizado final, caso ele seja configurado
- `NEXT_PUBLIC_APP_URL` tambem deve ser configurada no ambiente de producao, porque alimenta links canonicos, metadata e o redirect do login OAuth
- o build de producao valida o core e falha cedo se `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` estiverem ausentes
- `SUPABASE_SERVICE_ROLE_KEY` deve ficar apenas no servidor, em automacoes seguras e em rotinas administrativas
- sem uma chave OpenAI conectada em `/dashboard/empresa`, o validador de compliance continua com regras locais, mas campanhas, perguntas e WhatsApp ficam bloqueados com CTA para conectar
- sem billing configurado, checkout e cobranca retornam erro amigavel de configuracao
- sem credenciais da Meta, OAuth e webhook Meta falham com mensagem clara sem expor segredos
- `INTEGRATIONS_SECRET_KEY` e recomendado para cifrar tokens e chaves conectados na area Empresa

### MCP Supabase local/server

O MCP local de Supabase e os scripts administrativos usam apenas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Essas variaveis devem existir no ambiente do servidor/local e nunca devem ser expostas ao browser.

## Auth, callbacks e URLs publicas

URLs principais de producao:

- App: `https://leadhealth.vercel.app`
- Login: `https://leadhealth.vercel.app/login`
- Callback Supabase Auth: `https://leadhealth.vercel.app/auth/callback`
- Callback OAuth Meta: `https://leadhealth.vercel.app/api/integrations/meta/callback`
- Webhook Meta: `https://leadhealth.vercel.app/api/meta/webhook`
- Webhook de leads externos: `https://leadhealth.vercel.app/api/webhooks/leads`
- Politica de privacidade: `https://leadhealth.vercel.app/privacy`
- Termos de uso: `https://leadhealth.vercel.app/terms`
- Exclusao de dados: `https://leadhealth.vercel.app/data-deletion`

No painel do Supabase Auth, cadastre pelo menos:

```text
http://localhost:3000/auth/callback
https://leadhealth.vercel.app/auth/callback
```

Se houver dominio customizado, ele deve substituir o dominio `leadhealth.vercel.app` em `NEXT_PUBLIC_APP_URL`, callbacks, URLs legais e configuracoes de App Review. Em ambientes de preview da Vercel, mantenha o callback local e, se necessario, adicione o padrao `https://*-<team-or-account-slug>.vercel.app/**` na allowlist de Redirect URLs do Supabase.

## Webhooks

### Leads externos

O endpoint `POST /api/webhooks/leads` aceita:

- `Authorization: Bearer <token>`
- `x-leadhealth-token: <token>`

Payload recomendado:

```json
{
  "lead": {
    "name": "Maria Souza",
    "email": "maria@empresa.com",
    "phone": "(11) 99999-0000",
    "city": "Sao Paulo",
    "source": "make_zapier",
    "interest": "Plano empresarial",
    "budget": "ate R$ 2.000",
    "notes": "Veio do formulario principal"
  }
}
```

URL de producao:

```bash
export LEAD_WEBHOOK_URL=https://leadhealth.vercel.app/api/webhooks/leads
export LEAD_WEBHOOK_TOKEN=cole_o_token_gerado_no_dashboard
npm run webhook:test
```

Os logs de processamento podem ser acompanhados em `/dashboard/perfil`. A area de logs oferece filtros de sucesso/erro, refresh manual e autoatualizacao a cada 15 segundos.

Roteiro operacional completo: `docs/make-zapier-webhook-validation.md`.

### Meta

Para App Review e integracao Meta, use as URLs publicas do ambiente Vercel:

- Privacy Policy URL: `https://leadhealth.vercel.app/privacy`
- Terms of Service URL: `https://leadhealth.vercel.app/terms`
- User Data Deletion: `https://leadhealth.vercel.app/data-deletion`
- Webhook Callback URL: `https://leadhealth.vercel.app/api/meta/webhook`
- OAuth Redirect URI: `https://leadhealth.vercel.app/api/integrations/meta/callback`

Checklist complementar: `docs/meta-app-review.md`.

## Banco e migrations

As migrations ficam em `supabase/migrations/` e cobrem, entre outros pontos:

- core multi-tenant
- onboarding, convites e workspace
- historico de campanhas
- billing, assinaturas e creditos
- importacao CSV
- pedidos criativos e storage
- historico de mensagens WhatsApp
- comentarios de leads
- contas conectadas e integracoes
- eventos e logs de webhook de leads

Arquivos manuais de apoio ficam em `supabase/manual_*.sql`.

## Scripts de manutencao

Estes comandos continuam no repositorio para manutencao tecnica. Eles nao substituem o ambiente oficial publicado na Vercel.

```bash
npm run build
npm run lint
npm run ai:preview
npm run compliance:battery
npm run mcp:supabase
npm run webhook:test
npm run webhook:check
```

## Estrutura do projeto

- `app/`: paginas, layouts, middleware de acesso e rotas de API
- `src/lib/`: regras de negocio, integracoes, repositorios e configuracoes
- `src/components/`: componentes de interface
- `src/data/`: mocks e dados auxiliares
- `supabase/`: migrations e SQL de apoio
- `docs/`: documentacao tecnica complementar
- `scripts/`: scripts de suporte e validacao
