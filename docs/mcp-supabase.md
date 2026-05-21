# MCP Supabase

Este projeto inclui um servidor MCP local para consultar e alterar dados do Supabase usando `SUPABASE_SERVICE_ROLE_KEY`.

## Requisitos

Configure no ambiente local do servidor ou em um `.env.local` que nao seja compartilhado:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Use a service role key apenas no servidor/local MCP. Ela ignora RLS e nunca deve ir para o browser.
O MCP depende apenas de `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente local/servidor.
Nao use `vercel env pull` para manter um `.env.production` real versionado, anexado ou sincronizado fora do ambiente seguro.

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

Tabelas liberadas: `campaigns`, `creative_requests`, `creative_request_comments`, `whatsapp_messages`, `plans`, `subscriptions`, `payment_events`, `organizations`, `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`, `openai_connections`, `integration_sync_logs`, `lead_webhook_integrations`, `lead_webhook_events`, `profiles`, `workspace_members`, `invites`, `leads`, `onboarding_states`, `system_templates`.

## Billing

As tabelas abaixo ficam liberadas no MCP para evolucao e validacao operacional do billing:

- `plans`: catalogo de planos com preco, intervalo, status, `gateway` e `gateway_plan_id` opcionais para manter compatibilidade com Asaas, Mercado Pago ou Stripe.
- `subscriptions`: assinatura vinculada a `organization_id`, com `status`, periodo vigente, `gateway`, `external_id` e indice parcial para impedir mais de uma assinatura corrente por organizacao.
- `payment_events`: trilha de cobranca e pagamento por organizacao, com ligacao opcional a assinatura/plano, `event_type`, `status`, `external_id`, valor e payload bruto do provedor.

O foco operacional atual desta etapa e Asaas, mas o schema permanece independente do gateway para permitir alternancia para Stripe ou Mercado Pago sem redesenhar as tabelas.

## Integracoes Meta

As tabelas abaixo ficam liberadas no MCP para validacao operacional e suporte:

- `meta_integrations`: credencial por organizacao com `meta_account_id`, `meta_account_name`, `status`, expiracao e armazenamento seguro do token via `access_token_ciphertext` ou `access_token_reference`.
- `meta_pages`: paginas conectadas a uma integracao, com `connected_account_id`, `page_id`, `page_name`, `category` e `status`.
- `meta_ad_accounts`: contas de anuncio conectadas a uma integracao, com `connected_account_id`, `meta_ad_account_id`, moeda, timezone e `status`.
- `meta_ad_image_uploads`: uploads de imagens para a biblioteca da Meta, com `connected_account_id`, `meta_ad_account_id`, associacao a `creative_request_id` ou `campaign_id`, `local_status` e retorno bruto da Meta em `meta_response`.
- `meta_forms`: formularios conectados a paginas integradas, com `connected_account_id`, `page_id`, `page_name`, `form_id`, `form_name` e `status`.
- `openai_connections`: chave OpenAI da organizacao cifrada, com preview mascarado, ultimos 4 caracteres, status, modo `customer_key` na camada de aplicacao e ultima validacao.
- `integration_sync_logs`: trilha de sincronizacao e validacao para Meta/OpenAI com status, titulo, mensagem e detalhes em JSON.
- `campaigns`: historico de campanhas com `connected_account_id`, `meta_page_id`, `meta_ad_account_id`, `meta_lead_form_id`, `publish_mode` e `publication_status` para o fluxo controlado.
- `whatsapp_messages`: historico de mensagens WhatsApp geradas com `delivery_status`, `delivery_provider`, `delivery_attempted_at`, `delivery_sent_at`, `delivery_provider_message_id`, `delivery_error_code`, `delivery_error_message` e `delivery_history` para validar o envio sem expor o texto completo.
- `leads`: leads com `meta_connected_account_id`, `meta_page_id` e `meta_form_id` quando vierem de ativos Meta conectados.
- `onboarding_states`: estado de persistencia do checklist por organizacao, com `completed_steps` (array de IDs) e `dismissed_at`.
- `system_templates`: templates globais de campanhas e mensagens para apoio aos usuarios, categorizados por `MEI`, `PME`, `Reducao de Custo`, etc. Liberado apenas para `select`. O sistema possui um fallback estático em `src/data/system-templates.ts` caso a tabela nao esteja populada no banco.

## Validacao de Onboarding

Para validar o progresso do checklist via MCP, use `supabase_select` nas tabelas que geram os sinais de ativacao:

1. **Criar lead**: `supabase_select` na tabela `leads` filtrando por `organization_id`. Se houver ao menos 1 linha, o passo e marcado.
2. **Gerar campanha**: `supabase_select` na tabela `campaigns` filtrando por `organization_id`.
3. **Mensagem copiada**: `supabase_select` na tabela `whatsapp_messages` filtrando por `organization_id`.
4. **Envio WhatsApp**: `supabase_select` na tabela `whatsapp_messages` filtrando por `organization_id` e lendo apenas `delivery_status`, `delivery_provider`, `delivery_attempted_at`, `delivery_sent_at`, `delivery_provider_message_id`, `delivery_error_code`, `delivery_error_message` e `delivery_history`.
5. **Pedido enviado**: `supabase_select` na tabela `creative_requests` filtrando por `organization_id`.
6. **Estado persistido**: `supabase_select` em `onboarding_states` para conferir passos marcados manualmente ou data de ocultacao.

Observacoes:

- O MCP usa `SUPABASE_SERVICE_ROLE_KEY`, entao ele ignora RLS ao consultar essas tabelas.
- O isolamento por organizacao continua garantido no banco pelas policies de RLS para clientes autenticados.
- Nesta tarefa, o schema foi preparado para a integracao oficial Meta e para a conexao OpenAI por organizacao, sem expor segredos em texto puro.
