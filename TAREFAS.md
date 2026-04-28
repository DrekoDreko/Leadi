# Tarefas da LeadHealth

Checklist vivo dos próximos passos da SaaS LeadHealth. Este arquivo concentra tarefas operacionais, técnicas e de produto que envolvem **Eu**, **Codex** ou **Codex + Eu**. O `README.md` fica apenas como descrição pública do projeto no GitHub.

## Legenda

- **Eu:** tarefa que depende de conta, decisão, credencial, validação de negócio ou ação manual fora do código.
- **Codex:** tarefa que pode ser implementada direto no repositório.
- **Codex + Eu:** tarefa que precisa de implementação e também de acesso, revisão, decisão comercial ou teste manual.

## Prioridade imediata

- [ ] **Eu:** criar ou confirmar o projeto Supabase da LeadHealth.
- [ ] **Eu:** copiar `.env.example` para `.env.local`.
- [ ] **Eu:** preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`.
- [ ] **Eu:** aplicar a migration `supabase/migrations/202604280001_phase_1_core.sql` no SQL Editor do Supabase.
- [ ] **Eu:** criar a primeira conta em `/login` e confirmar se a organização/perfil foram criados.
- [ ] **Codex:** criar formulário de novo lead conectado ao `POST /api/leads`.
- [ ] **Codex:** criar edição de lead conectada ao `PATCH /api/leads/:id`.
- [ ] **Codex:** criar exclusão de lead com confirmação conectada ao `DELETE /api/leads/:id`.
- [ ] **Codex + Eu:** testar o fluxo real de login, criação, edição e exclusão de leads usando o Supabase configurado.

## Fase 1 - Base real do CRM

- [x] **Codex:** criar base visual em Next.js, TypeScript e Tailwind.
- [x] **Codex:** criar landing page em `/`.
- [x] **Codex:** criar dashboard visual em `/dashboard`.
- [x] **Codex:** criar página de login em `/login`.
- [x] **Codex:** criar página de planos em `/pricing`.
- [x] **Codex:** criar clientes Supabase para server/browser.
- [x] **Codex:** criar middleware para refresh de sessão.
- [x] **Codex:** criar migration com organizações, perfis, leads e RLS.
- [x] **Codex:** criar API básica de leads.
- [x] **Codex:** preparar campos de origem para Meta Lead Ads.
- [x] **Codex:** criar fallback para dados mockados quando Supabase não estiver configurado.
- [ ] **Codex:** proteger páginas internas para redirecionar usuário não logado quando o Supabase estiver configurado.
- [ ] **Codex:** criar estados de carregamento, erro e vazio mais completos no workspace de leads.
- [ ] **Codex:** adicionar filtros reais por etapa, origem, cidade, score e período.
- [ ] **Codex:** permitir atualizar etapa do lead pelo Kanban ou por ação rápida.
- [ ] **Codex:** persistir próximo contato, observações, interesse, orçamento e última interação.
- [ ] **Codex:** criar busca server-side para leads reais.
- [ ] **Codex:** adicionar paginação ou carregamento incremental de leads.
- [ ] **Codex:** revisar tipos gerados de banco após aplicar a migration real.
- [ ] **Codex + Eu:** validar se os campos do lead são suficientes para o processo comercial real.

## Fase 2 - Captura manual e CSV

- [ ] **Codex:** criar modal ou página para cadastrar lead manualmente.
- [ ] **Codex:** normalizar telefone brasileiro e salvar `phone_e164`.
- [ ] **Codex:** validar duplicidade por email, telefone e `meta_lead_id`.
- [ ] **Codex:** criar importação CSV com upload, preview e mapeamento de colunas.
- [ ] **Codex:** aceitar CSV exportado do Meta Lead Ads.
- [ ] **Codex:** criar relatório de importação com criados, ignorados, duplicados e erros.
- [ ] **Codex:** registrar `source = csv_import` para leads importados.
- [ ] **Codex:** criar opção de desfazer importação recente, se viável.
- [ ] **Eu:** exportar um CSV real ou de teste do Meta Lead Ads para validar o importador.
- [ ] **Codex + Eu:** testar importação com nomes de colunas reais usados pelo Meta.

## Fase 3 - IA para campanhas, compliance e WhatsApp

- [ ] **Eu:** criar chave da OpenAI API.
- [ ] **Eu:** preencher `OPENAI_API_KEY` no `.env.local` e depois no ambiente de produção.
- [ ] **Codex:** criar camada de serviço para OpenAI.
- [ ] **Codex:** criar gerador de campanha segura para plano de saúde empresarial.
- [ ] **Codex:** gerar headline, texto principal, descrição, CTA e público sugerido.
- [ ] **Codex:** gerar perguntas seguras para formulário Meta Lead Ads.
- [ ] **Codex:** criar validador de compliance para evitar linguagem sensível de saúde/seguro.
- [ ] **Codex:** criar tela de revisão de campanha em `/dashboard/campanhas`.
- [ ] **Codex:** salvar campanhas geradas no banco.
- [ ] **Codex:** criar geração de mensagem de WhatsApp por lead.
- [ ] **Codex:** salvar histórico de mensagens geradas.
- [ ] **Codex:** criar botão copiar mensagem.
- [ ] **Codex:** criar variações de mensagem por etapa do funil.
- [ ] **Codex + Eu:** revisar prompts com exemplos reais do seu mercado.
- [ ] **Codex + Eu:** testar risco de reprovação Meta usando textos reais antes de vender como recurso principal.

## Fase 4 - Pedidos de criativo e operação interna

- [ ] **Codex:** criar tabela de pedidos de criativo no Supabase.
- [ ] **Codex:** criar formulário de pedido de design, vídeo ou campanha completa.
- [ ] **Codex:** permitir anexos usando Supabase Storage.
- [ ] **Codex:** criar status do pedido: recebido, em produção, aguardando revisão, aprovado, entregue.
- [ ] **Codex:** criar área do vendedor para acompanhar pedidos.
- [ ] **Codex:** criar área admin inicial para visualizar pedidos de todas as organizações.
- [ ] **Codex:** criar comentários internos no pedido.
- [ ] **Eu:** definir quais tipos de pacote serão vendidos: design, vídeo, setup Meta, consultoria ou operação mensal.
- [ ] **Eu:** definir prazos, preço e escopo de cada pacote.
- [ ] **Codex + Eu:** testar fluxo completo de pedido até entrega manual.

## Fase 5 - Integração Make/Zapier antes da Meta direta

- [ ] **Codex:** criar endpoint de webhook para receber leads de automações.
- [ ] **Codex:** exigir token secreto por organização ou por integração.
- [ ] **Codex:** mapear payload recebido para o modelo de `leads`.
- [ ] **Codex:** salvar `source = make_zapier`.
- [ ] **Codex:** registrar payload bruto em `raw_payload`.
- [ ] **Codex:** criar tela de instruções para conectar Make/Zapier.
- [ ] **Codex:** criar logs de webhooks recebidos.
- [ ] **Eu:** criar cenário no Make ou Zapier conectando Meta Lead Ads ao webhook da LeadHealth.
- [ ] **Codex + Eu:** testar recebimento de lead em tempo quase real.

## Fase 6 - Meta Lead Ads oficial

- [ ] **Eu:** criar ou confirmar conta Meta for Developers.
- [ ] **Eu:** criar app da Meta para a LeadHealth.
- [ ] **Eu:** obter `META_APP_ID` e `META_APP_SECRET`.
- [ ] **Eu:** definir `META_VERIFY_TOKEN`.
- [ ] **Eu:** configurar domínio, política de privacidade e termos exigidos pela Meta.
- [ ] **Codex:** criar páginas públicas de privacidade e termos.
- [ ] **Codex:** criar endpoint `GET /api/meta/webhook` para verificação da Meta.
- [ ] **Codex:** criar endpoint `POST /api/meta/webhook` para eventos leadgen.
- [ ] **Codex:** validar assinatura dos eventos enviados pela Meta.
- [ ] **Codex:** criar serviço para buscar dados do lead pelo `leadgen_id`.
- [ ] **Codex:** criar estrutura para tokens, páginas conectadas e formulários.
- [ ] **Codex:** salvar leads diretos com `source = meta_lead_ads`.
- [ ] **Codex:** tratar duplicidade por `meta_lead_id`.
- [ ] **Codex + Eu:** configurar webhook no painel da Meta.
- [ ] **Codex + Eu:** passar pelo App Review se as permissões exigirem revisão.
- [ ] **Codex + Eu:** testar lead real vindo de um formulário Meta.

## Fase 7 - Pagamentos e planos

- [ ] **Eu:** escolher gateway inicial: Mercado Pago, Asaas ou Stripe.
- [ ] **Eu:** definir preços finais dos planos Solo, Equipe e Operação.
- [ ] **Eu:** definir trial, garantia, cancelamento e limites por plano.
- [ ] **Codex:** criar tabelas de planos, assinaturas e eventos de pagamento.
- [ ] **Codex:** integrar checkout externo do gateway escolhido.
- [ ] **Codex:** criar webhook de pagamento aprovado, recusado e cancelado.
- [ ] **Codex:** bloquear ou limitar recursos conforme assinatura.
- [ ] **Codex:** criar tela de billing/assinatura no dashboard.
- [ ] **Codex + Eu:** fazer compra teste ponta a ponta.

## Fase 8 - Deploy e produção

- [ ] **Eu:** criar projeto na Vercel.
- [ ] **Eu:** configurar domínio da LeadHealth.
- [ ] **Eu:** configurar variáveis de ambiente de produção.
- [ ] **Codex:** revisar `NEXT_PUBLIC_APP_URL`, redirects e callback de autenticação.
- [ ] **Codex:** adicionar verificação de ambiente para produção.
- [ ] **Codex:** rodar build e lint antes do deploy.
- [ ] **Codex:** preparar scripts ou instruções de migration.
- [ ] **Codex + Eu:** testar cadastro, login, leads e dashboard no domínio real.
- [ ] **Codex + Eu:** configurar URLs públicas usadas por Meta, webhooks e gateway de pagamento.

## Fase 9 - Qualidade, segurança e operação

- [ ] **Codex:** adicionar testes unitários para normalização de leads.
- [ ] **Codex:** adicionar testes de API para CRUD de leads.
- [ ] **Codex:** adicionar testes básicos de páginas críticas.
- [ ] **Codex:** revisar RLS para garantir isolamento por organização.
- [ ] **Codex:** adicionar logs controlados para erros de API.
- [ ] **Codex:** criar limites de tamanho para payloads e uploads.
- [ ] **Codex:** melhorar mensagens de erro para usuário final.
- [ ] **Codex:** adicionar rate limit em endpoints públicos de webhook.
- [ ] **Codex:** criar rotina de backup ou orientação de backup Supabase.
- [ ] **Eu:** revisar termos comerciais, LGPD e política de privacidade com apoio jurídico.
- [ ] **Codex + Eu:** fazer teste de uso como vendedor real por 1 dia.

## Fase 10 - Produto comercial

- [ ] **Eu:** definir nome final, domínio, identidade e promessa principal da LeadHealth.
- [ ] **Eu:** definir ICP: corretor solo, corretora pequena, equipe comercial ou agência.
- [ ] **Eu:** criar lista dos 10 primeiros usuários beta.
- [ ] **Eu:** definir oferta beta e preço de entrada.
- [ ] **Eu:** gravar ou escrever onboarding simples para novos usuários.
- [ ] **Codex:** criar checklist de onboarding dentro do dashboard.
- [ ] **Codex:** criar exemplos prontos de campanhas e mensagens.
- [ ] **Codex:** criar indicadores de ativação: lead criado, campanha gerada, mensagem copiada, pedido enviado.
- [ ] **Codex + Eu:** acompanhar uso dos primeiros beta testers e transformar dúvidas em tarefas.

## Backlog futuro

- [ ] **Codex:** criar integração para publicar campanha pausada no Meta Ads.
- [ ] **Codex:** criar upload de imagens para a Meta Marketing API.
- [ ] **Codex:** criar multiusuário completo com convites e permissões por papel.
- [ ] **Codex:** criar pipeline visual Kanban com drag and drop persistido.
- [ ] **Codex:** criar integrações com WhatsApp oficial ou provedor externo.
- [ ] **Codex:** criar scoring automático de leads.
- [ ] **Codex:** criar relatórios de ROI por campanha, origem e vendedor.
- [ ] **Codex:** criar exportação de leads e relatórios.
- [ ] **Codex + Eu:** decidir quando transformar a operação manual de Meta Ads em automação completa.
