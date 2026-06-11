# Leadi

Leadi é uma plataforma para corretores e equipes de vendas de planos de saúde organizarem seus leads, criarem campanhas, publicarem anúncios na Meta e fecharem mais negócios. Reúne num só lugar a captação de contatos, o acompanhamento do funil de vendas, a criação de conteúdo com inteligência artificial, o envio de mensagens por WhatsApp e a gestão da equipe.

## Acesso

O sistema já está no ar e funcionando:

- Site: [https://leadhealth.vercel.app](https://leadhealth.vercel.app)
- Login: [https://leadhealth.vercel.app/login](https://leadhealth.vercel.app/login)

> **Nota:** o endereço acima é o link do período de testes.

## Para quem é

Corretores que trabalham sozinhos, corretoras pequenas e equipes comerciais que vendem planos de saúde e precisam de uma forma simples de captar e acompanhar clientes.

## Como funciona, em resumo

1. O corretor conecta sua conta da Meta e cria campanhas com ajuda da IA.
2. Os anúncios são publicados no Facebook/Instagram e os leads chegam automaticamente.
3. Cada lead entra no funil e a equipe acompanha as etapas até o fechamento.
4. O gestor distribui os leads entre os vendedores e acompanha os resultados.

## O que já está pronto

### Captação e organização de leads
- Cadastro de leads em quadro (Kanban) ou lista, com filtros e busca.
- Campo de "próximo contato" com avisos de quem está sem agenda ou atrasado.
- Histórico de comentários e anotações em cada lead.
- Importação por planilha (CSV) e exportação de leads.
- Importação manual de leads da Meta por formulário, campanha ou anúncio.
- Entrada automática de leads por webhook (Make, Zapier e outros).
- Arquivamento e desarquivamento de leads.

### Funil de vendas
- Acompanhamento das etapas da venda, do primeiro contato ao fechamento.
- Distribuição e atribuição de leads entre os vendedores.

### Anúncios e integração Meta
- Conexão OAuth com a Meta (Facebook/Instagram) com permissões modulares.
- Sincronização de páginas, contas de anúncio e formulários de lead.
- Publicação de campanhas pausadas na Meta (campanha, adset, anúncio e criativo).
- Upload de imagens para a biblioteca de anúncios.
- Recebimento de leads em tempo real via webhook do leadgen.
- Importação manual de leads por formulário, campanha ou anúncio.
- Webhook de exclusão de dados para conformidade com a LGPD.

### Inteligência artificial
- Gerador de campanhas de marketing.
- Gerador de mensagens de WhatsApp personalizadas para cada lead.
- Validador de conformidade, que aponta riscos jurídicos em anúncios e mensagens.
- Gerador de imagens para criativos de anúncio.
- Biblioteca de modelos prontos (planos PME, adesão, etc.).

### WhatsApp
- Envio de mensagens via API oficial da Meta (WhatsApp Business).
- Suporte a provedor externo de WhatsApp como alternativa.
- Histórico de mensagens e acompanhamento de entrega.

### Equipe e permissões
- Criação de organização, equipes e convite de membros.
- Perfis diferentes: gestor, supervisor e consultor, cada um com sua tela.
- Distribuição e atribuição de leads entre os vendedores.
- Fluxos de aprovação para campanhas e peças criativas.

### Pedidos de criação (artes)
- Solicitação de artes e peças com anexos e comentários, e aprovação pelo responsável.

### Integrações
- Conexão com a Meta (Facebook/Instagram) para anúncios e captação de leads.
- Conexão com a OpenAI para os recursos de inteligência artificial.
- Recebimento de leads por webhook (Make, Zapier e outros).
- WhatsApp Business via API oficial da Meta ou provedor externo.

### Pagamentos e créditos
- Assinatura de planos pelo AbacatePay (Pix).
- Sistema de créditos para usar a inteligência artificial, com saldo, extrato e compra de pacotes.
- Pedidos de crédito para aprovação interna.

### Relatórios e início
- Página de relatórios com os números do negócio.
- Checklist de boas-vindas e indicadores de uso para novos usuários.
- Tema claro e escuro.

## O que ainda falta

### Em desenvolvimento
- **Simulador de preços**: ferramenta para o corretor fazer cotações de planos dentro do próprio sistema. Já existe uma versão de protótipo; falta finalizar.
- **Relatórios mais completos**: retorno por campanha, por origem do lead e por vendedor.

### Decisões de negócio (fora do código)
- Definir nome final, domínio e a proposta principal do produto.
- Definir o público-alvo prioritário.
- Montar a lista dos primeiros usuários de teste (beta).
- Definir a oferta e o preço de entrada.
- Acompanhar um dia real de uso por um vendedor para listar melhorias.

## Como o sistema é construído

- **Site e sistema**: Next.js (React), hospedado na Vercel.
- **Banco de dados e login**: Supabase.
- **Inteligência artificial**: OpenAI.
- **Anúncios e leads**: Meta (Facebook/Instagram).
- **WhatsApp**: API oficial da Meta + provedor externo opcional.
- **Pagamentos**: AbacatePay (Pix).

## Para desenvolvedores

As variáveis de ambiente necessárias estão descritas em [.env.example](.env.example), separando as públicas das que só podem ficar no servidor. Nunca coloque chaves reais nesse arquivo.

Comandos principais:

```bash
npm run dev    # rodar localmente
npm run build  # gerar a versão de produção
npm run lint   # verificar qualidade do código
npm run test   # rodar os testes
```

---
Desenvolvido por **DrekoDreko / Leadi**.
