# Tarefas agrupadas por contexto

Arquivo gerado a partir de `TAREFAS.md` para visualizar as tarefas por tema recorrente. O arquivo original nao foi alterado.

## Integracao Make/Zapier e webhooks

- [ ] **F5.7 - Criar logs de webhooks recebidos**
- [ ] **Eu:** criar cenario no Make ou Zapier conectando Meta Lead Ads ao webhook da LeadHealth.
- [ ] **F5.8 - Testar recebimento de lead em tempo quase real**

## Meta Lead Ads oficial e marketing

- [ ] **Eu:** criar ou confirmar conta Meta for Developers.
- [ ] **Eu:** criar app da Meta para a LeadHealth.
- [ ] **Eu:** obter `META_APP_ID` e `META_APP_SECRET`.
- [ ] **Eu:** definir `META_VERIFY_TOKEN`.
- [ ] **F6.2 - Criar GET /api/meta/webhook para verificacao**
- [ ] **F6.3 - Criar POST /api/meta/webhook para eventos leadgen**
- [ ] **F6.4 - Validar assinatura dos eventos Meta**
- [ ] **F6.5 - Criar servico para buscar dados do lead pelo leadgen_id**
- [ ] **F6.6 - Criar estrutura para tokens, paginas e formularios Meta**
- [ ] **F6.7 - Salvar leads diretos com source = meta_lead_ads**
- [ ] **F6.8 - Tratar duplicidade por meta_lead_id**
- [ ] **F6.9 - Configurar webhook no painel da Meta**
- [ ] **F6.11 - Testar lead real vindo de formulario Meta**

## Privacidade, termos e revisao externa

- [ ] **Eu:** configurar dominio, politica de privacidade e termos exigidos pela Meta.
- [ ] **F6.1 - Criar paginas publicas de privacidade e termos**
- [ ] **F6.10 - Passar pelo App Review se necessario**

## Pagamentos e planos

- [ ] **Eu:** escolher gateway inicial: Mercado Pago, Asaas ou Stripe.
- [ ] **Eu:** definir precos finais dos planos Solo, Equipe e Operacao.
- [ ] **Eu:** definir trial, garantia, cancelamento e limites por plano.
- [ ] **F7.1 - Criar tabelas de planos e assinaturas**
- [ ] **F7.4 - Bloquear ou limitar recursos conforme assinatura**
- [ ] **F7.6 - Fazer compra teste ponta a ponta**

## Deploy, producao e URLs publicas

- [ ] **Eu:** criar projeto na Vercel.
- [ ] **Eu:** configurar dominio da LeadHealth.
- [ ] **Eu:** configurar variaveis de ambiente de producao.
- [ ] **F8.1 - Revisar URLs, redirects e callback de autenticacao**
- [ ] **F8.2 - Adicionar verificacao de ambiente para producao**
- [ ] **F8.3 - Rodar build e lint antes do deploy**
- [ ] **F8.4 - Preparar scripts ou instrucoes de migration**
- [ ] **F8.5 - Testar cadastro, login, leads e dashboard no dominio real**
- [ ] **F8.6 - Configurar URLs publicas de Meta, webhooks e pagamentos**

## Qualidade, seguranca e operacao

- [ ] **F9.1 - Adicionar testes unitarios de normalizacao**
- [ ] **F9.2 - Adicionar testes de API para CRUD de leads**
- [ ] **F9.3 - Adicionar testes basicos de paginas criticas**
- [ ] **F9.4 - Revisar RLS**
- [ ] **F9.5 - Adicionar logs controlados para erros de API**
- [ ] **F9.6 - Criar limites de tamanho para payloads e uploads**
- [ ] **F9.7 - Melhorar mensagens de erro para usuario final**
- [ ] **F9.8 - Adicionar rate limit em endpoints publicos**
- [ ] **F9.9 - Criar rotina ou orientacao de backup Supabase**
- [ ] **F9.10 - Teste de uso como vendedor real por 1 dia**

## Juridico e LGPD

- [ ] **Eu:** revisar termos comerciais, LGPD e politica de privacidade com apoio juridico.

## Produto comercial, onboarding e beta

- [ ] **Eu:** definir nome final, dominio, identidade e promessa principal da LeadHealth.
- [ ] **Eu:** definir ICP: corretor solo, corretora pequena, equipe comercial ou agencia.
- [ ] **Eu:** criar lista dos 10 primeiros usuarios beta.
- [ ] **Eu:** definir oferta beta e preco de entrada.
- [ ] **Eu:** gravar ou escrever onboarding simples para novos usuarios.
- [ ] **F10.1 - Criar checklist de onboarding no dashboard**
- [ ] **F10.2 - Criar exemplos prontos de campanhas e mensagens**
- [ ] **F10.3 - Criar indicadores de ativacao**
- [ ] **F10.4 - Transformar feedback beta em tarefas**

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
