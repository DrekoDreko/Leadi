# Leadi

> 🚀 **Fase de testes — estamos começando!**
> O Leadi já está no ar e entrou na fase de testes para o lançamento. As funcionalidades principais estão prontas e em validação com os primeiros usuários. É o momento de usar, testar e nos ajudar a apontar melhorias antes da abertura ao público.

**Leadi** é um SaaS (software por assinatura) que reúne, num só lugar, tudo o que um corretor ou uma equipe de vendas de planos de saúde precisa para vender mais: captar leads, organizar o funil, criar campanhas e conteúdo com inteligência artificial, publicar anúncios na Meta (Facebook/Instagram), conversar pelo WhatsApp e acompanhar os resultados da equipe.

Em vez de espalhar o trabalho entre planilhas, grupos de WhatsApp e o Gerenciador de Anúncios da Meta, o corretor passa a operar tudo de um único painel — da chegada do lead até o fechamento da venda.

> 💡 **Origem da ideia:** o Leadi nasceu de uma ideia em **05/05/2026**.

## Acesso

O sistema já está no ar e funcionando no domínio oficial:

- Site: [https://useleadi.com](https://useleadi.com)
- Login: [https://useleadi.com/login](https://useleadi.com/login)

> **Nota:** o app está em fase de testes para o lançamento público.

## Para quem é

Consultores de Plano de Saúde;
Corretoras de Plano de Saúde pequenas e grandes em quantidade de colaboradores/consultores.

## Como funciona, em resumo

1. O corretor conecta sua conta da Meta e cria campanhas com ajuda da IA.
2. Os anúncios são publicados no Facebook/Instagram e os leads chegam automaticamente.
3. Cada lead entra no funil e a equipe acompanha as etapas até o fechamento.
4. O gestor distribui os leads entre os vendedores e acompanha os resultados.

## O que já está pronto:

### Inteligência artificial
- Gerador de campanhas de marketing sem usar o Gerenciador de Anúncios da Meta.
- Gerador de imagens para criativos de anúncio.
- Gerador de mensagens de WhatsApp personalizadas para cada lead.
- Validador de conformidade, que aponta riscos jurídicos em anúncios e mensagens.
- Biblioteca de modelos prontos (planos PME, adesão, etc.).

### Anúncios e integração Meta
- Conexão OAuth com a Meta (Facebook/Instagram) com permissões modulares.
- Sincronização de páginas, contas de anúncio e formulários de lead.
- Publicação de campanhas pausadas na Meta (campanha, adset, anúncio e criativo).
- Upload de imagens para a biblioteca de anúncios.
- Recebimento de leads em tempo real via webhook do leadgen.
- Importação manual de leads por formulário, campanha ou anúncio.
- Webhook de exclusão de dados para conformidade com a LGPD.

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

### Equipe e permissões
- Criação de organização, equipes e convite de membros.
- Perfis diferentes: gestor, supervisor e consultor, cada um com sua tela.
- Distribuição e atribuição de leads entre os vendedores.
- Fluxos de aprovação para campanhas e peças criativas.

### Integrações
- Conexão com a Meta (Facebook/Instagram) para anúncios e captação de leads.
- Conexão com a OpenAI para os recursos de inteligência artificial.
- Recebimento de leads por webhook (Make, Zapier e outros).
- WhatsApp Business via API oficial da Meta ou provedor externo.

### Pagamentos e créditos
- Assinatura de planos pelo AbacatePay (Pix).
- Sistema de créditos para usar a inteligência artificial, com saldo, extrato e compra de pacotes.
- Pedidos de crédito para aprovação interna ou compra avulsa por consultor.

### Relatórios e início
- Página de relatórios com os números do negócio.
- Checklist de boas-vindas e indicadores de uso para novos usuários.
- Tema claro e escuro.


## O que ainda falta

### Em desenvolvimento
- **Simulador de preços**: ferramenta para o corretor fazer cotações de planos dentro do próprio sistema. Já existe uma versão de protótipo; falta finalizar.
- **Relatórios mais completos**: retorno por campanha, por origem do lead e por vendedor.
- **WhatsApp API**: Automatização e preparação dos leads num esquema de atendimento automatizado, para qualificação de cada lead antes do primeiro contato com o Consultor.


## Como o sistema é construído

- **Site e sistema**: Next.js (React), hospedado na Vercel (domínio `useleadi.com`).
- **Banco de dados e login**: Supabase (com login por Google e recuperação de senha).
- **Proteção contra bots**: Cloudflare Turnstile (captcha).
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
Desenvolvido por **codeellow / Leadi**.
