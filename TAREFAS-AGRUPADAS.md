# Tarefas agrupadas por contexto

Arquivo gerado a partir de `TAREFAS.md` para visualizar as tarefas por tema recorrente. O arquivo original nao foi alterado.

## Integracao Make/Zapier e webhooks

- [x] **F5.7 - Criar logs de webhooks recebidos**
- [x] **Eu:** criar cenario no Make ou Zapier conectando Meta Lead Ads ao webhook do Leadi.
- [x] **F5.8 - Testar recebimento de lead em tempo quase real**

## Meta Lead Ads oficial e marketing

- [x] **Eu:** criar ou confirmar conta Meta for Developers.
- [x] **Eu:** criar app da Meta para o Leadi.
- [x] **Eu:** obter `META_APP_ID` e `META_APP_SECRET`.
- [x] **Eu:** definir `META_VERIFY_TOKEN`.
- [x] **F6.2 - Criar GET /api/meta/webhook para verificacao**
- [x] **F6.3 - Criar POST /api/meta/webhook para eventos leadgen**
- [x] **F6.4 - Validar assinatura dos eventos Meta**
- [x] **F6.5 - Criar servico para buscar dados do lead pelo leadgen_id**
- [x] **F6.6 - Criar estrutura para tokens, paginas e formularios Meta**
- [x] **F6.7 - Salvar leads diretos com source = meta_lead_ads**
- [x] **F6.8 - Tratar duplicidade por meta_lead_id**
- [x] **F6.9 - Configurar webhook no painel da Meta**
- [x] **F6.11 - Testar lead real vindo de formulario Meta**

## Contas conectadas da empresa

- [x] **F6.12 - Criar pagina /dashboard/empresa para contas conectadas**
- [x] **F6.13 - Criar estrutura de dados para contas conectadas**
- [x] **F6.14 - Implementar conexao Meta com OAuth e sincronizacao de ativos**
- [x] **F6.15 - Implementar conexao OpenAI por API key do cliente**
- [x] **F6.16 - Adaptar campanhas para usar contas conectadas**
- [x] **F6.17 - Criar publicacao de campanha no Meta com rascunho controlado**
- [x] **F6.18 - Adicionar testes e verificacoes do fluxo de conexao**

## Privacidade, termos e revisao externa

- [ ] **Eu:** configurar dominio, politica de privacidade e termos exigidos pela Meta.
- [x] **F6.1 - Criar paginas publicas de privacidade e termos**
- [ ] **F6.10 - Passar pelo App Review se necessario**

## Pagamentos e planos

- [ ] **Eu:** escolher gateway inicial: Mercado Pago, Asaas ou Stripe.
- [ ] **Eu:** definir precos finais dos planos Solo, Equipe e Operacao.
- [ ] **Eu:** definir trial, garantia, cancelamento e limites por plano.
- [x] **F7.1 - Criar tabelas de planos e assinaturas**
- [x] **F7.4 - Bloquear ou limitar recursos conforme assinatura**
- [ ] **F7.6 - Fazer compra teste ponta a ponta**

## Deploy, producao e URLs publicas

- [ ] **Eu:** criar projeto na Vercel.
- [ ] **Eu:** configurar dominio do Leadi.
- [ ] **Eu:** configurar variaveis de ambiente de producao.
- [x] **F8.1 - Revisar URLs, redirects e callback de autenticacao**
- [x] **F8.2 - Adicionar verificacao de ambiente para producao**
- [ ] **F8.3 - Rodar build e lint antes do deploy**
- [x] **F8.4 - Preparar scripts ou instrucoes de migration**
- [ ] **F8.5 - Testar cadastro, login, leads e dashboard no dominio real**
- [x] **F8.6 - Configurar URLs publicas de Meta, webhooks e pagamentos**

## Qualidade, seguranca e operacao

- [x] **F9.1 - Adicionar testes unitarios de normalizacao**
- [x] **F9.2 - Adicionar testes de API para CRUD de leads**
- [x] **F9.3 - Adicionar testes basicos de paginas criticas**
- [x] **F9.4 - Revisar RLS**
- [x] **F9.5 - Adicionar logs controlados para erros de API**
- [x] **F9.6 - Criar limites de tamanho para payloads e uploads**
- [ ] **F9.7 - Melhorar mensagens de erro para usuario final**
- [x] **F9.8 - Adicionar rate limit em endpoints publicos**
- [x] **F9.9 - Criar rotina ou orientacao de backup Supabase**
- [ ] **F9.10 - Teste de uso como vendedor real por 1 dia**

## Juridico e LGPD

- [ ] **Eu:** revisar termos comerciais, LGPD e politica de privacidade com apoio juridico.

## Produto comercial, onboarding e beta

- [ ] **Eu:** definir nome final, dominio, identidade e promessa principal do Leadi.
- [ ] **Eu:** definir ICP: corretor solo, corretora pequena, equipe comercial ou agencia.
- [ ] **Eu:** criar lista dos 10 primeiros usuarios beta.
- [ ] **Eu:** definir oferta beta e preco de entrada.
- [ ] **Eu:** gravar ou escrever onboarding simples para novos usuarios.
- [x] **F10.1 - Criar checklist de onboarding no dashboard**
- [x] **F10.2 - Criar exemplos prontos de campanhas e mensagens**
- [x] **F10.3 - Criar indicadores de ativacao**
- [x] **F10.4 - Transformar feedback beta em tarefas**

## Backlog futuro e evolucao do produto

- [ ] **B1 - Integracao para publicar campanha pausada no Meta Ads**
- [ ] **B2 - Upload de imagens para Meta Marketing API**
- [ ] **B3 - Multiusuario com convites e permissoes**
- [ ] **B4 - Kanban com drag and drop persistido**
- [ ] **B5 - Integracoes com WhatsApp oficial ou provedor externo**
- [ ] **B6 - Scoring automatico de leads**
- [ ] **B7 - Relatorios de ROI por campanha, origem e vendedor**
- [ ] **B8 - Exportacao de leads e relatorios**
- [ ] **B9 - Decidir automacao completa de Meta Ads**
