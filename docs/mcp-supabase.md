# MCP Supabase

Este projeto inclui um servidor MCP local para consultar e alterar dados do Supabase usando `SUPABASE_SERVICE_ROLE_KEY`.

## Requisitos

Configure no ambiente, ou em `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Use a service role key apenas no servidor/local MCP. Ela ignora RLS e nunca deve ir para o browser.

## Rodar

```bash
npm run mcp:supabase
```

## Configurar em um cliente MCP

Exemplo de configuração:

```json
{
  "mcpServers": {
    "leadhealth-supabase": {
      "command": "node",
      "args": ["/Users/lucasgomesdreko/Documents/APP META + CRM/scripts/supabase-mcp.mjs"]
    }
  }
}
```

## Ferramentas expostas

- `supabase_status`: mostra se as variáveis foram carregadas e quais tabelas estão liberadas.
- `supabase_select`: lê linhas com filtros, ordenação e limite máximo de 100.
- `supabase_insert`: insere até 25 registros por chamada.
- `supabase_update`: atualiza linhas, sempre exigindo ao menos um filtro.
- `supabase_delete`: remove linhas, sempre exigindo filtro e `confirm: "DELETE"`.

Tabelas liberadas: `campaigns`, `creative_requests`, `creative_request_comments`, `whatsapp_messages`, `organizations`, `lead_webhook_integrations`, `profiles`, `workspace_members`, `invites`, `leads`.
