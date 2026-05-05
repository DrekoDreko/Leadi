# LeadHealth

SaaS de CRM com IA para corretores e equipes de planos de saude empresariais. O produto centraliza captacao de leads, operacao comercial, geracao de campanhas, revisao de compliance, mensagens de WhatsApp, pedidos criativos e gestao de creditos.

## Stack

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase para auth, banco, storage e contexto multi-tenant
- OpenAI para geracao de campanhas, mensagens e revisao assistida
- Mercado Pago para checkout de planos e pacotes de creditos

## O que ja esta implementado

- autenticacao com Supabase Auth
- onboarding de perfil e setup inicial da equipe
- modelo multi-tenant com workspaces, convites, perfis e papeis
- dashboard autenticado com modulos por area
- CRM de leads com listagem, filtros, detalhes, atualizacao e exclusao
- importacao de leads por CSV
- ingestao de leads por webhook autenticado
- funil comercial por etapa
- geracao de campanhas com IA e historico salvo
- validador de compliance com regras locais e analise via OpenAI quando configurada
- geracao de mensagens de WhatsApp com historico salvo
- pedidos criativos com comentarios e anexos
- creditos, catalogo de produtos, checkout Mercado Pago e webhook de billing
- area de perfil com nome comercial, token de webhook e logs de eventos recebidos
- fluxo de equipe com membros e convites

## Principais rotas

### Publicas

- `/`: landing page do produto
- `/preview`: preview visual
- `/pricing`: planos e entrada para compra
- `/login`: login e cadastro
- `/invite/[token]`: aceite de convite

### Onboarding e equipe

- `/onboarding/profile-setup`: conclusao de perfil
- `/team/setup`: configuracao da equipe, membros e convites

### Dashboard

- `/dashboard`: visao geral com indicadores e saldo
- `/dashboard/leads`: CRM de leads
- `/dashboard/funil`: acompanhamento por etapas
- `/dashboard/importar`: importacao CSV
- `/dashboard/campanhas`: gerador e historico de campanhas
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
- `POST /api/leads/import-batches/[batchId]`: acompanha lote importado
- `POST /api/webhooks/leads`: recebe leads externos com token

### IA e operacao

- `POST /api/campaigns/generate`: gera campanha com consumo de creditos
- `GET /api/campaigns`: lista historico de campanhas
- `POST /api/campaigns/questions`: apoio ao fluxo de perguntas da campanha
- `POST /api/compliance/validate`: analisa risco de compliance
- `POST /api/whatsapp/generate`: gera mensagem para WhatsApp

### Pedidos criativos

- `GET /api/creative-requests`: lista pedidos
- `POST /api/creative-requests`: cria pedido
- `GET/PATCH /api/creative-requests/[id]`: consulta ou atualiza pedido
- `POST /api/creative-requests/[id]/comments`: adiciona comentario
- `POST /api/creative-requests/[id]/attachments`: envia anexo

### Billing

- `POST /api/billing/mercadopago/checkout`: cria checkout
- `POST /api/billing/webhooks/mercadopago`: confirma pagamentos

## Variaveis de ambiente

Base:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=
META_REDIRECT_URI=
META_GRAPH_API_VERSION=v22.0
DATABASE_URL=
```

Observacoes:

- sem Supabase configurado, partes do produto podem operar em modo de demonstracao ou ficar indisponiveis conforme o modulo
- sem `OPENAI_API_KEY`, o validador de compliance continua com regras locais, mas as geracoes de campanha e WhatsApp nao funcionam
- sem billing configurado, a compra de creditos e as geracoes que dependem de cobranca retornam indisponibilidade

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts uteis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run ai:preview
npm run compliance:battery
npm run mcp:supabase
npm run webhook:test
```

## Banco e migrations

As migrations ficam em `supabase/migrations/` e cobrem, entre outros pontos:

- core multi-tenant
- onboarding, convites e workspace
- historico de campanhas
- billing e creditos
- importacao CSV
- pedidos criativos e storage
- historico de mensagens WhatsApp
- eventos e logs de webhook de leads

Arquivos manuais de apoio ficam em `supabase/manual_*.sql`.

## Webhook de leads

O endpoint `POST /api/webhooks/leads` aceita `Authorization: Bearer <token>` ou `x-leadhealth-token: <token>`.

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

O backend tambem aceita aliases comuns em PT/EN e preserva o payload bruto para auditoria. Os logs de processamento podem ser acompanhados em `/dashboard/perfil`.

Para teste manual rapido sem Make/Zapier:

```bash
export LEAD_WEBHOOK_URL=http://localhost:3000/api/webhooks/leads
export LEAD_WEBHOOK_TOKEN=cole_o_token_gerado_no_dashboard
npm run webhook:test
```

Se quiser mandar um payload proprio:

```bash
export LEAD_WEBHOOK_PAYLOAD_FILE=./meu-payload.json
npm run webhook:test
```

No app, a area de logs em `/dashboard/perfil` oferece filtros de sucesso/erro, refresh manual e autoatualizacao a cada 15 segundos para acompanhar o recebimento quase em tempo real.

## Estrutura do projeto

- `app/`: paginas, layouts e rotas de API
- `src/lib/`: regras de negocio, integracoes e repositorios
- `src/components/`: componentes de interface
- `src/data/`: mocks e dados auxiliares
- `supabase/`: migrations e SQL de apoio
- `docs/`: documentacao tecnica complementar
- `scripts/`: scripts de suporte e validacao
