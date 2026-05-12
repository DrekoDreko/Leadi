# Validacao do webhook Make/Zapier

Este roteiro cobre o teste manual de recebimento de leads via `POST /api/webhooks/leads` com validacao no app e no Supabase sem expor tokens no retorno.

## Pre-requisitos

1. Aplicar a migration `supabase/migrations/202605050001_lead_webhook_events.sql`.
2. Garantir que o app esteja com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` configuradas.
3. Gerar um token em `/dashboard/perfil`.
4. Copiar a URL do webhook mostrada em `/dashboard/perfil`.

## Contrato do endpoint

- Metodo: `POST`
- URL: use a exibida em `/dashboard/perfil`
- Headers aceitos para autenticacao:
  - `Authorization: Bearer <token>`
  - `x-leadhealth-token: <token>`
- Header obrigatorio:
  - `Content-Type: application/json`

Observacoes:

- O token identifica a organizacao; o payload externo nao precisa enviar `organization_id`.
- O backend aceita tanto o objeto-raiz quanto wrappers como `lead`, `data`, `payload`, `contact` e `prospect`.
- Se `source` vier ausente ou fora da allowlist segura do webhook, o lead cai em `make_zapier`.

## Payload recomendado

```json
{
  "lead": {
    "name": "Maria Souza",
    "email": "maria@empresa.com",
    "phone": "(11) 99999-0000",
    "city": "Sao Paulo",
    "interest": "Plano empresarial",
    "source": "make_zapier",
    "notes": "Teste manual do Make/Zapier"
  }
}
```

Aliases comuns tambem sao aceitos, incluindo `nome`, `telefone`, `cidade`, `interesse`, `full_name`, `phone_number` e `contact_name`.

## Disparo manual

1. No Make ou Zapier, configure o webhook para enviar `POST` JSON para a URL do app.
2. Envie o token em `Authorization: Bearer` ou `x-leadhealth-token`.
3. Dispare um lead de teste.

Para um disparo local rapido fora do Make/Zapier:

```bash
export LEAD_WEBHOOK_URL=https://leadhealth.vercel.app/api/webhooks/leads
export LEAD_WEBHOOK_TOKEN=cole_o_token_gerado_no_dashboard
npm run webhook:test
```

## Validacao quase em tempo real

1. Abrir `/dashboard/perfil` e acompanhar a tabela "Logs recebidos".
2. Confirmar um registro `Sucesso (201)` ou, em caso de falha, ler a mensagem apresentada na coluna de erro.
3. Abrir `/dashboard/leads` e verificar se o lead apareceu.
4. Rodar a verificacao local abaixo para confirmar evento recebido, lead vinculado e `source = make_zapier`.

```bash
export LEAD_WEBHOOK_ORG_SLUG=slug-da-organizacao
npm run webhook:check
```

Variaveis opcionais:

- `LEAD_WEBHOOK_ORG_ID`: filtra por `organization_id`.
- `LEAD_WEBHOOK_LOOKBACK_MINUTES`: janela de busca. Padrao `30`.
- `LEAD_WEBHOOK_LIMIT`: quantidade maxima de eventos/leads retornados. Padrao `5`.

O script retorna um JSON com:

- `checks.receivedEvent`
- `checks.processedEvent`
- `checks.linkedLeadPresent`
- `checks.linkedLeadSourceValid`

## Erros esperados

- `401 Webhook nao autorizado.`: token invalido, revogado ou ausente.
- `415 Envie o webhook com Content-Type application/json.`: header incorreto.
- `400 Payload invalido. Revise o JSON enviado.`: corpo nao e um objeto JSON valido.
- `400 Nao foi possivel identificar a organizacao do webhook.`: problema interno no fluxo de resolucao da organizacao.
- `400 Nao encontramos o owner_email informado dentro da organizacao.`: owner mapeado para email inexistente.
- `400 O owner_profile_id informado nao pertence a essa organizacao.`: owner informado de outra org.
- `503 Configure o Supabase antes de usar o webhook de leads.`: service role ausente no ambiente do app.

## Criterio de aceite

- O log mais recente aparece em `/dashboard/perfil` poucos segundos apos o disparo.
- O lead vinculado existe na tabela `leads`.
- O lead foi salvo com `source = make_zapier`.
- O lead aparece no dashboard/logo na listagem de leads.
