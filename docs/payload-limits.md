# Limites de Tamanho de Payload e Upload

Para garantir a estabilidade operacional e prevenir abusos, o sistema aplica limites rigorosos ao tamanho dos dados recebidos.

## Limites Atuais

| Tipo de Dado | Limite | Descrição |
| :--- | :--- | :--- |
| **JSON Webhooks** | 1 MB | Aplica-se a webhooks da Meta, Mercado Pago e endpoints genéricos de leads. |
| **Importação CSV** | 10 MB | Limite para arquivos CSV carregados na interface de importação. |
| **Anexos** | 20 MB | Limite por arquivo em pedidos de criativos e anexos de leads. |

## Comportamento de Erro

Quando um limite é excedido:

1. **API**: Retorna status HTTP `413 Payload Too Large` com um JSON contendo a mensagem de erro detalhada.
2. **Interface**: A interface de usuário valida o arquivo antes do processamento e exibe um alerta claro impedindo o upload.

## Implementação Técnica

A lógica de validação está centralizada em `src/lib/payload-limits.ts`. 

- No servidor, a validação é feita via header `Content-Length` antes de carregar o corpo da requisição na memória.
- No cliente, a validação utiliza a propriedade `size` do objeto `File`.
