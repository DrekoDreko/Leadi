# Proteção de Endpoints Públicos (Rate Limiting)

Este documento descreve a implementação de Rate Limiting para os endpoints públicos de webhook (Leads e Meta).

## Estratégia

Utilizamos uma abordagem de **Sliding Window (Janela Deslizante)** implementada em memória para garantir simplicidade e compatibilidade imediata com o ambiente Vercel/Next.js sem dependências externas.

### Limites Aplicados

#### 1. Webhook de Leads (`/api/webhooks/leads`)
- **IP-based**: 100 requisições por minuto por IP.
- **Integration-based**: 30 requisições a cada 10 segundos por Integration ID (Token).
  - *Nota*: O limite por integração acomoda "bursts" comuns em automações como Zapier/Make.

#### 2. Webhook da Meta (`/api/meta/webhook`)
- **IP-based**: 150 requisições por minuto por IP.
  - *Nota*: Limite mais generoso devido à natureza volumosa dos eventos da Meta.

## Implementação Local vs. Serverless

### Como funciona em Produção (Vercel)
Em ambientes serverless, o estado em memória (`Map`) é local a cada instância da função (Lambda).

- **Vantagens**: Sem latência de rede (Redis), custo zero, sem configuração de infraestrutura.
- **Limitações**:
  - **Não é global**: Se o tráfego for distribuído entre 5 instâncias, o limite real é 5x o configurado.
  - **Reset no Cold Start**: O contador é zerado sempre que a instância é reiniciada ou escalada.
  - **Memória**: Em casos de ataques massivos de IPs únicos (DDoS), o mapa de memória pode crescer. Implementamos uma limpeza automática (`cleanupExpiredRecords`) quando o mapa excede 1000 entradas.

### Evolução Futura
Para um controle estrito e global (independente de instâncias), recomenda-se migrar para **Vercel KV (Redis)** utilizando a biblioteca `@upstash/ratelimit`.

## Resposta de Erro
Quando um limite é atingido, o servidor retorna:
- **Status**: `429 Too Many Requests`
- **Body**: `{ "error": "Muitas requisições. Tente novamente mais tarde." }`

Isso garante que plataformas como Zapier, Make e Meta reconheçam o limite e realizem retentivas (retries) automáticas seguindo suas próprias políticas de backoff.
